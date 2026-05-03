package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.model.ElvisUsoMensal;
import com.pedrocampelo.cnabportal.model.Plano;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.ElvisUsoMensalRepository;
import com.pedrocampelo.cnabportal.repository.PlanoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço de quota mensal do Elvis (IA do CNAB)
 * Sprint A3.9.1 · Gate de uso por plano
 *
 * Responsabilidades:
 *   1. Verificar se usuário pode fazer mais 1 pergunta (read-only)
 *   2. Incrementar contador após pergunta com sucesso (write)
 *   3. Retornar status de uso pro frontend exibir "X de Y usadas"
 *
 * Política:
 *   - Admin     → ilimitado (sem incrementar)
 *   - Whallet+  → ilimitado (sem incrementar — economiza I/O do banco)
 *   - Free      → limite vem de Plano.elvisQuotaMensal (V28)
 *
 * Reset:
 *   - Automático: chave (usuario_id, ano_mes) garante linha nova a cada mês
 *   - Sem cron job, sem complexidade
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ElvisQuotaService {

    private final ElvisUsoMensalRepository usoRepository;
    private final PlanoRepository planoRepository;
    private final PlanoGuard planoGuard;

    /* ─── DTO de status ─────────────────────────────────────────────────── */

    /**
     * Status de uso do mês corrente.
     * Usado pelo controller GET /api/elvis/uso-mensal pro frontend.
     */
    public record StatusUso(
            boolean ilimitado,    // true = sem limite (Whallet+/Admin)
            int     usadas,       // perguntas feitas no mês
            Integer limite,       // limite mensal (null se ilimitado)
            Integer restantes,    // limite - usadas (null se ilimitado)
            String  anoMes,       // mês de referência (ex: "2026-04")
            boolean podePerguntar // pode fazer +1 pergunta?
    ) {}

    /* ─── 1. Status (read-only) ─────────────────────────────────────────── */

    /**
     * Retorna o status de uso do mês corrente — não modifica nada.
     * Usado pelo endpoint informativo e pelo aspect (antes da pergunta).
     */
    @Transactional(readOnly = true)
    public StatusUso status(Usuario usuario) {
        boolean isAdmin = usuario != null && "ADMIN".equals(usuario.getPerfil());

        // Admin sempre ilimitado
        if (isAdmin) {
            return new StatusUso(true, 0, null, null, ElvisUsoMensal.anoMesAtual(), true);
        }

        // Busca o limite do plano (NULL = ilimitado)
        Integer limite = limiteDoPlano(usuario);

        // Plano sem limite (Whallet+) → libera direto
        if (limite == null) {
            return new StatusUso(true, 0, null, null, ElvisUsoMensal.anoMesAtual(), true);
        }

        // Plano com limite (Free) → busca uso atual
        String anoMes = ElvisUsoMensal.anoMesAtual();
        int usadas = usoRepository.findByUsuarioIdAndAnoMes(usuario.getId(), anoMes)
                .map(ElvisUsoMensal::getContador)
                .orElse(0);

        int restantes = Math.max(0, limite - usadas);
        boolean podePerguntar = usadas < limite;

        return new StatusUso(false, usadas, limite, restantes, anoMes, podePerguntar);
    }

    /* ─── 2. Verificação antes da pergunta ─────────────────────────────── */

    /**
     * Verifica se o usuário pode fazer mais uma pergunta.
     * Lança ElvisQuotaExcedidaException se atingiu o limite.
     *
     * Chamado pelo Aspect ANTES de executar o método anotado.
     */
    @Transactional(readOnly = true)
    public void verificarLimite(Usuario usuario) {
        StatusUso s = status(usuario);

        if (s.ilimitado()) return;  // Whallet+/Admin passam direto

        if (!s.podePerguntar()) {
            log.info("Quota Elvis excedida: usuario={}, usadas={}/{}, mes={}",
                    usuario.getEmail(), s.usadas(), s.limite(), s.anoMes());
            throw new ElvisQuotaExcedidaException(s.usadas(), s.limite(), s.anoMes());
        }
    }

    /* ─── 3. Incrementa após pergunta com sucesso ──────────────────────── */

    /**
     * Incrementa o contador do mês corrente.
     * Cria a linha se não existir (primeira pergunta do mês).
     *
     * Chamado pelo Aspect APÓS o método executar com sucesso.
     *
     * Pula incremento pra Whallet+/Admin (economiza I/O — não precisa contar
     * porque o limite é ilimitado).
     */
    @Transactional
    public void registrarPergunta(Usuario usuario) {
        if (usuario == null) return;

        boolean isAdmin = "ADMIN".equals(usuario.getPerfil());
        if (isAdmin) return;

        Integer limite = limiteDoPlano(usuario);
        if (limite == null) return;  // Whallet+ — não precisa contar

        String anoMes = ElvisUsoMensal.anoMesAtual();

        ElvisUsoMensal uso = usoRepository
                .findByUsuarioIdAndAnoMes(usuario.getId(), anoMes)
                .orElseGet(() -> ElvisUsoMensal.builder()
                        .usuarioId(usuario.getId())
                        .anoMes(anoMes)
                        .contador(0)
                        .build());

        uso.incrementar();
        usoRepository.save(uso);

        log.debug("Pergunta Elvis registrada: usuario={}, contador={}",
                usuario.getEmail(), uso.getContador());
    }

    /* ─── Internas ──────────────────────────────────────────────────────── */

    /**
     * Busca o limite do plano do usuário.
     * Retorna NULL se ilimitado.
     */
    private Integer limiteDoPlano(Usuario usuario) {
        if (usuario == null || usuario.getPlanoId() == null) {
            return 5;  // Default defensivo: tratar como Free
        }

        // IMPORTANTE: respeita assinatura ativa
        // Se Whallet+ está EXPIRADA, considera Free
        if (!planoGuard.assinaturaAtiva(usuario)) {
            return planoRepository.findBySlug(PlanoGuard.SLUG_GRATUITO)
                    .map(Plano::getElvisQuotaMensal)
                    .orElse(5);
        }

        return planoRepository.findById(usuario.getPlanoId())
                .map(Plano::getElvisQuotaMensal)
                .orElse(5);  // fallback defensivo
    }

    /* ─── Exception ─────────────────────────────────────────────────────── */

    /**
     * Lançada quando o usuário Free atinge o limite mensal.
     * Convertida em HTTP 429 pelo ElvisQuotaExceptionHandler.
     */
    public static class ElvisQuotaExcedidaException extends RuntimeException {
        private final int usadas;
        private final int limite;
        private final String anoMes;

        public ElvisQuotaExcedidaException(int usadas, int limite, String anoMes) {
            super(String.format(
                    "Limite mensal de perguntas ao Elvis atingido (%d/%d em %s). " +
                            "Faça upgrade pra Whallet+ pra perguntas ilimitadas.",
                    usadas, limite, anoMes
            ));
            this.usadas = usadas;
            this.limite = limite;
            this.anoMes = anoMes;
        }

        public int getUsadas() { return usadas; }
        public int getLimite() { return limite; }
        public String getAnoMes() { return anoMes; }
    }
}
package com.pedrocampelo.cnabportal.service.gestaosv;

import com.pedrocampelo.cnabportal.model.Plano;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.PlanoRepository;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Serviço de Trial 7 dias do Whallet+
 *
 * Regras:
 *   - Cada usuário pode ativar o trial UMA vez (trial_utilizado = true)
 *   - Trial dura 7 dias corridos
 *   - Durante trial: plano_id = whallet-plus, assinatura_status = 'TRIAL'
 *   - Após expirar: plano_id = gratuito, assinatura_status = 'SEM_ASSINATURA'
 *   - Se user assinar Stripe DURANTE trial, trial é "absorvido" (status muda pra ATIVA)
 *   - Admin não precisa de trial (já tem acesso total)
 *
 * Expiração:
 *   - Check on-demand: PlanoGuard chama verificarEExpirarSeNecessario()
 *   - Cron job: roda a cada hora e expira trials vencidos em batch
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrialService {

    private static final int TRIAL_DIAS = 7;

    private final UsuarioRepository usuarioRepository;
    private final PlanoRepository planoRepository;

    /**
     * Ativa trial de 7 dias do Whallet+ para o usuário.
     * @throws IllegalStateException se já usou trial ou já tem assinatura ativa
     */
    @Transactional
    public void ativarTrial(Usuario usuario) {
        if (Boolean.TRUE.equals(usuario.getTrialUtilizado())) {
            throw new IllegalStateException("Você já utilizou seu período de teste gratuito.");
        }

        String status = usuario.getAssinaturaStatus();
        if ("ATIVA".equals(status) || "CANCELANDO".equals(status)) {
            throw new IllegalStateException("Você já possui uma assinatura ativa.");
        }

        Plano plus = planoRepository.findBySlug(PlanoGuard.SLUG_WHALLET_PLUS)
                .orElseThrow(() -> new IllegalStateException("Plano Whallet+ não encontrado"));

        OffsetDateTime agora = OffsetDateTime.now();

        usuario.setPlanoId(plus.getId());
        usuario.setAssinaturaStatus("TRIAL");
        usuario.setTrialInicioEm(agora);
        usuario.setTrialExpiraEm(agora.plusDays(TRIAL_DIAS));
        usuario.setTrialUtilizado(true);

        usuarioRepository.save(usuario);
        log.info("Trial ativado: usuario={}, expira={}", usuario.getEmail(), usuario.getTrialExpiraEm());
    }

    /**
     * Verifica se o trial expirou e reverte pra Free se sim.
     * @return true se o trial foi expirado agora
     */
    @Transactional
    public boolean verificarEExpirarSeNecessario(Usuario usuario) {
        if (!"TRIAL".equals(usuario.getAssinaturaStatus())) return false;
        if (usuario.getTrialExpiraEm() == null) return false;
        if (usuario.getTrialExpiraEm().isAfter(OffsetDateTime.now())) return false;

        expirarTrial(usuario);
        return true;
    }

    /**
     * Retorna info do trial pro frontend.
     */
    public TrialStatus status(Usuario usuario) {
        if (usuario == null) return new TrialStatus(false, false, false, null, null, 0);

        boolean emTrial = "TRIAL".equals(usuario.getAssinaturaStatus())
                && usuario.getTrialExpiraEm() != null
                && usuario.getTrialExpiraEm().isAfter(OffsetDateTime.now());

        boolean jaUsou = Boolean.TRUE.equals(usuario.getTrialUtilizado());
        boolean expirado = jaUsou && !emTrial && !"ATIVA".equals(usuario.getAssinaturaStatus());

        int diasRestantes = 0;
        if (emTrial && usuario.getTrialExpiraEm() != null) {
            long diffMs = usuario.getTrialExpiraEm().toInstant().toEpochMilli()
                    - OffsetDateTime.now().toInstant().toEpochMilli();
            diasRestantes = Math.max(0, (int) Math.ceil(diffMs / 86_400_000.0));
        }

        return new TrialStatus(emTrial, jaUsou, expirado,
                usuario.getTrialInicioEm(), usuario.getTrialExpiraEm(), diasRestantes);
    }

    /**
     * Cron: roda a cada hora, expira trials vencidos em batch.
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void expirarTrialsVencidos() {
        List<Usuario> expirados = usuarioRepository.findByAssinaturaStatusAndTrialExpiraEmBefore(
                "TRIAL", OffsetDateTime.now());

        if (expirados.isEmpty()) return;
        log.info("Expirando {} trials vencidos", expirados.size());

        for (Usuario u : expirados) {
            expirarTrial(u);
        }
    }

    private void expirarTrial(Usuario usuario) {
        Plano free = planoRepository.findBySlug(PlanoGuard.SLUG_GRATUITO).orElse(null);
        usuario.setPlanoId(free != null ? free.getId() : null);
        usuario.setAssinaturaStatus("SEM_ASSINATURA");
        usuarioRepository.save(usuario);
        log.info("Trial expirado: usuario={}, revertido pra Free", usuario.getEmail());
    }

    public record TrialStatus(
            boolean emTrial,
            boolean jaUsou,
            boolean expirado,
            OffsetDateTime inicioEm,
            OffsetDateTime expiraEm,
            int diasRestantes
    ) {}
}
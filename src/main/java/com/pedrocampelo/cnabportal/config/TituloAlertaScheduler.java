package com.pedrocampelo.cnabportal.config;

import com.pedrocampelo.cnabportal.model.Titulo;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.TituloRepository;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import com.pedrocampelo.cnabportal.service.resendsv.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Envia e-mails de alerta diariamente para usuários que configuraram notificações.
 *
 * Roda às 08:00 todo dia.
 * Evita duplicatas verificando alertaUltimoEnvio — só envia uma vez por dia.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TituloAlertaScheduler {

    private final UsuarioRepository usuarioRepository;
    private final TituloRepository  tituloRepository;
    private final EmailService       emailService;

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void enviarAlertas() {
        LocalDate hoje = LocalDate.now();
        List<Usuario> usuarios = usuarioRepository.findUsuariosComAlertaAtivo();

        log.info("AlertaScheduler: verificando {} usuário(s) com alerta ativo", usuarios.size());

        int enviados = 0;
        for (Usuario u : usuarios) {
            try {
                // Evita enviar mais de uma vez por dia
                if (hoje.equals(u.getAlertaUltimoEnvio())) continue;

                int diasAntes = u.getAlertaDiasAntes() != null ? u.getAlertaDiasAntes() : 3;

                // Busca títulos vencidos (se o usuário quer)
                List<Titulo> vencidos = Boolean.TRUE.equals(u.getAlertaVencidos())
                        ? buscarVencidos(u.getId())
                        : List.of();

                // Busca títulos a vencer dentro do período configurado (se o usuário quer)
                List<Titulo> aVencer = Boolean.TRUE.equals(u.getAlertaAVencer())
                        ? buscarAVencer(u.getId(), hoje, diasAntes)
                        : List.of();

                // Só envia se houver algo relevante
                if (vencidos.isEmpty() && aVencer.isEmpty()) continue;

                emailService.enviarAlertaTitulos(
                        u.getEmail(), u.getNome(), vencidos, aVencer, diasAntes);

                u.setAlertaUltimoEnvio(hoje);
                usuarioRepository.save(u);
                enviados++;

            } catch (Exception e) {
                log.error("Erro ao processar alerta para {}: {}", u.getEmail(), e.getMessage());
            }
        }

        log.info("AlertaScheduler: {} e-mail(s) enviado(s)", enviados);
    }

    private List<Titulo> buscarVencidos(java.util.UUID usuarioId) {
        return tituloRepository.findParaRelatorio(usuarioId, "VENCIDO");
    }

    private List<Titulo> buscarAVencer(java.util.UUID usuarioId, LocalDate hoje, int dias) {
        LocalDate limite = hoje.plusDays(dias);
        // Busca PENDENTE com vencimento entre hoje e hoje+dias
        return tituloRepository.findParaRelatorio(usuarioId, "PENDENTE")
                .stream()
                .filter(t -> t.getVencimento() != null
                        && !t.getVencimento().isBefore(hoje)
                        && !t.getVencimento().isAfter(limite))
                .toList();
    }
}
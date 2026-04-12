package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import com.pedrocampelo.cnabportal.service.stripesv.CotaService;
import com.pedrocampelo.cnabportal.service.stripesv.CotaService.CotaResumo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class CotaController {

    private final CotaService       cotaService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/cota")
    public ResponseEntity<CotaResumo> getCota(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(cotaService.getResumo(usuario));
    }

    // Retorna dados atualizados do usuário (planoId, assinatura) — chamado após checkout
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Usuario usuario) {
        Usuario fresh = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        return ResponseEntity.ok(Map.of(
                "planoId",             fresh.getPlanoId() != null ? fresh.getPlanoId().toString() : "",
                "assinaturaStatus",    fresh.getAssinaturaStatus() != null ? fresh.getAssinaturaStatus() : "SEM_ASSINATURA",
                "assinaturaExpiraEm",  fresh.getAssinaturaExpiraEm() != null ? fresh.getAssinaturaExpiraEm().toString() : ""
        ));
    }

    // ── Preferências de alertas de e-mail ─────────────────────────────────────

    @GetMapping("/preferencias-alerta")
    public ResponseEntity<?> getPreferencias(@AuthenticationPrincipal Usuario usuario) {
        Usuario fresh = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        return ResponseEntity.ok(Map.of(
                "alertaVencidos",  fresh.getAlertaVencidos()  != null && fresh.getAlertaVencidos(),
                "alertaAVencer",   fresh.getAlertaAVencer()   != null && fresh.getAlertaAVencer(),
                "alertaDiasAntes", fresh.getAlertaDiasAntes() != null ? fresh.getAlertaDiasAntes() : 3
        ));
    }

    @PutMapping("/preferencias-alerta")
    public ResponseEntity<?> salvarPreferencias(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, Object> body) {
        try {
            Usuario u = usuarioRepository.findById(usuario.getId()).orElse(usuario);

            if (body.containsKey("alertaVencidos")) {
                u.setAlertaVencidos(Boolean.TRUE.equals(body.get("alertaVencidos")));
            }
            if (body.containsKey("alertaAVencer")) {
                u.setAlertaAVencer(Boolean.TRUE.equals(body.get("alertaAVencer")));
            }
            if (body.containsKey("alertaDiasAntes")) {
                int dias = Integer.parseInt(String.valueOf(body.get("alertaDiasAntes")));
                if (dias < 1 || dias > 90) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("mensagem", "Dias deve estar entre 1 e 90."));
                }
                u.setAlertaDiasAntes(dias);
            }

            usuarioRepository.save(u);
            return ResponseEntity.ok(Map.of("mensagem", "Preferências salvas com sucesso."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("mensagem", "Erro ao salvar preferências."));
        }
    }
}
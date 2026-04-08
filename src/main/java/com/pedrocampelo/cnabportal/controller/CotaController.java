package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import com.pedrocampelo.cnabportal.service.stripesv.CotaService;
import com.pedrocampelo.cnabportal.service.stripesv.CotaService.CotaResumo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

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
        // Relê do banco para garantir dados frescos após webhook
        Usuario fresh = usuarioRepository.findById(usuario.getId()).orElse(usuario);
        return ResponseEntity.ok(Map.of(
                "planoId",             fresh.getPlanoId() != null ? fresh.getPlanoId().toString() : "",
                "assinaturaStatus",    fresh.getAssinaturaStatus() != null ? fresh.getAssinaturaStatus() : "SEM_ASSINATURA",
                "assinaturaExpiraEm",  fresh.getAssinaturaExpiraEm() != null ? fresh.getAssinaturaExpiraEm().toString() : ""
        ));
    }
}
package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.CotaService;
import com.pedrocampelo.cnabportal.service.CotaService.CotaResumo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class CotaController {

    private final CotaService cotaService;

    @GetMapping("/cota")
    public ResponseEntity<CotaResumo> getCota(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(cotaService.getResumo(usuario));
    }
}
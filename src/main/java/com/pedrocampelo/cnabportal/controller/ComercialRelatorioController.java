package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.gate.RequireWhalletPlusWrite;
import com.pedrocampelo.cnabportal.dto.ComercialRelatorioResponse;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.service.comercialsv.ComercialRelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comercial")
@RequireWhalletPlusWrite
@RequiredArgsConstructor
public class ComercialRelatorioController {

    private final ComercialRelatorioService relatorioService;

    @GetMapping("/relatorio")
    public ResponseEntity<ComercialRelatorioResponse> relatorio(
            @AuthenticationPrincipal Usuario usuario) {

        return ResponseEntity.ok(
                relatorioService.gerar(usuario.getEmpresa().getId())
        );
    }
}

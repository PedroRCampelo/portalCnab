package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.config.TituloAlertaScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class AlertTest {

    private final TituloAlertaScheduler tituloAlertaScheduler;

    @PostMapping("/enviar-alertas")
    public ResponseEntity<?> enviarAlertasAgora() {
        tituloAlertaScheduler.enviarAlertas();
        return ResponseEntity.ok(Map.of("mensagem", "Processamento de alertas executado."));
    }
}
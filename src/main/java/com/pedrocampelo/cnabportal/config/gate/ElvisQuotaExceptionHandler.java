package com.pedrocampelo.cnabportal.config.gate;

import com.pedrocampelo.cnabportal.service.gestaosv.ElvisQuotaService.ElvisQuotaExcedidaException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Converte ElvisQuotaExcedidaException em HTTP 429 Too Many Requests.
 *
 * Por que 429 (e não 402 como o PlanoExceptionHandler)?
 *
 *   402 (Payment Required): exige assinatura pra ACESSAR a feature
 *     → User Free não pode usar Recebimentos                → 402
 *
 *   429 (Too Many Requests): pode usar, mas excedeu o LIMITE
 *     → User Free atingiu 5/5 perguntas no mês              → 429
 *
 * Frontend deve tratar diferente:
 *   - 402 → mostra paywall ("Assine pra acessar")
 *   - 429 → mostra mensagem de quota ("Você usou todas suas perguntas")
 *
 * Sprint A3.9.2
 */
@RestControllerAdvice
public class ElvisQuotaExceptionHandler {

    @ExceptionHandler(ElvisQuotaExcedidaException.class)
    public ResponseEntity<Map<String, Object>> handleQuotaExcedida(ElvisQuotaExcedidaException e) {
        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)  // 429
                .body(Map.of(
                        "codigo",     "ELVIS_QUOTA_EXCEDIDA",
                        "mensagem",   e.getMessage(),
                        "usadas",     e.getUsadas(),
                        "limite",     e.getLimite(),
                        "anoMes",     e.getAnoMes(),
                        "upgradePara", "whallet-plus"
                ));
    }
}
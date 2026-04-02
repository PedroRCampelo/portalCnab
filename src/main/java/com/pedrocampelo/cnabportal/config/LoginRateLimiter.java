package com.pedrocampelo.cnabportal.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

// Rate limiter em memoria para o endpoint de login
// Limite: 5 tentativas por IP em 60 segundos
// Em producao com multiplas instancias, substituir por Redis
@Component
@Slf4j
public class LoginRateLimiter {

    private static final int    LIMITE_TENTATIVAS = 5;
    private static final long   JANELA_SEGUNDOS   = 60;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean permitir(String ip) {
        Bucket bucket = buckets.computeIfAbsent(ip, k -> new Bucket());
        boolean permitido = bucket.tentar();
        if (!permitido) {
            log.warn("Rate limit atingido para IP: {}", ip);
        }
        return permitido;
    }

    public void registrarSucesso(String ip) {
        buckets.remove(ip); // reseta o contador apos login bem-sucedido
    }

    // Limpa IPs antigos periodicamente para nao vazar memoria
    // Chamado a cada 5 minutos pelo Spring Scheduler
    public void limparExpirados() {
        long agora = Instant.now().getEpochSecond();
        buckets.entrySet().removeIf(e -> agora - e.getValue().inicioJanela > JANELA_SEGUNDOS * 5);
    }

    private static class Bucket {
        final AtomicInteger tentativas = new AtomicInteger(0);
        volatile long inicioJanela = Instant.now().getEpochSecond();

        boolean tentar() {
            long agora = Instant.now().getEpochSecond();

            // Reseta a janela se passou o tempo
            if (agora - inicioJanela >= JANELA_SEGUNDOS) {
                tentativas.set(0);
                inicioJanela = agora;
            }

            return tentativas.incrementAndGet() <= LIMITE_TENTATIVAS;
        }
    }
}
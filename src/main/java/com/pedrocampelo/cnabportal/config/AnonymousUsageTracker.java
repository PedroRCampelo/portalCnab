package com.pedrocampelo.cnabportal.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

// Rastreia usos anônimos por IP — limite de 2, sem expiração
// Em produção com múltiplas instâncias, substituir por Redis
@Component
@Slf4j
public class AnonymousUsageTracker {

    private static final int LIMITE = 2;

    private final ConcurrentHashMap<String, AtomicInteger> contadores = new ConcurrentHashMap<>();

    public boolean temUsoDisponivel(String ip) {
        return contadores.getOrDefault(ip, new AtomicInteger(0)).get() < LIMITE;
    }

    // Retorna true se o uso foi registrado, false se o limite foi atingido
    public boolean registrarUso(String ip) {
        AtomicInteger contador = contadores.computeIfAbsent(ip, k -> new AtomicInteger(0));
        int atual = contador.get();
        if (atual >= LIMITE) {
            log.debug("Limite anônimo atingido para IP: {}", ip);
            return false;
        }
        contador.incrementAndGet();
        log.info("Uso anônimo registrado para IP: {} — {}/{}", ip, contador.get(), LIMITE);
        return true;
    }

    public int usosRestantes(String ip) {
        int usados = contadores.getOrDefault(ip, new AtomicInteger(0)).get();
        return Math.max(0, LIMITE - usados);
    }

    public int usosRealizados(String ip) {
        return contadores.getOrDefault(ip, new AtomicInteger(0)).get();
    }
}
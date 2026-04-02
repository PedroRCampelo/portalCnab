package com.pedrocampelo.cnabportal.config;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class RateLimiterScheduler {

    private final LoginRateLimiter rateLimiter;

    @Scheduled(fixedDelay = 300_000) // a cada 5 minutos
    public void limpar() {
        rateLimiter.limparExpirados();
    }
}
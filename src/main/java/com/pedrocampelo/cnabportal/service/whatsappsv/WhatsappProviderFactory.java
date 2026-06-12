package com.pedrocampelo.cnabportal.service.whatsappsv;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@RequiredArgsConstructor
@Slf4j
public class WhatsappProviderFactory {

    private final EvolutionWhatsappProvider evolutionProvider;
    private final MetaWhatsappProvider metaProvider;

    @Value("${whatsapp.provider:evolution}")
    private String providerAtivo;

    @PostConstruct
    public void init() {
        log.info("[WhatsApp] Provedor ativo: {}", providerAtivo.toUpperCase());
    }

    public WhatsappProvider get() {
        return "meta".equalsIgnoreCase(providerAtivo) ? metaProvider : evolutionProvider;
    }

    public boolean isMeta() {
        return "meta".equalsIgnoreCase(providerAtivo);
    }
}

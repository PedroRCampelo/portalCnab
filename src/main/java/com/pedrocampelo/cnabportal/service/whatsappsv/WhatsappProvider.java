package com.pedrocampelo.cnabportal.service.whatsappsv;

/**
 * Abstração do provedor de WhatsApp.
 * Implementações: EvolutionWhatsappProvider, MetaWhatsappProvider
 * Troca via env var WHATSAPP_PROVIDER=evolution|meta
 */
public interface WhatsappProvider {
    void enviarMensagem(String numero, String texto);
    String getNome();
}

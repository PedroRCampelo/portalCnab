package com.pedrocampelo.cnabportal.service;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final Resend resend;

    @Value("${email.from}")
    private String emailFrom;

    @Value("${app.url}")
    private String appUrl;

    public EmailService(@Value("${resend.api-key}") String apiKey) {
        this.resend = new Resend(apiKey);
    }

    // Envia o email de confirmacao de cadastro
    // O token e um UUID gerado no cadastro — expira em 24h
    public void enviarConfirmacaoEmail(String destinatario, String nome, String token) {
        String link = appUrl + "/verificar-email?token=" + token;

        // HTML simples e compativel com a maioria dos clientes de email
        // Evita CSS externo e estilos complexos que sao bloqueados pelo Gmail/Outlook
        String html = """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#0F172A;font-family:Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0F172A;">
                <tr><td align="center" style="padding:40px 20px;">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:12px;border:1px solid #334155;">
                    <tr><td style="padding:40px;">
                      <h2 style="color:#A78BFA;margin:0 0 12px;font-size:22px;">Confirme seu email</h2>
                      <p style="color:#94A3B8;margin:0 0 28px;font-size:15px;line-height:1.6;">
                        Ola, %s. Clique no botao abaixo para ativar sua conta no Whallet.
                      </p>
                      <table cellpadding="0" cellspacing="0">
                        <tr><td style="background:#7C3AED;border-radius:8px;">
                          <a href="%s" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">
                            Confirmar email
                          </a>
                        </td></tr>
                      </table>
                      <p style="color:#64748B;font-size:13px;margin:24px 0 0;line-height:1.6;">
                        Se o botao nao funcionar, copie e cole este link no navegador:<br>
                        <span style="color:#7C3AED;word-break:break-all;">%s</span>
                      </p>
                      <p style="color:#64748B;font-size:12px;margin:16px 0 0;">
                        Este link expira em 24 horas. Se voce nao criou uma conta, ignore este email.
                      </p>
                      <hr style="border:none;border-top:1px solid #1E293B;margin:24px 0;"/>
                      <p style="color:#475569;font-size:12px;margin:0;">Whallet — whallet.com.br</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(nome, link, link);

        try {
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(emailFrom)
                    .to(destinatario)
                    .subject("Confirme seu email — Whallet")
                    .html(html)
                    .build();

            resend.emails().send(email);
            log.info("Email de confirmacao enviado para: {}", destinatario);

        } catch (Exception e) {
            // Loga o erro mas nao interrompe o fluxo — usuario foi cadastrado
            // O dominio precisa estar verificado no Resend para enviar emails
            log.error("Falha ao enviar email para {}: {}", destinatario, e.getMessage());
        }
    }
}
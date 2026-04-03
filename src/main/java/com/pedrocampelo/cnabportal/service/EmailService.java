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
        String link        = appUrl + "/verificar-email?token=" + token;
        String primeiroNome = nome.split(" ")[0];

        String html = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Confirme seu email — Whallet</title>
            </head>
            <body style="margin:0;padding:0;background:#4C1D95;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

              <table width="100%%" cellpadding="0" cellspacing="0"
                style="background:#4C1D95;background:linear-gradient(135deg,#4C1D95 0%%,#6D28D9 40%%,#4F46E5 75%%,#3B82F6 100%%);">
                <tr><td align="center" style="padding:48px 20px;">

                  <!-- Lettermark logo -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr><td align="center">
                      <div style="display:inline-block;width:60px;height:60px;line-height:60px;border-radius:16px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);text-align:center;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;margin-bottom:12px;">W</div>
                      <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Whallet</div>
                    </td></tr>
                  </table>

                  <!-- Card -->
                  <table width="480" cellpadding="0" cellspacing="0"
                    style="max-width:480px;width:100%%;background:rgba(255,255,255,0.13);border-radius:20px;border:1px solid rgba(255,255,255,0.2);">
                    <tr><td style="padding:40px 36px;text-align:center;">

                      <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 12px;">
                        Ola, %s! 👋
                      </p>
                      <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.7;margin:0 0 32px;">
                        Bem-vindo ao Whallet. Clique no botão abaixo para ativar sua conta e começar trabalhar.
                      </p>

                      <!-- Botao -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                        <tr>
                          <td align="center" style="background:Se#ffffff;border-radius:12px;">
                            <a href="%s"
                              style="display:inline-block;padding:16px 48px;color:#6D28D9;font-weight:700;font-size:16px;text-decoration:none;white-space:nowrap;">
                              Confirmar email
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Divider -->
                      <table width="100%%" cellpadding="0" cellspacing="0">
                        <tr><td style="border-top:1px solid rgba(255,255,255,0.15);padding-top:24px;">
                          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 8px;">
                            Se o botão não funcionar, copie e cole este link:
                          </p>
                          <a href="%s" style="color:#C4B5FD;font-size:12px;word-break:break-all;">%s</a>
                        </td></tr>
                      </table>

                      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:20px 0 0;line-height:1.6;">
                        Este link expira em 24 horas. Se você não criou uma conta, ignore este email.
                      </p>

                    </td></tr>
                  </table>

                  <!-- Footer -->
                  <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:28px 0 0;">
                    Whallet &mdash;
                    <a href="https://whallet.com.br" style="color:rgba(255,255,255,0.5);text-decoration:none;">whallet.com.br</a>
                  </p>

                </td></tr>
              </table>

            </body>
            </html>
            """.formatted(primeiroNome, link, link, link);

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
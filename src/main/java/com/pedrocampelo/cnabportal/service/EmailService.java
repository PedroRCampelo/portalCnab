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
        String primeiroNome = nome != null && !nome.isBlank() ? nome.split(" ")[0] : "usuario";

        String html = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Confirme seu email — Whallet</title>
            </head>
            <body style="margin:0;padding:0;background:#F5F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;margin:0;padding:0;">
                <tr>
                  <td align="center" style="padding:40px 20px;">

                    <!-- Wrapper -->
                    <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">
                      
                      <!-- Top badge -->
                      <tr>
                        <td align="center" style="padding-bottom:24px;">
                          <div style="
                            display:inline-block;
                            padding:10px 18px;
                            border-radius:999px;
                            border:1px solid rgba(245,158,11,0.30);
                            background:#FFF8E6;
                            color:#B45309;
                            font-size:12px;
                            font-weight:800;
                            letter-spacing:1.2px;
                            text-transform:uppercase;">
                            Whallet · Confirmacao de email
                          </div>
                        </td>
                      </tr>

                      <!-- Logo / Brand -->
                      <tr>
                        <td align="center" style="padding-bottom:24px;">
                          <div style="
                            display:inline-block;
                            width:64px;
                            height:64px;
                            line-height:64px;
                            border-radius:18px;
                            background:linear-gradient(135deg,#F59E0B 0%%,#FCD34D 100%%);
                            color:#111111;
                            text-align:center;
                            font-size:30px;
                            font-weight:900;
                            letter-spacing:-1px;
                            box-shadow:0 10px 30px rgba(245,158,11,0.18);">
                            W
                          </div>
                          <div style="margin-top:12px;color:#111111;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                            Whallet
                          </div>
                          <div style="margin-top:6px;color:#787878;font-size:14px;">
                            Portal financeiro · CNAB + Gestao
                          </div>
                        </td>
                      </tr>

                      <!-- Main Card -->
                      <tr>
                        <td>
                          <table width="100%%" cellpadding="0" cellspacing="0"
                            style="
                              width:100%%;
                              background:#FFFFFF;
                              border:1px solid #E7E5E4;
                              border-radius:24px;
                              box-shadow:0 12px 40px rgba(17,17,17,0.06);">
                            
                            <!-- top line -->
                            <tr>
                              <td style="height:6px;background:linear-gradient(135deg,#F59E0B 0%%,#FCD34D 100%%);border-radius:24px 24px 0 0;"></td>
                            </tr>

                            <tr>
                              <td style="padding:40px 36px 32px 36px;text-align:left;">

                                <div style="color:#111111;font-size:28px;font-weight:900;line-height:1.15;letter-spacing:-1px;margin:0 0 18px;">
                                  Confirme seu email
                                </div>

                                <p style="color:#111111;font-size:16px;line-height:1.7;margin:0 0 14px;">
                                  Olá, <strong>%s</strong>!
                                </p>

                                <p style="color:#444444;font-size:15px;line-height:1.8;margin:0 0 28px;">
                                  Seja bem-vindo ao <strong>Whallet</strong>. Para ativar sua conta e começar a usar a plataforma,
                                  clique no botão abaixo.
                                </p>

                                <!-- CTA -->
                                <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                                  <tr>
                                    <td align="center"
                                      style="
                                        border-radius:14px;
                                        background:linear-gradient(135deg,#F59E0B 0%%,#FCD34D 100%%);
                                        box-shadow:0 10px 24px rgba(245,158,11,0.22);">
                                      <a href="%s"
                                        style="
                                          display:inline-block;
                                          padding:16px 30px;
                                          color:#111111;
                                          font-weight:800;
                                          font-size:15px;
                                          text-decoration:none;
                                          white-space:nowrap;">
                                        Confirmar email
                                      </a>
                                    </td>
                                  </tr>
                                </table>

                                <!-- Support text -->
                                <p style="color:#666666;font-size:13px;line-height:1.7;margin:0 0 22px;">
                                  Este link expira em <strong>24 horas</strong>. Caso você não tenha criado uma conta,
                                  basta ignorar este email.
                                </p>

                                <!-- Divider -->
                                <table width="100%%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="border-top:1px solid #ECECEC;padding-top:22px;">
                                      <p style="color:#787878;font-size:12px;line-height:1.6;margin:0 0 8px;">
                                        Se o botao nao funcionar, copie e cole este link no navegador:
                                      </p>
                                      <a href="%s"
                                        style="color:#B45309;font-size:12px;line-height:1.6;word-break:break-all;text-decoration:none;">
                                        %s
                                      </a>
                                    </td>
                                  </tr>
                                </table>

                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding-top:22px;">
                          <p style="color:#8A8A8A;font-size:12px;line-height:1.7;margin:0;">
                            Whallet &mdash;
                            <a href="https://whallet.com.br" style="color:#8A8A8A;text-decoration:none;">whallet.com.br</a>
                          </p>
                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>
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
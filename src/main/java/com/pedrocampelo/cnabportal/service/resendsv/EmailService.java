package com.pedrocampelo.cnabportal.service.resendsv;

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
            <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;margin:0;padding:0;">
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
                            border:1px solid rgba(6,182,212,0.22);
                            background:#EFF4F8;
                            color:#06B6D4;
                            font-size:12px;
                            font-weight:800;
                            letter-spacing:1.2px;
                            text-transform:uppercase;">
                            Whallet · Confirmação de email
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
                            background:linear-gradient(135deg,#06B6D4 0%%,#22D3EE 100%%);
                            color:#1E293B;
                            text-align:center;
                            font-size:30px;
                            font-weight:900;
                            letter-spacing:-1px;
                            box-shadow:0 10px 30px rgba(6,182,212,0.16);">
                            W
                          </div>
                          <div style="margin-top:12px;color:#1E293B;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                            Whallet
                          </div>
                          <div style="margin-top:6px;color:#475569;font-size:14px;">
                            Portal financeiro · CNAB + Gestão
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
                              border:1px solid #CBD5E1;
                              border-radius:24px;
                              box-shadow:0 12px 40px rgba(17,17,17,0.06);">
                            
                            <!-- top line -->
                            <tr>
                              <td style="height:6px;background:linear-gradient(135deg,#06B6D4 0%%,#22D3EE 100%%);border-radius:24px 24px 0 0;"></td>
                            </tr>

                            <tr>
                              <td style="padding:40px 36px 32px 36px;text-align:left;">

                                <div style="color:#1E293B;font-size:28px;font-weight:900;line-height:1.15;letter-spacing:-1px;margin:0 0 18px;">
                                  Confirme seu email
                                </div>

                                <p style="color:#1E293B;font-size:16px;line-height:1.7;margin:0 0 14px;">
                                  Olá, <strong>%s</strong>!
                                </p>

                                <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 28px;">
                                  Seja bem-vindo ao <strong>Whallet</strong>. Para ativar sua conta e começar a usar a plataforma,
                                  clique no botão abaixo.
                                </p>

                                <!-- CTA -->
                                <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                                  <tr>
                                    <td align="center"
                                      style="
                                        border-radius:14px;
                                        background:linear-gradient(135deg,#06B6D4 0%%,#22D3EE 100%%);
                                        box-shadow:0 10px 24px rgba(6,182,212,0.20);">
                                      <a href="%s"
                                        style="
                                          display:inline-block;
                                          padding:16px 30px;
                                          color:#1E293B;
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
                                <p style="color:#475569;font-size:13px;line-height:1.7;margin:0 0 22px;">
                                  Este link expira em <strong>24 horas</strong>. Caso você não tenha criado uma conta,
                                  basta ignorar este email.
                                </p>

                                <!-- Divider -->
                                <table width="100%%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="border-top:1px solid #CBD5E1;padding-top:22px;">
                                      <p style="color:#475569;font-size:12px;line-height:1.6;margin:0 0 8px;">
                                        Se o botao nao funcionar, copie e cole este link no navegador:
                                      </p>
                                      <a href="%s"
                                        style="color:#06B6D4;font-size:12px;line-height:1.6;word-break:break-all;text-decoration:none;">
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
                          <p style="color:#475569;font-size:12px;line-height:1.7;margin:0;">
                            Whallet &mdash;
                            <a href="https://whallet.com.br" style="color:#475569;text-decoration:none;">whallet.com.br</a>
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

    // Envia o email de redefinição de senha
    public void enviarEmailRedefinicaoSenha(String destinatario, String nome, String token) {
        String link = appUrl + "/redefinir-senha?token=" + token;
        String primeiroNome = nome != null && !nome.isBlank() ? nome.split(" ")[0] : "usuário";

        String html = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Redefinir senha — Whallet</title>
            </head>
            <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;margin:0;padding:0;">
                <tr><td align="center" style="padding:40px 20px;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">
                    <tr><td align="center" style="padding-bottom:24px;">
                      <div style="display:inline-block;padding:10px 18px;border-radius:999px;border:1px solid rgba(6,182,212,0.22);background:#EFF4F8;color:#06B6D4;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">
                        Whallet · Redefinição de senha
                      </div>
                    </td></tr>
                    <tr><td align="center" style="padding-bottom:24px;">
                      <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:18px;background:linear-gradient(135deg,#06B6D4 0%%,#22D3EE 100%%);color:#1E293B;text-align:center;font-size:30px;font-weight:900;letter-spacing:-1px;">W</div>
                      <div style="margin-top:12px;color:#1E293B;font-size:24px;font-weight:800;">Whallet</div>
                    </td></tr>
                    <tr><td>
                      <table width="100%%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:24px;box-shadow:0 12px 40px rgba(17,17,17,0.06);">
                        <tr><td style="height:6px;background:linear-gradient(135deg,#06B6D4 0%%,#22D3EE 100%%);border-radius:24px 24px 0 0;"></td></tr>
                        <tr><td style="padding:40px 36px 32px 36px;">
                          <div style="color:#1E293B;font-size:28px;font-weight:900;letter-spacing:-1px;margin:0 0 18px;">Redefinir sua senha</div>
                          <p style="color:#1E293B;font-size:16px;line-height:1.7;margin:0 0 14px;">Olá, <strong>%s</strong>!</p>
                          <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 28px;">
                            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
                          </p>
                          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                            <tr><td align="center" style="border-radius:14px;background:linear-gradient(135deg,#06B6D4 0%%,#22D3EE 100%%);box-shadow:0 10px 24px rgba(6,182,212,0.20);">
                              <a href="%s" style="display:inline-block;padding:16px 30px;color:#1E293B;font-weight:800;font-size:15px;text-decoration:none;white-space:nowrap;">Criar nova senha</a>
                            </td></tr>
                          </table>
                          <p style="color:#475569;font-size:13px;line-height:1.7;margin:0 0 22px;">
                            Este link expira em <strong>1 hora</strong>. Se você não solicitou isso, ignore este email — sua senha permanece a mesma.
                          </p>
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr><td style="border-top:1px solid #CBD5E1;padding-top:22px;">
                              <p style="color:#475569;font-size:12px;margin:0 0 8px;">Se o botão não funcionar, copie e cole este link:</p>
                              <a href="%s" style="color:#06B6D4;font-size:12px;word-break:break-all;text-decoration:none;">%s</a>
                            </td></tr>
                          </table>
                        </td></tr>
                      </table>
                    </td></tr>
                    <tr><td align="center" style="padding-top:22px;">
                      <p style="color:#475569;font-size:12px;margin:0;">Whallet &mdash; <a href="https://whallet.com.br" style="color:#475569;text-decoration:none;">whallet.com.br</a></p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(primeiroNome, link, link, link);

        try {
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(emailFrom)
                    .to(destinatario)
                    .subject("Redefinir sua senha — Whallet")
                    .html(html)
                    .build();
            resend.emails().send(email);
            log.info("Email de redefinição enviado para: {}", destinatario);
        } catch (Exception e) {
            log.error("Falha ao enviar email de redefinição para {}: {}", destinatario, e.getMessage());
        }
    }

    // ── Alerta de títulos ─────────────────────────────────────────────────────

    public void enviarAlertaTitulos(
            String destinatario,
            String nome,
            java.util.List<com.pedrocampelo.cnabportal.model.Titulo> vencidos,
            java.util.List<com.pedrocampelo.cnabportal.model.Titulo> aVencer,
            int diasAntes) {

        String primeiroNome = nome != null && !nome.isBlank() ? nome.split(" ")[0] : "usuário";
        java.text.NumberFormat brl = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("pt", "BR"));
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");

        StringBuilder sb = new StringBuilder();

        // Bloco de vencidos
        if (!vencidos.isEmpty()) {
            sb.append("""
        <tr><td style="padding:24px 32px 8px;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#DC2626;">
            ⚠️ Títulos vencidos em aberto (%s)
          </p>
          <table width="100%%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
            <tr style="background:#EFF4F8;">
              <th style="padding:8px 10px;text-align:left;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Fornecedor</th>
              <th style="padding:8px 10px;text-align:left;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Número</th>
              <th style="padding:8px 10px;text-align:right;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Vencimento</th>
              <th style="padding:8px 10px;text-align:right;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Saldo</th>
            </tr>
        """.formatted(vencidos.size()));
            for (int i = 0; i < Math.min(vencidos.size(), 15); i++) {
                var t = vencidos.get(i);
                String bg = i % 2 == 0 ? "#FFFFFF" : "#FFFFFF";
                sb.append(String.format("""
                    <tr style="background:%s;">
                      <td style="padding:7px 10px;color:#374151;border-bottom:1px solid #CBD5E1;">%s</td>
                      <td style="padding:7px 10px;color:#374151;border-bottom:1px solid #CBD5E1;">%s/%s</td>
                      <td style="padding:7px 10px;text-align:right;color:#DC2626;border-bottom:1px solid #CBD5E1;">%s</td>
                      <td style="padding:7px 10px;text-align:right;font-weight:600;color:#DC2626;border-bottom:1px solid #CBD5E1;">%s</td>
                    </tr>
                    """,
                        bg,
                        esc(t.getFornecedorNome()),
                        esc(t.getNumero()), esc(t.getParcela()),
                        t.getVencimento() != null ? t.getVencimento().format(fmt) : "—",
                        t.getSaldo() != null ? brl.format(t.getSaldo()) : "—"
                ));
            }
            if (vencidos.size() > 15) {
                sb.append(String.format(
                        "<tr><td colspan='4' style='padding:8px 10px;color:#475569;font-size:12px;'>... e mais %d título(s)</td></tr>",
                        vencidos.size() - 15));
            }
            sb.append("</table></td></tr>");
        }

        // Bloco a vencer
        if (!aVencer.isEmpty()) {
            sb.append("""
        <tr><td style="padding:24px 32px 8px;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#334155;">
            📅 Títulos a vencer nos próximos %s dia(s) (%s)
          </p>
          <table width="100%%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
            <tr style="background:#F8FAFC;">
              <th style="padding:8px 10px;text-align:left;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Fornecedor</th>
              <th style="padding:8px 10px;text-align:left;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Número</th>
              <th style="padding:8px 10px;text-align:right;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Vencimento</th>
              <th style="padding:8px 10px;text-align:right;color:#334155;font-weight:700;border-bottom:1px solid #CBD5E1;">Saldo</th>
            </tr>
        """.formatted(diasAntes, aVencer.size()));
            for (int i = 0; i < Math.min(aVencer.size(), 15); i++) {
                var t = aVencer.get(i);
                String bg = i % 2 == 0 ? "#FFFFFF" : "#FFFFFF";
                sb.append(String.format("""
                    <tr style="background:%s;">
                      <td style="padding:7px 10px;color:#374151;border-bottom:1px solid #CBD5E1;">%s</td>
                      <td style="padding:7px 10px;color:#374151;border-bottom:1px solid #CBD5E1;">%s/%s</td>
                      <td style="padding:7px 10px;text-align:right;color:#06B6D4;border-bottom:1px solid #CBD5E1;">%s</td>
                      <td style="padding:7px 10px;text-align:right;font-weight:600;color:#06B6D4;border-bottom:1px solid #CBD5E1;">%s</td>
                    </tr>
                    """,
                        bg,
                        esc(t.getFornecedorNome()),
                        esc(t.getNumero()), esc(t.getParcela()),
                        t.getVencimento() != null ? t.getVencimento().format(fmt) : "—",
                        t.getSaldo() != null ? brl.format(t.getSaldo()) : "—"
                ));
            }
            if (aVencer.size() > 15) {
                sb.append(String.format(
                        "<tr><td colspan='4' style='padding:8px 10px;color:#475569;font-size:12px;'>... e mais %d título(s)</td></tr>",
                        aVencer.size() - 15));
            }
            sb.append("</table></td></tr>");
        }

        String assunto = vencidos.isEmpty()
                ? "📅 Títulos a vencer — Whallet"
                : aVencer.isEmpty()
                ? "⚠️ Títulos vencidos em aberto — Whallet"
                : "⚠️ Alerta financeiro: vencidos e a vencer — Whallet";

        String html = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Alerta de títulos — Whallet</title></head>
            <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
                <tr><td align="center">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

                    <!-- Header principal -->
                    <tr><td style="background:#1E293B;padding:28px 32px;border-bottom:3px solid #06B6D4;">
                      <p style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">Whallet</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#CBD5E1;font-weight:500;">Portal Financeiro</p>
                    </td></tr>

                    <!-- Saudação -->
                    <tr><td style="padding:28px 32px 8px;">
                      <p style="margin:0;font-size:16px;color:#1E293B;">Olá, <strong>%s</strong> 👋</p>
                      <p style="margin:10px 0 0;font-size:14px;color:#475569;line-height:1.6;">
                        Aqui está um resumo dos seus títulos que precisam de atenção:
                      </p>
                    </td></tr>

                    <!-- Tabelas dinâmicas -->
                    %s

                    <!-- CTA -->
                    <tr><td style="padding:24px 32px;">
                      <a href="%s/titulos" style="display:inline-block;padding:13px 28px;background:#1E293B;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;border:1px solid rgba(6,182,212,0.30);">
                        Ver todos os títulos →
                      </a>
                    </td></tr>

                    <!-- Rodapé -->
                    <tr><td style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #CBD5E1;">
                      <p style="margin:0;font-size:11px;color:#CBD5E1;line-height:1.6;">
                        Você recebe este e-mail porque configurou alertas no Whallet.<br>
                        <a href="%s/preferencias-alerta" style="color:#06B6D4;text-decoration:none;">Gerenciar preferências de alerta</a>
                      </p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(primeiroNome, sb.toString(), appUrl, appUrl);

        try {
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(emailFrom)
                    .to(destinatario)
                    .subject(assunto)
                    .html(html)
                    .build();
            resend.emails().send(email);
            log.info("Alerta de títulos enviado para: {} — vencidos: {} / a vencer: {}",
                    destinatario, vencidos.size(), aVencer.size());
        } catch (Exception e) {
            log.error("Falha ao enviar alerta para {}: {}", destinatario, e.getMessage());
        }
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
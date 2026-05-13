package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "whatsapp_sessoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WhatsappSessao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "empresa_id")
    private UUID empresaId;

    /** Número real do usuário (5581996774063) — informado no app */
    @Column(nullable = false, length = 20)
    private String telefone;

    /** LID do WhatsApp — preenchido quando o usuário responde o código */
    @Column(length = 50)
    private String lid;

    /** Código de verificação de 6 dígitos enviado via WhatsApp */
    @Column(name = "codigo_verificacao", length = 6)
    private String codigoVerificacao;

    /** true quando o código foi validado com sucesso */
    @Column(nullable = false)
    @Builder.Default
    private Boolean verificada = false;

    /** Quando o código expira (5 minutos após envio) */
    @Column(name = "codigo_expira_em")
    private LocalDateTime codigoExpiraEm;

    @Column(columnDefinition = "TEXT")
    private String contexto;

    @Column(name = "ultima_mensagem_em", nullable = false)
    @Builder.Default
    private LocalDateTime ultimaMensagemEm = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativa = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
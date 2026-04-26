package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Auditoria de cobranças enviadas pelo MEI ao cliente.
 *
 * Cada vez que o usuário gera uma mensagem de cobrança (WhatsApp, email),
 * registramos aqui pra:
 *   - Mostrar histórico no detalhe do recebimento
 *   - Calcular score de inadimplência do cliente
 *   - Evitar spam (não sugerir cobrar de novo nas próximas 24h)
 */
@Entity
@Table(name = "cobrancas_enviadas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CobrancaEnviada {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recebimento_id", nullable = false)
    private Recebimento recebimento;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "tipo_mensagem", nullable = false, length = 20)
    private String tipoMensagem;
    // LEMBRETE | COBRANCA_AMIGAVEL | COBRANCA_FORMAL | COBRANCA_FIRME

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String canal = "WHATSAPP";
    // WHATSAPP | EMAIL | SMS

    @Column(name = "mensagem_texto", columnDefinition = "TEXT")
    private String mensagemTexto;  // snapshot do que foi enviado

    @CreationTimestamp
    @Column(name = "enviado_em", nullable = false, updatable = false)
    private LocalDateTime enviadoEm;
}
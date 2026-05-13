package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "whatsapp_mensagens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WhatsappMensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sessao_id", nullable = false)
    private UUID sessaoId;

    /** ENTRADA (usuário → bot) ou SAIDA (bot → usuário) */
    @Column(nullable = false, length = 10)
    private String direcao;

    /** TEXTO, AUDIO, IMAGEM, SISTEMA */
    @Column(nullable = false, length = 10)
    @Builder.Default
    private String tipo = "TEXTO";

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    /** Transcrição do áudio (quando tipo = AUDIO) */
    @Column(columnDefinition = "TEXT")
    private String transcricao;

    /** Ação executada: CRIAR_RECEBIMENTO, BAIXAR_TITULO, etc */
    @Column(name = "acao_executada", length = 50)
    private String acaoExecutada;

    /** ID do registro criado/alterado pela ação */
    @Column(name = "acao_id")
    private UUID acaoId;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
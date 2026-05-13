package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Cliente — entidade base do CRM.
 *
 * Sprint F1.3: campos expandidos (endereço, whatsapp, data nascimento, etc)
 * + referência ao setor (seguros, clínicas, imobiliário, etc).
 * Dados setoriais ficam na tabela cliente_setor_dados (EAV).
 */
@Entity
@Table(name = "clientes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // ── Identificação ─────────────────────────────────────────────────────────

    @Column(nullable = false, length = 150)
    @NotBlank
    private String nome;

    @Column(length = 20)
    private String documento;

    @Column(name = "tipo_pessoa", nullable = false, length = 2)
    @Builder.Default
    private String tipoPessoa = "PF";

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    // ── Contato ───────────────────────────────────────────────────────────────

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(length = 20)
    private String whatsapp;

    @Column(length = 20)
    private String telefone2;

    // ── Endereço ──────────────────────────────────────────────────────────────

    @Column(length = 200)
    private String endereco;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 9)
    private String cep;

    // ── Comercial ─────────────────────────────────────────────────────────────

    @Column(name = "origem_lead", length = 50)
    private String origemLead;

    @Column(length = 100)
    private String responsavel;

    @Column(length = 255)
    private String tags;

    // ── Categorização ─────────────────────────────────────────────────────────

    @Column(length = 50)
    private String categoria;

    @Column(columnDefinition = "TEXT")
    private String notas;

    // ── Setor (CRM setorial — Sprint F1.3) ────────────────────────────────────

    /**
     * ID do setor: "seguros", "clinicas", "imobiliario", "varejo", "servicos".
     * Null = sem setor (aba de dados setoriais não aparece).
     */
    @Column(name = "setor_id", length = 30)
    private String setorId;

    // ── Score e acompanhamento ─────────────────────────────────────────────────

    @Column(length = 20)
    private String score;

    @Column(name = "data_ultimo_contato")
    private LocalDateTime dataUltimoContato;

    // ── Status ────────────────────────────────────────────────────────────────

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    // ── Auditoria ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
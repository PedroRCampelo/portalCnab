package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "clientes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    // Multi-tenant — invisível na resposta JSON pra não vazar
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // ── Identificação ─────────────────────────────────────────────────────────

    @Column(nullable = false, length = 150)
    @NotBlank
    private String nome;

    @Column(length = 20)
    private String documento;  // CPF ou CNPJ — opcional

    @Column(name = "tipo_pessoa", nullable = false, length = 2)
    @Builder.Default
    private String tipoPessoa = "PF";  // PF | PJ

    // ── Contato ───────────────────────────────────────────────────────────────

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String telefone;  // armazenado normalizado (só dígitos), formatado na UI

    // ── Categorização ─────────────────────────────────────────────────────────

    @Column(length = 50)
    private String categoria;

    @Column(columnDefinition = "TEXT")
    private String notas;

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
package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Categoria unificada de receitas e despesas.
 *
 * Sprint F1.2: substitui tipos_gasto como modelo principal de categorização.
 *
 * Tipos:
 *   - RECEITA: aparece no dropdown de Recebimentos
 *   - DESPESA: aparece no dropdown de Títulos a pagar
 *   - AMBOS:   aparece nos dois
 */
@Entity
@Table(name = "categorias")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nome;

    /**
     * RECEITA | DESPESA | AMBOS
     */
    @Column(nullable = false, length = 10)
    @Builder.Default
    private String tipo = "AMBOS";

    /**
     * Cor hex opcional pra UI (ex: "#15C3DD").
     */
    @Column(length = 7)
    private String cor;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
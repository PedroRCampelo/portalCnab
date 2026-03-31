package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade JPA que representa a tabela 'empresas'.
 *
 * Cada empresa é um tenant do sistema.
 * No MVP todos os usuários pertencem a uma única empresa,
 * mas a estrutura já suporta multi-empresa futura.
 */
@Entity
@Table(name = "empresas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String nome;

    // CNPJ armazenado formatado: XX.XXX.XXX/XXXX-XX
    @Column(nullable = false, unique = true, length = 18)
    private String cnpj;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativa = true;

    @CreationTimestamp
    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @UpdateTimestamp
    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;
}
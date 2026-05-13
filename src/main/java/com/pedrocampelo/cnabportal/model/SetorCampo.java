package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "setor_campos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SetorCampo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "setor_id", nullable = false, length = 30)
    private String setorId;

    @Column(nullable = false, length = 50)
    private String grupo;

    @Column(nullable = false, length = 50)
    private String campo;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String tipo = "TEXT";

    @Column(columnDefinition = "TEXT")
    private String opcoes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean obrigatorio = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;
}
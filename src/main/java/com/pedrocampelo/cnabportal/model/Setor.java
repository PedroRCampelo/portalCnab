package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "setores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Setor {

    @Id
    @Column(length = 30)
    private String id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 255)
    private String descricao;

    @Column(length = 30)
    private String icone;

    @Column(nullable = false)
    @Builder.Default
    private Integer ordem = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;
}
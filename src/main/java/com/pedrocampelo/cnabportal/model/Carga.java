package com.pedrocampelo.cnabportal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "cargas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Carga {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(length = 20, nullable = false)
    private String numero;

    @Column(length = 255)
    private String descricao;

    // ABERTA | FINALIZADA
    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "ABERTA";

    @Column(name = "endereco_origem", length = 500)
    private String enderecoOrigem;

    @OneToMany(mappedBy = "carga", fetch = FetchType.LAZY)
    @Builder.Default
    private List<PedidoVenda> pedidos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}

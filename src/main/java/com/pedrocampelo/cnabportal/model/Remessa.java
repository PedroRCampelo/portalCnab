package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "remessas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Remessa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(name = "nome_arquivo", nullable = false, length = 255)
    private String nomeArquivo;

    @Column(nullable = false, length = 50)
    private String banco;

    @Column(nullable = false, length = 10)
    private String versao;

    @Column(nullable = false, length = 20)
    private String modo;

    @Column(name = "tipo_saida", nullable = false, length = 10)
    private String tipoSaida; // EXCEL | PDF

    @Column(name = "qtd_registros")
    private Integer qtdRegistros;

    @Column(name = "valor_total", precision = 18, scale = 2)
    private BigDecimal valorTotal;

    @CreationTimestamp
    @Column(name = "gerado_em", nullable = false, updatable = false)
    private LocalDateTime geradoEm;

    @Column(name = "ip_origem", length = 45)
    private String ipOrigem;
}
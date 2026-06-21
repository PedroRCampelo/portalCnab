package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "empresa_numeradores")
@IdClass(NumeradorEmpresaId.class)
@Getter @Setter @NoArgsConstructor
public class NumeradorEmpresa {

    @Id
    @Column(name = "empresa_id")
    private UUID empresaId;

    @Id
    @Column(name = "tipo", length = 20)
    private String tipo;

    @Column(name = "ultimo", nullable = false)
    private long ultimo;

    public NumeradorEmpresa(UUID empresaId, String tipo) {
        this.empresaId = empresaId;
        this.tipo      = tipo;
        this.ultimo    = 0L;
    }
}

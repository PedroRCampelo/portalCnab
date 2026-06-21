package com.pedrocampelo.cnabportal.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class NumeradorEmpresaId implements Serializable {

    private UUID   empresaId;
    private String tipo;

    public NumeradorEmpresaId() {}

    public NumeradorEmpresaId(UUID empresaId, String tipo) {
        this.empresaId = empresaId;
        this.tipo      = tipo;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof NumeradorEmpresaId other)) return false;
        return Objects.equals(empresaId, other.empresaId) && Objects.equals(tipo, other.tipo);
    }

    @Override
    public int hashCode() {
        return Objects.hash(empresaId, tipo);
    }
}

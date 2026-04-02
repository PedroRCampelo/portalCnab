import { useState, useEffect } from "react";
import api from "../services/api.js";

// Componente reutilizavel para mostrar a cota do usuario
// Exibe: "X de Y arquivos usados este mes" ou "Uso ilimitado"
export default function CotaBadge() {
    const [cota, setCota] = useState(null);

    useEffect(() => {
        api.get("/api/usuario/cota")
            .then(({ data }) => setCota(data))
            .catch(() => {}); // silencioso — nao quebra o fluxo
    }, []);

    if (!cota) return null;

    if (cota.ilimitado) {
        return (
            <div className="cota-badge cota-badge--pro">
                <span className="cota-dot cota-dot--pro"/>
                Uso ilimitado — Plano Pro
            </div>
        );
    }

    const restantes = cota.limite - cota.usados;
    const percentual = Math.round((cota.usados / cota.limite) * 100);
    const critico = restantes <= 2;
    const esgotado = restantes <= 0;

    return (
        <div className={`cota-badge ${esgotado ? "cota-badge--esgotado" : critico ? "cota-badge--critico" : ""}`}>
            <div className="cota-info">
        <span className="cota-texto">
          {esgotado
              ? "Limite mensal atingido"
              : `${cota.usados} de ${cota.limite} arquivos usados este mes`}
        </span>
                {!esgotado && critico && (
                    <span className="cota-aviso">Apenas {restantes} restante{restantes !== 1 ? "s" : ""}</span>
                )}
            </div>
            <div className="cota-barra-wrap">
                <div
                    className="cota-barra-fill"
                    style={{ width: `${Math.min(percentual, 100)}%` }}
                />
            </div>
            {esgotado && (
                <a href="/upgrade" className="cota-upgrade">
                    Fazer upgrade para Pro — R$ 18,90/mes
                </a>
            )}
        </div>
    );
}
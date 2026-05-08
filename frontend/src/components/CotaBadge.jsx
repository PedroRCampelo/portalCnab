import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

/**
 * CotaBadge — Indicador de cota mensal de conversões CNAB
 * Sprint A3.6.15 fix · Removida referência ao plano Pro (descontinuado)
 *
 * Exibe:
 *  - Whallet+ ou Admin → "Uso ilimitado — Whallet+" (verde com check)
 *  - Free com cota OK   → "X de Y arquivos usados este mês" + barra cyan
 *  - Free crítico (≤2)  → "X de Y" em âmbar + aviso "apenas N restante(s)"
 *  - Free esgotado (=0) → "Limite mensal atingido" + CTA upgrade Whallet+
 *
 * Endpoint:
 *  GET /api/usuario/cota → { ilimitado, usados, limite }
 */
export default function CotaBadge() {
    const [cota, setCota] = useState(null);

    useEffect(() => {
        api.get("/api/usuario/cota")
            .then(({ data }) => setCota(data))
            .catch(() => {}); // silencioso — não quebra o fluxo
    }, []);

    if (!cota) return null;

    /* ─── Ilimitado (Whallet+ ou Admin) ──────────────────────────────── */
    if (cota.ilimitado) {
        return (
            <div className="cota-badge cota-badge--ilimitado">
                <span className="cota-dot cota-dot--ilimitado"/>
                Uso ilimitado — Whallet+
            </div>
        );
    }

    /* ─── Cálculos pra Free ──────────────────────────────────────────── */
    const restantes  = cota.limite - cota.usados;
    const percentual = Math.round((cota.usados / cota.limite) * 100);
    const critico    = restantes > 0 && restantes <= 2;
    const esgotado   = restantes <= 0;

    return (
        <div className={`cota-badge ${esgotado ? "cota-badge--esgotado" : critico ? "cota-badge--critico" : ""}`}>
            <div className="cota-info">
                <span className="cota-texto">
                    {esgotado
                        ? "Limite mensal atingido"
                        : `${cota.usados} de ${cota.limite} arquivos usados este mês`}
                </span>
                {!esgotado && critico && (
                    <span className="cota-aviso">
                        Apenas {restantes} restante{restantes !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            <div className="cota-barra-wrap">
                <div
                    className="cota-barra-fill"
                    style={{ width: `${Math.min(percentual, 100)}%` }}
                />
            </div>

            {esgotado && (
                <Link to="/planos" className="cota-upgrade">
                    Fazer upgrade para Whallet+ — R$ 39,90/mês
                </Link>
            )}
        </div>
    );
}
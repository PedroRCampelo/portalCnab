import { useState, useEffect } from "react";
import { LuThermometer, LuTrendingUp, LuCircleAlert, LuTriangleAlert, LuBan, LuSettings } from "react-icons/lu";
import { Link } from "react-router-dom";
import api from "../../../services/api.js";

/**
 * TermometroFaturamento — Barra visual de faturamento anual vs limite
 * Sprint 2.2-B
 *
 * Aparece na SaudeMesTab se empresa tem regime com limite configurado (MEI).
 * Busca dados de GET /api/empresa/termometro-faturamento.
 *
 * Estados visuais:
 *   TRANQUILO  (< 60%)  → barra verde
 *   ATENCAO    (60-79%) → barra amarela
 *   CRITICO    (80-99%) → barra vermelha
 *   ESTOURADO  (≥ 100%) → barra vermelha cheia + banner crítico
 *   SEM_LIMITE           → CTA "Configurar limite"
 *   SEM_DADOS            → mensagem informativa
 *   null (carregando)    → skeleton
 */
export default function TermometroFaturamento() {
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        api.get("/api/empresa/termometro-faturamento")
            .then(({ data }) => setDados(data))
            .catch(() => setErro(true))
            .finally(() => setCarregando(false));
    }, []);

    // Carregando
    if (carregando) return null;

    // Erro silencioso (não quebra a página)
    if (erro) return null;

    // Sem limite configurado — CTA pra configurar
    if (dados.alerta === "SEM_LIMITE") {
        return (
            <div className="tmf">
                <div className="tmf-head">
                    <LuThermometer size={14} className="tmf-head-icon"/>
                    <span className="tmf-head-label">Termômetro {dados.regime}</span>
                    <span className="tmf-head-ano">{dados.ano}</span>
                </div>
                <p className="tmf-msg-vazio">{dados.mensagem}</p>
                <Link to="/configuracoes" className="tmf-cta-config">
                    <LuSettings size={13}/>
                    Configurar regime e limite
                </Link>
                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    // Sem dados no ano
    if (dados.alerta === "SEM_DADOS") {
        return (
            <div className="tmf">
                <div className="tmf-head">
                    <LuThermometer size={14} className="tmf-head-icon"/>
                    <span className="tmf-head-label">Termômetro {dados.regime}</span>
                    <span className="tmf-head-ano">{dados.ano}</span>
                </div>
                <p className="tmf-msg-vazio">{dados.mensagem}</p>
                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    // Com dados — termômetro visual
    const pct = Math.min(dados.percentual, 100);
    const alertaClass = dados.alerta === "ESTOURADO" ? "tmf--estourado"
        : dados.alerta === "CRITICO"   ? "tmf--critico"
            : dados.alerta === "ATENCAO"    ? "tmf--atencao"
                :                                  "tmf--tranquilo";

    const AlertIcon = dados.alerta === "ESTOURADO" ? LuBan
        : dados.alerta === "CRITICO"   ? LuTriangleAlert
            : dados.alerta === "ATENCAO"    ? LuCircleAlert
                :                                  LuTrendingUp;

    return (
        <div className={`tmf ${alertaClass}`}>

            {/* Header */}
            <div className="tmf-head">
                <LuThermometer size={14} className="tmf-head-icon"/>
                <span className="tmf-head-label">Termômetro {dados.regime}</span>
                <span className="tmf-head-ano">{dados.ano}</span>
                <span className="tmf-head-pct">{dados.percentual.toFixed(0)}%</span>
            </div>

            {/* Valores */}
            <div className="tmf-valores">
                <span className="tmf-faturado">{fmtMoeda(dados.faturadoNoAno)}</span>
                <span className="tmf-de">de {fmtMoeda(dados.limiteAnual)}</span>
            </div>

            {/* Barra de progresso */}
            <div className="tmf-barra-bg">
                <div className="tmf-barra-fill" style={{ width: `${pct}%` }}/>
                {/* Marcadores de referência */}
                <div className="tmf-marca" style={{ left: "60%" }} title="60%"/>
                <div className="tmf-marca" style={{ left: "80%" }} title="80%"/>
            </div>

            {/* Mensagem do backend */}
            <div className="tmf-mensagem">
                <AlertIcon size={13} className="tmf-mensagem-icon"/>
                <span>{dados.mensagem}</span>
            </div>

            {/* Detalhes */}
            <div className="tmf-detalhes">
                <div className="tmf-detalhe">
                    <span className="tmf-detalhe-label">Média mensal</span>
                    <span className="tmf-detalhe-valor">{fmtMoeda(dados.mediaMensal)}</span>
                </div>
                <div className="tmf-detalhe">
                    <span className="tmf-detalhe-label">Restante</span>
                    <span className="tmf-detalhe-valor">{fmtMoeda(dados.restante)}</span>
                </div>
                <div className="tmf-detalhe">
                    <span className="tmf-detalhe-label">Meses com receita</span>
                    <span className="tmf-detalhe-valor">{dados.mesesComReceita}</span>
                </div>
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ─── Helper ──────────────────────────────────────────────────────────── */

function fmtMoeda(valor) {
    if (valor == null) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(valor);
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .tmf-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.tmf {
    padding: 18px 20px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
    margin-bottom: 14px;
}

/* ── Variantes de cor ────────────────────────────────────────────────── */

.tmf--tranquilo { border-left: 3px solid var(--success); }
.tmf--atencao   { border-left: 3px solid var(--warning); }
.tmf--critico   { border-left: 3px solid var(--error); }
.tmf--estourado { border-left: 3px solid var(--error); background: var(--error-bg); }

/* ── Header ──────────────────────────────────────────────────────────── */

.tmf-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
}

.tmf-head-icon { color: var(--text-dim); }
.tmf--tranquilo .tmf-head-icon { color: var(--success); }
.tmf--atencao   .tmf-head-icon { color: var(--warning); }
.tmf--critico   .tmf-head-icon,
.tmf--estourado .tmf-head-icon { color: var(--error); }

.tmf-head-label {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.tmf-head-ano {
    font-family: var(--ff-mono);
    font-size: 10px;
    color: var(--text-dim);
    opacity: 0.6;
}

.tmf-head-pct {
    margin-left: auto;
    font-family: var(--ff-mono);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.tmf--tranquilo .tmf-head-pct { color: var(--success); }
.tmf--atencao   .tmf-head-pct { color: var(--warning); }
.tmf--critico   .tmf-head-pct,
.tmf--estourado .tmf-head-pct { color: var(--error); }

/* ── Valores ─────────────────────────────────────────────────────────── */

.tmf-valores {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 10px;
}

.tmf-faturado {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

.tmf-de {
    font-size: 13px;
    color: var(--text-dim);
}

/* ── Barra de progresso ──────────────────────────────────────────────── */

.tmf-barra-bg {
    position: relative;
    height: 8px;
    border-radius: 100px;
    background: var(--bg);
    overflow: visible;
    margin-bottom: 12px;
}

.tmf-barra-fill {
    height: 100%;
    border-radius: 100px;
    transition: width 0.6s ease;
    min-width: 4px;
}

.tmf--tranquilo .tmf-barra-fill { background: var(--success); }
.tmf--atencao   .tmf-barra-fill { background: var(--warning); }
.tmf--critico   .tmf-barra-fill { background: var(--error); }
.tmf--estourado .tmf-barra-fill { background: var(--error); width: 100% !important; }

/* Marcadores de referência 60% e 80% */
.tmf-marca {
    position: absolute;
    top: -2px;
    width: 1px;
    height: 12px;
    background: var(--text-dim);
    opacity: 0.2;
}

/* ── Mensagem ────────────────────────────────────────────────────────── */

.tmf-mensagem {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-muted);
    margin-bottom: 12px;
}

.tmf--tranquilo .tmf-mensagem-icon { color: var(--success); }
.tmf--atencao   .tmf-mensagem-icon { color: var(--warning); }
.tmf--critico   .tmf-mensagem-icon,
.tmf--estourado .tmf-mensagem-icon { color: var(--error); }

.tmf-mensagem-icon { flex-shrink: 0; margin-top: 2px; }

/* ── Detalhes (3 mini-KPIs) ──────────────────────────────────────────── */

.tmf-detalhes {
    display: flex;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--hair);
}

.tmf-detalhe {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.tmf-detalhe-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.tmf-detalhe-valor {
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

/* ── Msg vazio / CTA config ──────────────────────────────────────────── */

.tmf-msg-vazio {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0 0 10px;
    line-height: 1.5;
}

.tmf-cta-config {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--ff-sans);
    font-size: 12px;
    font-weight: 600;
    color: var(--cyan-dark);
    text-decoration: none;
}

.tmf-cta-config:hover { text-decoration: underline; }

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 500px) {
    .tmf-detalhes {
        flex-direction: column;
        gap: 8px;
    }
    .tmf-faturado {
        font-size: 18px;
    }
}
`;
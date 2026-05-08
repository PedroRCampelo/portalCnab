import {
    LuLoader, LuCircleCheck, LuTriangleAlert, LuFileSpreadsheet,
    LuFileText, LuClock, LuTrendingUp,
} from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import {
    fmtValor, fmtMes, BarraHorizontal, AGING_FAIXAS,
    useRelatorioTitulos, useExportacao,
} from "./_helpers.jsx";

/**
 * AgingPagarPage — Relatório de inadimplência + fluxo dos próximos 12 meses
 * Sprint A3.6.8.2 · Refatoração
 *
 * Conteúdo:
 *  - 3 KPIs no topo (Total a vencer, Total vencido, Quantidade de títulos)
 *  - Card "Aging" com 4 caixas coloridas por faixa de atraso
 *  - Card "Fluxo dos próximos 12 meses" com barras horizontais por mês
 *
 * Endpoints:
 *  - GET /api/titulos/relatorio (vem tudo: aging + fluxoCaixa)
 *  - GET /api/titulos/exportar/{excel|pdf}
 */
export default function AgingPagarPage() {
    const { dados, carregando, erro } = useRelatorioTitulos();
    const { exportar, exportando } = useExportacao("/api/titulos/exportar", "aging-pagar");

    // ── Loading ─────────────────────────────────────────────────────────────

    if (carregando) {
        return (
            <>
                <PageHeader title="Aging de pagar" backTo="/relatorios" backLabel="Relatórios"/>
                <div className="rel-loading">
                    <LuLoader size={20} className="rel-spin"/>
                    <span>Carregando dados...</span>
                </div>
                <style>{COMPONENT_CSS}</style>
            </>
        );
    }

    if (erro || !dados) {
        return (
            <>
                <PageHeader title="Aging de pagar" backTo="/relatorios" backLabel="Relatórios"/>
                <Card>
                    <Card.Body>
                        <EmptyState
                            icon={LuTriangleAlert}
                            title="Não foi possível carregar"
                            description={erro || "Tente novamente em instantes."}
                        />
                    </Card.Body>
                </Card>
                <style>{COMPONENT_CSS}</style>
            </>
        );
    }

    // ── Cálculos derivados ──────────────────────────────────────────────────

    const totalAVencer = dados.fluxoCaixa?.reduce((s, i) => s + Number(i.total || 0), 0) || 0;
    const qtdAVencer   = dados.fluxoCaixa?.reduce((s, i) => s + Number(i.quantidade || 0), 0) || 0;
    const totalVencido = dados.aging?.reduce((s, i) => s + Number(i.total || 0), 0) || 0;
    const qtdVencido   = dados.aging?.reduce((s, i) => s + Number(i.quantidade || 0), 0) || 0;
    const semVencidos  = !dados.aging?.length || totalVencido === 0;

    return (
        <>
            <PageHeader
                title="Aging de pagar"
                backTo="/relatorios"
                backLabel="Relatórios"
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => exportar("excel")}
                            disabled={!!exportando}
                        >
                            <LuFileSpreadsheet size={14}/>
                            {exportando === "excel" ? "Gerando..." : "Excel"}
                        </button>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => exportar("pdf")}
                            disabled={!!exportando}
                        >
                            <LuFileText size={14}/>
                            {exportando === "pdf" ? "Gerando..." : "PDF"}
                        </button>
                    </>
                }
            />

            <p className="rel-subtitulo">
                Análise dos seus títulos a pagar — vencidos por faixa de atraso e
                projeção dos próximos 12 meses.
            </p>

            {/* ── KPIs ── */}
            <div className="ap-kpis">
                <KpiBox
                    label="Total a vencer"
                    valor={fmtValor(totalAVencer)}
                    sub={`${qtdAVencer} ${qtdAVencer === 1 ? "título" : "títulos"}`}
                    icon={<LuTrendingUp size={14}/>}
                    variant="default"
                />
                <KpiBox
                    label="Total vencido"
                    valor={fmtValor(totalVencido)}
                    sub={`${qtdVencido} ${qtdVencido === 1 ? "título" : "títulos"}`}
                    icon={<LuTriangleAlert size={14}/>}
                    variant={totalVencido > 0 ? "error" : "neutral"}
                />
                <KpiBox
                    label="Saldo total em aberto"
                    valor={fmtValor(totalAVencer + totalVencido)}
                    sub={`${qtdAVencer + qtdVencido} ${(qtdAVencer + qtdVencido) === 1 ? "título" : "títulos"}`}
                    icon={<LuClock size={14}/>}
                    variant="neutral"
                />
            </div>

            {/* ── Card: Aging (faixas de atraso) ── */}
            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Análise de inadimplência</Card.Title>
                        <Card.Description>Títulos vencidos agrupados por faixa de atraso</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body>
                    {semVencidos ? (
                        <EmptyState
                            icon={LuCircleCheck}
                            title="Nenhum título vencido"
                            description="Você está em dia com seus pagamentos! 🎉"
                            variant="compact"
                        />
                    ) : (
                        <div className="ap-aging-grid">
                            {AGING_FAIXAS.map(faixa => {
                                const item = dados.aging.find(a => a.nome === faixa.key);
                                const qtd = item?.quantidade ?? 0;
                                const total = Number(item?.total ?? 0);
                                return (
                                    <div key={faixa.key} className={`ap-aging-box ap-aging-box--${faixa.variant}`}>
                                        <div className="ap-aging-label">{faixa.label}</div>
                                        <div className="ap-aging-valor">{fmtValor(total)}</div>
                                        <div className="ap-aging-qtd">
                                            {qtd} {qtd === 1 ? "título" : "títulos"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* ── Card: Fluxo dos próximos 12 meses ── */}
            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Vencimentos nos próximos 12 meses</Card.Title>
                        <Card.Description>Soma dos saldos em aberto agrupados por mês</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body>
                    {!dados.fluxoCaixa?.length ? (
                        <EmptyState
                            icon={LuCircleCheck}
                            title="Sem vencimentos futuros"
                            description="Nenhum título a pagar nos próximos 12 meses."
                            variant="compact"
                        />
                    ) : (() => {
                        const max = Math.max(...dados.fluxoCaixa.map(i => Number(i.total)));
                        return (
                            <div className="ap-fluxo">
                                {dados.fluxoCaixa.map(item => (
                                    <div key={item.mes} className="ap-fluxo-row">
                                        <div className="ap-fluxo-label">
                                            <span className="ap-fluxo-mes">{fmtMes(item.mes)}</span>
                                            <span className="ap-fluxo-meta">
                                                <span className="ap-fluxo-valor">{fmtValor(item.total)}</span>
                                                <span className="ap-fluxo-qtd">
                                                    {item.quantidade} {item.quantidade === 1 ? "título" : "títulos"}
                                                </span>
                                            </span>
                                        </div>
                                        <BarraHorizontal valor={Number(item.total)} max={max} variant="warning"/>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </Card.Body>
            </Card>

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   KpiBox — caixinha de KPI no topo
   ═════════════════════════════════════════════════════════════════════════════ */

function KpiBox({ label, valor, sub, icon, variant = "default" }) {
    return (
        <div className={`ap-kpi ap-kpi--${variant}`}>
            <div className="ap-kpi-head">
                <span className="ap-kpi-icon">{icon}</span>
                <span className="ap-kpi-label">{label}</span>
            </div>
            <div className="ap-kpi-valor">{valor}</div>
            <div className="ap-kpi-sub">{sub}</div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .ap-* + .rel-* (compartilhados)
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.rel-subtitulo {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
    max-width: 720px;
}

.rel-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 20px;
    color: var(--text-dim);
    font-size: 14px;
}

.rel-spin {
    animation: rel-spin 1s linear infinite;
}

@keyframes rel-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

/* ── KPIs no topo ────────────────────────────────────────────────────── */

.ap-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.ap-kpi {
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.ap-kpi--error {
    background: var(--error-bg);
    border-color: rgba(229, 72, 77, 0.2);
}

.ap-kpi-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
}

.ap-kpi-icon {
    display: inline-flex;
    color: var(--text-dim);
    line-height: 0;
}

.ap-kpi--error .ap-kpi-icon { color: var(--error); }
.ap-kpi--default .ap-kpi-icon { color: var(--cyan-dark); }

.ap-kpi-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.ap-kpi-valor {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
    margin-bottom: 4px;
}

.ap-kpi--error .ap-kpi-valor {
    color: var(--error);
}

.ap-kpi-sub {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* ── Aging grid (4 caixas coloridas) ──────────────────────────────────── */

.ap-aging-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.ap-aging-box {
    padding: 16px 18px;
    border-radius: 10px;
    border: 1px solid;
}

.ap-aging-box--warning {
    background: var(--warning-bg);
    border-color: rgba(230, 162, 60, 0.25);
}

.ap-aging-box--error {
    background: var(--error-bg);
    border-color: rgba(229, 72, 77, 0.25);
}

.ap-aging-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 8px;
}

.ap-aging-box--warning .ap-aging-label { color: var(--warning); }
.ap-aging-box--error   .ap-aging-label { color: var(--error); }

.ap-aging-valor {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
    margin-bottom: 4px;
}

.ap-aging-qtd {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* ── Fluxo (linhas com barras) ────────────────────────────────────────── */

.ap-fluxo {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.ap-fluxo-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.ap-fluxo-label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
}

.ap-fluxo-mes {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}

.ap-fluxo-meta {
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
}

.ap-fluxo-valor {
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.005em;
}

.ap-fluxo-qtd {
    font-family: var(--ff-mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .ap-kpis {
        grid-template-columns: 1fr;
    }
    .ap-aging-grid {
        grid-template-columns: 1fr 1fr;
    }
}
`;
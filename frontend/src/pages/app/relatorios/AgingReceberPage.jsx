import {
    LuLoader, LuCircleCheck, LuTriangleAlert,
    LuClock, LuTrendingUp, LuFileSpreadsheet,
} from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import {
    fmtValor, fmtMes, BarraHorizontal, AGING_FAIXAS,
    useRelatorioRecebimentos, useExportacao,
} from "./_helpers.jsx";

export default function AgingReceberPage() {
    const { dados, carregando, erro } = useRelatorioRecebimentos();
    const { exportar, exportando } = useExportacao("/api/recebimentos/exportar", "aging_receber");

    const excelBtn = (
        <button className="ph-btn ph-btn--secondary" onClick={() => exportar("excel?tipo=aging-receber")} disabled={!!exportando}>
            <LuFileSpreadsheet size={14}/> {exportando ? "Gerando…" : "Excel"}
        </button>
    );

    if (carregando) {
        return (
            <>
                <PageHeader title="Aging de receber" backTo="/relatorios" backLabel="Relatórios"/>
                <div className="rel-loading">
                    <LuLoader size={20} className="rel-spin"/>
                    <span>Carregando dados...</span>
                </div>
                <style>{CSS}</style>
            </>
        );
    }

    if (erro || !dados) {
        return (
            <>
                <PageHeader title="Aging de receber" backTo="/relatorios" backLabel="Relatórios"/>
                <Card><Card.Body>
                    <EmptyState
                        icon={LuTriangleAlert}
                        title="Não foi possível carregar"
                        description={erro || "Tente novamente em instantes."}
                    />
                </Card.Body></Card>
                <style>{CSS}</style>
            </>
        );
    }

    const totalAReceber = dados.fluxoCaixa?.reduce((s, i) => s + Number(i.total || 0), 0) || 0;
    const qtdAReceber   = dados.fluxoCaixa?.reduce((s, i) => s + Number(i.quantidade || 0), 0) || 0;
    const totalAtrasado = dados.aging?.reduce((s, i) => s + Number(i.total || 0), 0) || 0;
    const qtdAtrasado   = dados.aging?.reduce((s, i) => s + Number(i.quantidade || 0), 0) || 0;
    const semAtrasados  = !dados.aging?.length || totalAtrasado === 0;

    return (
        <>
            <PageHeader
                title="Aging de receber"
                backTo="/relatorios"
                backLabel="Relatórios"
                actions={excelBtn}
            />

            <p className="rel-subtitulo">
                Análise dos seus recebimentos — atrasados por faixa e
                previsão de entradas nos próximos 12 meses.
            </p>

            {/* KPIs */}
            <div className="ar-kpis">
                <div className="ar-kpi ar-kpi--default">
                    <div className="ar-kpi-head">
                        <span className="ar-kpi-icon"><LuTrendingUp size={14}/></span>
                        <span className="ar-kpi-label">A receber</span>
                    </div>
                    <div className="ar-kpi-valor">{fmtValor(totalAReceber)}</div>
                    <div className="ar-kpi-sub">{qtdAReceber} {qtdAReceber === 1 ? "recebimento" : "recebimentos"}</div>
                </div>
                <div className={`ar-kpi ${totalAtrasado > 0 ? "ar-kpi--error" : "ar-kpi--neutral"}`}>
                    <div className="ar-kpi-head">
                        <span className="ar-kpi-icon"><LuTriangleAlert size={14}/></span>
                        <span className="ar-kpi-label">Atrasados</span>
                    </div>
                    <div className="ar-kpi-valor">{fmtValor(totalAtrasado)}</div>
                    <div className="ar-kpi-sub">{qtdAtrasado} {qtdAtrasado === 1 ? "recebimento" : "recebimentos"}</div>
                </div>
                <div className="ar-kpi ar-kpi--neutral">
                    <div className="ar-kpi-head">
                        <span className="ar-kpi-icon"><LuClock size={14}/></span>
                        <span className="ar-kpi-label">Total em aberto</span>
                    </div>
                    <div className="ar-kpi-valor">{fmtValor(totalAReceber + totalAtrasado)}</div>
                    <div className="ar-kpi-sub">{qtdAReceber + qtdAtrasado} itens</div>
                </div>
            </div>

            {/* Aging */}
            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Análise de inadimplência</Card.Title>
                        <Card.Description>Recebimentos vencidos agrupados por faixa de atraso</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body>
                    {semAtrasados ? (
                        <EmptyState
                            icon={LuCircleCheck}
                            title="Nenhum recebimento atrasado"
                            description="Todos os seus clientes estão em dia! 🎉"
                            variant="compact"
                        />
                    ) : (
                        <div className="ar-aging-grid">
                            {AGING_FAIXAS.map(faixa => {
                                const item = dados.aging.find(a => a.nome === faixa.key);
                                const qtd = item?.quantidade ?? 0;
                                const total = Number(item?.total ?? 0);
                                return (
                                    <div key={faixa.key} className={`ar-aging-box ar-aging-box--${faixa.variant}`}>
                                        <div className="ar-aging-label">{faixa.label}</div>
                                        <div className="ar-aging-valor">{fmtValor(total)}</div>
                                        <div className="ar-aging-qtd">
                                            {qtd} {qtd === 1 ? "recebimento" : "recebimentos"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Fluxo */}
            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Entradas nos próximos 12 meses</Card.Title>
                        <Card.Description>Previsão de recebimentos agrupados por mês de vencimento</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body>
                    {!dados.fluxoCaixa?.length ? (
                        <EmptyState
                            icon={LuCircleCheck}
                            title="Sem recebimentos futuros"
                            description="Nenhum recebimento pendente nos próximos 12 meses."
                            variant="compact"
                        />
                    ) : (() => {
                        const max = Math.max(...dados.fluxoCaixa.map(i => Number(i.total)));
                        return (
                            <div className="ar-fluxo">
                                {dados.fluxoCaixa.map(item => (
                                    <div key={item.mes} className="ar-fluxo-row">
                                        <div className="ar-fluxo-label">
                                            <span className="ar-fluxo-mes">{fmtMes(item.mes)}</span>
                                            <span className="ar-fluxo-meta">
                                                <span className="ar-fluxo-valor">{fmtValor(item.total)}</span>
                                                <span className="ar-fluxo-qtd">
                                                    {item.quantidade} {item.quantidade === 1 ? "receb." : "receb."}
                                                </span>
                                            </span>
                                        </div>
                                        <BarraHorizontal valor={Number(item.total)} max={max} variant="default"/>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </Card.Body>
            </Card>

            <style>{CSS}</style>
        </>
    );
}

const CSS = `
.rel-subtitulo{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--text-muted);max-width:720px}
.rel-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--text-dim);font-size:14px}
.rel-spin{animation:rel-spin 1s linear infinite}
@keyframes rel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.ar-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px}
.ar-kpi{padding:16px 18px;border-radius:12px;background:var(--surface);border:1px solid var(--hair)}
.ar-kpi--error{background:var(--error-bg);border-color:rgba(229,72,77,.2)}
.ar-kpi-head{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.ar-kpi-icon{display:inline-flex;color:var(--text-dim);line-height:0}
.ar-kpi--error .ar-kpi-icon{color:var(--error)}
.ar-kpi--default .ar-kpi-icon{color:var(--cyan-dark)}
.ar-kpi-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)}
.ar-kpi-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums;margin-bottom:4px}
.ar-kpi--error .ar-kpi-valor{color:var(--error)}
.ar-kpi-sub{font-family:var(--ff-mono);font-size:10px;letter-spacing:.04em;color:var(--text-dim)}

.ar-aging-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.ar-aging-box{padding:16px 18px;border-radius:10px;border:1px solid}
.ar-aging-box--warning{background:var(--warning-bg);border-color:rgba(230,162,60,.25)}
.ar-aging-box--error{background:var(--error-bg);border-color:rgba(229,72,77,.25)}
.ar-aging-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}
.ar-aging-box--warning .ar-aging-label{color:var(--warning)}
.ar-aging-box--error .ar-aging-label{color:var(--error)}
.ar-aging-valor{font-size:22px;font-weight:700;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums;margin-bottom:4px}
.ar-aging-qtd{font-family:var(--ff-mono);font-size:10px;letter-spacing:.04em;color:var(--text-dim)}

.ar-fluxo{display:flex;flex-direction:column;gap:14px}
.ar-fluxo-row{display:flex;flex-direction:column;gap:6px}
.ar-fluxo-label{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.ar-fluxo-mes{font-size:13px;font-weight:600;color:var(--navy-deep)}
.ar-fluxo-meta{display:inline-flex;align-items:baseline;gap:10px}
.ar-fluxo-valor{font-size:13px;font-weight:600;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.ar-fluxo-qtd{font-family:var(--ff-mono);font-size:10px;color:var(--text-dim);letter-spacing:.04em}

@media(max-width:600px){.ar-kpis{grid-template-columns:1fr}.ar-aging-grid{grid-template-columns:1fr 1fr}}
`;
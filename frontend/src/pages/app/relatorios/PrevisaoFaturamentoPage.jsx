import { LuLoader, LuTriangleAlert, LuCalendarClock } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, fmtMes, useRelatorioComercial } from "./_helpers.jsx";

export default function PrevisaoFaturamentoPage() {
    const { dados, carregando, erro } = useRelatorioComercial();

    if (carregando) return <Loading />;
    if (erro || !dados) return <Erro msg={erro} />;

    const meses = dados.previsaoFaturamento ?? [];
    const totalPrevisto   = meses.reduce((s, m) => s + Number(m.valorPrevisto   || 0), 0);
    const totalConfirmado = meses.reduce((s, m) => s + Number(m.valorConfirmado || 0), 0);
    const max = Math.max(...meses.flatMap(m => [Number(m.valorPrevisto), Number(m.valorConfirmado)]), 1);

    return (
        <>
            <PageHeader title="Previsão de faturamento" backTo="/relatorios" backLabel="Relatórios"/>

            <p className="rel-subtitulo">
                Projeção de receita para os próximos 6 meses com base em pedidos em aberto e já efetivados.
            </p>

            <div className="pf-resumo">
                <div className="pf-box">
                    <div className="pf-label">Previsto (abertos)</div>
                    <div className="pf-valor pf-valor--cyan">{fmtValor(totalPrevisto)}</div>
                </div>
                <div className="pf-box">
                    <div className="pf-label">Confirmado (efetivados)</div>
                    <div className="pf-valor pf-valor--success">{fmtValor(totalConfirmado)}</div>
                </div>
                <div className="pf-box">
                    <div className="pf-label">Total projetado</div>
                    <div className="pf-valor">{fmtValor(totalPrevisto + totalConfirmado)}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <Card.Title>Próximos 6 meses</Card.Title>
                    <Card.Description>
                        <span className="pf-legenda"><span className="pf-dot pf-dot--cyan"/>Previsto (pedidos abertos)</span>
                        <span className="pf-legenda"><span className="pf-dot pf-dot--success"/>Confirmado (pedidos efetivados)</span>
                    </Card.Description>
                </Card.Header>
                <Card.Body padded={false}>
                    {meses.every(m => Number(m.valorPrevisto) === 0 && Number(m.valorConfirmado) === 0) ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState icon={LuCalendarClock}
                                        title="Sem projeção disponível"
                                        description="Crie pedidos de venda com datas de vencimento futuras para visualizar a previsão."
                                        variant="compact"/>
                        </div>
                    ) : (
                        <div className="pf-barras">
                            {meses.map((m, i) => {
                                const pv  = Number(m.valorPrevisto   || 0);
                                const pc  = Number(m.valorConfirmado || 0);
                                const pctPrev  = max > 0 ? (pv  / max) * 100 : 0;
                                const pctConf  = max > 0 ? (pc  / max) * 100 : 0;
                                return (
                                    <div key={i} className="pf-mes-col">
                                        <div className="pf-mes-val-top">
                                            {(pv + pc) > 0 && (
                                                <span className="pf-mes-total">{fmtValor(pv + pc)}</span>
                                            )}
                                        </div>
                                        <div className="pf-mes-bars">
                                            <div className="pf-bar-wrap">
                                                <div className="pf-bar pf-bar--cyan"
                                                     style={{ height: `${Math.max(pv > 0 ? 4 : 0, pctPrev)}%` }}
                                                     title={`Previsto: ${fmtValor(pv)}`}
                                                />
                                            </div>
                                            <div className="pf-bar-wrap">
                                                <div className="pf-bar pf-bar--success"
                                                     style={{ height: `${Math.max(pc > 0 ? 4 : 0, pctConf)}%` }}
                                                     title={`Confirmado: ${fmtValor(pc)}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="pf-mes-label">{fmtMes(m.mes)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <style>{CSS}</style>
        </>
    );
}

function Loading() {
    return (<>
        <PageHeader title="Previsão de faturamento" backTo="/relatorios" backLabel="Relatórios"/>
        <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando...</span></div>
        <style>{CSS}</style>
    </>);
}
function Erro({ msg }) {
    return (<>
        <PageHeader title="Previsão de faturamento" backTo="/relatorios" backLabel="Relatórios"/>
        <Card><Card.Body><EmptyState icon={LuTriangleAlert} title="Erro" description={msg || "Tente novamente."}/></Card.Body></Card>
        <style>{CSS}</style>
    </>);
}

const CSS = `
.rel-subtitulo{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--text-muted);max-width:720px}
.rel-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--text-dim);font-size:14px}
.rel-spin{animation:rel-spin 1s linear infinite}
@keyframes rel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.pf-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.pf-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.pf-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.pf-valor{font-size:20px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.pf-valor--cyan{color:var(--cyan-deep)}
.pf-valor--success{color:var(--success)}

.pf-legenda{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);margin-right:16px}
.pf-dot{display:inline-block;width:8px;height:8px;border-radius:2px}
.pf-dot--cyan{background:var(--cyan)}
.pf-dot--success{background:var(--success)}

.pf-barras{display:flex;gap:8px;padding:24px;height:280px;align-items:flex-end}
.pf-mes-col{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;min-width:60px}
.pf-mes-val-top{height:24px;display:flex;align-items:flex-end;justify-content:center}
.pf-mes-total{font-family:var(--ff-mono);font-size:9px;color:var(--text-dim);white-space:nowrap}
.pf-mes-bars{flex:1;width:100%;display:flex;gap:3px;align-items:flex-end;padding-top:4px}
.pf-bar-wrap{flex:1;height:100%;display:flex;align-items:flex-end;border-radius:4px 4px 0 0;background:var(--bg);border:1px solid var(--hair);border-bottom:none;min-height:4px}
.pf-bar{width:100%;border-radius:3px 3px 0 0;transition:height .4s ease}
.pf-bar--cyan{background:var(--cyan)}
.pf-bar--success{background:var(--success)}
.pf-mes-label{font-family:var(--ff-mono);font-size:9px;color:var(--text-dim);margin-top:6px;letter-spacing:.04em}
`;

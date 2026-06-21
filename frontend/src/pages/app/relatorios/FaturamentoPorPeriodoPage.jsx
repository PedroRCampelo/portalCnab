import { LuLoader, LuTriangleAlert, LuTrendingUp } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, fmtMes, useRelatorioComercial } from "./_helpers.jsx";

export default function FaturamentoPorPeriodoPage() {
    const { dados, carregando, erro } = useRelatorioComercial();

    if (carregando) return <Loading />;
    if (erro || !dados) return <Erro msg={erro} />;

    const meses = dados.faturamentoPorMes ?? [];
    const total = meses.reduce((s, m) => s + Number(m.valor || 0), 0);
    const max   = meses.length > 0 ? Math.max(...meses.map(m => Number(m.valor))) : 0;
    const ticketMedio = meses.length > 0 ? total / meses.length : 0;

    return (
        <>
            <PageHeader title="Faturamento por período" backTo="/relatorios" backLabel="Relatórios"/>

            <p className="rel-subtitulo">
                Evolução do faturamento mês a mês com base nos pedidos de venda efetivados.
            </p>

            <div className="fp-resumo">
                <div className="fp-resumo-box">
                    <div className="fp-label">Total acumulado</div>
                    <div className="fp-valor">{fmtValor(total)}</div>
                </div>
                <div className="fp-resumo-box">
                    <div className="fp-label">Meses com vendas</div>
                    <div className="fp-valor">{meses.length}</div>
                </div>
                <div className="fp-resumo-box">
                    <div className="fp-label">Média mensal</div>
                    <div className="fp-valor">{fmtValor(ticketMedio)}</div>
                </div>
                <div className="fp-resumo-box">
                    <div className="fp-label">Melhor mês</div>
                    <div className="fp-valor">
                        {meses.length > 0
                            ? fmtMes(meses.reduce((a, b) => Number(a.valor) >= Number(b.valor) ? a : b).mes)
                            : "—"}
                    </div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Faturamento mensal</Card.Title>
                        <Card.Description>Pedidos efetivados agrupados por mês</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body padded={false}>
                    {meses.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState icon={LuTrendingUp} title="Sem dados de faturamento"
                                        description="Efetive pedidos de venda para visualizar o faturamento por período."
                                        variant="compact"/>
                        </div>
                    ) : (
                        <div className="fp-barras">
                            {meses.map((m, i) => {
                                const pct = max > 0 ? (Number(m.valor) / max) * 100 : 0;
                                return (
                                    <div key={i} className="fp-barra-wrap">
                                        <div className="fp-barra-col">
                                            <div className="fp-barra-valor">{fmtValor(m.valor)}</div>
                                            <div className="fp-barra-track">
                                                <div className="fp-barra-fill" style={{ height: `${Math.max(4, pct)}%` }}/>
                                            </div>
                                            <div className="fp-barra-mes">{fmtMes(m.mes)}</div>
                                        </div>
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
    return (
        <>
            <PageHeader title="Faturamento por período" backTo="/relatorios" backLabel="Relatórios"/>
            <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando...</span></div>
            <style>{CSS}</style>
        </>
    );
}

function Erro({ msg }) {
    return (
        <>
            <PageHeader title="Faturamento por período" backTo="/relatorios" backLabel="Relatórios"/>
            <Card><Card.Body>
                <EmptyState icon={LuTriangleAlert} title="Não foi possível carregar"
                            description={msg || "Tente novamente em instantes."}/>
            </Card.Body></Card>
            <style>{CSS}</style>
        </>
    );
}

const CSS = `
.rel-subtitulo{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--text-muted);max-width:720px}
.rel-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--text-dim);font-size:14px}
.rel-spin{animation:rel-spin 1s linear infinite}
@keyframes rel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.fp-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.fp-resumo-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.fp-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.fp-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}

.fp-barras{display:flex;align-items:flex-end;gap:8px;padding:24px;height:260px;overflow-x:auto}
.fp-barra-wrap{flex:1;min-width:64px;height:100%;display:flex;align-items:flex-end}
.fp-barra-col{width:100%;display:flex;flex-direction:column;align-items:center;height:100%}
.fp-barra-valor{font-family:var(--ff-mono);font-size:9px;font-weight:700;color:var(--text-dim);margin-bottom:4px;white-space:nowrap;letter-spacing:.04em}
.fp-barra-track{flex:1;width:100%;background:var(--bg);border-radius:6px 6px 0 0;overflow:hidden;display:flex;align-items:flex-end;border:1px solid var(--hair);border-bottom:none;min-height:8px}
.fp-barra-fill{width:100%;background:linear-gradient(to top,var(--cyan),var(--cyan-light));border-radius:4px 4px 0 0;transition:height .4s ease}
.fp-barra-mes{font-family:var(--ff-mono);font-size:9px;color:var(--text-dim);margin-top:6px;letter-spacing:.04em}
`;

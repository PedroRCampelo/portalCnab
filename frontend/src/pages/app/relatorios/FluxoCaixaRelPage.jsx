import { LuLoader, LuTriangleAlert, LuChartLine, LuCircleCheck, LuFileSpreadsheet } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, fmtMes, useRelatorioFluxoBanco, useExportacao } from "./_helpers.jsx";

export default function FluxoCaixaRelPage() {
    const { dados, carregando, erro } = useRelatorioFluxoBanco();
    const { exportar, exportando } = useExportacao("/api/fluxo-caixa/exportar", "fluxo_caixa");

    const excelBtn = (
        <button className="ph-btn ph-btn--secondary" onClick={() => exportar("excel?tipo=fluxo-caixa")} disabled={!!exportando}>
            <LuFileSpreadsheet size={14}/> {exportando ? "Gerando…" : "Excel"}
        </button>
    );

    if (carregando) {
        return (
            <>
                <PageHeader title="Fluxo de caixa" backTo="/relatorios" backLabel="Relatórios"/>
                <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando dados...</span></div>
                <style>{CSS}</style>
            </>
        );
    }

    if (erro || !dados) {
        return (
            <>
                <PageHeader title="Fluxo de caixa" backTo="/relatorios" backLabel="Relatórios"/>
                <Card><Card.Body><EmptyState icon={LuTriangleAlert} title="Não foi possível carregar" description={erro || "Tente novamente."}/></Card.Body></Card>
                <style>{CSS}</style>
            </>
        );
    }

    const fluxo = dados.fluxoCaixa ?? [];
    const totalEntradas = fluxo.reduce((s, i) => s + Number(i.entradas || 0), 0);
    const totalSaidas   = fluxo.reduce((s, i) => s + Number(i.saidas || 0), 0);
    const maxVal = Math.max(...fluxo.map(i => Math.max(Number(i.entradas || 0), Number(i.saidas || 0))), 1);

    return (
        <>
            <PageHeader title="Fluxo de caixa" backTo="/relatorios" backLabel="Relatórios" actions={excelBtn}/>

            <p className="rel-subtitulo">
                Entradas e saídas por mês — últimos 12 meses realizados e projeção dos próximos 6 meses
                com base nos recebimentos e títulos pendentes.
            </p>

            <div className="fc-resumo">
                <div className="fc-resumo-box">
                    <div className="fc-resumo-label">Total entradas</div>
                    <div className="fc-resumo-valor fc-val--success">{fmtValor(totalEntradas)}</div>
                </div>
                <div className="fc-resumo-box">
                    <div className="fc-resumo-label">Total saídas</div>
                    <div className="fc-resumo-valor fc-val--error">{fmtValor(totalSaidas)}</div>
                </div>
                <div className="fc-resumo-box">
                    <div className="fc-resumo-label">Saldo líquido</div>
                    <div className={`fc-resumo-valor ${totalEntradas - totalSaidas >= 0 ? "fc-val--success" : "fc-val--error"}`}>
                        {fmtValor(totalEntradas - totalSaidas)}
                    </div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Entradas × Saídas por mês</Card.Title>
                        <Card.Description>Barras verdes = entradas, vermelhas = saídas. Meses projetados em tom mais claro.</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body>
                    {fluxo.length === 0 ? (
                        <EmptyState icon={LuChartLine} title="Sem dados" description="Nenhum movimento bancário registrado." variant="compact"/>
                    ) : (
                        <div className="fc-chart">
                            {fluxo.map(item => {
                                const pctE = (Number(item.entradas) / maxVal) * 100;
                                const pctS = (Number(item.saidas) / maxVal) * 100;
                                const saldo = Number(item.saldo || 0);
                                const proj = item.projetado;
                                return (
                                    <div key={item.mes} className={`fc-row ${proj ? "fc-row--proj" : ""}`}>
                                        <div className="fc-row-mes">{fmtMes(item.mes)}</div>
                                        <div className="fc-row-bars">
                                            <div className="fc-bar-wrap">
                                                <div className="fc-bar fc-bar--in" style={{ width: `${Math.max(pctE, 1)}%` }}/>
                                                <span className="fc-bar-label">{fmtValor(item.entradas)}</span>
                                            </div>
                                            <div className="fc-bar-wrap">
                                                <div className="fc-bar fc-bar--out" style={{ width: `${Math.max(pctS, 1)}%` }}/>
                                                <span className="fc-bar-label">{fmtValor(item.saidas)}</span>
                                            </div>
                                        </div>
                                        <div className={`fc-row-saldo ${saldo >= 0 ? "fc-val--success" : "fc-val--error"}`}>
                                            {saldo >= 0 ? "+" : ""}{fmtValor(saldo)}
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

const CSS = `
.rel-subtitulo{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--text-muted);max-width:720px}
.rel-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--text-dim);font-size:14px}
.rel-spin{animation:rel-spin 1s linear infinite}
@keyframes rel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.fc-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px}
.fc-resumo-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.fc-resumo-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.fc-resumo-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;font-variant-numeric:tabular-nums}
.fc-val--success{color:var(--success)}.fc-val--error{color:var(--error)}

.fc-chart{display:flex;flex-direction:column;gap:16px}
.fc-row{display:grid;grid-template-columns:60px 1fr 110px;gap:12px;align-items:center}
.fc-row--proj{opacity:.6}
.fc-row-mes{font-size:13px;font-weight:600;color:var(--navy-deep)}
.fc-row-bars{display:flex;flex-direction:column;gap:4px}
.fc-bar-wrap{display:flex;align-items:center;gap:8px}
.fc-bar{height:8px;border-radius:4px;transition:width .4s ease;min-width:2px}
.fc-bar--in{background:var(--success)}
.fc-bar--out{background:var(--error)}
.fc-bar-label{font-size:11px;color:var(--text-dim);font-variant-numeric:tabular-nums;white-space:nowrap}
.fc-row-saldo{font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;text-align:right}

@media(max-width:600px){.fc-row{grid-template-columns:50px 1fr 90px;gap:8px}.fc-resumo{grid-template-columns:1fr}}
`;
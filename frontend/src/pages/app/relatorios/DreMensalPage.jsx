import { LuLoader, LuTriangleAlert, LuFileChartColumn, LuFileSpreadsheet } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, fmtMes, useRelatorioFluxoBanco, useExportacao } from "./_helpers.jsx";

export default function DreMensalPage() {
    const { dados, carregando, erro } = useRelatorioFluxoBanco();
    const { exportar, exportando } = useExportacao("/api/fluxo-caixa/exportar", "dre_mensal");

    const excelBtn = (
        <button className="ph-btn ph-btn--secondary" onClick={() => exportar("excel?tipo=dre")} disabled={!!exportando}>
            <LuFileSpreadsheet size={14}/> {exportando ? "Gerando…" : "Excel"}
        </button>
    );

    if (carregando) {
        return (
            <>
                <PageHeader title="DRE mensal" backTo="/relatorios" backLabel="Relatórios"/>
                <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando dados...</span></div>
                <style>{CSS}</style>
            </>
        );
    }

    if (erro || !dados) {
        return (
            <>
                <PageHeader title="DRE mensal" backTo="/relatorios" backLabel="Relatórios"/>
                <Card><Card.Body><EmptyState icon={LuTriangleAlert} title="Não foi possível carregar" description={erro || "Tente novamente."}/></Card.Body></Card>
                <style>{CSS}</style>
            </>
        );
    }

    const dre = dados.dre ?? [];
    const meses = dre.filter(d => !d.ehTotal);
    const totalRow = dre.find(d => d.ehTotal);

    const totalReceitas = totalRow ? Number(totalRow.receitas) : 0;
    const totalDespesas = totalRow ? Number(totalRow.despesas) : 0;
    const totalResultado = totalRow ? Number(totalRow.resultado) : 0;
    const margemGeral = totalRow ? Number(totalRow.margem) : 0;

    return (
        <>
            <PageHeader title="DRE mensal" backTo="/relatorios" backLabel="Relatórios" actions={excelBtn}/>

            <p className="rel-subtitulo">
                Demonstrativo de Resultados simplificado — receitas menos despesas por mês,
                baseado nos movimentos bancários dos últimos 12 meses.
            </p>

            <div className="dre-kpis">
                <div className="dre-kpi">
                    <div className="dre-kpi-label">Receitas (12m)</div>
                    <div className="dre-kpi-valor dre-val--success">{fmtValor(totalReceitas)}</div>
                </div>
                <div className="dre-kpi">
                    <div className="dre-kpi-label">Despesas (12m)</div>
                    <div className="dre-kpi-valor dre-val--error">{fmtValor(totalDespesas)}</div>
                </div>
                <div className="dre-kpi">
                    <div className="dre-kpi-label">Resultado</div>
                    <div className={`dre-kpi-valor ${totalResultado >= 0 ? "dre-val--success" : "dre-val--error"}`}>
                        {fmtValor(totalResultado)}
                    </div>
                </div>
                <div className="dre-kpi">
                    <div className="dre-kpi-label">Margem</div>
                    <div className={`dre-kpi-valor ${margemGeral >= 0 ? "dre-val--success" : "dre-val--error"}`}>
                        {margemGeral.toFixed(1)}%
                    </div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Resultado mensal</Card.Title>
                        <Card.Description>Receitas − Despesas = Resultado (com margem %)</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body padded={false}>
                    {meses.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState icon={LuFileChartColumn} title="Sem dados"
                                        description="Registre movimentos bancários para gerar o DRE."
                                        variant="compact"/>
                        </div>
                    ) : (
                        <div className="dre-table-wrap">
                            <table className="dre-table">
                                <thead>
                                <tr>
                                    <th>Mês</th>
                                    <th className="dre-col-right">Receitas</th>
                                    <th className="dre-col-right">Despesas</th>
                                    <th className="dre-col-right">Resultado</th>
                                    <th className="dre-col-right">Margem</th>
                                </tr>
                                </thead>
                                <tbody>
                                {meses.map(item => {
                                    const resultado = Number(item.resultado || 0);
                                    const margem = Number(item.margem || 0);
                                    const positivo = resultado >= 0;
                                    return (
                                        <tr key={item.mes}>
                                            <td className="dre-col-mes">{fmtMes(item.mes)}</td>
                                            <td className="dre-col-right dre-val--success">{fmtValor(item.receitas)}</td>
                                            <td className="dre-col-right dre-val--error">{fmtValor(item.despesas)}</td>
                                            <td className={`dre-col-right dre-col-bold ${positivo ? "dre-val--success" : "dre-val--error"}`}>
                                                {fmtValor(resultado)}
                                            </td>
                                            <td className={`dre-col-right ${positivo ? "dre-val--success" : "dre-val--error"}`}>
                                                {margem.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                                {totalRow && (
                                    <tfoot>
                                    <tr className="dre-row-total">
                                        <td className="dre-col-mes">Total</td>
                                        <td className="dre-col-right dre-val--success">{fmtValor(totalReceitas)}</td>
                                        <td className="dre-col-right dre-val--error">{fmtValor(totalDespesas)}</td>
                                        <td className={`dre-col-right dre-col-bold ${totalResultado >= 0 ? "dre-val--success" : "dre-val--error"}`}>
                                            {fmtValor(totalResultado)}
                                        </td>
                                        <td className={`dre-col-right ${margemGeral >= 0 ? "dre-val--success" : "dre-val--error"}`}>
                                            {margemGeral.toFixed(1)}%
                                        </td>
                                    </tr>
                                    </tfoot>
                                )}
                            </table>
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

.dre-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.dre-kpi{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.dre-kpi-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.dre-kpi-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;font-variant-numeric:tabular-nums}
.dre-val--success{color:var(--success)}.dre-val--error{color:var(--error)}

.dre-table-wrap{overflow-x:auto}
.dre-table{width:100%;border-collapse:collapse;font-size:13px}
.dre-table th{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);padding:10px 16px;text-align:left;border-bottom:2px solid var(--hair)}
.dre-table td{padding:10px 16px;border-bottom:1px solid var(--hair);color:var(--navy-deep)}
.dre-table tbody tr:hover{background:var(--bg)}
.dre-col-mes{font-weight:600;white-space:nowrap}
.dre-col-right{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dre-col-bold{font-weight:700}
.dre-row-total td{font-weight:700;border-top:2px solid var(--hair);background:var(--bg);font-size:14px}

@media(max-width:600px){.dre-kpis{grid-template-columns:1fr 1fr}.dre-table{font-size:12px}.dre-table th,.dre-table td{padding:8px 10px}}
`;
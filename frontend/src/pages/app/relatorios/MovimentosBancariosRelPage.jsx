import { LuLoader, LuTriangleAlert, LuLandmark, LuArrowUpRight, LuArrowDownRight, LuFileSpreadsheet } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, useRelatorioFluxoBanco, useExportacao } from "./_helpers.jsx";

export default function MovimentosBancariosRelPage() {
    const { dados, carregando, erro } = useRelatorioFluxoBanco();
    const { exportar, exportando } = useExportacao("/api/fluxo-caixa/exportar", "movimentos_bancarios");

    const excelBtn = (
        <button className="ph-btn ph-btn--secondary" onClick={() => exportar("excel?tipo=movimentos")} disabled={!!exportando}>
            <LuFileSpreadsheet size={14}/> {exportando ? "Gerando…" : "Excel"}
        </button>
    );

    if (carregando) {
        return (
            <>
                <PageHeader title="Movimentos bancários" backTo="/relatorios" backLabel="Relatórios"/>
                <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando dados...</span></div>
                <style>{CSS}</style>
            </>
        );
    }

    if (erro || !dados) {
        return (
            <>
                <PageHeader title="Movimentos bancários" backTo="/relatorios" backLabel="Relatórios"/>
                <Card><Card.Body><EmptyState icon={LuTriangleAlert} title="Não foi possível carregar" description={erro || "Tente novamente."}/></Card.Body></Card>
                <style>{CSS}</style>
            </>
        );
    }

    const movimentos = (dados.movimentos ?? []).filter(m => !m.cancelado);
    const totalEntradas = movimentos.filter(m => m.ehEntrada).reduce((s, m) => s + Number(m.valor || 0), 0);
    const totalSaidas   = movimentos.filter(m => !m.ehEntrada).reduce((s, m) => s + Number(m.valor || 0), 0);

    function fmtData(d) {
        if (!d) return "—";
        const dt = new Date(d + "T00:00:00");
        return dt.toLocaleDateString("pt-BR");
    }

    function formatarTipo(tipo) {
        const map = {
            RECEBIMENTO: "Recebimento",
            PAGAMENTO: "Pagamento",
            AJUSTE_MANUAL: "Ajuste",
            ESTORNO_RECEBIMENTO: "Estorno receb.",
            ESTORNO_PAGAMENTO: "Estorno pgto.",
        };
        return map[tipo] || tipo;
    }

    return (
        <>
            <PageHeader title="Movimentos bancários" backTo="/relatorios" backLabel="Relatórios" actions={excelBtn}/>

            <p className="rel-subtitulo">
                Extrato consolidado dos últimos movimentos de todas as suas contas bancárias.
            </p>

            <div className="mb-resumo">
                <div className="mb-resumo-box">
                    <div className="mb-resumo-label">Entradas</div>
                    <div className="mb-resumo-valor mb-val--success">{fmtValor(totalEntradas)}</div>
                </div>
                <div className="mb-resumo-box">
                    <div className="mb-resumo-label">Saídas</div>
                    <div className="mb-resumo-valor mb-val--error">{fmtValor(totalSaidas)}</div>
                </div>
                <div className="mb-resumo-box">
                    <div className="mb-resumo-label">Movimentos</div>
                    <div className="mb-resumo-valor">{movimentos.length}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Extrato consolidado</Card.Title>
                        <Card.Description>Últimos {movimentos.length} movimentos de todas as contas</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body padded={false}>
                    {movimentos.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState icon={LuLandmark} title="Nenhum movimento"
                                        description="Registre pagamentos e recebimentos para ver o extrato."
                                        variant="compact"/>
                        </div>
                    ) : (
                        <div className="mb-table-wrap">
                            <table className="mb-table">
                                <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Conta</th>
                                    <th className="mb-col-right">Valor</th>
                                </tr>
                                </thead>
                                <tbody>
                                {movimentos.map(m => (
                                    <tr key={m.id} className={m.ehEntrada ? "mb-row--in" : "mb-row--out"}>
                                        <td className="mb-col-data">{fmtData(m.data)}</td>
                                        <td>
                                                <span className={`mb-tipo ${m.ehEntrada ? "mb-tipo--in" : "mb-tipo--out"}`}>
                                                    {m.ehEntrada ? <LuArrowDownRight size={11}/> : <LuArrowUpRight size={11}/>}
                                                    {formatarTipo(m.tipo)}
                                                </span>
                                        </td>
                                        <td className="mb-col-desc">{m.descricao}</td>
                                        <td className="mb-col-conta">{m.conta}</td>
                                        <td className={`mb-col-right ${m.ehEntrada ? "mb-val--success" : "mb-val--error"}`}>
                                            {m.ehEntrada ? "+" : "−"}{fmtValor(m.valor)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
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

.mb-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.mb-resumo-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.mb-resumo-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.mb-resumo-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;font-variant-numeric:tabular-nums;color:var(--navy-deep)}
.mb-val--success{color:var(--success)}.mb-val--error{color:var(--error)}

.mb-table-wrap{overflow-x:auto}
.mb-table{width:100%;border-collapse:collapse;font-size:13px}
.mb-table th{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);padding:10px 16px;text-align:left;border-bottom:2px solid var(--hair);position:sticky;top:0;background:var(--surface)}
.mb-table td{padding:10px 16px;border-bottom:1px solid var(--hair);color:var(--navy-deep);vertical-align:middle}
.mb-table tbody tr:hover{background:var(--bg)}
.mb-col-data{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:12px;color:var(--text-dim)}
.mb-col-desc{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mb-col-conta{font-size:12px;color:var(--text-dim);white-space:nowrap}
.mb-col-right{text-align:right;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.mb-tipo{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px}
.mb-tipo--in{color:var(--success);background:rgba(24,178,107,.08)}
.mb-tipo--out{color:var(--error);background:rgba(229,72,77,.08)}

@media(max-width:600px){.mb-resumo{grid-template-columns:1fr 1fr}.mb-table{font-size:12px}.mb-col-desc{max-width:140px}}
`;
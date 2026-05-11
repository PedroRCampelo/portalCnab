import {
    LuLoader, LuTriangleAlert, LuUsers, LuFileSpreadsheet,
} from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import {
    fmtValor, BarraHorizontal,
    useRelatorioRecebimentos, useExportacao,
} from "./_helpers.jsx";

export default function PorClientePage() {
    const { dados, carregando, erro } = useRelatorioRecebimentos();
    const { exportar, exportando } = useExportacao("/api/recebimentos/exportar", "por_cliente");

    const excelBtn = (
        <button className="ph-btn ph-btn--secondary" onClick={() => exportar("excel?tipo=por-cliente")} disabled={!!exportando}>
            <LuFileSpreadsheet size={14}/> {exportando ? "Gerando…" : "Excel"}
        </button>
    );

    if (carregando) {
        return (
            <>
                <PageHeader title="Por cliente" backTo="/relatorios" backLabel="Relatórios"/>
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
                <PageHeader title="Por cliente" backTo="/relatorios" backLabel="Relatórios"/>
                <Card><Card.Body>
                    <EmptyState icon={LuTriangleAlert} title="Não foi possível carregar"
                                description={erro || "Tente novamente em instantes."}/>
                </Card.Body></Card>
                <style>{CSS}</style>
            </>
        );
    }

    const clientes = dados.porCliente ?? [];
    const totalAberto   = clientes.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalRecebido = clientes.reduce((s, i) => s + Number(i.recebido || 0), 0);
    const totalItens    = clientes.reduce((s, i) => s + Number(i.quantidade || 0), 0);
    const max = clientes.length > 0 ? Math.max(...clientes.map(i => Number(i.total))) : 0;

    return (
        <>
            <PageHeader
                title="Por cliente"
                backTo="/relatorios"
                backLabel="Relatórios"
                actions={excelBtn}
            />

            <p className="rel-subtitulo">
                Ranking dos seus principais clientes por valor em aberto.
                Útil pra priorizar cobranças e identificar inadimplência.
            </p>

            <div className="pc-resumo">
                <div className="pc-resumo-box">
                    <div className="pc-resumo-label">Em aberto</div>
                    <div className="pc-resumo-valor">{fmtValor(totalAberto)}</div>
                </div>
                <div className="pc-resumo-box">
                    <div className="pc-resumo-label">Já recebido</div>
                    <div className="pc-resumo-valor pc-resumo-valor--success">{fmtValor(totalRecebido)}</div>
                </div>
                <div className="pc-resumo-box">
                    <div className="pc-resumo-label">Clientes</div>
                    <div className="pc-resumo-valor">{clientes.length}</div>
                </div>
                <div className="pc-resumo-box">
                    <div className="pc-resumo-label">Recebimentos</div>
                    <div className="pc-resumo-valor">{totalItens}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Top clientes por valor em aberto</Card.Title>
                        <Card.Description>
                            Os {clientes.length} maiores clientes com saldo pendente
                        </Card.Description>
                    </div>
                </Card.Header>
                <Card.Body padded={false}>
                    {clientes.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState
                                icon={LuUsers}
                                title="Nenhum dado disponível"
                                description="Cadastre recebimentos e seus clientes aparecerão aqui ranqueados."
                                variant="compact"
                            />
                        </div>
                    ) : (
                        <ul className="pc-lista">
                            {clientes.map((item, idx) => (
                                <li key={item.nome + idx} className="pc-item">
                                    <div className="pc-rank">{idx + 1}</div>
                                    <div className="pc-content">
                                        <div className="pc-nome">{item.nome}</div>
                                        <BarraHorizontal valor={Number(item.total)} max={max} variant="default"/>
                                    </div>
                                    <div className="pc-meta">
                                        <div className="pc-valor">{fmtValor(item.total)}</div>
                                        <div className="pc-qtd">
                                            {item.quantidade} {item.quantidade === 1 ? "receb." : "receb."}
                                        </div>
                                        {Number(item.recebido) > 0 && (
                                            <div className="pc-recebido">
                                                ✓ {fmtValor(item.recebido)} recebido
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
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

.pc-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.pc-resumo-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.pc-resumo-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.pc-resumo-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.pc-resumo-valor--success{color:var(--success)}

.pc-lista{list-style:none;margin:0;padding:0}
.pc-item{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid var(--hair)}
.pc-item:last-child{border-bottom:none}
.pc-item:hover{background:var(--bg)}
.pc-rank{width:28px;height:28px;border-radius:6px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-family:var(--ff-mono);font-size:12px;font-weight:700;background:var(--cyan-soft);color:var(--cyan-dark);border:1px solid rgba(6,182,212,.2)}
.pc-content{flex:1;min-width:0}
.pc-nome{font-size:13px;font-weight:600;color:var(--navy-deep);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-meta{flex-shrink:0;text-align:right;min-width:120px}
.pc-valor{font-size:13px;font-weight:600;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.pc-qtd{font-family:var(--ff-mono);font-size:10px;color:var(--text-dim);letter-spacing:.04em;margin-top:2px}
.pc-recebido{font-size:10px;color:var(--success);margin-top:2px}

@media(max-width:600px){.pc-resumo{grid-template-columns:1fr 1fr}.pc-item{padding:12px 16px;gap:10px}.pc-meta{min-width:auto}}
`;
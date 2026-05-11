import {
    LuLoader, LuTriangleAlert, LuHistory, LuCircleCheck, LuFileSpreadsheet,
} from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import {
    fmtValor, fmtMes, BarraHorizontal,
    useRelatorioRecebimentos, useExportacao,
} from "./_helpers.jsx";

export default function HistoricoPagamentosPage() {
    const { dados, carregando, erro } = useRelatorioRecebimentos();
    const { exportar, exportando } = useExportacao("/api/recebimentos/exportar", "historico_pagamentos");

    const excelBtn = (
        <button className="ph-btn ph-btn--secondary" onClick={() => exportar("excel?tipo=historico")} disabled={!!exportando}>
            <LuFileSpreadsheet size={14}/> {exportando ? "Gerando…" : "Excel"}
        </button>
    );

    if (carregando) {
        return (
            <>
                <PageHeader title="Histórico de pagamentos" backTo="/relatorios" backLabel="Relatórios"/>
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
                <PageHeader title="Histórico de pagamentos" backTo="/relatorios" backLabel="Relatórios"/>
                <Card><Card.Body>
                    <EmptyState icon={LuTriangleAlert} title="Não foi possível carregar"
                                description={erro || "Tente novamente em instantes."}/>
                </Card.Body></Card>
                <style>{CSS}</style>
            </>
        );
    }

    const historico = dados.historico ?? [];
    const totalRecebido = historico.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalQtd      = historico.reduce((s, i) => s + Number(i.quantidade || 0), 0);
    const max = historico.length > 0 ? Math.max(...historico.map(i => Number(i.total))) : 0;
    const mediaMensal = historico.length > 0 ? totalRecebido / historico.length : 0;

    return (
        <>
            <PageHeader
                title="Histórico de pagamentos"
                backTo="/relatorios"
                backLabel="Relatórios"
                actions={excelBtn}
            />

            <p className="rel-subtitulo">
                Evolução dos pagamentos recebidos nos últimos 12 meses.
                Acompanhe a sazonalidade e identifique tendências.
            </p>

            <div className="hp-resumo">
                <div className="hp-resumo-box">
                    <div className="hp-resumo-label">Total recebido</div>
                    <div className="hp-resumo-valor hp-resumo-valor--success">{fmtValor(totalRecebido)}</div>
                </div>
                <div className="hp-resumo-box">
                    <div className="hp-resumo-label">Média mensal</div>
                    <div className="hp-resumo-valor">{fmtValor(mediaMensal)}</div>
                </div>
                <div className="hp-resumo-box">
                    <div className="hp-resumo-label">Meses com receita</div>
                    <div className="hp-resumo-valor">{historico.length}</div>
                </div>
                <div className="hp-resumo-box">
                    <div className="hp-resumo-label">Recebimentos</div>
                    <div className="hp-resumo-valor">{totalQtd}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Recebimentos por mês</Card.Title>
                        <Card.Description>
                            Últimos 12 meses — valores efetivamente recebidos
                        </Card.Description>
                    </div>
                </Card.Header>
                <Card.Body>
                    {historico.length === 0 ? (
                        <EmptyState
                            icon={LuHistory}
                            title="Sem histórico"
                            description="Nenhum pagamento recebido nos últimos 12 meses. Registre recebimentos e marque como recebidos."
                            variant="compact"
                        />
                    ) : (
                        <div className="hp-timeline">
                            {historico.map(item => {
                                const acima = Number(item.total) >= mediaMensal;
                                return (
                                    <div key={item.mes} className="hp-row">
                                        <div className="hp-label">
                                            <span className="hp-mes">{fmtMes(item.mes)}</span>
                                            <span className="hp-meta">
                                                <span className="hp-valor">{fmtValor(item.total)}</span>
                                                <span className="hp-qtd">
                                                    {item.quantidade} {item.quantidade === 1 ? "receb." : "receb."}
                                                </span>
                                                {acima && (
                                                    <span className="hp-tag-acima">
                                                        <LuCircleCheck size={9}/> acima da média
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <BarraHorizontal
                                            valor={Number(item.total)}
                                            max={max}
                                            variant={acima ? "success" : "default"}
                                        />
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

.hp-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.hp-resumo-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.hp-resumo-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.hp-resumo-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.hp-resumo-valor--success{color:var(--success)}

.hp-timeline{display:flex;flex-direction:column;gap:14px}
.hp-row{display:flex;flex-direction:column;gap:6px}
.hp-label{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.hp-mes{font-size:13px;font-weight:600;color:var(--navy-deep)}
.hp-meta{display:inline-flex;align-items:baseline;gap:10px}
.hp-valor{font-size:13px;font-weight:600;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.hp-qtd{font-family:var(--ff-mono);font-size:10px;color:var(--text-dim);letter-spacing:.04em}
.hp-tag-acima{display:inline-flex;align-items:center;gap:3px;font-size:9px;color:var(--success);font-weight:600}

@media(max-width:600px){.hp-resumo{grid-template-columns:1fr 1fr}}
`;
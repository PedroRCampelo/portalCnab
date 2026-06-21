import { LuLoader, LuTriangleAlert, LuChartBar } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, fmtValorCompacto, useRelatorioComercial } from "./_helpers.jsx";

const ESTAGIOS = [
    { key: "orcamentosRascunho",  label: "Orçamento\nRascunho",  cor: "var(--text-dim)",   bgAlpha: 0.05, countKey: "orcamentosRascunho"  },
    { key: "orcamentosEnviados",  label: "Orçamento\nEnviado",   cor: "#f59e0b",            bgAlpha: 0.08, countKey: "orcamentosEnviados"  },
    { key: "orcamentosAprovados", label: "Orçamento\nAprovado",  cor: "var(--cyan-deep)",   bgAlpha: 0.08, countKey: "orcamentosAprovados" },
    { key: "pedidosAbertos",      label: "Pedido\nAberto",       cor: "#6366f1",            bgAlpha: 0.08, countKey: "pedidosAbertos"      },
    { key: "pedidosEfetivados",   label: "Pedido\nEfetivado",    cor: "var(--success)",     bgAlpha: 0.08, countKey: "pedidosEfetivados"   },
];

export default function FunilComercialPage() {
    const { dados, carregando, erro } = useRelatorioComercial();

    if (carregando) return <Loading />;
    if (erro || !dados) return <Erro msg={erro} />;

    const f = dados.funil ?? {};
    const totalOrc = (f.orcamentosRascunho ?? 0) + (f.orcamentosEnviados ?? 0)
        + (f.orcamentosAprovados ?? 0) + (f.orcamentosEmPedido ?? 0);
    const totalPv  = (f.pedidosAbertos ?? 0) + (f.pedidosEfetivados ?? 0) + (f.pedidosCancelados ?? 0);
    const maxCount = Math.max(...ESTAGIOS.map(e => Number(f[e.countKey] ?? 0)), 1);

    const taxaConversao = totalOrc > 0
        ? Math.round((Number(f.pedidosEfetivados ?? 0) / totalOrc) * 100)
        : 0;

    return (
        <>
            <PageHeader title="Funil comercial" backTo="/relatorios" backLabel="Relatórios"/>

            <p className="rel-subtitulo">
                Visão do pipeline comercial do orçamento ao pedido efetivado.
            </p>

            <div className="fc-resumo">
                <div className="fc-box">
                    <div className="fc-label">Total orçamentos</div>
                    <div className="fc-valor">{totalOrc}</div>
                </div>
                <div className="fc-box">
                    <div className="fc-label">Total pedidos</div>
                    <div className="fc-valor">{totalPv}</div>
                </div>
                <div className="fc-box">
                    <div className="fc-label">Taxa de conversão</div>
                    <div className="fc-valor fc-valor--cyan">{taxaConversao}%</div>
                </div>
                <div className="fc-box">
                    <div className="fc-label">Valor efetivado</div>
                    <div className="fc-valor fc-valor--success">{fmtValor(f.valorEfetivado ?? 0)}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <Card.Title>Pipeline por estágio</Card.Title>
                    <Card.Description>Quantidade de registros em cada etapa do funil</Card.Description>
                </Card.Header>
                <Card.Body>
                    <div className="fc-funil">
                        {ESTAGIOS.map((e, i) => {
                            const count = Number(f[e.countKey] ?? 0);
                            const pct   = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            const width = `${Math.max(30, 100 - (i * 14))}%`;
                            return (
                                <div key={e.key} className="fc-estagio" style={{ width }}>
                                    <div
                                        className="fc-estagio-bar"
                                        style={{ background: e.cor, opacity: 0.15 + (count > 0 ? 0.7 : 0) }}
                                    />
                                    <div className="fc-estagio-content">
                                        <div className="fc-estagio-label" style={{ color: e.cor }}>
                                            {e.label.split("\n").map((l, j) => <span key={j} className="fc-label-part">{l}</span>)}
                                        </div>
                                        <div className="fc-estagio-count" style={{ color: e.cor }}>{count}</div>
                                    </div>
                                    {i < ESTAGIOS.length - 1 && (
                                        <div className="fc-seta">▼</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card.Body>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <Card>
                    <Card.Header><Card.Title>Orçamentos</Card.Title></Card.Header>
                    <Card.Body>
                        <div className="fc-detalhe-grid">
                            {[
                                { l: "Rascunho",  v: f.orcamentosRascunho  ?? 0 },
                                { l: "Enviado",   v: f.orcamentosEnviados   ?? 0 },
                                { l: "Aprovado",  v: f.orcamentosAprovados  ?? 0, val: f.valorOrcamentosAprovados },
                                { l: "Em pedido", v: f.orcamentosEmPedido   ?? 0 },
                            ].map((r, i) => (
                                <div key={i} className="fc-detalhe-row">
                                    <span className="fc-detalhe-label">{r.l}</span>
                                    <span className="fc-detalhe-count">{r.v}</span>
                                    {r.val != null && <span className="fc-detalhe-val">{fmtValorCompacto(r.val)}</span>}
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header><Card.Title>Pedidos de venda</Card.Title></Card.Header>
                    <Card.Body>
                        <div className="fc-detalhe-grid">
                            {[
                                { l: "Aberto",    v: f.pedidosAbertos    ?? 0, val: f.valorPedidosAbertos },
                                { l: "Efetivado", v: f.pedidosEfetivados ?? 0, val: f.valorEfetivado      },
                                { l: "Cancelado", v: f.pedidosCancelados ?? 0 },
                            ].map((r, i) => (
                                <div key={i} className="fc-detalhe-row">
                                    <span className="fc-detalhe-label">{r.l}</span>
                                    <span className="fc-detalhe-count">{r.v}</span>
                                    {r.val != null && <span className="fc-detalhe-val">{fmtValorCompacto(r.val)}</span>}
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
            </div>

            <style>{CSS}</style>
        </>
    );
}

function Loading() {
    return (<>
        <PageHeader title="Funil comercial" backTo="/relatorios" backLabel="Relatórios"/>
        <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando...</span></div>
        <style>{CSS}</style>
    </>);
}
function Erro({ msg }) {
    return (<>
        <PageHeader title="Funil comercial" backTo="/relatorios" backLabel="Relatórios"/>
        <Card><Card.Body><EmptyState icon={LuTriangleAlert} title="Erro" description={msg || "Tente novamente."}/></Card.Body></Card>
        <style>{CSS}</style>
    </>);
}

const CSS = `
.rel-subtitulo{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--text-muted);max-width:720px}
.rel-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--text-dim);font-size:14px}
.rel-spin{animation:rel-spin 1s linear infinite}
@keyframes rel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.fc-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.fc-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.fc-label,.fc-detalhe-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.fc-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.fc-valor--cyan{color:var(--cyan-deep)}
.fc-valor--success{color:var(--success)}

.fc-funil{display:flex;flex-direction:column;align-items:center;gap:0}
.fc-estagio{position:relative;border-radius:10px;overflow:hidden;margin:3px 0}
.fc-estagio-bar{position:absolute;inset:0}
.fc-estagio-content{position:relative;display:flex;align-items:center;justify-content:space-between;padding:14px 24px}
.fc-estagio-label{display:flex;flex-direction:column;font-size:12px;font-weight:600;gap:1px}
.fc-label-part{line-height:1.3}
.fc-estagio-count{font-size:28px;font-weight:700;font-variant-numeric:tabular-nums}
.fc-seta{text-align:center;font-size:11px;color:var(--text-dim);margin:0}

.fc-detalhe-grid{display:flex;flex-direction:column;gap:8px}
.fc-detalhe-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--hair)}
.fc-detalhe-row:last-child{border-bottom:none}
.fc-detalhe-label{flex:1;font-size:13px;color:var(--ink)}
.fc-detalhe-count{font-family:var(--ff-mono);font-size:13px;font-weight:700;color:var(--navy-deep);min-width:32px;text-align:right}
.fc-detalhe-val{font-size:11px;color:var(--text-muted);min-width:70px;text-align:right}

@media(max-width:640px){
    div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
    .fc-estagio{width:100%!important}
}
`;

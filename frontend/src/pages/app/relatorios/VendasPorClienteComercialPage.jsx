import { LuLoader, LuTriangleAlert, LuUsers } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, BarraHorizontal, useRelatorioComercial } from "./_helpers.jsx";

export default function VendasPorClienteComercialPage() {
    const { dados, carregando, erro } = useRelatorioComercial();

    if (carregando) return <Loading />;
    if (erro || !dados) return <Erro msg={erro} />;

    const clientes = dados.vendasPorCliente ?? [];
    const totalGeral   = clientes.reduce((s, c) => s + Number(c.valorTotal || 0), 0);
    const totalEfetiv  = clientes.reduce((s, c) => s + Number(c.valorEfetivado || 0), 0);
    const totalPedidos = clientes.reduce((s, c) => s + Number(c.totalPedidos || 0), 0);
    const max = clientes.length > 0 ? Math.max(...clientes.map(c => Number(c.valorTotal))) : 0;

    return (
        <>
            <PageHeader title="Vendas por cliente" backTo="/relatorios" backLabel="Relatórios"/>

            <p className="rel-subtitulo">
                Ranking de clientes pelo volume de pedidos de venda gerados.
            </p>

            <div className="vc-resumo">
                <div className="vc-box">
                    <div className="vc-label">Volume total</div>
                    <div className="vc-valor">{fmtValor(totalGeral)}</div>
                </div>
                <div className="vc-box">
                    <div className="vc-label">Efetivado</div>
                    <div className="vc-valor vc-valor--success">{fmtValor(totalEfetiv)}</div>
                </div>
                <div className="vc-box">
                    <div className="vc-label">Clientes</div>
                    <div className="vc-valor">{clientes.length}</div>
                </div>
                <div className="vc-box">
                    <div className="vc-label">Total pedidos</div>
                    <div className="vc-valor">{totalPedidos}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Ranking por cliente</Card.Title>
                        <Card.Description>Pedidos não cancelados — ordenados por valor total</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body padded={false}>
                    {clientes.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState icon={LuUsers} title="Nenhum dado disponível"
                                        description="Crie pedidos de venda para visualizar o ranking de clientes."
                                        variant="compact"/>
                        </div>
                    ) : (
                        <ul className="vc-lista">
                            {clientes.map((c, idx) => {
                                const txEfet = Number(c.valorTotal) > 0
                                    ? Math.round((Number(c.valorEfetivado) / Number(c.valorTotal)) * 100)
                                    : 0;
                                return (
                                    <li key={c.clienteNome + idx} className="vc-item">
                                        <div className="vc-rank">{idx + 1}</div>
                                        <div className="vc-content">
                                            <div className="vc-nome">{c.clienteNome}</div>
                                            <BarraHorizontal valor={Number(c.valorTotal)} max={max}/>
                                        </div>
                                        <div className="vc-meta">
                                            <div className="vc-total">{fmtValor(c.valorTotal)}</div>
                                            <div className="vc-qtd">{c.totalPedidos} pedido{c.totalPedidos !== 1 ? "s" : ""}</div>
                                            {txEfet > 0 && (
                                                <div className="vc-efet">{txEfet}% efetivado</div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
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
            <PageHeader title="Vendas por cliente" backTo="/relatorios" backLabel="Relatórios"/>
            <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando...</span></div>
            <style>{CSS}</style>
        </>
    );
}
function Erro({ msg }) {
    return (
        <>
            <PageHeader title="Vendas por cliente" backTo="/relatorios" backLabel="Relatórios"/>
            <Card><Card.Body>
                <EmptyState icon={LuTriangleAlert} title="Erro" description={msg || "Tente novamente."}/>
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

.vc-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.vc-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.vc-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.vc-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.vc-valor--success{color:var(--success)}

.vc-lista{list-style:none;margin:0;padding:0}
.vc-item{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid var(--hair)}
.vc-item:last-child{border-bottom:none}
.vc-item:hover{background:var(--bg)}
.vc-rank{width:28px;height:28px;border-radius:6px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-family:var(--ff-mono);font-size:12px;font-weight:700;background:var(--cyan-soft);color:var(--cyan-dark);border:1px solid rgba(6,182,212,.2)}
.vc-content{flex:1;min-width:0}
.vc-nome{font-size:13px;font-weight:600;color:var(--navy-deep);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vc-meta{flex-shrink:0;text-align:right;min-width:120px}
.vc-total{font-size:13px;font-weight:600;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.vc-qtd{font-family:var(--ff-mono);font-size:10px;color:var(--text-dim);letter-spacing:.04em;margin-top:2px}
.vc-efet{font-size:10px;color:var(--success);margin-top:2px}
`;

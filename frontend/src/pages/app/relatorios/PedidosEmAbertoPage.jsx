import { LuLoader, LuTriangleAlert, LuShoppingCart } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, useRelatorioComercial } from "./_helpers.jsx";

const FORMA_PAG = {
    PIX: "Pix", BOLETO: "Boleto", DINHEIRO: "Dinheiro",
    CARTAO_CREDITO: "Cartão crédito", CARTAO_DEBITO: "Cartão débito",
    TRANSFERENCIA: "Transferência", OUTROS: "Outros",
};

function fmtDataBr(s) {
    if (!s) return "—";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
}

function diasAtraso(vencStr) {
    const hoje = new Date();
    const venc = new Date(vencStr);
    const diff = Math.floor((hoje - venc) / 86400000);
    return diff;
}

export default function PedidosEmAbertoPage() {
    const { dados, carregando, erro } = useRelatorioComercial();

    if (carregando) return <Loading />;
    if (erro || !dados) return <Erro msg={erro} />;

    const pedidos = dados.pedidosEmAberto ?? [];
    const totalValor  = pedidos.reduce((s, p) => s + Number(p.valorTotal || 0), 0);
    const vencidos    = pedidos.filter(p => diasAtraso(p.primeiroVencimento) > 0);
    const aVencer30   = pedidos.filter(p => { const d = diasAtraso(p.primeiroVencimento); return d <= 0 && d >= -30; });

    return (
        <>
            <PageHeader title="Pedidos em aberto" backTo="/relatorios" backLabel="Relatórios"/>

            <p className="rel-subtitulo">
                Todos os pedidos de venda com status Aberto — aguardando efetivação ou pagamento.
            </p>

            <div className="pa-resumo">
                <div className="pa-box">
                    <div className="pa-label">Total em aberto</div>
                    <div className="pa-valor">{fmtValor(totalValor)}</div>
                </div>
                <div className="pa-box">
                    <div className="pa-label">Pedidos</div>
                    <div className="pa-valor">{pedidos.length}</div>
                </div>
                <div className="pa-box">
                    <div className="pa-label">Vencendo em 30 dias</div>
                    <div className="pa-valor pa-valor--warn">{aVencer30.length}</div>
                </div>
                <div className="pa-box">
                    <div className="pa-label">Com venc. passado</div>
                    <div className="pa-valor pa-valor--danger">{vencidos.length}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <Card.Title>Pedidos aguardando efetivação</Card.Title>
                    <Card.Description>Ordenados por data de vencimento (mais próximos primeiro)</Card.Description>
                </Card.Header>
                <Card.Body padded={false}>
                    {pedidos.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState icon={LuShoppingCart} title="Nenhum pedido em aberto"
                                        description="Todos os pedidos foram efetivados ou cancelados."
                                        variant="compact"/>
                        </div>
                    ) : (
                        <div className="pa-table-wrap">
                            <table className="pa-table">
                                <thead>
                                    <tr>
                                        <th>Pedido</th>
                                        <th>Cliente</th>
                                        <th>Forma pag.</th>
                                        <th>Criado em</th>
                                        <th style={{ textAlign: "right" }}>Vencimento</th>
                                        <th style={{ textAlign: "right" }}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidos.map((p, i) => {
                                        const atraso = diasAtraso(p.primeiroVencimento);
                                        return (
                                            <tr key={i} className={atraso > 0 ? "pa-row-vencido" : ""}>
                                                <td><span className="pa-num">{p.numero}</span></td>
                                                <td>{p.clienteNome}</td>
                                                <td><span className="pa-forma">{FORMA_PAG[p.formaPagamento] ?? p.formaPagamento}</span></td>
                                                <td className="pa-dim">{fmtDataBr(p.criadoEm)}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    <span className={atraso > 0 ? "pa-venc-atrasado" : "pa-venc"}>
                                                        {fmtDataBr(p.primeiroVencimento)}
                                                        {atraso > 0 && <span className="pa-dias"> +{atraso}d</span>}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtValor(p.valorTotal)}</td>
                                            </tr>
                                        );
                                    })}
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

function Loading() {
    return (<>
        <PageHeader title="Pedidos em aberto" backTo="/relatorios" backLabel="Relatórios"/>
        <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando...</span></div>
        <style>{CSS}</style>
    </>);
}
function Erro({ msg }) {
    return (<>
        <PageHeader title="Pedidos em aberto" backTo="/relatorios" backLabel="Relatórios"/>
        <Card><Card.Body><EmptyState icon={LuTriangleAlert} title="Erro" description={msg || "Tente novamente."}/></Card.Body></Card>
        <style>{CSS}</style>
    </>);
}

const CSS = `
.rel-subtitulo{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--text-muted);max-width:720px}
.rel-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--text-dim);font-size:14px}
.rel-spin{animation:rel-spin 1s linear infinite}
@keyframes rel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.pa-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.pa-box{padding:14px 18px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.pa-label{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.pa-valor{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.pa-valor--warn{color:var(--warning)}
.pa-valor--danger{color:var(--error)}

.pa-table-wrap{overflow-x:auto}
.pa-table{width:100%;border-collapse:collapse;font-size:13px}
.pa-table th{padding:10px 16px;text-align:left;font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);border-bottom:1px solid var(--hair);background:var(--bg)}
.pa-table td{padding:12px 16px;border-bottom:1px solid var(--hair);color:var(--ink)}
.pa-table tr:last-child td{border-bottom:none}
.pa-table tr:hover td{background:var(--bg)}
.pa-row-vencido td{background:rgba(239,68,68,.03)}
.pa-num{font-family:var(--ff-mono);font-size:11px;font-weight:700;color:var(--cyan-dark);background:var(--cyan-soft);padding:3px 8px;border-radius:5px}
.pa-forma{font-size:11px;color:var(--text-muted);background:var(--bg);padding:2px 7px;border-radius:4px;border:1px solid var(--hair)}
.pa-dim{color:var(--text-dim);font-size:12px}
.pa-venc{color:var(--ink)}
.pa-venc-atrasado{color:var(--error);font-weight:600}
.pa-dias{font-family:var(--ff-mono);font-size:10px;margin-left:4px}
`;

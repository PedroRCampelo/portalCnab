import { LuLoader, LuTriangleAlert, LuWallet, LuStar, LuFileSpreadsheet } from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, BarraHorizontal, useRelatorioFluxoBanco, useExportacao } from "./_helpers.jsx";

export default function SaldoPorContaRelPage() {
    const { dados, carregando, erro } = useRelatorioFluxoBanco();
    const { exportar, exportando } = useExportacao("/api/fluxo-caixa/exportar", "saldo_por_conta");

    const excelBtn = (
        <button className="ph-btn ph-btn--secondary" onClick={() => exportar("excel?tipo=saldo-por-conta")} disabled={!!exportando}>
            <LuFileSpreadsheet size={14}/> {exportando ? "Gerando…" : "Excel"}
        </button>
    );

    if (carregando) {
        return (
            <>
                <PageHeader title="Saldo por conta" backTo="/relatorios" backLabel="Relatórios"/>
                <div className="rel-loading"><LuLoader size={20} className="rel-spin"/><span>Carregando dados...</span></div>
                <style>{CSS}</style>
            </>
        );
    }

    if (erro || !dados) {
        return (
            <>
                <PageHeader title="Saldo por conta" backTo="/relatorios" backLabel="Relatórios"/>
                <Card><Card.Body><EmptyState icon={LuTriangleAlert} title="Não foi possível carregar" description={erro || "Tente novamente."}/></Card.Body></Card>
                <style>{CSS}</style>
            </>
        );
    }

    const contas = (dados.saldoPorConta ?? []).filter(c => !c.ehTotal);
    const totalItem = (dados.saldoPorConta ?? []).find(c => c.ehTotal);
    const totalGeral = totalItem ? Number(totalItem.saldoAtual) : contas.reduce((s, c) => s + Number(c.saldoAtual || 0), 0);
    const maxSaldo = Math.max(...contas.map(c => Math.abs(Number(c.saldoAtual || 0))), 1);

    return (
        <>
            <PageHeader title="Saldo por conta" backTo="/relatorios" backLabel="Relatórios" actions={excelBtn}/>

            <p className="rel-subtitulo">
                Posição atual em cada conta bancária cadastrada, com saldo calculado a partir dos movimentos.
            </p>

            <div className="sc-total">
                <div className="sc-total-label">Saldo total</div>
                <div className={`sc-total-valor ${totalGeral >= 0 ? "sc-val--success" : "sc-val--error"}`}>
                    {fmtValor(totalGeral)}
                </div>
                <div className="sc-total-sub">{contas.length} {contas.length === 1 ? "conta ativa" : "contas ativas"}</div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Posição por conta</Card.Title>
                        <Card.Description>Saldo atual = saldo inicial + movimentos</Card.Description>
                    </div>
                </Card.Header>
                <Card.Body padded={false}>
                    {contas.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState icon={LuWallet} title="Nenhuma conta cadastrada"
                                        description="Cadastre contas bancárias em Fluxo de Caixa para acompanhar seus saldos."
                                        variant="compact"/>
                        </div>
                    ) : (
                        <ul className="sc-lista">
                            {contas.map(conta => {
                                const saldo = Number(conta.saldoAtual || 0);
                                const positivo = saldo >= 0;
                                return (
                                    <li key={conta.id} className="sc-item">
                                        <div className="sc-icon-wrap">
                                            {conta.principal
                                                ? <LuStar size={16} className="sc-icon--principal"/>
                                                : <LuWallet size={16} className="sc-icon"/>}
                                        </div>
                                        <div className="sc-content">
                                            <div className="sc-nome">
                                                {conta.nome}
                                                {conta.principal && <span className="sc-badge-principal">Principal</span>}
                                            </div>
                                            <div className="sc-banco">{conta.banco}</div>
                                            <BarraHorizontal
                                                valor={Math.abs(saldo)}
                                                max={maxSaldo}
                                                variant={positivo ? "success" : "error"}
                                            />
                                        </div>
                                        <div className="sc-meta">
                                            <div className={`sc-saldo ${positivo ? "sc-val--success" : "sc-val--error"}`}>
                                                {fmtValor(saldo)}
                                            </div>
                                            <div className="sc-inicial">Inicial: {fmtValor(conta.saldoInicial)}</div>
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

const CSS = `
.rel-subtitulo{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--text-muted);max-width:720px}
.rel-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px 20px;color:var(--text-dim);font-size:14px}
.rel-spin{animation:rel-spin 1s linear infinite}
@keyframes rel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.sc-total{text-align:center;padding:24px;margin-bottom:20px;border-radius:12px;background:var(--surface);border:1px solid var(--hair)}
.sc-total-label{font-family:var(--ff-mono);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px}
.sc-total-valor{font-size:32px;font-weight:700;letter-spacing:-.025em;font-variant-numeric:tabular-nums;margin-bottom:4px}
.sc-total-sub{font-size:12px;color:var(--text-dim)}
.sc-val--success{color:var(--success)}.sc-val--error{color:var(--error)}

.sc-lista{list-style:none;margin:0;padding:0}
.sc-item{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid var(--hair)}
.sc-item:last-child{border-bottom:none}
.sc-item:hover{background:var(--bg)}
.sc-icon-wrap{flex-shrink:0;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--cyan-soft)}
.sc-icon{color:var(--cyan-dark)}
.sc-icon--principal{color:var(--warning)}
.sc-content{flex:1;min-width:0}
.sc-nome{font-size:14px;font-weight:600;color:var(--navy-deep);margin-bottom:2px;display:flex;align-items:center;gap:8px}
.sc-badge-principal{font-family:var(--ff-mono);font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--warning);background:var(--warning-bg);padding:2px 6px;border-radius:4px}
.sc-banco{font-size:12px;color:var(--text-dim);margin-bottom:6px}
.sc-meta{flex-shrink:0;text-align:right;min-width:120px}
.sc-saldo{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
.sc-inicial{font-size:10px;color:var(--text-dim);margin-top:2px}

@media(max-width:600px){.sc-item{padding:12px 16px;gap:10px}.sc-meta{min-width:auto}.sc-total-valor{font-size:24px}}
`;
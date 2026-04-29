import {
    LuLoader, LuTriangleAlert, LuFileSpreadsheet,
    LuFileText, LuTags,
} from "react-icons/lu";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import {
    fmtValor, BarraHorizontal,
    useRelatorioTitulos, useExportacao,
} from "./_helpers.jsx";

/**
 * PorTipoGastoPage — Distribuição dos títulos a pagar por categoria
 * Sprint A3.6.8.2 · Refatoração
 *
 * Mostra cada tipo de gasto cadastrado e quanto representa do total em aberto.
 * Lista ordenada por maior valor → menor valor.
 *
 * Endpoints:
 *  - GET /api/titulos/relatorio (campo .porTipoGasto)
 *  - GET /api/titulos/exportar/{excel|pdf}
 */
export default function PorTipoGastoPage() {
    const { dados, carregando, erro } = useRelatorioTitulos();
    const { exportar, exportando } = useExportacao("/api/titulos/exportar", "por-tipo-gasto");

    if (carregando) {
        return (
            <>
                <PageHeader title="Por tipo de gasto" backTo="/relatorios" backLabel="Relatórios"/>
                <div className="rel-loading">
                    <LuLoader size={20} className="rel-spin"/>
                    <span>Carregando dados...</span>
                </div>
                <style>{COMPONENT_CSS}</style>
            </>
        );
    }

    if (erro || !dados) {
        return (
            <>
                <PageHeader title="Por tipo de gasto" backTo="/relatorios" backLabel="Relatórios"/>
                <Card>
                    <Card.Body>
                        <EmptyState
                            icon={LuTriangleAlert}
                            title="Não foi possível carregar"
                            description={erro || "Tente novamente em instantes."}
                        />
                    </Card.Body>
                </Card>
                <style>{COMPONENT_CSS}</style>
            </>
        );
    }

    const tipos = dados.porTipoGasto ?? [];
    const total = tipos.reduce((s, i) => s + Number(i.total || 0), 0);
    const max   = tipos.length > 0 ? Math.max(...tipos.map(i => Number(i.total))) : 0;

    return (
        <>
            <PageHeader
                title="Por tipo de gasto"
                backTo="/relatorios"
                backLabel="Relatórios"
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => exportar("excel")}
                            disabled={!!exportando}
                        >
                            <LuFileSpreadsheet size={14}/>
                            {exportando === "excel" ? "Gerando..." : "Excel"}
                        </button>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => exportar("pdf")}
                            disabled={!!exportando}
                        >
                            <LuFileText size={14}/>
                            {exportando === "pdf" ? "Gerando..." : "PDF"}
                        </button>
                    </>
                }
            />

            <p className="rel-subtitulo">
                Distribuição dos títulos em aberto entre as categorias de gasto cadastradas.
                Útil pra entender pra onde está indo o seu dinheiro.
            </p>

            {/* Resumo no topo */}
            <div className="ptg-resumo">
                <div className="ptg-resumo-box">
                    <div className="ptg-resumo-label">Total em aberto</div>
                    <div className="ptg-resumo-valor">{fmtValor(total)}</div>
                </div>
                <div className="ptg-resumo-box">
                    <div className="ptg-resumo-label">Categorias ativas</div>
                    <div className="ptg-resumo-valor">{tipos.length}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Distribuição por categoria</Card.Title>
                        <Card.Description>
                            Ordenado por valor, do maior para o menor
                        </Card.Description>
                    </div>
                </Card.Header>
                <Card.Body>
                    {tipos.length === 0 ? (
                        <EmptyState
                            icon={LuTags}
                            title="Nenhum dado disponível"
                            description="Cadastre tipos de gasto e categorize seus títulos a pagar pra ver a distribuição aqui."
                            action={
                                <Link to="/tipos-gasto" className="ph-btn ph-btn--ghost">
                                    Cadastrar tipos de gasto →
                                </Link>
                            }
                            variant="compact"
                        />
                    ) : (
                        <div className="ptg-lista">
                            {tipos.map(item => {
                                const pct = total > 0 ? (Number(item.total) / total) * 100 : 0;
                                return (
                                    <div key={item.nome} className="ptg-row">
                                        <div className="ptg-row-head">
                                            <span className="ptg-row-nome">{item.nome}</span>
                                            <span className="ptg-row-meta">
                                                <span className="ptg-row-valor">{fmtValor(item.total)}</span>
                                                <span className="ptg-row-pct">{pct.toFixed(1)}%</span>
                                            </span>
                                        </div>
                                        <BarraHorizontal valor={Number(item.total)} max={max} variant="default"/>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .ptg-* + .rel-* (compartilhados)
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.rel-subtitulo {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
    max-width: 720px;
}

.rel-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 20px;
    color: var(--text-dim);
    font-size: 14px;
}

.rel-spin {
    animation: rel-spin 1s linear infinite;
}

@keyframes rel-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

/* ── Resumo no topo ──────────────────────────────────────────────────── */

.ptg-resumo {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.ptg-resumo-box {
    padding: 14px 18px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.ptg-resumo-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 6px;
}

.ptg-resumo-valor {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

/* ── Lista de tipos ──────────────────────────────────────────────────── */

.ptg-lista {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.ptg-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.ptg-row-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
}

.ptg-row-nome {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}

.ptg-row-meta {
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
}

.ptg-row-valor {
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.005em;
}

.ptg-row-pct {
    font-family: var(--ff-mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    min-width: 45px;
    text-align: right;
}
`;
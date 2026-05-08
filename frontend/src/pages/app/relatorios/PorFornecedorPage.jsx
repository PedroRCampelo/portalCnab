import {
    LuLoader, LuTriangleAlert, LuFileSpreadsheet,
    LuFileText, LuBuilding2,
} from "react-icons/lu";
import PageHeader from "../../../components/shell/PageHeader.jsx";
import Card       from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import {
    fmtValor, BarraHorizontal,
    useRelatorioTitulos, useExportacao,
} from "./_helpers.jsx";

/**
 * PorFornecedorPage — Top fornecedores por valor em aberto
 * Sprint A3.6.8.2 · Refatoração
 *
 * Lista os fornecedores com saldo em aberto, ordenados do maior pro menor.
 * Mostra ranking, nome, quantidade de títulos e valor total.
 *
 * Endpoints:
 *  - GET /api/titulos/relatorio (campo .fornecedores)
 *  - GET /api/titulos/exportar/{excel|pdf}
 */
export default function PorFornecedorPage() {
    const { dados, carregando, erro } = useRelatorioTitulos();
    const { exportar, exportando } = useExportacao("/api/titulos/exportar", "por-fornecedor");

    if (carregando) {
        return (
            <>
                <PageHeader title="Por fornecedor" backTo="/relatorios" backLabel="Relatórios"/>
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
                <PageHeader title="Por fornecedor" backTo="/relatorios" backLabel="Relatórios"/>
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

    const fornecedores = dados.fornecedores ?? [];
    const total = fornecedores.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalTitulos = fornecedores.reduce((s, i) => s + Number(i.quantidade || 0), 0);
    const max = fornecedores.length > 0 ? Math.max(...fornecedores.map(i => Number(i.total))) : 0;

    return (
        <>
            <PageHeader
                title="Por fornecedor"
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
                Ranking dos seus principais fornecedores ordenados por valor em aberto.
                Útil pra negociar prazos ou consolidar pagamentos.
            </p>

            {/* Resumo no topo */}
            <div className="pf-resumo">
                <div className="pf-resumo-box">
                    <div className="pf-resumo-label">Total em aberto</div>
                    <div className="pf-resumo-valor">{fmtValor(total)}</div>
                </div>
                <div className="pf-resumo-box">
                    <div className="pf-resumo-label">Fornecedores</div>
                    <div className="pf-resumo-valor">{fornecedores.length}</div>
                </div>
                <div className="pf-resumo-box">
                    <div className="pf-resumo-label">Total de títulos</div>
                    <div className="pf-resumo-valor">{totalTitulos}</div>
                </div>
            </div>

            <Card>
                <Card.Header>
                    <div>
                        <Card.Title>Top fornecedores por valor em aberto</Card.Title>
                        <Card.Description>
                            Os {fornecedores.length} maiores fornecedores com saldo em aberto
                        </Card.Description>
                    </div>
                </Card.Header>
                <Card.Body padded={false}>
                    {fornecedores.length === 0 ? (
                        <div style={{ padding: 24 }}>
                            <EmptyState
                                icon={LuBuilding2}
                                title="Nenhum dado disponível"
                                description="Cadastre títulos a pagar e seus fornecedores aparecerão aqui ranqueados."
                                variant="compact"
                            />
                        </div>
                    ) : (
                        <ul className="pf-lista">
                            {fornecedores.map((item, idx) => (
                                <li key={item.nome + idx} className="pf-item">
                                    <div className="pf-rank">{idx + 1}</div>
                                    <div className="pf-content">
                                        <div className="pf-nome">{item.nome}</div>
                                        <BarraHorizontal valor={Number(item.total)} max={max} variant="warning"/>
                                    </div>
                                    <div className="pf-meta">
                                        <div className="pf-valor">{fmtValor(item.total)}</div>
                                        <div className="pf-qtd">
                                            {item.quantidade} {item.quantidade === 1 ? "título" : "títulos"}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card.Body>
            </Card>

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .pf-* + .rel-* (compartilhados)
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

.pf-resumo {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.pf-resumo-box {
    padding: 14px 18px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.pf-resumo-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 6px;
}

.pf-resumo-valor {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

/* ── Lista de fornecedores ───────────────────────────────────────────── */

.pf-lista {
    list-style: none;
    margin: 0;
    padding: 0;
}

.pf-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--hair);
}

.pf-item:last-child {
    border-bottom: none;
}

.pf-item:hover {
    background: var(--bg);
}

.pf-rank {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--ff-mono);
    font-size: 12px;
    font-weight: 700;
    background: var(--warning-bg);
    color: var(--warning);
    border: 1px solid rgba(230, 162, 60, 0.25);
}

.pf-content {
    flex: 1;
    min-width: 0;
}

.pf-nome {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pf-meta {
    flex-shrink: 0;
    text-align: right;
    min-width: 110px;
}

.pf-valor {
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.005em;
}

.pf-qtd {
    font-family: var(--ff-mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    margin-top: 2px;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .pf-resumo {
        grid-template-columns: 1fr 1fr;
    }
    .pf-item {
        padding: 12px 16px;
        gap: 10px;
    }
    .pf-meta {
        min-width: auto;
    }
    .pf-valor {
        font-size: 12px;
    }
}
`;
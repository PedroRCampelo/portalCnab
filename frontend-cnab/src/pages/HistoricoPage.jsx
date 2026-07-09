import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    LuSearch, LuFolderOpen, LuFileSpreadsheet, LuFileCode,
    LuRotateCcw, LuPlus,
} from "react-icons/lu";
import api from "../services/api.js";
import PageHeader from "../components/shell/PageHeader.jsx";
import DataTable  from "../components/ui/DataTable.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

/**
 * HistoricoPage — Histórico de remessas CNAB
 * Sprint A3.6.9 · Refatoração
 *
 * Estrutura:
 *  - PageHeader com título + ação "Gerar remessa"
 *  - 2 KPIs (Total de remessas + Valor total processado)
 *  - Filtros pills (tipo: Todos/Excel/Texto)
 *  - Busca por nome de arquivo ou banco
 *  - DataTable com 7 colunas, sort funcional
 *  - EmptyState com CTA pra /excel
 *
 * Endpoints:
 *  - GET /api/usuario/historico
 */
export default function HistoricoPage() {
    const navigate = useNavigate();

    const [remessas,    setRemessas]    = useState([]);
    const [carregando,  setCarregando]  = useState(true);
    const [erro,        setErro]        = useState("");
    const [busca,       setBusca]       = useState("");
    const [filtroTipo,  setFiltroTipo]  = useState("");

    // ── Carregamento ────────────────────────────────────────────────────────

    useEffect(() => {
        api.get("/api/usuario/historico")
            .then(({ data }) => setRemessas(data ?? []))
            .catch(err => setErro(err.response?.data?.mensagem ?? "Erro ao carregar histórico"))
            .finally(() => setCarregando(false));
    }, []);

    // ── Filtros aplicados (client-side) ─────────────────────────────────────

    const remessasFiltradas = useMemo(() => {
        let lista = remessas;

        if (filtroTipo) {
            lista = lista.filter(r => r.tipoSaida === filtroTipo);
        }

        if (busca.trim()) {
            const termo = busca.trim().toLowerCase();
            lista = lista.filter(r =>
                (r.nomeArquivo ?? "").toLowerCase().includes(termo) ||
                (r.banco       ?? "").toLowerCase().includes(termo)
            );
        }

        return lista;
    }, [remessas, busca, filtroTipo]);

    // ── KPIs (calculados no total, não no filtro) ───────────────────────────

    const kpis = useMemo(() => ({
        total: remessas.length,
        valor: remessas.reduce((s, r) => s + Number(r.valorTotal || 0), 0),
        excel: remessas.filter(r => r.tipoSaida === "EXCEL").length,
        texto: remessas.filter(r => r.tipoSaida === "TEXTO").length,
    }), [remessas]);

    // ── Definição das colunas da DataTable ──────────────────────────────────

    const colunas = useMemo(() => [
        {
            key: "nomeArquivo",
            label: "Arquivo",
            sortable: true,
            render: r => (
                <div className="hist-arquivo" title={r.nomeArquivo}>
                    <span className="hist-arquivo-icon">
                        {r.tipoSaida === "EXCEL"
                            ? <LuFileSpreadsheet size={14}/>
                            : <LuFileCode size={14}/>}
                    </span>
                    <span className="hist-arquivo-nome">{r.nomeArquivo ?? "—"}</span>
                </div>
            ),
        },
        {
            key: "banco",
            label: "Banco",
            sortable: true,
            render: r => (
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    {r.banco ?? "—"}
                </span>
            ),
        },
        {
            key: "versao",
            label: "Layout",
            render: r => (
                <span style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 11,
                    color: "var(--text-dim)",
                    letterSpacing: "0.04em",
                }}>
                    CNAB {r.versao} · {r.modo}
                </span>
            ),
        },
        {
            key: "tipoSaida",
            label: "Tipo",
            align: "center",
            render: r => (
                <span className={`ui-badge ui-badge--${r.tipoSaida === "EXCEL" ? "success" : "neutral"}`}>
                    {r.tipoSaida}
                </span>
            ),
        },
        {
            key: "qtdRegistros",
            label: "Registros",
            sortable: true,
            align: "right",
            render: r => (
                <span className="ui-table-num" style={{ fontSize: 13 }}>
                    {r.qtdRegistros ?? "—"}
                </span>
            ),
        },
        {
            key: "valorTotal",
            label: "Valor total",
            sortable: true,
            align: "right",
            render: r => (
                <span className="ui-table-num" style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--navy-deep)",
                }}>
                    {fmtValor(r.valorTotal)}
                </span>
            ),
        },
        {
            key: "geradoEm",
            label: "Gerado em",
            sortable: true,
            render: r => (
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {fmtData(r.geradoEm)}
                </span>
            ),
        },
    ], []);

    // ── Render ──────────────────────────────────────────────────────────────

    const temFiltrosAtivos = filtroTipo || busca.trim();

    return (
        <>
            <PageHeader
                title="Histórico CNAB"
                actions={
                    <button
                        className="ph-btn ph-btn--primary"
                        onClick={() => navigate("/excel")}
                    >
                        <LuPlus size={14}/>
                        Gerar remessa
                    </button>
                }
            />

            <p className="hist-subtitulo">
                Arquivos CNAB gerados pela sua conta. Use a busca pra encontrar
                remessas específicas.
            </p>

            {/* Erro */}
            {erro && <div className="hist-erro">{erro}</div>}

            {/* KPIs */}
            {!carregando && remessas.length > 0 && (
                <div className="hist-kpis">
                    <div className="hist-kpi">
                        <div className="hist-kpi-label">Total de remessas</div>
                        <div className="hist-kpi-valor">{kpis.total}</div>
                        <div className="hist-kpi-sub">
                            {kpis.excel} Excel · {kpis.texto} Texto
                        </div>
                    </div>
                    <div className="hist-kpi">
                        <div className="hist-kpi-label">Valor total processado</div>
                        <div className="hist-kpi-valor">{fmtValor(kpis.valor)}</div>
                    </div>
                </div>
            )}

            {/* Filtros + busca */}
            {!carregando && remessas.length > 0 && (
                <div className="hist-toolbar">
                    <div className="hist-pills">
                        {[
                            { value: "",      label: "Todos" },
                            { value: "EXCEL", label: "Excel" },
                            { value: "TEXTO", label: "Texto" },
                        ].map(f => (
                            <button
                                key={f.value || "todos"}
                                className={`hist-pill ${filtroTipo === f.value ? "active" : ""}`}
                                onClick={() => setFiltroTipo(f.value)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="hist-busca">
                        <LuSearch size={14} className="hist-busca-icon"/>
                        <input
                            type="text"
                            className="hist-busca-input"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            placeholder="Buscar por arquivo ou banco..."
                        />
                    </div>
                </div>
            )}

            {/* Tabela */}
            <DataTable
                columns={colunas}
                data={remessasFiltradas}
                keyField="id"
                loading={carregando}
                empty={
                    <EmptyState
                        icon={LuFolderOpen}
                        title={
                            temFiltrosAtivos
                                ? "Nenhuma remessa encontrada"
                                : "Nenhuma remessa gerada ainda"
                        }
                        description={
                            temFiltrosAtivos
                                ? "Tente ajustar os filtros ou a busca."
                                : "Gere arquivos CNAB a partir de Excel ou cadastre títulos pra começar a usar."
                        }
                        action={
                            temFiltrosAtivos ? (
                                <button
                                    className="ph-btn ph-btn--ghost"
                                    onClick={() => { setFiltroTipo(""); setBusca(""); }}
                                >
                                    <LuRotateCcw size={14}/>
                                    Limpar filtros
                                </button>
                            ) : (
                                <Link to="/excel" className="ph-btn ph-btn--primary">
                                    <LuPlus size={14}/>
                                    Gerar minha primeira remessa
                                </Link>
                            )
                        }
                    />
                }
            />

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Helpers locais
   ═════════════════════════════════════════════════════════════════════════════ */

function fmtData(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function fmtValor(valor) {
    if (valor == null || valor === 0) return "—";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(valor);
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .hist-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.hist-subtitulo {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
    max-width: 720px;
}

.hist-erro {
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
}

/* ── KPIs ────────────────────────────────────────────────────────────── */

.hist-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.hist-kpi {
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.hist-kpi-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 8px;
}

.hist-kpi-valor {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
    margin-bottom: 4px;
}

.hist-kpi-sub {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* ── Toolbar (pills + busca) ─────────────────────────────────────────── */

.hist-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.hist-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.hist-pill {
    padding: 6px 14px;
    border-radius: 100px;
    font-family: var(--ff-sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
    transition: all 0.15s;
}

.hist-pill:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
}

.hist-pill.active {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.hist-busca {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 380px;
    margin-left: auto;
}

.hist-busca-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    pointer-events: none;
}

.hist-busca-input {
    width: 100%;
    padding: 8px 12px 8px 34px;
    border: 1.5px solid var(--hair);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink-2);
    font-family: var(--ff-sans);
    font-size: 13px;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
}

.hist-busca-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

/* ── Coluna "Arquivo" ────────────────────────────────────────────────── */

.hist-arquivo {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 280px;
}

.hist-arquivo-icon {
    flex-shrink: 0;
    color: var(--cyan-dark);
    display: inline-flex;
    line-height: 0;
}

.hist-arquivo-nome {
    flex: 1;
    min-width: 0;
    font-family: var(--ff-mono);
    font-size: 12px;
    color: var(--ink-2);
    letter-spacing: 0.005em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 700px) {
    .hist-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .hist-busca {
        max-width: 100%;
        margin-left: 0;
    }

    .hist-kpis {
        grid-template-columns: 1fr;
    }
}
`;
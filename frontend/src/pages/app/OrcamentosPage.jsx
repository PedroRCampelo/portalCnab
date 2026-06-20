import { useState, useCallback, useMemo, useEffect } from "react";
import {
    LuPlus, LuFileText, LuSearch, LuPencil, LuCircleCheck,
    LuChevronLeft, LuChevronRight, LuRotateCcw, LuX,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader        from "../../components/shell/PageHeader.jsx";
import DataTable         from "../../components/ui/DataTable.jsx";
import EmptyState        from "../../components/ui/EmptyState.jsx";
import OrcamentoModal    from "./comercial/OrcamentoModal.jsx";
import OrcamentoDetalhes from "./comercial/OrcamentoDetalhes.jsx";
import "./comercial/Comercial.css";

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const STATUS_INFO = {
    RASCUNHO:  { label: "Rascunho",  variant: "neutral"  },
    ENVIADO:   { label: "Enviado",   variant: "default"  },
    APROVADO:  { label: "Aprovado",  variant: "success"  },
    RECUSADO:  { label: "Recusado",  variant: "error"    },
    EXPIRADO:  { label: "Expirado",  variant: "warning"  },
    EM_PEDIDO: { label: "Em Pedido", variant: "purple"   },
};

const FILTROS_STATUS = [
    { value: "",          label: "Todos"     },
    { value: "RASCUNHO",  label: "Rascunho"  },
    { value: "ENVIADO",   label: "Enviado"   },
    { value: "APROVADO",  label: "Aprovado"  },
    { value: "RECUSADO",  label: "Recusado"  },
    { value: "EM_PEDIDO", label: "Em Pedido" },
];

function fmtData(d) {
    if (!d) return "—";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
}

function fmtValor(v) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));
}

function iniciais(nome) {
    if (!nome) return "?";
    return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function diasAteVencer(validade) {
    if (!validade) return null;
    const alvo  = new Date(validade + "T00:00:00");
    const hoje0 = new Date(); hoje0.setHours(0, 0, 0, 0);
    return Math.round((alvo - hoje0) / (1000 * 60 * 60 * 24));
}

/* ─── Componente principal ───────────────────────────────────────────────── */

export default function OrcamentosPage() {
    const [orcamentos, setOrcamentos]       = useState([]);
    const [carregando, setCarregando]       = useState(false);
    const [filtroStatus, setFiltroStatus]   = useState("");
    const [busca, setBusca]                 = useState("");
    const [dataInicio, setDataInicio]       = useState("");
    const [dataFim, setDataFim]             = useState("");
    const [pagina, setPagina]               = useState(0);
    const [totalPaginas, setTotalPaginas]   = useState(0);

    const [modalAberto, setModalAberto]     = useState(false);
    const [editando, setEditando]           = useState(null);
    const [detalhes, setDetalhes]           = useState(null);

    /* ── Carregamento ───────────────────────────────────────────────────── */

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const params = new URLSearchParams({ pagina, tamanho: 20 });
            if (filtroStatus) params.set("status", filtroStatus);
            const { data } = await api.get(`/api/orcamentos?${params}`);
            setOrcamentos(data.content ?? []);
            setTotalPaginas(data.totalPages ?? 0);
        } catch {
            setOrcamentos([]);
        } finally {
            setCarregando(false);
        }
    }, [pagina, filtroStatus]);

    useEffect(() => { carregar(); }, [carregar]);

    /* ── Busca / filtro client-side ─────────────────────────────────────── */

    const filtrados = useMemo(() => {
        let lista = orcamentos;
        if (busca.trim()) {
            const q = busca.toLowerCase();
            lista = lista.filter(o =>
                o.numero?.toLowerCase().includes(q) ||
                o.descricao?.toLowerCase().includes(q) ||
                o.cliente?.nome?.toLowerCase().includes(q)
            );
        }
        if (dataInicio) {
            lista = lista.filter(o => o.validade >= dataInicio);
        }
        if (dataFim) {
            lista = lista.filter(o => o.validade <= dataFim);
        }
        return lista;
    }, [orcamentos, busca, dataInicio, dataFim]);

    const temFiltros = filtroStatus || busca.trim() || dataInicio || dataFim;

    function limparFiltros() {
        setFiltroStatus(""); setBusca(""); setDataInicio(""); setDataFim(""); setPagina(0);
    }

    /* ── Ações ──────────────────────────────────────────────────────────── */

    function abrirNovo()     { setEditando(null); setModalAberto(true); }
    function abrirEditar(o)  { setEditando(o); setModalAberto(true); }
    function fecharModal()   { setModalAberto(false); setEditando(null); }

    async function salvar(dados) {
        if (editando) {
            await api.put(`/api/orcamentos/${editando.id}`, dados);
        } else {
            await api.post("/api/orcamentos", dados);
        }
        fecharModal();
        setPagina(0);
        carregar();
    }

    async function mudarStatus(id, novoStatus) {
        await api.patch(`/api/orcamentos/${id}/status?status=${novoStatus}`);
        carregar();
        if (detalhes?.id === id) setDetalhes(null);
    }

    /* ── Colunas ────────────────────────────────────────────────────────── */

    const colunas = useMemo(() => [
        {
            key: "numero",
            label: "Número",
            sortable: true,
            render: o => (
                <span style={{
                    fontFamily: "var(--ff-mono)", fontSize: 13, fontWeight: 600,
                    color: "var(--navy-deep)", letterSpacing: "0.02em",
                }}>
                    {o.numero}
                </span>
            ),
        },
        {
            key: "cliente",
            label: "Cliente",
            sortable: true,
            render: o => (
                <div className="ui-cell-avatar">
                    <div className="ui-cell-avatar-img">{iniciais(o.cliente?.nome)}</div>
                    <div className="ui-cell-avatar-text">
                        <div className="ui-cell-avatar-name">{o.cliente?.nome || "—"}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "descricao",
            label: "Descrição",
            sortable: true,
            render: o => (
                <span style={{ color: "var(--ink-2)", fontSize: 13 }}>{o.descricao || "—"}</span>
            ),
        },
        {
            key: "validade",
            label: "Validade",
            sortable: true,
            render: o => {
                const dias = diasAteVencer(o.validade);
                const vencido = dias !== null && dias < 0 && o.status !== "APROVADO" && o.status !== "EM_PEDIDO";
                return (
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                        <span className="ui-table-num" style={{ fontSize: 13 }}>{fmtData(o.validade)}</span>
                        {dias !== null && !["APROVADO","EM_PEDIDO","RECUSADO"].includes(o.status) && (
                            <span style={{
                                fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 600,
                                letterSpacing: "0.04em",
                                color: vencido ? "var(--error)" : dias <= 3 ? "var(--warning)" : "var(--text-dim)",
                            }}>
                                {vencido ? `${Math.abs(dias)}d vencido` : dias === 0 ? "vence hoje" : `em ${dias}d`}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "valorTotal",
            label: "Total",
            sortable: true,
            align: "right",
            render: o => (
                <span className="ui-table-num" style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-deep)" }}>
                    {fmtValor(o.valorTotal)}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            align: "center",
            render: o => {
                const info = STATUS_INFO[o.status] ?? { label: o.status, variant: "neutral" };
                return (
                    <span className={`ui-badge ui-badge--${info.variant}`}>{info.label}</span>
                );
            },
        },
        {
            key: "_actions",
            label: "",
            align: "right",
            render: o => (
                <AcoesInline
                    orc={o}
                    onEditar={() => abrirEditar(o)}
                    onAprovar={() => mudarStatus(o.id, "APROVADO")}
                    onEnviar={() => mudarStatus(o.id, "ENVIADO")}
                />
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    /* ── Render ─────────────────────────────────────────────────────────── */

    return (
        <>
            <style>{COMPONENT_CSS}</style>

            <PageHeader
                title="Orçamentos"
                actions={
                    <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                        <LuPlus size={14}/> Novo orçamento
                    </button>
                }
            />

            {/* Toolbar */}
            <div className="orc-toolbar">
                <div className="orc-pills">
                    {FILTROS_STATUS.map(f => (
                        <button
                            key={f.value || "todos"}
                            className={`orc-pill ${filtroStatus === f.value ? "active" : ""}`}
                            onClick={() => { setFiltroStatus(f.value); setPagina(0); }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="orc-filtros-extras">
                    <div className="orc-date-range">
                        <input
                            type="date"
                            className="orc-date-input"
                            title="Validade de"
                            value={dataInicio}
                            onChange={e => setDataInicio(e.target.value)}
                        />
                        <span className="orc-date-sep">—</span>
                        <input
                            type="date"
                            className="orc-date-input"
                            title="Validade até"
                            value={dataFim}
                            onChange={e => setDataFim(e.target.value)}
                        />
                    </div>

                    <div className="orc-busca">
                        <LuSearch size={14} className="orc-busca-icon"/>
                        <input
                            type="text"
                            className="orc-busca-input"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            placeholder="Buscar por número, cliente ou descrição..."
                        />
                        {busca && (
                            <button className="orc-busca-clear" onClick={() => setBusca("")}>
                                <LuX size={12}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <DataTable
                columns={colunas}
                data={filtrados}
                keyField="id"
                loading={carregando}
                onRowClick={o => setDetalhes(o)}
                empty={
                    <EmptyState
                        icon={LuFileText}
                        title={temFiltros ? "Nenhum orçamento encontrado" : "Nenhum orçamento cadastrado"}
                        description={
                            temFiltros
                                ? "Tente ajustar os filtros ou a busca."
                                : "Crie o primeiro orçamento para começar."
                        }
                        action={
                            temFiltros ? (
                                <button className="ph-btn ph-btn--ghost" onClick={limparFiltros}>
                                    <LuRotateCcw size={14}/> Limpar filtros
                                </button>
                            ) : (
                                <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                                    <LuPlus size={14}/> Novo orçamento
                                </button>
                            )
                        }
                    />
                }
                density="default"
            />

            {/* Paginação */}
            {totalPaginas > 1 && (
                <div className="orc-paginacao">
                    <button
                        className="ph-btn ph-btn--icon"
                        onClick={() => setPagina(p => Math.max(0, p - 1))}
                        disabled={pagina === 0}
                    >
                        <LuChevronLeft size={14}/>
                    </button>
                    <span className="orc-paginacao-texto">
                        Página <strong>{pagina + 1}</strong> de <strong>{totalPaginas}</strong>
                    </span>
                    <button
                        className="ph-btn ph-btn--icon"
                        onClick={() => setPagina(p => p + 1)}
                        disabled={pagina >= totalPaginas - 1}
                    >
                        <LuChevronRight size={14}/>
                    </button>
                </div>
            )}

            {/* Modais */}
            {modalAberto && (
                <OrcamentoModal
                    inicial={editando}
                    onSalvar={salvar}
                    onFechar={fecharModal}
                />
            )}

            {detalhes && (
                <OrcamentoDetalhes
                    orcamento={detalhes}
                    onFechar={() => setDetalhes(null)}
                    onEditar={() => { setDetalhes(null); abrirEditar(detalhes); }}
                    onMudarStatus={novoStatus => { mudarStatus(detalhes.id, novoStatus); setDetalhes(null); }}
                />
            )}
        </>
    );
}

/* ─── Ações inline ───────────────────────────────────────────────────────── */

function AcoesInline({ orc, onEditar, onAprovar, onEnviar }) {
    return (
        <div className="orc-actions" onClick={e => e.stopPropagation()}>
            {orc.editavel && (
                <button className="orc-action" title="Editar" onClick={onEditar}>
                    <LuPencil size={14}/>
                </button>
            )}
            {orc.status === "RASCUNHO" && (
                <button className="orc-action orc-action--enviar" title="Marcar como enviado" onClick={onEnviar}>
                    <LuCircleCheck size={14}/>
                </button>
            )}
            {orc.status === "ENVIADO" && (
                <button className="orc-action orc-action--aprovar" title="Aprovar" onClick={onAprovar}>
                    <LuCircleCheck size={14}/>
                </button>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .orc-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `

/* ─── Badge purple (EM_PEDIDO) ──────────────────────────────────────────── */

.ui-badge--purple {
    background: #f5f3ff;
    color: #6d28d9;
}

/* ─── Toolbar ────────────────────────────────────────────────────────────── */

.orc-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.orc-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.orc-pill {
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

.orc-pill:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
}

.orc-pill.active {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

/* ─── Filtros extras (datas + busca) ────────────────────────────────────── */

.orc-filtros-extras {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    flex-wrap: wrap;
}

.orc-date-range {
    display: flex;
    align-items: center;
    gap: 4px;
}

.orc-date-input {
    padding: 7px 10px;
    border: 1.5px solid var(--hair);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink-2);
    font-family: var(--ff-sans);
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;
    width: 130px;
}

.orc-date-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.orc-date-sep {
    font-size: 12px;
    color: var(--text-dim);
    padding: 0 2px;
}

/* ─── Busca ──────────────────────────────────────────────────────────────── */

.orc-busca {
    position: relative;
    min-width: 220px;
    max-width: 320px;
}

.orc-busca-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    pointer-events: none;
}

.orc-busca-input {
    width: 100%;
    padding: 8px 32px 8px 34px;
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

.orc-busca-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.orc-busca-clear {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text-dim);
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 4px;
}

.orc-busca-clear:hover {
    color: var(--navy-deep);
    background: var(--bg);
}

/* ─── Ações inline ───────────────────────────────────────────────────────── */

.orc-actions {
    display: inline-flex;
    gap: 4px;
    align-items: center;
}

.orc-action {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.12s;
    flex-shrink: 0;
}

.orc-action:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.orc-action--aprovar:hover {
    border-color: var(--success);
    background: var(--success-bg);
    color: var(--success);
}

.orc-action--enviar:hover {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

/* ─── Paginação ──────────────────────────────────────────────────────────── */

.orc-paginacao {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 16px 0;
}

.orc-paginacao-texto {
    padding: 0 16px;
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--ff-sans);
    letter-spacing: -0.005em;
}

.orc-paginacao-texto strong {
    color: var(--navy-deep);
    font-weight: 600;
}

/* ─── Responsivo ─────────────────────────────────────────────────────────── */

@media (max-width: 768px) {
    .orc-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .orc-filtros-extras {
        margin-left: 0;
    }

    .orc-busca {
        max-width: 100%;
        min-width: 0;
    }

    .orc-date-range {
        flex: 1;
    }

    .orc-date-input {
        width: 100%;
        flex: 1;
    }
}
`;

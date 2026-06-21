import { useState, useCallback, useMemo, useEffect } from "react";
import {
    LuPlus, LuFileText, LuSearch, LuPencil, LuCircleCheck, LuCircleX,
    LuChevronLeft, LuChevronRight, LuRotateCcw, LuX, LuCopy,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader          from "../../components/shell/PageHeader.jsx";
import DataTable           from "../../components/ui/DataTable.jsx";
import EmptyState          from "../../components/ui/EmptyState.jsx";
import Modal               from "../../components/ui/Modal.jsx";
import PedidoVendaModal    from "./comercial/PedidoVendaModal.jsx";
import PedidoVendaDetalhes from "./comercial/PedidoVendaDetalhes.jsx";
import "./comercial/Comercial.css";

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const STATUS_INFO = {
    ABERTO:    { label: "Aberto",    variant: "default"  },
    EM_CARGA:  { label: "Em carga",  variant: "info"     },
    EFETIVADO: { label: "Efetivado", variant: "success"  },
    CANCELADO: { label: "Cancelado", variant: "error"    },
};

const FILTROS_STATUS = [
    { value: "",          label: "Todos"     },
    { value: "ABERTO",    label: "Aberto"    },
    { value: "EM_CARGA",  label: "Em carga"  },
    { value: "EFETIVADO", label: "Efetivado" },
    { value: "CANCELADO", label: "Cancelado" },
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

/* ─── Componente principal ───────────────────────────────────────────────── */

export default function PedidosVendaPage() {
    const [pedidos, setPedidos]             = useState([]);
    const [carregando, setCarregando]       = useState(false);
    const [filtroStatus, setFiltroStatus]   = useState("");
    const [busca, setBusca]                 = useState("");
    const [pagina, setPagina]               = useState(0);
    const [totalPaginas, setTotalPaginas]   = useState(0);
    const [erro, setErro]                   = useState("");

    const [modalAberto, setModalAberto]         = useState(false);
    const [editando, setEditando]               = useState(null);
    const [detalhes, setDetalhes]               = useState(null);
    const [confirmEfetivar, setConfirmEfetivar] = useState(null);
    const [confirmCancelar, setConfirmCancelar] = useState(null);
    const [efetivando, setEfetivando]           = useState(false);
    const [cancelando, setCancelando]           = useState(false);

    /* ── Carregamento ───────────────────────────────────────────────────── */

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const params = new URLSearchParams({ pagina, tamanho: 20 });
            if (filtroStatus) params.set("status", filtroStatus);
            const { data } = await api.get(`/api/pedidos-venda?${params}`);
            setPedidos(data.content ?? []);
            setTotalPaginas(data.totalPages ?? 0);
        } catch {
            setPedidos([]);
        } finally {
            setCarregando(false);
        }
    }, [pagina, filtroStatus]);

    useEffect(() => { carregar(); }, [carregar]);

    /* ── Busca client-side ──────────────────────────────────────────────── */

    const filtrados = useMemo(() => {
        if (!busca.trim()) return pedidos;
        const q = busca.toLowerCase();
        return pedidos.filter(p =>
            p.numero?.toLowerCase().includes(q) ||
            p.descricao?.toLowerCase().includes(q) ||
            p.cliente?.nome?.toLowerCase().includes(q)
        );
    }, [pedidos, busca]);

    const temFiltros = filtroStatus || busca.trim();

    function limparFiltros() {
        setFiltroStatus(""); setBusca(""); setPagina(0);
    }

    /* ── Ações ──────────────────────────────────────────────────────────── */

    function abrirNovo()    { setEditando(null); setModalAberto(true); }
    function abrirEditar(p) { setEditando(p); setModalAberto(true); }
    function fecharModal()  { setModalAberto(false); setEditando(null); }

    async function salvarPedido(dados) {
        if (editando) {
            await api.put(`/api/pedidos-venda/${editando.id}`, dados);
        } else {
            await api.post("/api/pedidos-venda", dados);
        }
        fecharModal();
        setPagina(0);
        carregar();
    }

    async function efetivar(id) {
        setErro("");
        setEfetivando(true);
        try {
            await api.post(`/api/pedidos-venda/${id}/efetivar`);
            setConfirmEfetivar(null);
            carregar();
        } catch (err) {
            const msg = err?.response?.data?.erro ?? err?.response?.data?.message ?? "Erro ao efetivar pedido.";
            setErro(msg);
            setConfirmEfetivar(null);
        } finally {
            setEfetivando(false);
        }
    }

    async function cancelar(id) {
        setErro("");
        setCancelando(true);
        try {
            await api.post(`/api/pedidos-venda/${id}/cancelar`);
            setConfirmCancelar(null);
            carregar();
        } catch (err) {
            const msg = err?.response?.data?.erro ?? err?.response?.data?.message ?? "Erro ao cancelar pedido.";
            setErro(msg);
            setConfirmCancelar(null);
        } finally {
            setCancelando(false);
        }
    }

    async function copiarPedido(id) {
        setErro("");
        try {
            await api.post(`/api/pedidos-venda/${id}/copiar`);
            carregar();
        } catch (err) {
            const msg = err?.response?.data?.erro ?? err?.response?.data?.message ?? "Erro ao copiar pedido.";
            setErro(msg);
        }
    }

    /* ── Colunas ────────────────────────────────────────────────────────── */

    const colunas = useMemo(() => [
        {
            key: "numero",
            label: "Número",
            sortable: true,
            render: p => (
                <span style={{
                    fontFamily: "var(--ff-mono)", fontSize: 13, fontWeight: 600,
                    color: "var(--navy-deep)", letterSpacing: "0.02em",
                }}>
                    {p.numero}
                </span>
            ),
        },
        {
            key: "cliente",
            label: "Cliente",
            sortable: true,
            render: p => (
                <div className="ui-cell-avatar">
                    <div className="ui-cell-avatar-img">{iniciais(p.cliente?.nome)}</div>
                    <div className="ui-cell-avatar-text">
                        <div className="ui-cell-avatar-name">{p.cliente?.nome || "—"}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "descricao",
            label: "Descrição",
            sortable: true,
            render: p => (
                <span style={{ color: "var(--ink-2)", fontSize: 13 }}>{p.descricao || "—"}</span>
            ),
        },
        {
            key: "criadoEm",
            label: "Emissão",
            sortable: true,
            render: p => (
                <span className="ui-table-num" style={{ fontSize: 13 }}>
                    {p.criadoEm ? fmtData(p.criadoEm.slice(0, 10)) : "—"}
                </span>
            ),
        },
        {
            key: "primeiroVencimento",
            label: "Vencimento",
            sortable: true,
            render: p => (
                <span className="ui-table-num" style={{ fontSize: 13 }}>{fmtData(p.primeiroVencimento)}</span>
            ),
        },
        {
            key: "parcelas",
            label: "Parcelas",
            render: p => (
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    {p.numParcelas === 1
                        ? "À vista"
                        : `${p.numParcelas}x / ${p.intervaloDias}d`}
                </span>
            ),
        },
        {
            key: "valorTotal",
            label: "Total",
            sortable: true,
            align: "right",
            render: p => (
                <span className="ui-table-num" style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-deep)" }}>
                    {fmtValor(p.valorTotal)}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            align: "center",
            render: p => {
                const info = STATUS_INFO[p.status] ?? { label: p.status, variant: "neutral" };
                return <span className={`ui-badge ui-badge--${info.variant}`}>{info.label}</span>;
            },
        },
        {
            key: "_actions",
            label: "",
            align: "right",
            render: p => (
                <AcoesInline
                    pedido={p}
                    onEditar={() => abrirEditar(p)}
                    onEfetivar={() => setConfirmEfetivar(p)}
                    onCancelar={() => setConfirmCancelar(p)}
                    onCopiar={() => copiarPedido(p.id)}
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
                title="Pedidos de Venda"
                actions={
                    <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                        <LuPlus size={14}/> Novo pedido
                    </button>
                }
            />

            {erro && (
                <div className="pv-erro">
                    {erro}
                    <button className="pv-erro-fechar" onClick={() => setErro("")}><LuX size={12}/></button>
                </div>
            )}

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
                onRowClick={p => setDetalhes(p)}
                empty={
                    <EmptyState
                        icon={LuFileText}
                        title={temFiltros ? "Nenhum pedido encontrado" : "Nenhum pedido de venda cadastrado"}
                        description={
                            temFiltros
                                ? "Tente ajustar os filtros ou a busca."
                                : "Crie o primeiro pedido de venda para começar."
                        }
                        action={
                            temFiltros ? (
                                <button className="ph-btn ph-btn--ghost" onClick={limparFiltros}>
                                    <LuRotateCcw size={14}/> Limpar filtros
                                </button>
                            ) : (
                                <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                                    <LuPlus size={14}/> Novo pedido
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
                <PedidoVendaModal
                    inicial={editando}
                    onSalvar={salvarPedido}
                    onFechar={fecharModal}
                />
            )}

            {detalhes && (
                <PedidoVendaDetalhes
                    pedido={detalhes}
                    onFechar={() => setDetalhes(null)}
                    onEditar={() => { setDetalhes(null); abrirEditar(detalhes); }}
                    onEfetivar={() => { setConfirmEfetivar(detalhes); setDetalhes(null); }}
                    onCancelar={() => { setConfirmCancelar(detalhes); setDetalhes(null); }}
                    onCopiar={() => { copiarPedido(detalhes.id); setDetalhes(null); }}
                />
            )}

            {/* Confirmar efetivar */}
            {confirmEfetivar && (() => {
                const total = Number(confirmEfetivar.valorTotal ?? 0);
                const n = confirmEfetivar.numParcelas ?? 1;
                const porParcela = n > 1 ? total / n : null;
                return (
                    <Modal
                        open
                        title="Efetivar pedido"
                        onClose={() => setConfirmEfetivar(null)}
                        actions={
                            <>
                                <button className="ph-btn" onClick={() => setConfirmEfetivar(null)} disabled={efetivando}>
                                    Cancelar
                                </button>
                                <button
                                    className="ph-btn ph-btn--primary"
                                    onClick={() => efetivar(confirmEfetivar.id)}
                                    disabled={efetivando}
                                >
                                    {efetivando ? "Efetivando..." : "Efetivar"}
                                </button>
                            </>
                        }
                    >
                        <Modal.Body>
                            <p>
                                Efetivar o pedido <strong>{confirmEfetivar.numero}</strong>?
                            </p>
                            <p style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 13 }}>
                                {n === 1
                                    ? <>Será gerado <strong>1</strong> recebimento de{" "}
                                        <strong>{fmtValor(total)}</strong> no módulo financeiro.</>
                                    : <>Serão gerados <strong>{n}</strong> recebimentos de{" "}
                                        <strong>{fmtValor(porParcela)}</strong> cada (total:{" "}
                                        <strong>{fmtValor(total)}</strong>) no módulo financeiro.</>
                                }
                            </p>
                        </Modal.Body>
                    </Modal>
                );
            })()}

            {/* Confirmar cancelar */}
            {confirmCancelar && (
                <Modal
                    open
                    title="Cancelar pedido"
                    onClose={() => setConfirmCancelar(null)}
                    actions={
                        <>
                            <button className="ph-btn" onClick={() => setConfirmCancelar(null)} disabled={cancelando}>
                                Voltar
                            </button>
                            <button
                                className="ph-btn ph-btn--danger"
                                onClick={() => cancelar(confirmCancelar.id)}
                                disabled={cancelando}
                            >
                                {cancelando ? "Cancelando..." : "Cancelar pedido"}
                            </button>
                        </>
                    }
                >
                    <Modal.Body>
                        <p>Tem certeza que deseja cancelar o pedido <strong>{confirmCancelar.numero}</strong>? Esta ação não pode ser desfeita.</p>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
}

/* ─── Ações inline ───────────────────────────────────────────────────────── */

function AcoesInline({ pedido: p, onEditar, onEfetivar, onCancelar, onCopiar }) {
    return (
        <div className="orc-actions" onClick={e => e.stopPropagation()}>
            {p.editavel && (
                <button className="orc-action" title="Editar" onClick={onEditar}>
                    <LuPencil size={14}/>
                </button>
            )}
            <button className="orc-action" title="Copiar pedido" onClick={onCopiar}>
                <LuCopy size={14}/>
            </button>
            {p.efetivavel && (
                <button className="orc-action orc-action--aprovar" title="Efetivar pedido" onClick={onEfetivar}>
                    <LuCircleCheck size={14}/>
                </button>
            )}
            {p.status === "ABERTO" && (
                <button className="orc-action orc-action--cancelar" title="Cancelar" onClick={onCancelar}>
                    <LuCircleX size={14}/>
                </button>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `

/* ─── Toolbar (reutiliza classes .orc-* do OrcamentosPage) ──────────────── */

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

.orc-filtros-extras {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    flex-wrap: wrap;
}

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

.orc-action--cancelar:hover {
    border-color: var(--error, #ef4444);
    background: rgba(239, 68, 68, 0.06);
    color: var(--error, #ef4444);
}

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

/* ─── Erro banner ────────────────────────────────────────────────────────── */

.pv-erro {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    margin-bottom: 12px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 8px;
    font-size: 13px;
    color: #b91c1c;
}

.pv-erro-fechar {
    border: none;
    background: none;
    cursor: pointer;
    color: inherit;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 2px;
    border-radius: 4px;
    opacity: 0.7;
}

.pv-erro-fechar:hover { opacity: 1; }

@media (max-width: 768px) {
    .orc-toolbar { flex-direction: column; align-items: stretch; }
    .orc-filtros-extras { margin-left: 0; }
    .orc-busca { max-width: 100%; min-width: 0; }
}
`;

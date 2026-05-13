import { useState, useEffect, useCallback, useMemo } from "react";
import {
    LuPlus, LuSearch, LuPencil, LuTrash2, LuPhone, LuMail,
    LuUsers, LuExternalLink, LuChevronLeft, LuChevronRight,
    LuRotateCcw,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader      from "../../components/shell/PageHeader.jsx";
import DataTable       from "../../components/ui/DataTable.jsx";
import EmptyState      from "../../components/ui/EmptyState.jsx";
import Modal           from "../../components/ui/Modal.jsx";

import ClienteModal    from "./clientes/ClienteModal.jsx";
import DetalhesModal   from "./clientes/DetalhesModal.jsx";
import {
    iniciais, SCORE_INFO,
} from "./clientes/_helpers.js";

/**
 * ClientesPage — Lista e gerenciamento de clientes
 * Sprint A3.6.4 · Refatoração
 *
 * Estrutura:
 *  - PageHeader com título + ação "Novo cliente"
 *  - Busca por nome (com debounce 300ms)
 *  - DataTable com sort, click pra detalhes, ações inline
 *  - Modais: ClienteModal (cadastro/edição), DetalhesModal (visualização)
 *  - Confirmação de inativação via Modal
 *
 * Endpoints:
 *  - GET    /api/clientes?pagina&tamanho       — listagem paginada
 *  - GET    /api/clientes/buscar?termo         — busca client-side
 *  - GET    /api/clientes/{id}                 — detalhes (com stats)
 *  - POST   /api/clientes                      — criar
 *  - PUT    /api/clientes/{id}                 — editar
 *  - DELETE /api/clientes/{id}                 — inativar
 */
export default function ClientesPage() {

    // Estado
    const [clientes, setClientes]         = useState([]);
    const [carregando, setCarregando]     = useState(true);
    const [erro, setErro]                 = useState("");

    // Busca + paginação
    const [busca, setBusca]               = useState("");
    const [paginaAtual, setPaginaAtual]   = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);

    // Modais
    const [modalAberto, setModalAberto]       = useState(false);
    const [editando, setEditando]             = useState(null);
    const [salvando, setSalvando]             = useState(false);
    const [detalhesAberto, setDetalhesAberto] = useState(null);
    const [confirmInativar, setConfirmInativar] = useState(null);

    // ── Carregamento ────────────────────────────────────────────────────────

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            if (busca.trim()) {
                const { data } = await api.get(`/api/clientes/buscar?termo=${encodeURIComponent(busca.trim())}`);
                setClientes(data);
                setTotalPaginas(1);
            } else {
                const { data } = await api.get(`/api/clientes?pagina=${paginaAtual}&tamanho=20`);
                setClientes(data.content);
                setTotalPaginas(data.totalPages);
            }
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar clientes");
        } finally {
            setCarregando(false);
        }
    }, [busca, paginaAtual]);

    // Debounce de 300ms na busca
    useEffect(() => {
        const t = setTimeout(carregar, busca.trim() ? 300 : 0);
        return () => clearTimeout(t);
    }, [carregar]);

    // ── Ações ──────────────────────────────────────────────────────────────

    async function abrirDetalhes(id) {
        try {
            const { data } = await api.get(`/api/clientes/${id}`);
            setDetalhesAberto(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar detalhes");
        }
    }

    function abrirNovo() {
        setEditando(null);
        setModalAberto(true);
    }

    function abrirEdicao(cliente) {
        setEditando(cliente);
        setDetalhesAberto(null);
        setModalAberto(true);
    }

    async function salvarCliente(payload) {
        setSalvando(true);
        try {
            let resultado;
            if (editando) {
                const { data } = await api.put(`/api/clientes/${editando.id}`, payload);
                resultado = data;
            } else {
                const { data } = await api.post("/api/clientes", payload);
                resultado = data;
            }
            setModalAberto(false);
            setEditando(null);
            await carregar();
            return resultado;
        } finally {
            setSalvando(false);
        }
    }

    async function executarInativacao() {
        try {
            await api.delete(`/api/clientes/${confirmInativar.id}`);
            setConfirmInativar(null);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao inativar");
            setConfirmInativar(null);
        }
    }

    // ── Definição das colunas da DataTable ──────────────────────────────────

    const colunas = useMemo(() => [
        {
            key: "nome",
            label: "Cliente",
            sortable: true,
            render: c => (
                <div className="ui-cell-avatar">
                    <div className="ui-cell-avatar-img">
                        {iniciais(c.nome)}
                    </div>
                    <div className="ui-cell-avatar-text">
                        <div className="ui-cell-avatar-name">{c.nome}</div>
                        {c.categoria && (
                            <div className="ui-cell-avatar-sub">{c.categoria}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "telefoneFormatado",
            label: "Telefone",
            sortable: true,
            render: c => c.telefoneFormatado ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-2)" }}>
                    <LuPhone size={12} style={{ color: "var(--text-dim)" }}/>
                    {c.telefoneFormatado}
                </span>
            ) : (
                <span style={{ color: "var(--text-dim)", fontSize: 13 }}>—</span>
            ),
        },
        {
            key: "email",
            label: "E-mail",
            sortable: true,
            render: c => c.email ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-2)" }}>
                    <LuMail size={12} style={{ color: "var(--text-dim)" }}/>
                    {c.email}
                </span>
            ) : (
                <span style={{ color: "var(--text-dim)", fontSize: 13 }}>—</span>
            ),
        },
        {
            key: "score",
            label: "Score",
            align: "center",
            render: c => {
                const info = c.score ? SCORE_INFO[c.score] : null;
                if (!info) return <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>;
                return (
                    <span className={`ui-badge ui-badge--${info.variant}`}>
                        {info.label}
                    </span>
                );
            },
        },
        {
            key: "_actions",
            label: "",
            align: "right",
            render: c => (
                <div className="cli-actions" onClick={e => e.stopPropagation()}>
                    <button
                        className="cli-action"
                        onClick={() => abrirEdicao(c)}
                        title="Editar"
                    >
                        <LuPencil size={14}/>
                    </button>
                    <button
                        className="cli-action cli-action--danger"
                        onClick={() => setConfirmInativar(c)}
                        title="Inativar cliente"
                    >
                        <LuTrash2 size={14}/>
                    </button>
                </div>
            ),
        },
    ], []);

    // ── Render ──────────────────────────────────────────────────────────────

    const temBusca = busca.trim().length > 0;

    return (
        <>
            <PageHeader
                title="Clientes"
                actions={
                    <button
                        className="ph-btn ph-btn--primary"
                        onClick={abrirNovo}
                    >
                        <LuPlus size={14}/>
                        Novo cliente
                    </button>
                }
            />

            {/* Erro */}
            {erro && <div className="cli-erro">{erro}</div>}

            {/* Busca */}
            <div className="cli-busca-wrap">
                <LuSearch size={14} className="cli-busca-icon"/>
                <input
                    type="text"
                    className="cli-busca-input"
                    value={busca}
                    onChange={e => { setBusca(e.target.value); setPaginaAtual(0); }}
                    placeholder="Buscar por nome..."
                />
            </div>

            {/* Tabela */}
            <DataTable
                columns={colunas}
                data={clientes}
                keyField="id"
                loading={carregando}
                empty={
                    <EmptyState
                        icon={LuUsers}
                        title={temBusca ? "Nenhum cliente encontrado" : "Cadastre seu primeiro cliente"}
                        description={
                            temBusca
                                ? "Tente buscar por outro termo."
                                : "Cadastre clientes para criar recebimentos e enviar cobranças via WhatsApp."
                        }
                        action={
                            temBusca ? (
                                <button
                                    className="ph-btn ph-btn--ghost"
                                    onClick={() => setBusca("")}
                                >
                                    <LuRotateCcw size={14}/>
                                    Limpar busca
                                </button>
                            ) : (
                                <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                                    <LuPlus size={14}/>
                                    Cadastrar primeiro cliente
                                </button>
                            )
                        }
                    />
                }
                onRowClick={(c) => abrirDetalhes(c.id)}
            />

            {/* Paginação (só sem busca) */}
            {totalPaginas > 1 && !temBusca && (
                <div className="cli-paginacao">
                    <button
                        className="ph-btn ph-btn--icon"
                        onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                        disabled={paginaAtual === 0}
                    >
                        <LuChevronLeft size={14}/>
                    </button>
                    <span className="cli-paginacao-texto">
                        Página <strong>{paginaAtual + 1}</strong> de <strong>{totalPaginas}</strong>
                    </span>
                    <button
                        className="ph-btn ph-btn--icon"
                        onClick={() => setPaginaAtual(p => p + 1)}
                        disabled={paginaAtual >= totalPaginas - 1}
                    >
                        <LuChevronRight size={14}/>
                    </button>
                </div>
            )}

            {/* ═══ MODAIS ═══ */}

            {modalAberto && (
                <ClienteModal
                    cliente={editando}
                    onSalvar={salvarCliente}
                    onFechar={() => { setModalAberto(false); setEditando(null); }}
                    salvando={salvando}
                />
            )}

            {detalhesAberto && (
                <DetalhesModal
                    cliente={detalhesAberto}
                    onFechar={() => setDetalhesAberto(null)}
                    onEditar={() => abrirEdicao(detalhesAberto)}
                />
            )}

            {/* Confirmação de inativação */}
            <Modal
                open={confirmInativar !== null}
                onClose={() => setConfirmInativar(null)}
                size="sm"
                title="Inativar cliente?"
                description={confirmInativar && (
                    <>Tem certeza que deseja inativar <strong>"{confirmInativar.nome}"</strong>?
                        Os recebimentos dele continuam visíveis no histórico.</>
                )}
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setConfirmInativar(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={executarInativacao}
                            style={{ background: "var(--error)", borderColor: "var(--error)" }}
                        >
                            Sim, inativar
                        </button>
                    </>
                }
            />

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .cli-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.cli-erro {
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
}

/* ── Busca ───────────────────────────────────────────────────────────── */

.cli-busca-wrap {
    position: relative;
    margin-bottom: 16px;
    max-width: 420px;
}

.cli-busca-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    pointer-events: none;
}

.cli-busca-input {
    width: 100%;
    padding: 9px 12px 9px 34px;
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

.cli-busca-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

/* ── Ações inline na tabela ──────────────────────────────────────────── */

.cli-actions {
    display: inline-flex;
    gap: 4px;
    align-items: center;
}

.cli-action {
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
}

.cli-action:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.cli-action--danger:hover {
    border-color: var(--error);
    background: var(--error-bg);
    color: var(--error);
}

/* ── Paginação ───────────────────────────────────────────────────────── */

.cli-paginacao {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 16px 0;
}

.cli-paginacao-texto {
    padding: 0 16px;
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--ff-sans);
    letter-spacing: -0.005em;
}

.cli-paginacao-texto strong {
    color: var(--navy-deep);
    font-weight: 600;
}

/* Responsivo */
@media (max-width: 600px) {
    .cli-busca-wrap {
        max-width: 100%;
    }
}
`;
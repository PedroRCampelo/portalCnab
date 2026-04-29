import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
    LuPlus, LuLayers, LuSearch, LuLoader, LuHandCoins,
    LuCircleCheck, LuPencil, LuTrash2, LuMessageCircle, LuUndo2,
    LuRotateCcw, LuChevronLeft, LuChevronRight,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader      from "../../components/shell/PageHeader.jsx";
import DataTable       from "../../components/ui/DataTable.jsx";
import EmptyState      from "../../components/ui/EmptyState.jsx";
import Modal           from "../../components/ui/Modal.jsx";

import CobrancaWhatsappModal from "../../components/CobrancaWhatsappModal.jsx";

import ResumoBoxes       from "./recebimentos/ResumoBoxes.jsx";
import RecebimentoModal  from "./recebimentos/RecebimentoModal.jsx";
import ParceladoModal    from "./recebimentos/ParceladoModal.jsx";
import ReceberModal      from "./recebimentos/ReceberModal.jsx";
import {
    fmtData, fmtValor, vencimentoContexto,
    STATUS_INFO, FILTROS_STATUS,
} from "./recebimentos/_helpers.js";

/**
 * RecebimentosPage — Lista e gerenciamento de recebimentos
 * Sprint A3.6.1 · Refatoração
 *
 * Estrutura:
 *  - PageHeader com título + ações (Parcelado, Novo recebimento)
 *  - 3 KPIs (a receber este mês, atrasados, próximos 7 dias)
 *  - Filtros pills (Todos / A receber / Atrasados / Parciais / Recebidos)
 *  - Busca por descrição/cliente
 *  - DataTable com sort, badges, ações inline
 *  - Paginação
 *  - 4 modais: cadastro, parcelado, receber, cobrança WhatsApp
 *
 * Endpoints:
 *  - GET    /api/recebimentos
 *  - GET    /api/recebimentos/resumo
 *  - POST   /api/recebimentos
 *  - PUT    /api/recebimentos/{id}
 *  - POST   /api/recebimentos/parcelado
 *  - POST   /api/recebimentos/{id}/receber
 *  - POST   /api/recebimentos/{id}/estornar
 *  - POST   /api/recebimentos/{id}/cancelar
 */
export default function RecebimentosPage() {
    const [searchParams] = useSearchParams();
    const clienteFiltroId = searchParams.get("clienteId");

    // Estado
    const [recebimentos, setRecebimentos] = useState([]);
    const [resumo, setResumo]             = useState({ aReceberMes: 0, qtdAtrasados: 0, qtdProximosVencer: 0 });
    const [carregando, setCarregando]     = useState(true);
    const [erro, setErro]                 = useState("");

    // Filtros
    const [filtroStatus, setFiltroStatus] = useState("");
    const [busca, setBusca]               = useState("");

    // Paginação
    const [paginaAtual, setPaginaAtual]   = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);

    // Modais
    const [modalAberto, setModalAberto]       = useState(false);
    const [modalParcelado, setModalParcelado] = useState(false);
    const [editando, setEditando]             = useState(null);
    const [salvando, setSalvando]             = useState(false);
    const [receberAberto, setReceberAberto]   = useState(null);
    const [cobrancaAberta, setCobrancaAberta] = useState(null);
    const [confirmEstornar, setConfirmEstornar] = useState(null);
    const [confirmCancelar, setConfirmCancelar] = useState(null);

    // ── Carregamento ────────────────────────────────────────────────────────

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const params = new URLSearchParams();
            params.set("pagina",  paginaAtual);
            params.set("tamanho", "20");
            if (filtroStatus)    params.set("status", filtroStatus);
            if (clienteFiltroId) params.set("clienteId", clienteFiltroId);

            const [{ data: page }, { data: res }] = await Promise.all([
                api.get(`/api/recebimentos?${params}`),
                api.get("/api/recebimentos/resumo"),
            ]);

            setRecebimentos(page.content);
            setTotalPaginas(page.totalPages);
            setResumo(res);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar recebimentos");
        } finally {
            setCarregando(false);
        }
    }, [filtroStatus, clienteFiltroId, paginaAtual]);

    useEffect(() => { carregar(); }, [carregar]);

    // ── Busca client-side ───────────────────────────────────────────────────

    const recebimentosFiltrados = useMemo(() => {
        if (!busca.trim()) return recebimentos;
        const q = busca.toLowerCase();
        return recebimentos.filter(r =>
            r.descricao?.toLowerCase().includes(q) ||
            r.cliente?.nome?.toLowerCase().includes(q)
        );
    }, [recebimentos, busca]);

    // ── Ações ──────────────────────────────────────────────────────────────

    function abrirNovo() {
        setEditando(null);
        setModalAberto(true);
    }

    function abrirEdicao(r) {
        if (Number(r.valorRecebido) > 0 || r.status === "CANCELADO") {
            setErro("Este recebimento não pode ser editado. Estorne a baixa primeiro.");
            return;
        }
        setEditando(r);
        setModalAberto(true);
    }

    async function salvar(payload) {
        setSalvando(true);
        try {
            if (editando) {
                await api.put(`/api/recebimentos/${editando.id}`, payload);
            } else {
                await api.post("/api/recebimentos", payload);
            }
            setModalAberto(false);
            setEditando(null);
            await carregar();
        } finally {
            setSalvando(false);
        }
    }

    async function salvarParcelado(payload) {
        setSalvando(true);
        try {
            await api.post("/api/recebimentos/parcelado", payload);
            setModalParcelado(false);
            await carregar();
        } finally {
            setSalvando(false);
        }
    }

    async function confirmarRecebimento({ valor, dataRecebimento, contaId }) {
        await api.post(`/api/recebimentos/${receberAberto.id}/receber`, {
            valor, dataRecebimento, contaId,
        });
        setReceberAberto(null);
        await carregar();
    }

    async function executarEstorno() {
        try {
            await api.post(`/api/recebimentos/${confirmEstornar.id}/estornar`);
            setConfirmEstornar(null);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao estornar");
            setConfirmEstornar(null);
        }
    }

    async function executarCancelamento() {
        try {
            await api.post(`/api/recebimentos/${confirmCancelar.id}/cancelar`);
            setConfirmCancelar(null);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao cancelar");
            setConfirmCancelar(null);
        }
    }

    // ── Definição das colunas da DataTable ──────────────────────────────────

    const colunas = useMemo(() => [
        {
            key: "cliente",
            label: "Cliente",
            sortable: true,
            render: r => (
                <div className="ui-cell-avatar">
                    <div className="ui-cell-avatar-img">
                        {iniciais(r.cliente?.nome ?? "?")}
                    </div>
                    <div className="ui-cell-avatar-text">
                        <div className="ui-cell-avatar-name">
                            {r.cliente?.nome || "Sem cliente"}
                        </div>
                        {r.parcelaTotal > 1 && (
                            <div className="ui-cell-avatar-sub">
                                Parcela {r.parcelaAtual}/{r.parcelaTotal}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "descricao",
            label: "Descrição",
            sortable: true,
            render: r => (
                <span style={{
                    color: "var(--ink-2)",
                    fontSize: 13,
                }}>
                    {r.descricao}
                </span>
            ),
        },
        {
            key: "dataVencimento",
            label: "Vencimento",
            sortable: true,
            render: r => {
                const ctx = vencimentoContexto(r.dataVencimento, r.status);
                return (
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                        <span className="ui-table-num" style={{ fontSize: 13 }}>
                            {fmtData(r.dataVencimento)}
                        </span>
                        {ctx && (
                            <span style={{
                                fontFamily: "var(--ff-mono)",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                color: ctx.variant === "error"
                                    ? "var(--error)"
                                    : ctx.variant === "warning"
                                        ? "var(--warning)"
                                        : "var(--text-dim)",
                            }}>
                                {ctx.texto}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "valor",
            label: "Valor",
            sortable: true,
            align: "right",
            render: r => (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.3 }}>
                    <span className="ui-table-num" style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--navy-deep)",
                    }}>
                        {fmtValor(r.valor)}
                    </span>
                    {r.status === "PARCIAL" && (
                        <span style={{
                            fontFamily: "var(--ff-mono)",
                            fontSize: 10,
                            color: "var(--cyan-dark)",
                        }}>
                            Recebido: {fmtValor(r.valorRecebido)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            align: "center",
            render: r => {
                const info = STATUS_INFO[r.status] ?? { label: r.status, variant: "neutral" };
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
            render: r => <AcoesInline
                recebimento={r}
                onReceber={() => setReceberAberto(r)}
                onEditar={() => abrirEdicao(r)}
                onCobrar={() => setCobrancaAberta(r)}
                onEstornar={() => setConfirmEstornar(r)}
                onCancelar={() => setConfirmCancelar(r)}
            />,
        },
    ], []);

    // ── Render ──────────────────────────────────────────────────────────────

    const temFiltrosAtivos = filtroStatus || busca.trim();

    return (
        <>
            <PageHeader
                title="Recebimentos"
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setModalParcelado(true)}
                        >
                            <LuLayers size={14}/>
                            Parcelado
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={abrirNovo}
                        >
                            <LuPlus size={14}/>
                            Novo recebimento
                        </button>
                    </>
                }
            />

            {/* KPIs */}
            <ResumoBoxes resumo={resumo}/>

            {/* Erro */}
            {erro && <div className="rec-erro">{erro}</div>}

            {/* Filtros + busca */}
            <div className="rec-toolbar">
                <div className="rec-pills">
                    {FILTROS_STATUS.map(f => (
                        <button
                            key={f.value || "todos"}
                            className={`rec-pill ${filtroStatus === f.value ? "active" : ""}`}
                            onClick={() => { setFiltroStatus(f.value); setPaginaAtual(0); }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="rec-busca">
                    <LuSearch size={14} className="rec-busca-icon"/>
                    <input
                        type="text"
                        className="rec-busca-input"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar por descrição ou cliente..."
                    />
                </div>
            </div>

            {/* Tabela */}
            <DataTable
                columns={colunas}
                data={recebimentosFiltrados}
                keyField="id"
                loading={carregando}
                empty={
                    <EmptyState
                        icon={LuHandCoins}
                        title={temFiltrosAtivos ? "Nenhum recebimento encontrado" : "Nenhum recebimento cadastrado"}
                        description={
                            temFiltrosAtivos
                                ? "Tente ajustar os filtros de status ou a busca."
                                : "Cadastre seu primeiro recebimento para acompanhar o que entra de dinheiro no seu negócio."
                        }
                        action={
                            !temFiltrosAtivos ? (
                                <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                                    <LuPlus size={14}/>
                                    Criar primeiro recebimento
                                </button>
                            ) : (
                                <button
                                    className="ph-btn ph-btn--ghost"
                                    onClick={() => { setFiltroStatus(""); setBusca(""); setPaginaAtual(0); }}
                                >
                                    <LuRotateCcw size={14}/>
                                    Limpar filtros
                                </button>
                            )
                        }
                    />
                }
                density="default"
            />

            {/* Paginação */}
            {totalPaginas > 1 && (
                <div className="rec-paginacao">
                    <button
                        className="ph-btn ph-btn--icon"
                        onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                        disabled={paginaAtual === 0}
                    >
                        <LuChevronLeft size={14}/>
                    </button>
                    <span className="rec-paginacao-texto">
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
                <RecebimentoModal
                    recebimento={editando}
                    onSalvar={salvar}
                    onFechar={() => { setModalAberto(false); setEditando(null); }}
                    salvando={salvando}
                />
            )}

            {modalParcelado && (
                <ParceladoModal
                    onSalvar={salvarParcelado}
                    onFechar={() => setModalParcelado(false)}
                    salvando={salvando}
                />
            )}

            {receberAberto && (
                <ReceberModal
                    recebimento={receberAberto}
                    onConfirmar={confirmarRecebimento}
                    onFechar={() => setReceberAberto(null)}
                />
            )}

            {cobrancaAberta && (
                <CobrancaWhatsappModal
                    recebimento={cobrancaAberta}
                    onFechar={() => setCobrancaAberta(null)}
                    onSucesso={() => carregar()}
                />
            )}

            {/* Confirmação: Estornar */}
            <Modal
                open={confirmEstornar !== null}
                onClose={() => setConfirmEstornar(null)}
                size="sm"
                title="Estornar baixa?"
                description={confirmEstornar && (
                    <>O recebimento "<strong>{confirmEstornar.descricao}</strong>" voltará pra status pendente.
                        Esta ação fica registrada no histórico.</>
                )}
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setConfirmEstornar(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={executarEstorno}
                            style={{ background: "var(--warning)", borderColor: "var(--warning)" }}
                        >
                            Sim, estornar
                        </button>
                    </>
                }
            />

            {/* Confirmação: Cancelar */}
            <Modal
                open={confirmCancelar !== null}
                onClose={() => setConfirmCancelar(null)}
                size="sm"
                title="Cancelar recebimento?"
                description={confirmCancelar && (
                    <>Cancelar "<strong>{confirmCancelar.descricao}</strong>"?
                        O registro fica no histórico mas não conta mais nas suas projeções.</>
                )}
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setConfirmCancelar(null)}
                        >
                            Voltar
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={executarCancelamento}
                            style={{ background: "var(--error)", borderColor: "var(--error)" }}
                        >
                            Sim, cancelar
                        </button>
                    </>
                }
            />

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   AcoesInline — botões de ação no canto direito de cada linha
   ═════════════════════════════════════════════════════════════════════════════ */

function AcoesInline({ recebimento: r, onReceber, onEditar, onCobrar, onEstornar, onCancelar }) {
    const temBaixa     = Number(r.valorRecebido) > 0;
    const ehCancelado  = r.status === "CANCELADO";
    const ehAtivo      = ["PENDENTE", "ATRASADO", "PARCIAL"].includes(r.status);

    const podeReceber  = ehAtivo;
    const podeCobrar   = ehAtivo && r.cliente?.telefone;
    const podeEstornar = temBaixa && !ehCancelado;
    const podeEditar   = !temBaixa && !ehCancelado;
    const podeCancelar = !temBaixa && !ehCancelado;

    return (
        <div className="rec-actions" onClick={e => e.stopPropagation()}>
            {podeReceber && (
                <button
                    className="rec-action rec-action--receber"
                    onClick={onReceber}
                    title="Registrar recebimento"
                >
                    <LuCircleCheck size={14}/>
                </button>
            )}

            {podeCobrar && (
                <button
                    className="rec-action rec-action--cobrar"
                    onClick={onCobrar}
                    title="Cobrar via WhatsApp"
                >
                    <LuMessageCircle size={14}/>
                </button>
            )}

            {podeEstornar && (
                <button
                    className="rec-action rec-action--estornar"
                    onClick={onEstornar}
                    title="Estornar baixa"
                >
                    <LuUndo2 size={14}/>
                </button>
            )}

            {podeEditar && (
                <button
                    className="rec-action"
                    onClick={onEditar}
                    title="Editar"
                >
                    <LuPencil size={14}/>
                </button>
            )}

            {podeCancelar && (
                <button
                    className="rec-action rec-action--cancelar"
                    onClick={onCancelar}
                    title="Cancelar recebimento"
                >
                    <LuTrash2 size={14}/>
                </button>
            )}
        </div>
    );
}

/* ─── Helper local ───────────────────────────────────────────────────────── */

function iniciais(nome) {
    if (!nome) return "?";
    return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .rec-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
/* ─── Erro ─────────────────────────────────────────────────────────────── */

.rec-erro {
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
}

/* ─── Toolbar (filtros + busca) ──────────────────────────────────────── */

.rec-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

/* Pills de filtro de status */
.rec-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.rec-pill {
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

.rec-pill:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
}

.rec-pill.active {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

/* Busca */
.rec-busca {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 360px;
    margin-left: auto;
}

.rec-busca-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    pointer-events: none;
}

.rec-busca-input {
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

.rec-busca-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

/* ─── Ações inline na tabela ─────────────────────────────────────────── */

.rec-actions {
    display: inline-flex;
    gap: 4px;
    align-items: center;
}

.rec-action {
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

.rec-action:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.rec-action--receber:hover {
    border-color: var(--success);
    background: var(--success-bg);
    color: var(--success);
}

.rec-action--cobrar:hover {
    border-color: rgba(37, 211, 102, 0.5);
    background: rgba(37, 211, 102, 0.08);
    color: #15803D;
}

.rec-action--estornar:hover {
    border-color: var(--warning);
    background: var(--warning-bg);
    color: var(--warning);
}

.rec-action--cancelar:hover {
    border-color: var(--error);
    background: var(--error-bg);
    color: var(--error);
}

/* ─── Paginação ──────────────────────────────────────────────────────── */

.rec-paginacao {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 16px 0;
}

.rec-paginacao-texto {
    padding: 0 16px;
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--ff-sans);
    letter-spacing: -0.005em;
}

.rec-paginacao-texto strong {
    color: var(--navy-deep);
    font-weight: 600;
}

/* ─── Responsivo ─────────────────────────────────────────────────────── */

@media (max-width: 700px) {
    .rec-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .rec-busca {
        max-width: 100%;
        margin-left: 0;
    }

    .rec-actions {
        flex-wrap: nowrap;
    }
}
`;
import { useState, useEffect, useCallback } from "react";
import {
    LuPlus, LuFileText, LuChevronLeft, LuChevronRight,
    LuPencil, LuCircleCheck, LuCircleX, LuRotateCcw,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader  from "../../components/shell/PageHeader.jsx";
import EmptyState  from "../../components/ui/EmptyState.jsx";
import Modal       from "../../components/ui/Modal.jsx";
import PedidoVendaModal    from "./comercial/PedidoVendaModal.jsx";
import PedidoVendaDetalhes from "./comercial/PedidoVendaDetalhes.jsx";
import "./comercial/Comercial.css";

const STATUS_LABELS = {
    ABERTO:    { label: "Aberto",    cls: "badge--blue"  },
    EFETIVADO: { label: "Efetivado", cls: "badge--green" },
    CANCELADO: { label: "Cancelado", cls: "badge--red"   },
};

function fmt(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PedidosVendaPage() {
    const [pedidos, setPedidos]           = useState([]);
    const [pagina, setPagina]             = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [status, setStatus]             = useState("");
    const [loading, setLoading]           = useState(false);

    const [modalAberto, setModalAberto]   = useState(false);
    const [editando, setEditando]         = useState(null);
    const [detalhes, setDetalhes]         = useState(null);
    const [confirmEfetivar, setConfirmEfetivar] = useState(null);
    const [confirmCancelar, setConfirmCancelar] = useState(null);

    const carregar = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ pagina, tamanho: 20 });
            if (status) params.set("status", status);
            const { data } = await api.get(`/api/pedidos-venda?${params}`);
            setPedidos(data.content ?? []);
            setTotalPaginas(data.totalPages ?? 0);
        } catch {
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    }, [pagina, status]);

    useEffect(() => { carregar(); }, [carregar]);

    function abrirNovo() { setEditando(null); setModalAberto(true); }
    function abrirEditar(p) { setEditando(p); setModalAberto(true); }
    function fecharModal() { setModalAberto(false); setEditando(null); }

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
        await api.post(`/api/pedidos-venda/${id}/efetivar`);
        setConfirmEfetivar(null);
        carregar();
    }

    async function cancelar(id) {
        await api.post(`/api/pedidos-venda/${id}/cancelar`);
        setConfirmCancelar(null);
        carregar();
    }

    const statusInfo = (s) => STATUS_LABELS[s] ?? { label: s, cls: "badge--gray" };

    return (
        <div className="page">
            <PageHeader
                title="Pedidos de Venda"
                actions={
                    <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                        <LuPlus size={16}/> Novo pedido
                    </button>
                }
            />

            <div className="page-filters">
                <select
                    className="filter-select"
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPagina(0); }}
                >
                    <option value="">Todos os status</option>
                    <option value="ABERTO">Aberto</option>
                    <option value="EFETIVADO">Efetivado</option>
                    <option value="CANCELADO">Cancelado</option>
                </select>

                <button className="ph-btn ph-btn--icon" onClick={carregar} title="Recarregar">
                    <LuRotateCcw size={16}/>
                </button>
            </div>

            {loading ? (
                <div className="page-loading">Carregando...</div>
            ) : pedidos.length === 0 ? (
                <EmptyState
                    icon={LuFileText}
                    title="Nenhum pedido de venda encontrado"
                    description="Crie o primeiro pedido de venda para começar."
                    action={<button className="ph-btn ph-btn--primary" onClick={abrirNovo}>+ Novo pedido</button>}
                />
            ) : (
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Descrição</th>
                                <th>Vencimento</th>
                                <th>Parcelas</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.map(p => {
                                const si = statusInfo(p.status);
                                return (
                                    <tr key={p.id} onClick={() => setDetalhes(p)} className="dt-row--clickable">
                                        <td className="dt-mono">{p.numero}</td>
                                        <td>{p.cliente?.nome}</td>
                                        <td className="dt-secondary">{p.descricao}</td>
                                        <td>{p.primeiroVencimento}</td>
                                        <td>{p.numParcelas}x</td>
                                        <td className="dt-value">{fmt(p.valorTotal)}</td>
                                        <td>
                                            <span className={`badge ${si.cls}`}>{si.label}</span>
                                        </td>
                                        <td className="dt-actions" onClick={e => e.stopPropagation()}>
                                            {p.editavel && (
                                                <button className="dt-action-btn" title="Editar" onClick={() => abrirEditar(p)}>
                                                    <LuPencil size={15}/>
                                                </button>
                                            )}
                                            {p.efetivavel && (
                                                <button className="dt-action-btn dt-action-btn--success" title="Efetivar pedido"
                                                    onClick={() => setConfirmEfetivar(p)}>
                                                    <LuCircleCheck size={15}/>
                                                </button>
                                            )}
                                            {p.status === "ABERTO" && (
                                                <button className="dt-action-btn dt-action-btn--danger" title="Cancelar"
                                                    onClick={() => setConfirmCancelar(p)}>
                                                    <LuCircleX size={15}/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {totalPaginas > 1 && (
                        <div className="pagination">
                            <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>
                                <LuChevronLeft size={16}/>
                            </button>
                            <span>{pagina + 1} / {totalPaginas}</span>
                            <button disabled={pagina >= totalPaginas - 1} onClick={() => setPagina(p => p + 1)}>
                                <LuChevronRight size={16}/>
                            </button>
                        </div>
                    )}
                </div>
            )}

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
                />
            )}

            {confirmEfetivar && (
                <Modal
                    open
                    title="Efetivar pedido"
                    onClose={() => setConfirmEfetivar(null)}
                    actions={
                        <>
                            <button className="ph-btn" onClick={() => setConfirmEfetivar(null)}>Cancelar</button>
                            <button className="ph-btn ph-btn--primary" onClick={() => efetivar(confirmEfetivar.id)}>
                                Efetivar
                            </button>
                        </>
                    }
                >
                    <p>
                        Efetivar o pedido <strong>{confirmEfetivar.numero}</strong>?<br/>
                        Serão gerados <strong>{confirmEfetivar.numParcelas}</strong> recebimento(s) de{" "}
                        <strong>{Number(confirmEfetivar.valorTotal ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>{" "}
                        no módulo financeiro.
                    </p>
                </Modal>
            )}

            {confirmCancelar && (
                <Modal
                    open
                    title="Cancelar pedido"
                    onClose={() => setConfirmCancelar(null)}
                    actions={
                        <>
                            <button className="ph-btn" onClick={() => setConfirmCancelar(null)}>Voltar</button>
                            <button className="ph-btn ph-btn--danger" onClick={() => cancelar(confirmCancelar.id)}>
                                Cancelar pedido
                            </button>
                        </>
                    }
                >
                    <p>Tem certeza que deseja cancelar o pedido <strong>{confirmCancelar.numero}</strong>? Esta ação não pode ser desfeita.</p>
                </Modal>
            )}
        </div>
    );
}

import Modal from "../../../components/ui/Modal.jsx";
import { LuPencil, LuCircleCheck, LuCircleX, LuCopy } from "react-icons/lu";

function fmt(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABELS = {
    ABERTO:    "Aberto",
    EFETIVADO: "Efetivado",
    CANCELADO: "Cancelado",
};

const FORMA_PAG_LABELS = {
    PIX:            "Pix",
    BOLETO:         "Boleto",
    DINHEIRO:       "Dinheiro",
    CARTAO_CREDITO: "Cartão de crédito",
    CARTAO_DEBITO:  "Cartão de débito",
    TRANSFERENCIA:  "Transferência",
    OUTROS:         "Outros",
};

export default function PedidoVendaDetalhes({ pedido: p, onFechar, onEditar, onEfetivar, onCancelar, onCopiar }) {
    return (
        <Modal
            open
            title={`Pedido de Venda ${p.numero}`}
            onClose={onFechar}
            size="lg"
            actions={
                <div style={{ display: "flex", gap: "8px" }}>
                    <button className="ph-btn" title="Duplicar pedido" onClick={onCopiar}>
                        <LuCopy size={14}/> Copiar
                    </button>
                    {p.editavel && (
                        <button className="ph-btn" onClick={onEditar}>
                            <LuPencil size={14}/> Editar
                        </button>
                    )}
                    {p.efetivavel && (
                        <button className="ph-btn ph-btn--primary" onClick={onEfetivar}>
                            <LuCircleCheck size={14}/> Efetivar
                        </button>
                    )}
                    {p.status === "ABERTO" && (
                        <button className="ph-btn ph-btn--danger" onClick={onCancelar}>
                            <LuCircleX size={14}/> Cancelar
                        </button>
                    )}
                </div>
            }
        >
            <Modal.Body>
            <dl className="detalhe-grid">
                <div>
                    <dt>Cliente</dt>
                    <dd>{p.cliente?.nome}</dd>
                </div>
                <div>
                    <dt>Status</dt>
                    <dd>{STATUS_LABELS[p.status] ?? p.status}</dd>
                </div>
                <div>
                    <dt>Forma de pagamento</dt>
                    <dd>{FORMA_PAG_LABELS[p.formaPagamento] ?? p.formaPagamento}</dd>
                </div>
                <div>
                    <dt>Parcelas</dt>
                    <dd>
                        {p.numParcelas === 1
                            ? "À vista"
                            : `${p.numParcelas}x de ${fmt(Number(p.valorTotal ?? 0) / p.numParcelas)} a cada ${p.intervaloDias} dias`}
                    </dd>
                </div>
                <div>
                    <dt>Primeiro vencimento</dt>
                    <dd>{p.primeiroVencimento}</dd>
                </div>
                <div>
                    <dt>Total</dt>
                    <dd style={{ fontSize: "16px", fontWeight: 700 }}>{fmt(p.valorTotal)}</dd>
                </div>
                {p.descricao && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <dt>Descrição</dt>
                        <dd>{p.descricao}</dd>
                    </div>
                )}
                {p.observacoes && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <dt>Observações</dt>
                        <dd style={{ whiteSpace: "pre-wrap" }}>{p.observacoes}</dd>
                    </div>
                )}
                {p.efetivadoEm && (
                    <div>
                        <dt>Efetivado em</dt>
                        <dd>{new Date(p.efetivadoEm).toLocaleString("pt-BR")}</dd>
                    </div>
                )}
            </dl>

            {p.itens?.length > 0 && (
                <div className="detalhe-itens">
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style={{ textAlign: "right" }}>Qtd</th>
                                <th style={{ textAlign: "right" }}>Valor unit.</th>
                                <th style={{ textAlign: "right" }}>Desconto</th>
                                <th style={{ textAlign: "right" }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {p.itens.map((item, i) => (
                                <tr key={item.id ?? i}>
                                    <td>{item.descricao}</td>
                                    <td style={{ textAlign: "right" }}>{item.quantidade}</td>
                                    <td style={{ textAlign: "right" }}>{fmt(item.valorUnitario)}</td>
                                    <td style={{ textAlign: "right" }}>{fmt(item.desconto)}</td>
                                    <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            </Modal.Body>
        </Modal>
    );
}

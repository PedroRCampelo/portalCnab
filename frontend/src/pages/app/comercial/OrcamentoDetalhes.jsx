import Modal from "../../../components/ui/Modal.jsx";
import { LuPencil, LuCircleCheck, LuPrinter } from "react-icons/lu";
import { imprimirOrcamento } from "./OrcamentoPrint.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

function fmt(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABELS = {
    RASCUNHO:  "Rascunho",
    ENVIADO:   "Enviado",
    APROVADO:  "Aprovado",
    RECUSADO:  "Recusado",
    EXPIRADO:  "Expirado",
    EM_PEDIDO: "Em Pedido",
};

const FORMA_PAG_LABELS = {
    A_DEFINIR:      "A definir",
    PIX:            "Pix",
    BOLETO:         "Boleto",
    DINHEIRO:       "Dinheiro",
    CARTAO_CREDITO: "Cartão de crédito",
    CARTAO_DEBITO:  "Cartão de débito",
    TRANSFERENCIA:  "Transferência",
    CHEQUE:         "Cheque",
    OUTROS:         "Outros",
};

export default function OrcamentoDetalhes({ orcamento: orc, onFechar, onEditar, onMudarStatus }) {
    const emPedido = orc.status === "EM_PEDIDO";
    const { usuario } = useAuth();

    return (
        <Modal
            open
            title={`Orçamento ${orc.numero}`}
            onClose={onFechar}
            size="lg"
            actions={
                <div style={{ display: "flex", gap: "8px" }}>
                    <button className="ph-btn" onClick={() => imprimirOrcamento(orc, usuario?.empresa)}>
                        <LuPrinter size={14}/> Imprimir
                    </button>
                    {!emPedido && (
                        <>
                            {orc.editavel && (
                                <button className="ph-btn" onClick={onEditar}>
                                    <LuPencil size={14}/> Editar
                                </button>
                            )}
                            {orc.status === "RASCUNHO" && (
                                <button className="ph-btn ph-btn--primary" onClick={() => onMudarStatus("ENVIADO")}>
                                    Marcar como enviado
                                </button>
                            )}
                            {orc.status === "ENVIADO" && (
                                <>
                                    <button className="ph-btn" onClick={() => onMudarStatus("RASCUNHO")}>
                                        Voltar para rascunho
                                    </button>
                                    <button className="ph-btn ph-btn--primary" onClick={() => onMudarStatus("APROVADO")}>
                                        <LuCircleCheck size={14}/> Aprovar
                                    </button>
                                </>
                            )}
                            {orc.status === "APROVADO" && (
                                <button className="ph-btn" onClick={() => onMudarStatus("RECUSADO")}>
                                    Marcar como recusado
                                </button>
                            )}
                            {orc.status === "RECUSADO" && (
                                <button className="ph-btn" onClick={() => onMudarStatus("RASCUNHO")}>
                                    Reabrir como rascunho
                                </button>
                            )}
                        </>
                    )}
                </div>
            }
        >
            <Modal.Body>
            <dl className="detalhe-grid">
                <div>
                    <dt>Cliente</dt>
                    <dd>{orc.cliente?.nome}</dd>
                </div>
                <div>
                    <dt>Status</dt>
                    <dd>{STATUS_LABELS[orc.status] ?? orc.status}</dd>
                </div>
                {orc.dataEmissao && (
                    <div>
                        <dt>Data de emissão</dt>
                        <dd>{orc.dataEmissao}</dd>
                    </div>
                )}
                <div>
                    <dt>Validade</dt>
                    <dd>{orc.validade}</dd>
                </div>
                <div>
                    <dt>Total</dt>
                    <dd>{fmt(orc.valorTotal)}</dd>
                </div>
                {orc.descontoGeral > 0 && (
                    <div>
                        <dt>Desconto geral</dt>
                        <dd>{fmt(orc.descontoGeral)}</dd>
                    </div>
                )}
                <div>
                    <dt>Forma de pagamento</dt>
                    <dd>{FORMA_PAG_LABELS[orc.formaPagamento] ?? orc.formaPagamento}</dd>
                </div>
                <div>
                    <dt>Condição de pagamento</dt>
                    <dd>
                        {orc.numParcelas === 1
                            ? "À vista"
                            : `${orc.numParcelas}x a cada ${orc.intervaloDias} dias`}
                    </dd>
                </div>
                {orc.descricao && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <dt>Descrição</dt>
                        <dd>{orc.descricao}</dd>
                    </div>
                )}
                {orc.observacoes && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <dt>Observações</dt>
                        <dd style={{ whiteSpace: "pre-wrap" }}>{orc.observacoes}</dd>
                    </div>
                )}
            </dl>

            {orc.itens?.length > 0 && (
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
                            {orc.itens.map((item, i) => (
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

            {emPedido && (
                <p style={{
                    marginTop: 16, padding: "10px 14px",
                    background: "var(--surface-2, #f4f4f8)",
                    borderRadius: 6, fontSize: 13,
                    color: "var(--text-secondary)",
                }}>
                    Este orçamento foi convertido em pedido de venda e não pode mais ser alterado.
                </p>
            )}
            </Modal.Body>
        </Modal>
    );
}

import { useEffect } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";

function fmt(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(str) {
    if (!str) return "—";
    const [ano, mes, dia] = str.split("-");
    return `${dia}/${mes}/${ano}`;
}

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

export default function OrcamentoPrint({ orcamento: orc, onFechar }) {
    const { usuario } = useAuth();
    const empresa = usuario?.empresa ?? null;

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const subtotalBruto = orc.itens?.reduce((s, it) => s + Number(it.valorUnitario ?? 0) * Number(it.quantidade ?? 1), 0) ?? 0;
    const descontoTotal = (orc.itens?.reduce((s, it) => s + Number(it.desconto ?? 0), 0) ?? 0) + Number(orc.descontoGeral ?? 0);
    const total         = Number(orc.valorTotal ?? 0);

    const condicao = orc.numParcelas === 1
        ? "À vista"
        : `${orc.numParcelas}x a cada ${orc.intervaloDias} dias`;

    return (
        <>
            <style>{PRINT_CSS}</style>

            {/* Overlay de preview — oculto na impressão */}
            <div className="orc-print-overlay no-print">
                <div className="orc-print-toolbar">
                    <span className="orc-print-toolbar-title">Pré-visualização do orçamento</span>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="orc-print-btn orc-print-btn--secondary" onClick={onFechar}>
                            Fechar
                        </button>
                        <button className="orc-print-btn orc-print-btn--primary" onClick={() => window.print()}>
                            Imprimir / Salvar PDF
                        </button>
                    </div>
                </div>
                <div className="orc-print-paper-wrap">
                    <Document orc={orc} empresa={empresa} subtotalBruto={subtotalBruto} descontoTotal={descontoTotal} total={total} condicao={condicao}/>
                </div>
            </div>

            {/* Documento que aparece na impressão — oculto normalmente */}
            <div className="print-only">
                <Document orc={orc} empresa={empresa} subtotalBruto={subtotalBruto} descontoTotal={descontoTotal} total={total} condicao={condicao}/>
            </div>
        </>
    );
}

function Document({ orc, empresa, subtotalBruto, descontoTotal, total, condicao }) {
    const fmt = v => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="orc-doc">
            {/* ── Cabeçalho ── */}
            <header className="orc-header">
                <div className="orc-header-empresa">
                    {empresa?.logoBase64 && (
                        <img src={empresa.logoBase64} alt="Logo" className="orc-logo"/>
                    )}
                    <div className="orc-header-info">
                        <h1 className="orc-empresa-nome">{empresa?.nome ?? "Minha Empresa"}</h1>
                        {orc.empresa?.cnpj && (
                            <span className="orc-empresa-detalhe">CNPJ: {orc.empresa.cnpj}</span>
                        )}
                        {orc.empresa?.telefone && (
                            <span className="orc-empresa-detalhe">{orc.empresa.telefone}</span>
                        )}
                        {orc.empresa?.emailEmpresa && (
                            <span className="orc-empresa-detalhe">{orc.empresa.emailEmpresa}</span>
                        )}
                    </div>
                </div>

                <div className="orc-header-doc">
                    <div className="orc-doc-badge">ORÇAMENTO</div>
                    <div className="orc-doc-num">Nº {orc.numero}</div>
                    <div className="orc-doc-meta">
                        <span>Emissão: {fmtData(orc.dataCriacao ?? orc.dataEmissao)}</span>
                        <span>Validade: {fmtData(orc.validade)}</span>
                    </div>
                </div>
            </header>

            <div className="orc-divider"/>

            {/* ── Destinatário ── */}
            <section className="orc-cliente">
                <div className="orc-section-label">DESTINATÁRIO</div>
                <div className="orc-cliente-nome">{orc.cliente?.nome ?? "—"}</div>
                {orc.cliente?.cpfCnpj && (
                    <div className="orc-cliente-doc">CPF/CNPJ: {orc.cliente.cpfCnpj}</div>
                )}
                {orc.cliente?.email && (
                    <div className="orc-cliente-doc">{orc.cliente.email}</div>
                )}
                {orc.cliente?.telefone && (
                    <div className="orc-cliente-doc">{orc.cliente.telefone}</div>
                )}
            </section>

            {orc.descricao && (
                <section className="orc-descricao">
                    <div className="orc-section-label">OBJETO</div>
                    <p className="orc-descricao-text">{orc.descricao}</p>
                </section>
            )}

            {/* ── Itens ── */}
            <section className="orc-itens-section">
                <div className="orc-section-label">ITENS</div>
                <table className="orc-table">
                    <thead>
                        <tr>
                            <th className="orc-th-desc">Descrição</th>
                            <th className="orc-th-num">Qtd.</th>
                            <th className="orc-th-num">Valor Unit.</th>
                            <th className="orc-th-num">Desconto</th>
                            <th className="orc-th-num">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orc.itens?.map((item, i) => (
                            <tr key={item.id ?? i} className={i % 2 === 0 ? "orc-tr-even" : ""}>
                                <td>{item.descricao}</td>
                                <td className="orc-td-num">{item.quantidade}</td>
                                <td className="orc-td-num">{fmt(item.valorUnitario)}</td>
                                <td className="orc-td-num">{item.desconto > 0 ? fmt(item.desconto) : "—"}</td>
                                <td className="orc-td-num orc-td-strong">{fmt(item.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* ── Totais ── */}
            <section className="orc-totais">
                {descontoTotal > 0 && (
                    <>
                        <div className="orc-totais-row">
                            <span>Subtotal</span>
                            <span>{fmt(subtotalBruto)}</span>
                        </div>
                        <div className="orc-totais-row orc-totais-desconto">
                            <span>Descontos</span>
                            <span>- {fmt(descontoTotal)}</span>
                        </div>
                    </>
                )}
                <div className="orc-totais-row orc-totais-total">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                </div>
            </section>

            {/* ── Condições de pagamento ── */}
            <section className="orc-pagamento">
                <div className="orc-section-label">CONDIÇÕES DE PAGAMENTO</div>
                <div className="orc-pagamento-grid">
                    <div className="orc-pagamento-item">
                        <span className="orc-pagamento-key">Forma</span>
                        <span className="orc-pagamento-val">
                            {FORMA_PAG_LABELS[orc.formaPagamento] ?? orc.formaPagamento ?? "—"}
                        </span>
                    </div>
                    <div className="orc-pagamento-item">
                        <span className="orc-pagamento-key">Condição</span>
                        <span className="orc-pagamento-val">{condicao}</span>
                    </div>
                    <div className="orc-pagamento-item">
                        <span className="orc-pagamento-key">Validade da proposta</span>
                        <span className="orc-pagamento-val">{fmtData(orc.validade)}</span>
                    </div>
                </div>
            </section>

            {orc.observacoes && (
                <section className="orc-obs">
                    <div className="orc-section-label">OBSERVAÇÕES</div>
                    <p className="orc-obs-text">{orc.observacoes}</p>
                </section>
            )}

            {/* ── Rodapé ── */}
            <footer className="orc-footer">
                <div className="orc-assinatura">
                    <div className="orc-assinatura-linha"/>
                    <div className="orc-assinatura-label">{empresa?.nome ?? "Fornecedor"}</div>
                </div>
                <div className="orc-assinatura">
                    <div className="orc-assinatura-linha"/>
                    <div className="orc-assinatura-label">{orc.cliente?.nome ?? "Cliente"}</div>
                </div>
            </footer>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CSS
   ───────────────────────────────────────────────────────────────────────────── */

const PRINT_CSS = `
/* ── Overlay (tela) ── */
.orc-print-overlay {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: #1a1a2e;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.orc-print-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #111827;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
}

.orc-print-toolbar-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.75);
    letter-spacing: -0.01em;
}

.orc-print-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: opacity 0.15s;
}

.orc-print-btn:hover { opacity: 0.85; }

.orc-print-btn--secondary {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85);
}

.orc-print-btn--primary {
    background: #15c3dd;
    color: #0a1628;
}

.orc-print-paper-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 32px 20px;
    display: flex;
    justify-content: center;
}

/* ── Documento (A4-like) ── */
.orc-doc {
    background: white;
    width: 100%;
    max-width: 760px;
    min-height: 1050px;
    padding: 52px 56px;
    box-shadow: 0 4px 40px rgba(0,0,0,0.35);
    border-radius: 4px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #111827;
    font-size: 13px;
    line-height: 1.55;
    box-sizing: border-box;
}

/* ── Header ── */
.orc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 24px;
}

.orc-header-empresa {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1;
    min-width: 0;
}

.orc-logo {
    width: 56px;
    height: 56px;
    object-fit: contain;
    border-radius: 6px;
    flex-shrink: 0;
}

.orc-header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.orc-empresa-nome {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0a1628;
    margin: 0 0 2px;
    line-height: 1.1;
}

.orc-empresa-detalhe {
    font-size: 11px;
    color: #6b7280;
    display: block;
    line-height: 1.4;
}

.orc-header-doc {
    text-align: right;
    flex-shrink: 0;
}

.orc-doc-badge {
    display: inline-block;
    padding: 4px 12px;
    background: #0a1628;
    color: #15c3dd;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.orc-doc-num {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0a1628;
    line-height: 1;
    margin-bottom: 6px;
}

.orc-doc-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    color: #6b7280;
}

.orc-divider {
    height: 2px;
    background: linear-gradient(90deg, #15c3dd 0%, #0a1628 100%);
    border-radius: 2px;
    margin-bottom: 24px;
}

/* ── Section label ── */
.orc-section-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #15c3dd;
    margin-bottom: 8px;
}

/* ── Cliente ── */
.orc-cliente {
    margin-bottom: 20px;
    padding: 14px 16px;
    background: #f9fafb;
    border-radius: 8px;
    border-left: 3px solid #15c3dd;
}

.orc-cliente-nome {
    font-size: 15px;
    font-weight: 700;
    color: #0a1628;
    letter-spacing: -0.02em;
    margin-bottom: 2px;
}

.orc-cliente-doc {
    font-size: 11px;
    color: #6b7280;
}

/* ── Descrição ── */
.orc-descricao {
    margin-bottom: 20px;
}

.orc-descricao-text {
    margin: 0;
    color: #374151;
    font-size: 13px;
    line-height: 1.6;
}

/* ── Tabela de itens ── */
.orc-itens-section {
    margin-bottom: 0;
}

.orc-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
}

.orc-table thead tr {
    background: #0a1628;
    color: white;
}

.orc-table th {
    padding: 9px 12px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.orc-th-desc { text-align: left; }
.orc-th-num  { text-align: right; min-width: 80px; }

.orc-table tbody tr {
    border-bottom: 1px solid #f3f4f6;
}

.orc-table tbody td {
    padding: 9px 12px;
    font-size: 12.5px;
    color: #374151;
    vertical-align: top;
}

.orc-tr-even td { background: #fafafa; }

.orc-td-num    { text-align: right; white-space: nowrap; }
.orc-td-strong { font-weight: 700; color: #0a1628; }

/* ── Totais ── */
.orc-totais {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 16px 12px 0;
    gap: 6px;
    margin-bottom: 24px;
    border-top: 2px solid #f3f4f6;
}

.orc-totais-row {
    display: flex;
    gap: 40px;
    justify-content: space-between;
    min-width: 260px;
    font-size: 13px;
    color: #6b7280;
}

.orc-totais-desconto { color: #e54848; }

.orc-totais-total {
    font-size: 16px;
    font-weight: 800;
    color: #0a1628;
    padding-top: 8px;
    border-top: 2px solid #0a1628;
    margin-top: 4px;
}

/* ── Pagamento ── */
.orc-pagamento {
    margin-bottom: 20px;
    padding: 14px 16px;
    background: #f0fdfe;
    border-radius: 8px;
    border: 1px solid rgba(21, 195, 221, 0.2);
}

.orc-pagamento-grid {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
}

.orc-pagamento-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.orc-pagamento-key {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b7280;
}

.orc-pagamento-val {
    font-size: 13px;
    font-weight: 600;
    color: #0a1628;
}

/* ── Observações ── */
.orc-obs {
    margin-bottom: 24px;
    padding: 12px 14px;
    background: #fffbeb;
    border-radius: 6px;
    border-left: 3px solid #f59e0b;
}

.orc-obs-text {
    margin: 0;
    font-size: 12px;
    color: #78350f;
    white-space: pre-wrap;
    line-height: 1.6;
}

/* ── Assinatura ── */
.orc-footer {
    display: flex;
    justify-content: space-around;
    gap: 40px;
    margin-top: 48px;
    padding-top: 16px;
}

.orc-assinatura {
    flex: 1;
    text-align: center;
}

.orc-assinatura-linha {
    border-bottom: 1.5px solid #374151;
    width: 80%;
    margin: 0 auto 6px;
}

.orc-assinatura-label {
    font-size: 11px;
    color: #6b7280;
}

/* ── Print media ── */
@media print {
    .no-print { display: none !important; }

    .print-only { display: block !important; }

    body > *:not(.print-only) { display: none !important; }

    .orc-doc {
        box-shadow: none;
        border-radius: 0;
        padding: 20mm 18mm;
        max-width: none;
        width: 100%;
        min-height: auto;
    }

    @page {
        size: A4;
        margin: 0;
    }
}

/* Esconde .print-only no modo tela */
@media screen {
    .print-only { display: none !important; }
}
`;

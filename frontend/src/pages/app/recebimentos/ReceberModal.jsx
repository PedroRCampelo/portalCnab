import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuLandmark, LuArrowRight } from "react-icons/lu";
import api from "../../../services/api.js";
import Modal from "../../../components/ui/Modal.jsx";
import {
    fmtValor, hoje, mascaraMoeda, parseMoeda, formatarMoedaParaInput,
} from "./_helpers.js";

/**
 * ReceberModal — Confirmação de baixa de recebimento
 * Sprint A3.6.3 · Refatoração
 *
 * Permite registrar recebimento total OU parcial, com escolha de conta destino.
 *
 * Funcionalidades:
 *  - Pré-preenche valor com saldo pendente (mas pode editar pra parcial)
 *  - Botões "Total" e "Metade" pra preencher rápido
 *  - Indica se é recebimento parcial (saldo restante)
 *  - Carrega contas bancárias e pré-seleciona a "principal"
 *  - Empty state se não houver contas (com link pra Fluxo de Caixa)
 *  - Data padrão = hoje
 *
 * Endpoints:
 *  - GET /api/saldos-bancarios (carrega contas)
 *  - onConfirmar callback chama POST /api/recebimentos/{id}/receber no parent
 *
 * Props:
 *  recebimento — objeto com .saldoPendente, .cliente, .descricao
 *  onConfirmar — function({ valor, dataRecebimento, contaId })
 *  onFechar    — function
 */
export default function ReceberModal({ recebimento, onConfirmar, onFechar }) {

    const saldo = Number(recebimento.saldoPendente);

    const [valor, setValor]           = useState(() => formatarMoedaParaInput(saldo));
    const [data, setData]             = useState(hoje());
    const [contaId, setContaId]       = useState("");
    const [contas, setContas]         = useState([]);
    const [carregandoContas, setCarregandoContas] = useState(false);
    const [erro, setErro]             = useState("");
    const [salvando, setSalvando]     = useState(false);

    // Carrega contas e pré-seleciona principal
    useEffect(() => {
        async function carregar() {
            setCarregandoContas(true);
            try {
                const { data: lista } = await api.get("/api/saldos-bancarios");
                setContas(lista || []);
                const principal = lista?.find(c => c.principal);
                const padrao = principal ?? lista?.[0];
                if (padrao) setContaId(padrao.id);
            } catch (err) {
                console.error("Erro ao carregar contas", err);
            } finally {
                setCarregandoContas(false);
            }
        }
        carregar();
    }, []);

    async function confirmar() {
        setErro("");
        const valorNum = parseMoeda(valor);

        if (valorNum <= 0) {
            setErro("Informe um valor válido");
            return;
        }
        if (valorNum > saldo) {
            setErro(`Valor maior que saldo pendente (${fmtValor(saldo)})`);
            return;
        }
        if (!contaId) {
            setErro("Selecione a conta bancária do recebimento");
            return;
        }

        setSalvando(true);
        try {
            await onConfirmar({
                valor: valorNum,
                dataRecebimento: data,
                contaId,
            });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao registrar");
            setSalvando(false);
        }
    }

    const valorNumAtual = parseMoeda(valor);
    const ehTotal       = Math.abs(valorNumAtual - saldo) < 0.01;
    const ehParcial     = valorNumAtual > 0 && valorNumAtual < saldo;
    const saldoRestante = saldo - valorNumAtual;

    return (
        <Modal
            open={true}
            onClose={onFechar}
            size="sm"
            title="Registrar recebimento"
        >
            <Modal.Body>

                {/* Info do recebimento */}
                <div className="rcb-info-box">
                    <div className="rcb-info-cliente">
                        {recebimento.cliente?.nome || "Sem cliente"}
                    </div>
                    <div className="rcb-info-descricao">
                        {recebimento.descricao}
                    </div>
                    <div className="rcb-info-saldo">
                        <span>Saldo pendente:</span>
                        <strong>{fmtValor(saldo)}</strong>
                    </div>
                </div>

                {/* Valor */}
                <div className="rm-field">
                    <label className="rm-label">Valor recebido (R$) *</label>
                    <input
                        type="text"
                        className="rm-input"
                        value={valor}
                        onChange={e => setValor(mascaraMoeda(e.target.value))}
                        autoFocus
                        disabled={salvando}
                    />

                    {/* Atalhos: Total / Metade */}
                    <div className="rcb-shortcuts">
                        <button
                            type="button"
                            className={`rcb-shortcut ${ehTotal ? "active" : ""}`}
                            onClick={() => setValor(formatarMoedaParaInput(saldo))}
                            disabled={salvando}
                        >
                            Total ({fmtValor(saldo)})
                        </button>
                        <button
                            type="button"
                            className="rcb-shortcut"
                            onClick={() => setValor(formatarMoedaParaInput(saldo / 2))}
                            disabled={salvando}
                        >
                            Metade
                        </button>
                    </div>

                    {/* Indicador de parcial */}
                    {ehParcial && (
                        <div className="rcb-parcial-hint">
                            <LuArrowRight size={12}/>
                            Recebimento parcial — saldo restante: <strong>{fmtValor(saldoRestante)}</strong>
                        </div>
                    )}
                </div>

                {/* Conta bancária */}
                <div className="rm-field">
                    <label className="rm-label">Conta bancária *</label>

                    {carregandoContas ? (
                        <div className="rcb-state">Carregando contas...</div>
                    ) : contas.length === 0 ? (
                        <div className="rcb-empty-contas">
                            <LuLandmark size={16}/>
                            <div>
                                <strong>Nenhuma conta bancária cadastrada.</strong>
                                <br/>
                                Cadastre uma em <Link to="/fluxo-caixa" className="rcb-empty-link">Fluxo de Caixa</Link>{" "}
                                antes de registrar a baixa.
                            </div>
                        </div>
                    ) : (
                        <select
                            className="rm-input"
                            value={contaId}
                            onChange={e => setContaId(e.target.value)}
                            disabled={salvando}
                        >
                            <option value="">Selecione a conta</option>
                            {contas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nomeConta}
                                    {c.banco ? ` — ${c.banco}` : ""}
                                    {" · saldo: "}
                                    {fmtValor(c.saldoAtual)}
                                    {c.principal ? " ⭐" : ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Data */}
                <div className="rm-field">
                    <label className="rm-label">Data do recebimento</label>
                    <input
                        type="date"
                        className="rm-input"
                        value={data}
                        onChange={e => setData(e.target.value)}
                        disabled={salvando}
                    />
                </div>

                {erro && <div className="rm-erro">{erro}</div>}
            </Modal.Body>

            <Modal.Footer>
                <button
                    type="button"
                    className="ph-btn ph-btn--ghost"
                    onClick={onFechar}
                    disabled={salvando}
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    className="ph-btn ph-btn--primary"
                    onClick={confirmar}
                    disabled={salvando || !valor || !contaId || contas.length === 0}
                    style={{ background: "var(--success)", borderColor: "var(--success)" }}
                >
                    {salvando ? "Registrando..." : "Confirmar recebimento"}
                </button>
            </Modal.Footer>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS
   Reusa .rm-* (de RecebimentoModal/ParceladoModal) + adiciona .rcb-* específicas
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
/* ── Classes .rm-* (mesmas do RecebimentoModal) ────────────────────── */

.rm-field {
    margin-bottom: 14px;
}

.rm-field:last-child {
    margin-bottom: 0;
}

.rm-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink-2);
}

.rm-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1.5px solid var(--hair);
    background: var(--surface);
    color: var(--text);
    font-family: var(--ff-sans);
    font-size: 14px;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
}

.rm-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.rm-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}

.rm-erro {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
    font-size: 13px;
    line-height: 1.4;
    margin-top: 12px;
    margin-bottom: 4px;
}

/* ── Classes .rcb-* (específicas do ReceberModal) ──────────────────── */

/* Info do recebimento (cliente + descrição + saldo) */
.rcb-info-box {
    padding: 14px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
    background: var(--bg);
    border: 1px solid var(--hair);
}

.rcb-info-cliente {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    margin-bottom: 2px;
}

.rcb-info-descricao {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
    margin-bottom: 10px;
}

.rcb-info-saldo {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--hair);
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
    text-transform: uppercase;
    font-weight: 600;
}

.rcb-info-saldo strong {
    font-family: var(--ff-sans);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: var(--navy-deep);
    text-transform: none;
    font-variant-numeric: tabular-nums;
}

/* Atalhos Total / Metade */
.rcb-shortcuts {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    flex-wrap: wrap;
}

.rcb-shortcut {
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
    font-family: var(--ff-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.15s;
}

.rcb-shortcut:hover:not(:disabled) {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.rcb-shortcut.active {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.rcb-shortcut:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Hint de parcial */
.rcb-parcial-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.2);
    font-size: 12px;
    line-height: 1.4;
    color: var(--ink-2);
}

.rcb-parcial-hint strong {
    color: var(--cyan-dark);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

/* Loading state */
.rcb-state {
    padding: 10px 12px;
    color: var(--text-dim);
    font-size: 13px;
    text-align: center;
}

/* Empty state quando não há contas */
.rcb-empty-contas {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.25);
    color: var(--ink-2);
    font-size: 12px;
    line-height: 1.5;
}

.rcb-empty-contas svg {
    color: var(--warning);
    flex-shrink: 0;
    margin-top: 1px;
}

.rcb-empty-contas strong {
    color: var(--navy-deep);
    font-weight: 600;
}

.rcb-empty-link {
    color: var(--cyan-dark);
    font-weight: 600;
    text-decoration: none;
}

.rcb-empty-link:hover {
    text-decoration: underline;
}
`;
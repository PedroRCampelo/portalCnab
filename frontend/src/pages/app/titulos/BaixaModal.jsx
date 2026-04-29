import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuLandmark, LuCircleCheck, LuArrowRight } from "react-icons/lu";
import api from "../../../services/api.js";
import Modal from "../../../components/ui/Modal.jsx";
import {
    fmtValor, hoje, mascaraMoeda, parseMoeda, formatarMoedaParaInput,
} from "./_helpers.js";

/**
 * BaixaModal — Confirmação de pagamento de título
 * Sprint A3.6.5.3 · Refatoração
 *
 * Permite registrar pagamento total OU parcial, com escolha de conta destino.
 *
 * Recursos:
 *  - Pré-preenche valor com saldo
 *  - Indica visualmente: quitação total (verde) ou parcial (warning)
 *  - Mostra acréscimo se valor > saldo
 *  - Carrega contas bancárias e pré-seleciona "principal"
 *  - Empty state se não houver contas (com link Fluxo de Caixa)
 *
 * Endpoints consumidos:
 *  - GET /api/saldos-bancarios
 *  - onConfirmar callback chama POST /api/titulos/{id}/baixa no parent
 *
 * Props:
 *  titulo      — objeto com .saldo, .valor, .fornecedorNome, .numero
 *  onConfirmar — function({ valorPago, dataBaixa, observacao, contaId })
 *  onFechar    — function
 */
export default function BaixaModal({ titulo, onConfirmar, onFechar }) {

    const saldoAtual = Number(titulo.saldo ?? titulo.valor ?? 0);

    const [valor,    setValor]    = useState(() => formatarMoedaParaInput(saldoAtual));
    const [data,     setData]     = useState(hoje());
    const [obs,      setObs]      = useState("");
    const [contaId,  setContaId]  = useState("");

    const [contas,   setContas]   = useState([]);
    const [carregandoContas, setCarregandoContas] = useState(false);

    const [erro,     setErro]     = useState("");
    const [salvando, setSalvando] = useState(false);

    // Carrega contas bancárias e pré-seleciona principal
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
            setErro("Informe um valor maior que zero");
            return;
        }
        if (!contaId) {
            setErro("Selecione a conta bancária do pagamento");
            return;
        }

        setSalvando(true);
        try {
            await onConfirmar({
                valorPago:  valorNum,
                dataBaixa:  data,
                observacao: obs,
                contaId,
            });
            setSalvando(false);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao registrar baixa");
            setSalvando(false);
        }
    }

    function handleClose() {
        if (salvando) return;
        onFechar();
    }

    // ── Cálculos derivados ──────────────────────────────────────────────────

    const valorBaixa = parseMoeda(valor);
    const novoSaldo  = Math.max(0, saldoAtual - valorBaixa);
    const acrescimo  = valorBaixa > saldoAtual ? valorBaixa - saldoAtual : 0;
    const quita      = valorBaixa >= saldoAtual && valorBaixa > 0;
    const ehParcial  = valorBaixa > 0 && valorBaixa < saldoAtual;

    return (
        <Modal
            open={true}
            onClose={handleClose}
            size="sm"
            title="Registrar baixa"
        >
            <Modal.Body>

                {/* Info do título */}
                <div className="bxm-info-box">
                    <div className="bxm-info-fornecedor">
                        {titulo.fornecedorNome}
                    </div>
                    <div className="bxm-info-numero">
                        {titulo.prefixo && `${titulo.prefixo} `}
                        #{titulo.numero}
                        {titulo.parcela && titulo.parcela !== "001" && ` · Parcela ${titulo.parcela}`}
                    </div>
                    <div className="bxm-info-saldo">
                        <span>Saldo atual:</span>
                        <strong>{fmtValor(saldoAtual)}</strong>
                    </div>
                </div>

                {/* Valor pago */}
                <div className="bxm-field">
                    <label className="bxm-label">
                        Valor pago (R$)
                        <span className="bxm-label-req">*</span>
                    </label>
                    <input
                        type="text"
                        className="bxm-input bxm-input--big"
                        inputMode="numeric"
                        value={valor}
                        onChange={e => setValor(mascaraMoeda(e.target.value))}
                        placeholder="0,00"
                        autoFocus
                        disabled={salvando}
                    />

                    {/* Atalhos: Total / Metade */}
                    <div className="bxm-shortcuts">
                        <button
                            type="button"
                            className={`bxm-shortcut ${quita ? "active" : ""}`}
                            onClick={() => setValor(formatarMoedaParaInput(saldoAtual))}
                            disabled={salvando}
                        >
                            Total ({fmtValor(saldoAtual)})
                        </button>
                        <button
                            type="button"
                            className="bxm-shortcut"
                            onClick={() => setValor(formatarMoedaParaInput(saldoAtual / 2))}
                            disabled={salvando}
                        >
                            Metade
                        </button>
                    </div>

                    {/* Indicador de quitação ou parcial */}
                    {valorBaixa > 0 && (
                        quita ? (
                            <div className="bxm-status bxm-status--quita">
                                <LuCircleCheck size={14}/>
                                <span>
                                    Título quitado
                                    {acrescimo > 0 && (
                                        <span style={{ color: "var(--text-dim)" }}>
                                            {" "}· acréscimo de <strong>{fmtValor(acrescimo)}</strong>
                                        </span>
                                    )}
                                </span>
                            </div>
                        ) : ehParcial && (
                            <div className="bxm-status bxm-status--parcial">
                                <LuArrowRight size={12}/>
                                <span>
                                    Pagamento parcial — saldo restante: <strong>{fmtValor(novoSaldo)}</strong>
                                </span>
                            </div>
                        )
                    )}
                </div>

                {/* Conta bancária */}
                <div className="bxm-field">
                    <label className="bxm-label">
                        Conta bancária
                        <span className="bxm-label-req">*</span>
                    </label>

                    {carregandoContas ? (
                        <div className="bxm-state">Carregando contas...</div>
                    ) : contas.length === 0 ? (
                        <div className="bxm-empty-contas">
                            <LuLandmark size={16}/>
                            <div>
                                <strong>Nenhuma conta bancária cadastrada.</strong>
                                <br/>
                                Cadastre uma em <Link to="/fluxo-caixa" className="bxm-empty-link">Fluxo de Caixa</Link>{" "}
                                antes de registrar a baixa.
                            </div>
                        </div>
                    ) : (
                        <select
                            className="bxm-input"
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

                {/* Data + Observação */}
                <div className="bxm-grid-2">
                    <div className="bxm-field">
                        <label className="bxm-label">Data da baixa</label>
                        <input
                            type="date"
                            className="bxm-input"
                            value={data}
                            onChange={e => setData(e.target.value)}
                            disabled={salvando}
                        />
                    </div>
                    <div className="bxm-field">
                        <label className="bxm-label">
                            Observação
                            <span className="bxm-label-opt">opcional</span>
                        </label>
                        <input
                            type="text"
                            className="bxm-input"
                            value={obs}
                            onChange={e => setObs(e.target.value)}
                            placeholder="—"
                            maxLength={200}
                            disabled={salvando}
                        />
                    </div>
                </div>

                {erro && <div className="bxm-erro">{erro}</div>}
            </Modal.Body>

            <Modal.Footer>
                <button
                    type="button"
                    className="ph-btn ph-btn--ghost"
                    onClick={handleClose}
                    disabled={salvando}
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    className="ph-btn ph-btn--primary"
                    onClick={confirmar}
                    disabled={salvando || valorBaixa <= 0 || !contaId || contas.length === 0}
                    style={{
                        background: quita ? "var(--success)" : "var(--cyan-dark)",
                        borderColor: quita ? "var(--success)" : "var(--cyan-dark)",
                    }}
                >
                    {salvando
                        ? "Registrando..."
                        : quita
                            ? "Confirmar quitação"
                            : "Confirmar baixa parcial"}
                </button>
            </Modal.Footer>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .bxm-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.bxm-field {
    margin-bottom: 14px;
}

.bxm-field:last-child {
    margin-bottom: 0;
}

.bxm-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
}

.bxm-grid-2 .bxm-field {
    margin-bottom: 0;
}

.bxm-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink-2);
}

.bxm-label-req {
    color: var(--warning);
    font-weight: 700;
}

.bxm-label-opt {
    font-weight: 400;
    font-size: 11px;
    color: var(--text-dim);
}

.bxm-input {
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

.bxm-input--big {
    font-size: 18px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.015em;
}

.bxm-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.bxm-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}

/* ── Info box do título ──────────────────────────────────────────────── */

.bxm-info-box {
    padding: 14px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
    background: var(--bg);
    border: 1px solid var(--hair);
}

.bxm-info-fornecedor {
    font-size: 14px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    margin-bottom: 2px;
}

.bxm-info-numero {
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    margin-bottom: 10px;
}

.bxm-info-saldo {
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

.bxm-info-saldo strong {
    font-family: var(--ff-sans);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: var(--warning);
    text-transform: none;
    font-variant-numeric: tabular-nums;
}

/* ── Atalhos Total / Metade ──────────────────────────────────────────── */

.bxm-shortcuts {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    flex-wrap: wrap;
}

.bxm-shortcut {
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

.bxm-shortcut:hover:not(:disabled) {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.bxm-shortcut.active {
    border-color: var(--success);
    background: var(--success-bg);
    color: var(--success);
}

.bxm-shortcut:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ── Status (quita/parcial) ──────────────────────────────────────────── */

.bxm-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
}

.bxm-status--quita {
    background: var(--success-bg);
    border: 1px solid rgba(24, 178, 107, 0.25);
    color: var(--success);
    font-weight: 600;
}

.bxm-status--quita strong {
    color: var(--text);
    font-weight: 700;
}

.bxm-status--parcial {
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.25);
    color: var(--ink-2);
}

.bxm-status--parcial svg {
    color: var(--warning);
    flex-shrink: 0;
}

.bxm-status--parcial strong {
    color: var(--warning);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

/* ── Loading state ───────────────────────────────────────────────────── */

.bxm-state {
    padding: 10px 12px;
    color: var(--text-dim);
    font-size: 13px;
    text-align: center;
}

/* ── Empty state quando não há contas ─────────────────────────────────── */

.bxm-empty-contas {
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

.bxm-empty-contas svg {
    color: var(--warning);
    flex-shrink: 0;
    margin-top: 1px;
}

.bxm-empty-contas strong {
    color: var(--navy-deep);
    font-weight: 600;
}

.bxm-empty-link {
    color: var(--cyan-dark);
    font-weight: 600;
    text-decoration: none;
}

.bxm-empty-link:hover {
    text-decoration: underline;
}

/* ── Erro ────────────────────────────────────────────────────────────── */

.bxm-erro {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.3);
    color: var(--warning);
    font-size: 13px;
    line-height: 1.4;
    margin-top: 12px;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .bxm-grid-2 {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}
`;
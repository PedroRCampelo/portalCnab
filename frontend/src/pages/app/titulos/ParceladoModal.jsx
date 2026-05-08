import { useState, useMemo } from "react";
import { LuLayers, LuCalendar } from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import {
    fmtData, fmtValor, hoje, parseMoeda,
    PARCELADO_VAZIO,
} from "./_helpers.js";

/**
 * ParceladoModal — Cria N parcelas de um título
 * Sprint A3.6.5.3 · Refatoração
 *
 * Recursos:
 *  - Quantidade de parcelas (2-360)
 *  - Intervalo: semanal/quinzenal/mensal/etc + customizado
 *  - Data do 1º vencimento
 *  - Preview das primeiras 4 parcelas com datas calculadas
 *
 * Endpoint:
 *  - onSalvar callback chama POST /api/titulos/parcelado no parent
 *    Payload esperado: { titulo: {...formBase}, qtdParcelas, intervaloDias, vencimento1 }
 *
 * Props:
 *  formBase — dados básicos do título (vindo do TituloModal)
 *  onSalvar — function({ titulo, qtdParcelas, intervaloDias })
 *  onFechar — function
 *  salvando — bool
 */
export default function ParceladoModal({ formBase, onSalvar, onFechar, salvando }) {

    const [form, setForm] = useState(PARCELADO_VAZIO);
    const [erro, setErro] = useState("");

    function atualizar(campo, valor) {
        setForm(p => ({ ...p, [campo]: valor }));
    }

    // Resolve intervalo final (numérico)
    const intervaloFinal = useMemo(() => {
        if (form.intervaloDias === "customizado") {
            return parseInt(form.diasCustomizados) || 0;
        }
        return parseInt(form.intervaloDias) || 0;
    }, [form.intervaloDias, form.diasCustomizados]);

    const qtdNum = parseInt(form.qtdParcelas) || 0;

    // Preview das datas das parcelas (até 4 primeiras)
    const previewDatas = useMemo(() => {
        if (!form.vencimento1 || qtdNum < 2 || intervaloFinal < 1) return [];
        const datas = [];
        const limite = Math.min(qtdNum, 4);
        for (let i = 0; i < limite; i++) {
            const d = new Date(form.vencimento1 + "T00:00:00");
            d.setDate(d.getDate() + (i * intervaloFinal));
            datas.push(d.toISOString().split("T")[0]);
        }
        return datas;
    }, [form.vencimento1, qtdNum, intervaloFinal]);

    const valorPorParcela = useMemo(() => {
        if (!formBase?.valor) return 0;
        const total = parseMoeda(formBase.valor);
        return qtdNum > 0 ? total / qtdNum : 0;
    }, [formBase?.valor, qtdNum]);

    async function handleSalvar() {
        setErro("");

        if (qtdNum < 2 || qtdNum > 360) {
            setErro("Número de parcelas deve ser entre 2 e 360.");
            return;
        }
        if (intervaloFinal < 1) {
            setErro("Intervalo deve ser de pelo menos 1 dia.");
            return;
        }
        if (!form.vencimento1) {
            setErro("Informe a data do 1º vencimento.");
            return;
        }

        try {
            await onSalvar({
                titulo: {
                    ...formBase,
                    tipoGastoId: formBase.tipoGastoId || null,
                    valor:    parseMoeda(formBase.valor),
                    saldo:    parseMoeda(formBase.valor),
                    desconto: parseMoeda(formBase.desconto),
                    juros:    parseMoeda(formBase.juros),
                    multa:    parseMoeda(formBase.multa),
                    vencimento: form.vencimento1,
                },
                qtdParcelas:   qtdNum,
                intervaloDias: intervaloFinal,
            });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar parcelas");
        }
    }

    function handleClose() {
        if (salvando) return;
        onFechar();
    }

    return (
        <Modal
            open={true}
            onClose={handleClose}
            size="default"
            title="Lançamento parcelado"
            description={
                formBase && (
                    <>Serão criados <strong>{qtdNum || 2} títulos</strong> com base em{" "}
                        <strong>#{formBase.numero || "—"}</strong>{" "}
                        de <strong>{formBase.fornecedorNome || "—"}</strong>,{" "}
                        valor <strong>{formBase.valor || "0,00"}</strong> cada.</>
                )
            }
        >
            <Modal.Body>

                {/* Vencimento da 1ª parcela */}
                <div className="pcm-field">
                    <label className="pcm-label">
                        Vencimento da 1ª parcela
                        <span className="pcm-label-req">*</span>
                    </label>
                    <input
                        type="date"
                        className="pcm-input"
                        value={form.vencimento1}
                        onChange={e => atualizar("vencimento1", e.target.value)}
                        disabled={salvando}
                    />
                </div>

                {/* Qtd parcelas + Intervalo (grid 2 col) */}
                <div className="pcm-grid-2">
                    <div className="pcm-field">
                        <label className="pcm-label">
                            Número de parcelas
                            <span className="pcm-label-req">*</span>
                        </label>
                        <input
                            type="text"
                            className="pcm-input"
                            inputMode="numeric"
                            value={form.qtdParcelas}
                            onChange={e => atualizar("qtdParcelas", e.target.value.replace(/\D/g, ""))}
                            placeholder="Ex: 12"
                            disabled={salvando}
                        />
                    </div>
                    <div className="pcm-field">
                        <label className="pcm-label">
                            Intervalo entre parcelas
                            <span className="pcm-label-req">*</span>
                        </label>
                        <select
                            className="pcm-input"
                            value={form.intervaloDias}
                            onChange={e => atualizar("intervaloDias", e.target.value)}
                            disabled={salvando}
                        >
                            <option value="7">Semanal (7 dias)</option>
                            <option value="15">Quinzenal (15 dias)</option>
                            <option value="30">Mensal (30 dias)</option>
                            <option value="60">Bimestral (60 dias)</option>
                            <option value="90">Trimestral (90 dias)</option>
                            <option value="customizado">Personalizado</option>
                        </select>
                    </div>
                </div>

                {/* Dias customizados (só aparece se selecionou) */}
                {form.intervaloDias === "customizado" && (
                    <div className="pcm-field">
                        <label className="pcm-label">
                            Dias entre parcelas
                            <span className="pcm-label-req">*</span>
                        </label>
                        <input
                            type="text"
                            className="pcm-input"
                            inputMode="numeric"
                            value={form.diasCustomizados}
                            onChange={e => atualizar("diasCustomizados", e.target.value.replace(/\D/g, ""))}
                            placeholder="Ex: 45"
                            disabled={salvando}
                        />
                    </div>
                )}

                {/* Preview das primeiras parcelas */}
                {previewDatas.length > 0 && (
                    <div className="pcm-preview">
                        <div className="pcm-preview-head">
                            <LuCalendar size={12}/>
                            <span>Preview das primeiras parcelas</span>
                        </div>
                        <div className="pcm-preview-list">
                            {previewDatas.map((d, i) => (
                                <div key={i} className="pcm-preview-row">
                                    <span className="pcm-preview-num">
                                        {String(i + 1).padStart(3, "0")}/{String(qtdNum).padStart(3, "0")}
                                    </span>
                                    <span className="pcm-preview-date">{fmtData(d)}</span>
                                    <span className="pcm-preview-valor">
                                        {fmtValor(valorPorParcela)}
                                    </span>
                                </div>
                            ))}
                            {qtdNum > 4 && (
                                <div className="pcm-preview-more">
                                    + {qtdNum - 4} parcelas seguintes...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {erro && <div className="pcm-erro">{erro}</div>}
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
                    onClick={handleSalvar}
                    disabled={salvando || qtdNum < 2 || !form.vencimento1}
                >
                    <LuLayers size={14}/>
                    {salvando ? "Criando..." : `Criar ${qtdNum >= 2 ? qtdNum : ""} parcelas`.trim()}
                </button>
            </Modal.Footer>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .pcm-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.pcm-field {
    margin-bottom: 14px;
}

.pcm-field:last-child {
    margin-bottom: 0;
}

.pcm-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
}

.pcm-grid-2 .pcm-field {
    margin-bottom: 0;
}

.pcm-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink-2);
}

.pcm-label-req {
    color: var(--warning);
    font-weight: 700;
}

.pcm-input {
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

.pcm-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.pcm-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}

/* ── Preview de parcelas ─────────────────────────────────────────────── */

.pcm-preview {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.2);
}

.pcm-preview-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cyan-dark);
}

.pcm-preview-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.pcm-preview-row {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid rgba(21, 195, 221, 0.12);
    font-size: 13px;
    color: var(--ink-2);
}

.pcm-preview-row:last-child {
    border-bottom: none;
}

.pcm-preview-num {
    font-family: var(--ff-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--cyan-dark);
    letter-spacing: 0.04em;
}

.pcm-preview-date {
    font-size: 13px;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}

.pcm-preview-valor {
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
    text-align: right;
}

.pcm-preview-more {
    margin-top: 6px;
    text-align: center;
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    font-style: italic;
}

/* ── Erro ────────────────────────────────────────────────────────────── */

.pcm-erro {
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
    .pcm-grid-2 {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}
`;
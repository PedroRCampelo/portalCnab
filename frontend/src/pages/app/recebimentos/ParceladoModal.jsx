import { useState } from "react";
import Modal from "../../../components/ui/Modal.jsx";
import ClienteAutocomplete from "./ClienteAutocomplete.jsx";
import {
    fmtValor, hoje, mascaraMoeda, parseMoeda,
    FORMAS_PAGAMENTO, PARCELADO_VAZIO,
} from "./_helpers.js";

/**
 * ParceladoModal — Cadastro de recebimento parcelado
 * Sprint A3.6.2 · Refatoração
 *
 * Cria N parcelas em sequência com intervalo customizável.
 * Mostra preview das parcelas com ajuste centesimal na última.
 *
 * Props:
 *  onSalvar — function(payload)
 *  onFechar — function
 *  salvando — bool
 */
export default function ParceladoModal({ onSalvar, onFechar, salvando }) {

    const [form, setForm] = useState({ ...PARCELADO_VAZIO, dataVencimentoPrimeira: hoje() });
    const [erro, setErro] = useState("");

    function atualizar(c, v) {
        setForm(p => ({ ...p, [c]: v }));
    }

    // Cálculo de parcelas (preview)
    const valorTotalNum         = parseMoeda(form.valorTotal);
    const qtd                   = Number(form.qtdParcelas) || 0;
    const valorPorParcela       = qtd > 0 ? valorTotalNum / qtd : 0;
    const valorParcelaArredondado = Math.round(valorPorParcela * 100) / 100;
    const totalArredondado      = valorParcelaArredondado * (qtd - 1);
    const ultimaParcela         = qtd > 0 ? valorTotalNum - totalArredondado : 0;
    const ehUltimaDiferente     = qtd >= 2 &&
        Math.abs(ultimaParcela - valorParcelaArredondado) > 0.001;

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        // Validações
        if (!form.clienteId)              { setErro("Selecione um cliente"); return; }
        if (!form.descricao.trim())       { setErro("Descrição é obrigatória"); return; }
        if (valorTotalNum <= 0)           { setErro("Informe o valor total"); return; }
        if (qtd < 2 || qtd > 360)         { setErro("Número de parcelas entre 2 e 360"); return; }
        if (!form.dataVencimentoPrimeira) { setErro("Data do primeiro vencimento é obrigatória"); return; }
        const intervalo = Number(form.intervaloDias);
        if (intervalo < 1 || intervalo > 365) {
            setErro("Intervalo entre 1 e 365 dias");
            return;
        }

        try {
            await onSalvar({
                clienteId:              form.clienteId,
                descricao:              form.descricao.trim(),
                categoria:              form.categoria || null,
                dataVencimentoPrimeira: form.dataVencimentoPrimeira,
                valorTotal:             valorTotalNum,
                qtdParcelas:            qtd,
                intervaloDias:          intervalo,
                formaPagamento:         form.formaPagamento,
                observacao:             form.observacao || null,
            });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar parcelas");
        }
    }

    return (
        <Modal
            open={true}
            onClose={onFechar}
            size="default"
            title="Recebimento parcelado"
            description="Crie várias parcelas de uma vez com intervalo customizável."
        >
            <form onSubmit={handleSubmit}>
                <Modal.Body>

                    {/* Cliente */}
                    <div className="rm-field">
                        <label className="rm-label">Cliente *</label>
                        <ClienteAutocomplete
                            valor={form.clienteId}
                            onChange={id => atualizar("clienteId", id)}
                            disabled={salvando}
                        />
                    </div>

                    {/* Descrição */}
                    <div className="rm-field">
                        <label className="rm-label">Descrição *</label>
                        <input
                            type="text"
                            className="rm-input"
                            value={form.descricao}
                            onChange={e => atualizar("descricao", e.target.value)}
                            placeholder="Ex: Pacote de consultoria 6 meses"
                            required
                            disabled={salvando}
                            maxLength={255}
                        />
                        <small className="rm-hint">
                            Cada parcela receberá "(N/total)" automaticamente após a descrição.
                        </small>
                    </div>

                    {/* Valor total + Quantidade de parcelas */}
                    <div className="rm-grid-2">
                        <div className="rm-field">
                            <label className="rm-label">Valor total (R$) *</label>
                            <input
                                type="text"
                                className="rm-input"
                                value={form.valorTotal}
                                onChange={e => atualizar("valorTotal", mascaraMoeda(e.target.value))}
                                placeholder="0,00"
                                required
                                disabled={salvando}
                            />
                        </div>
                        <div className="rm-field">
                            <label className="rm-label">Qtd. de parcelas *</label>
                            <input
                                type="number"
                                className="rm-input"
                                min="2"
                                max="360"
                                value={form.qtdParcelas}
                                onChange={e => atualizar("qtdParcelas", e.target.value)}
                                required
                                disabled={salvando}
                            />
                        </div>
                    </div>

                    {/* 1º vencimento + Intervalo */}
                    <div className="rm-grid-2">
                        <div className="rm-field">
                            <label className="rm-label">1º vencimento *</label>
                            <input
                                type="date"
                                className="rm-input"
                                value={form.dataVencimentoPrimeira}
                                onChange={e => atualizar("dataVencimentoPrimeira", e.target.value)}
                                required
                                disabled={salvando}
                            />
                        </div>
                        <div className="rm-field">
                            <label className="rm-label">Intervalo *</label>
                            <select
                                className="rm-input"
                                value={form.intervaloDias}
                                onChange={e => atualizar("intervaloDias", Number(e.target.value))}
                                disabled={salvando}
                            >
                                <option value="7">Semanal (7 dias)</option>
                                <option value="15">Quinzenal (15 dias)</option>
                                <option value="30">Mensal (30 dias)</option>
                                <option value="60">Bimestral (60 dias)</option>
                                <option value="90">Trimestral (90 dias)</option>
                                <option value="180">Semestral (180 dias)</option>
                                <option value="365">Anual (365 dias)</option>
                            </select>
                        </div>
                    </div>

                    {/* Forma de pagamento */}
                    <div className="rm-field">
                        <label className="rm-label">Forma de pagamento</label>
                        <select
                            className="rm-input"
                            value={form.formaPagamento}
                            onChange={e => atualizar("formaPagamento", e.target.value)}
                            disabled={salvando}
                        >
                            {FORMAS_PAGAMENTO.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Preview das parcelas */}
                    {qtd >= 2 && valorTotalNum > 0 && (
                        <div className="rm-info-box">
                            <div className="rm-info-box-label">Preview das parcelas</div>
                            <div className="rm-info-box-content">
                                <strong>{qtd}</strong> parcelas de <strong>{fmtValor(valorParcelaArredondado)}</strong>
                                {ehUltimaDiferente && (
                                    <> (última de <strong>{fmtValor(ultimaParcela)}</strong> p/ ajuste centesimal)</>
                                )}
                                <br/>
                                Total: <strong>{fmtValor(valorTotalNum)}</strong>
                            </div>
                        </div>
                    )}

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
                        type="submit"
                        className="ph-btn ph-btn--primary"
                        disabled={salvando || qtd < 2 || valorTotalNum <= 0}
                    >
                        {salvando ? "Criando..." : `Criar ${qtd >= 2 ? qtd : ""} parcelas`.trim()}
                    </button>
                </Modal.Footer>
            </form>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .rm-*
   Mesmos do RecebimentoModal — duplicado de propósito, pra cada modal
   ter seus próprios estilos quando aberto sozinho.
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.rm-field {
    margin-bottom: 14px;
}

.rm-field:last-child {
    margin-bottom: 0;
}

.rm-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
}

.rm-grid-2 .rm-field {
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

.rm-label-opt {
    font-weight: 400;
    font-size: 11px;
    color: var(--text-dim);
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

.rm-textarea {
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
}

.rm-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--cyan-dark);
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    padding: 8px 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 12px;
    transition: opacity 0.15s;
}

.rm-toggle:hover {
    opacity: 0.7;
}

.rm-extras {
    padding: 16px;
    border-radius: 10px;
    margin-bottom: 12px;
    background: var(--bg);
    border: 1px solid var(--hair);
}

.rm-extras .rm-field:last-child {
    margin-bottom: 0;
}

.rm-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin: 0;
    padding: 4px 0;
}

.rm-checkbox input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--cyan);
    cursor: pointer;
}

.rm-checkbox-text {
    font-size: 13px;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
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

.rm-info-box {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.2);
}

.rm-info-box-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cyan-dark);
    margin-bottom: 8px;
}

.rm-info-box-content {
    font-size: 13px;
    line-height: 1.6;
    color: var(--ink-2);
}

.rm-info-box-content strong {
    color: var(--navy-deep);
    font-weight: 700;
}

.rm-hint {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
}

@media (max-width: 600px) {
    .rm-grid-2 {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}
`;
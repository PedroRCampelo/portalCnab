import { useState, useEffect } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import ClienteAutocomplete from "./ClienteAutocomplete.jsx";
import api from "../../../services/api.js";
import {
    fmtValor, hoje, mascaraMoeda, parseMoeda, formatarMoedaParaInput,
    FORMAS_PAGAMENTO, RECEBIMENTO_VAZIO,
} from "./_helpers.js";

/**
 * RecebimentoModal — Cadastro/edição de recebimento individual
 * Sprint A3.6.2 · Refatoração
 *
 * Campos:
 *  - Cliente (autocomplete)
 *  - Descrição (obrigatório)
 *  - Valor + Vencimento (grid 2 col)
 *  - Forma de pagamento
 *  - "Mais detalhes" (collapse): Categoria, Recorrência, Observação
 *
 * Props:
 *  recebimento — objeto se editando, null se criando
 *  onSalvar    — function(payload)
 *  onFechar    — function
 *  salvando    — bool
 */
export default function RecebimentoModal({ recebimento, onSalvar, onFechar, salvando }) {
    const ehEdicao = !!recebimento;

    const [form, setForm] = useState(() => {
        if (recebimento) {
            return {
                clienteId:       recebimento.cliente?.id ?? "",
                descricao:       recebimento.descricao ?? "",
                categoria:       recebimento.categoria ?? "",
                categoriaId:     recebimento.categoriaId ?? "",
                dataVencimento:  recebimento.dataVencimento ?? "",
                valor:           formatarMoedaParaInput(recebimento.valor),
                formaPagamento:  recebimento.formaPagamento ?? "PIX",
                parcelaAtual:    recebimento.parcelaAtual ?? 1,
                parcelaTotal:    recebimento.parcelaTotal ?? 1,
                recorrente:      recebimento.recorrente ?? false,
                recorrenciaTipo: recebimento.recorrenciaTipo ?? "",
                observacao:      recebimento.observacao ?? "",
            };
        }
        return { ...RECEBIMENTO_VAZIO, dataVencimento: hoje() };
    });

    const [maisDetalhes, setMaisDetalhes] = useState(false);
    const [erro, setErro] = useState("");
    const [categorias, setCategorias] = useState([]);

    // Carrega categorias de receita
    useEffect(() => {
        api.get("/api/categorias?tipo=RECEITA")
            .then(({ data }) => setCategorias(data))
            .catch(() => {});
    }, []);

    function atualizar(c, v) {
        setForm(p => ({ ...p, [c]: v }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        // Validações
        if (!form.clienteId)        { setErro("Selecione um cliente"); return; }
        if (!form.descricao.trim()) { setErro("Descrição é obrigatória"); return; }
        const valorNum = parseMoeda(form.valor);
        if (valorNum <= 0)          { setErro("Valor deve ser maior que zero"); return; }
        if (!form.dataVencimento)   { setErro("Data de vencimento é obrigatória"); return; }

        try {
            await onSalvar({
                clienteId:       form.clienteId,
                descricao:       form.descricao.trim(),
                categoria:       form.categoria || null,
                categoriaId:     form.categoriaId || null,
                dataVencimento:  form.dataVencimento,
                valor:           valorNum,
                formaPagamento:  form.formaPagamento,
                parcelaAtual:    Number(form.parcelaAtual) || 1,
                parcelaTotal:    Number(form.parcelaTotal) || 1,
                recorrente:      !!form.recorrente,
                recorrenciaTipo: form.recorrente ? (form.recorrenciaTipo || "MENSAL") : null,
                observacao:      form.observacao || null,
            });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar");
        }
    }

    return (
        <Modal
            open={true}
            onClose={onFechar}
            size="default"
            title={ehEdicao ? "Editar recebimento" : "Novo recebimento"}
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1, minHeight: 0 }}>
                <Modal.Body>

                    {/* Cliente (autocomplete) */}
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
                            placeholder="Ex: Consultoria mês de abril"
                            required
                            disabled={salvando}
                            maxLength={255}
                        />
                    </div>

                    {/* Valor + Vencimento (grid 2 col) */}
                    <div className="rm-grid-2">
                        <div className="rm-field">
                            <label className="rm-label">Valor (R$) *</label>
                            <input
                                type="text"
                                className="rm-input"
                                value={form.valor}
                                onChange={e => atualizar("valor", mascaraMoeda(e.target.value))}
                                placeholder="0,00"
                                required
                                disabled={salvando}
                            />
                        </div>
                        <div className="rm-field">
                            <label className="rm-label">Vencimento *</label>
                            <input
                                type="date"
                                className="rm-input"
                                value={form.dataVencimento}
                                onChange={e => atualizar("dataVencimento", e.target.value)}
                                required
                                disabled={salvando}
                            />
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

                    {/* Toggle "mais detalhes" */}
                    <button
                        type="button"
                        className="rm-toggle"
                        onClick={() => setMaisDetalhes(m => !m)}
                    >
                        {maisDetalhes ? <LuChevronUp size={14}/> : <LuChevronDown size={14}/>}
                        {maisDetalhes ? "Esconder detalhes" : "Adicionar mais detalhes"}
                    </button>

                    {maisDetalhes && (
                        <div className="rm-extras">

                            {/* Categoria */}
                            <div className="rm-field">
                                <label className="rm-label">
                                    Categoria
                                    <span className="rm-label-opt">opcional</span>
                                </label>
                                <select
                                    className="rm-input"
                                    value={form.categoriaId || ""}
                                    onChange={e => atualizar("categoriaId", e.target.value || null)}
                                    disabled={salvando}
                                >
                                    <option value="">— Sem categoria —</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Recorrência */}
                            <div className="rm-field">
                                <label className="rm-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={form.recorrente}
                                        onChange={e => atualizar("recorrente", e.target.checked)}
                                        disabled={salvando}
                                    />
                                    <span className="rm-checkbox-text">
                                        Recebimento recorrente (cliente fixo)
                                    </span>
                                </label>
                                {form.recorrente && (
                                    <select
                                        className="rm-input"
                                        style={{ marginTop: 8 }}
                                        value={form.recorrenciaTipo || "MENSAL"}
                                        onChange={e => atualizar("recorrenciaTipo", e.target.value)}
                                        disabled={salvando}
                                    >
                                        <option value="SEMANAL">Toda semana</option>
                                        <option value="QUINZENAL">A cada 15 dias</option>
                                        <option value="MENSAL">Todo mês</option>
                                        <option value="ANUAL">Todo ano</option>
                                    </select>
                                )}
                            </div>

                            {/* Observação */}
                            <div className="rm-field">
                                <label className="rm-label">
                                    Observação
                                    <span className="rm-label-opt">opcional</span>
                                </label>
                                <textarea
                                    className="rm-input rm-textarea"
                                    value={form.observacao}
                                    onChange={e => atualizar("observacao", e.target.value)}
                                    placeholder="Notas internas..."
                                    disabled={salvando}
                                    rows={2}
                                />
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
                        disabled={salvando}
                    >
                        {salvando ? "Salvando..." : (ehEdicao ? "Salvar alterações" : "Criar recebimento")}
                    </button>
                </Modal.Footer>
            </form>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .rm-*
   Compartilhados também com ParceladoModal e ReceberModal (mesma classe rm-)
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

/* Toggle "mais detalhes" */
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

/* Extras (collapse) */
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

/* Checkbox */
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

/* Erro */
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

/* Info box (preview de parcelas no ParceladoModal) */
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

/* Hint pequeno abaixo de campo */
.rm-hint {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
}

/* Responsivo */
@media (max-width: 600px) {
    .rm-grid-2 {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}
`;
import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import {
    mascaraTelefone, mascaraDocumento,
    TIPOS_PESSOA, CLIENTE_VAZIO,
} from "./_helpers.js";

/**
 * ClienteModal — Cadastro/edição de cliente
 * Sprint A3.6.4 · Refatoração
 *
 * Campos essenciais (sempre visíveis):
 *  - Nome (obrigatório)
 *  - Telefone (com máscara, recomendado pra cobrança)
 *  - E-mail
 *
 * Campos avançados (collapse "+ Adicionar mais detalhes"):
 *  - Tipo de pessoa (PF/PJ)
 *  - Documento (CPF/CNPJ com máscara)
 *  - Categoria
 *  - Notas internas
 *
 * Props:
 *  cliente  — objeto se editando, null se criando
 *  onSalvar — function(payload) — backend normaliza documento e telefone
 *  onFechar — function
 *  salvando — bool
 */
export default function ClienteModal({ cliente, onSalvar, onFechar, salvando }) {
    const ehEdicao = !!cliente;

    const [form, setForm]                   = useState(cliente || CLIENTE_VAZIO);
    const [maisDetalhes, setMaisDetalhes]   = useState(() => {
        // Abre detalhes automaticamente em edição se já tem dados avançados
        return !!(cliente && (cliente.documento || cliente.categoria || cliente.notas));
    });
    const [erro, setErro] = useState("");

    function atualizar(campo, valor) {
        setForm(p => ({ ...p, [campo]: valor }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        if (!form.nome.trim()) {
            setErro("Nome é obrigatório");
            return;
        }

        try {
            // Normaliza antes de enviar (limpa máscaras)
            const payload = {
                ...form,
                documento: form.documento ? form.documento.replace(/\D/g, "") : null,
                telefone:  form.telefone  ? form.telefone.replace(/\D/g, "")  : null,
            };
            await onSalvar(payload);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar cliente");
        }
    }

    return (
        <Modal
            open={true}
            onClose={onFechar}
            size="default"
            title={ehEdicao ? "Editar cliente" : "Novo cliente"}
        >
            <form onSubmit={handleSubmit}>
                <Modal.Body>

                    {/* Nome */}
                    <div className="cm-field">
                        <label className="cm-label">Nome *</label>
                        <input
                            type="text"
                            className="cm-input"
                            value={form.nome}
                            onChange={e => atualizar("nome", e.target.value)}
                            placeholder="Nome completo do cliente"
                            required
                            disabled={salvando}
                            autoFocus
                            maxLength={100}
                        />
                    </div>

                    {/* Telefone */}
                    <div className="cm-field">
                        <label className="cm-label">
                            Telefone (WhatsApp)
                            <span className="cm-label-hint">recomendado pra cobrança</span>
                        </label>
                        <input
                            type="tel"
                            className="cm-input"
                            value={mascaraTelefone(form.telefone)}
                            onChange={e => atualizar("telefone", e.target.value)}
                            placeholder="(11) 98765-4321"
                            disabled={salvando}
                            maxLength={16}
                        />
                    </div>

                    {/* E-mail */}
                    <div className="cm-field">
                        <label className="cm-label">
                            E-mail
                            <span className="cm-label-opt">opcional</span>
                        </label>
                        <input
                            type="email"
                            className="cm-input"
                            value={form.email}
                            onChange={e => atualizar("email", e.target.value)}
                            placeholder="cliente@email.com"
                            disabled={salvando}
                        />
                    </div>

                    {/* Toggle "mais detalhes" */}
                    <button
                        type="button"
                        className="cm-toggle"
                        onClick={() => setMaisDetalhes(m => !m)}
                    >
                        {maisDetalhes ? <LuChevronUp size={14}/> : <LuChevronDown size={14}/>}
                        {maisDetalhes ? "Esconder detalhes" : "Adicionar mais detalhes"}
                    </button>

                    {maisDetalhes && (
                        <div className="cm-extras">

                            {/* Tipo + Documento (grid 1fr 2fr) */}
                            <div className="cm-grid-doc">
                                <div className="cm-field">
                                    <label className="cm-label">Tipo</label>
                                    <select
                                        className="cm-input"
                                        value={form.tipoPessoa}
                                        onChange={e => atualizar("tipoPessoa", e.target.value)}
                                        disabled={salvando}
                                    >
                                        {TIPOS_PESSOA.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="cm-field">
                                    <label className="cm-label">
                                        {form.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}
                                    </label>
                                    <input
                                        type="text"
                                        className="cm-input"
                                        value={mascaraDocumento(form.documento, form.tipoPessoa)}
                                        onChange={e => atualizar("documento", e.target.value)}
                                        placeholder={form.tipoPessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                                        disabled={salvando}
                                        maxLength={form.tipoPessoa === "PJ" ? 18 : 14}
                                    />
                                </div>
                            </div>

                            {/* Categoria */}
                            <div className="cm-field">
                                <label className="cm-label">
                                    Categoria
                                    <span className="cm-label-opt">opcional</span>
                                </label>
                                <input
                                    type="text"
                                    className="cm-input"
                                    value={form.categoria}
                                    onChange={e => atualizar("categoria", e.target.value)}
                                    placeholder="Ex: consultoria, recorrente, varejo"
                                    disabled={salvando}
                                    maxLength={50}
                                />
                            </div>

                            {/* Notas */}
                            <div className="cm-field">
                                <label className="cm-label">
                                    Notas internas
                                    <span className="cm-label-opt">opcional</span>
                                </label>
                                <textarea
                                    className="cm-input cm-textarea"
                                    value={form.notas}
                                    onChange={e => atualizar("notas", e.target.value)}
                                    placeholder="Observações sobre o cliente..."
                                    disabled={salvando}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {erro && <div className="cm-erro">{erro}</div>}
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
                        disabled={salvando || !form.nome.trim()}
                    >
                        {salvando ? "Salvando..." : (ehEdicao ? "Salvar alterações" : "Criar cliente")}
                    </button>
                </Modal.Footer>
            </form>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .cm-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.cm-field {
    margin-bottom: 14px;
}

.cm-field:last-child {
    margin-bottom: 0;
}

.cm-grid-doc {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 12px;
    margin-bottom: 14px;
}

.cm-grid-doc .cm-field {
    margin-bottom: 0;
}

.cm-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink-2);
}

.cm-label-opt {
    font-weight: 400;
    font-size: 11px;
    color: var(--text-dim);
}

.cm-label-hint {
    font-weight: 400;
    font-size: 11px;
    color: var(--text-dim);
    font-style: italic;
}

.cm-input {
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

.cm-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.cm-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}

.cm-textarea {
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
}

.cm-toggle {
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

.cm-toggle:hover {
    opacity: 0.7;
}

.cm-extras {
    padding: 16px;
    border-radius: 10px;
    margin-bottom: 12px;
    background: var(--bg);
    border: 1px solid var(--hair);
}

.cm-extras .cm-field:last-child {
    margin-bottom: 0;
}

.cm-erro {
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

@media (max-width: 600px) {
    .cm-grid-doc {
        grid-template-columns: 1fr;
        gap: 14px;
    }
}
`;
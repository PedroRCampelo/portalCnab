import { useState, useEffect } from "react";
import { LuFileText, LuLayers } from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import {
    mascaraMoeda, mascaraDoc, parseMoeda, formatarMoedaParaInput,
    TIPOS_PAGAMENTO, STATUS_OPS, CAMPOS_OBRIGATORIOS, TITULO_VAZIO,
} from "./_helpers.js";

/**
 * TituloModal — Cadastro/edição de título a pagar
 * Sprint A3.6.5.2 · Refatoração
 *
 * Campos: Identificação, Fornecedor, Datas, Valores, Observação
 *
 * Botões do footer:
 *  - Cancelar (ghost)
 *  - Parcelar (ghost) — só na criação, abre ParceladoModal
 *  - Cadastrar/Salvar (primary)
 *
 * Props:
 *  titulo     — objeto se editando, null se criando
 *  tiposGasto — array de tipos de gasto pra dropdown
 *  onSalvar   — function(payload)
 *  onParcelar — function — abre ParceladoModal
 *  onFechar   — function
 *  salvando   — bool
 */
export default function TituloModal({ titulo, tiposGasto = [], onSalvar, onParcelar, onFechar, salvando }) {
    const ehEdicao = !!titulo;

    const [form, setForm] = useState(TITULO_VAZIO);
    const [erro, setErro] = useState("");

    // Inicializa form quando titulo muda
    useEffect(() => {
        if (titulo) {
            setForm({
                prefixo: titulo.prefixo ?? "AP",
                numero: titulo.numero ?? "",
                parcela: titulo.parcela ?? "01",
                parcelaAtual: titulo.parcelaAtual ?? 1,
                parcelaTotal: titulo.parcelaTotal ?? 1,
                chave: titulo.chave ?? "",
                tipo: titulo.tipo ?? "BOLETO",
                tipoGastoId: titulo.tipoGastoId ?? "",
                fornecedorNome: titulo.fornecedorNome ?? "",
                fornecedorDocumento: titulo.fornecedorDocumento ?? "",
                emissao: titulo.emissao ?? "",
                vencimento: titulo.vencimento ?? "",
                valor:    titulo.valor    ? formatarMoedaParaInput(titulo.valor)    : "",
                desconto: titulo.desconto ? formatarMoedaParaInput(titulo.desconto) : "",
                juros:    titulo.juros    ? formatarMoedaParaInput(titulo.juros)    : "",
                multa:    titulo.multa    ? formatarMoedaParaInput(titulo.multa)    : "",
                observacao: titulo.observacao ?? "",
                status: titulo.status ?? "PENDENTE",
            });
        } else {
            setForm({ ...TITULO_VAZIO });
        }
        setErro("");
    }, [titulo]);

    function atualizar(campo, valor) {
        // Aplica máscara em campo de documento
        if (campo === "fornecedorDocumento") {
            valor = mascaraDoc(valor);
        }
        setForm(p => ({ ...p, [campo]: valor }));
    }

    async function handleSalvar() {
        setErro("");

        // Validação dos obrigatórios
        const faltando = CAMPOS_OBRIGATORIOS.filter(
            c => !form[c] || String(form[c]).trim() === ""
        );
        if (faltando.length > 0) {
            setErro("Preencha todos os campos obrigatórios (marcados com *).");
            return;
        }
        if (parseMoeda(form.valor) <= 0) {
            setErro("O valor deve ser maior que zero.");
            return;
        }

        try {
            const payload = {
                ...form,
                tipoGastoId: form.tipoGastoId || null,
                valor:    parseMoeda(form.valor),
                saldo:    parseMoeda(form.valor),
                desconto: parseMoeda(form.desconto),
                juros:    parseMoeda(form.juros),
                multa:    parseMoeda(form.multa),
            };
            await onSalvar(payload);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar título.");
        }
    }

    function abrirParcelar() {
        // Validação mínima antes de parcelar
        if (!form.fornecedorNome || !form.valor) {
            setErro("Preencha Fornecedor e Valor antes de parcelar.");
            return;
        }
        if (parseMoeda(form.valor) <= 0) {
            setErro("O valor deve ser maior que zero pra parcelar.");
            return;
        }

        // Passa o form atual pro callback do parent
        onParcelar(form);
    }

    // Opções pro select de Tipo de Gasto
    const tipoGastoOpts = [
        { value: "", label: "— Sem categoria —" },
        ...tiposGasto.map(t => ({ value: t.id, label: t.nome })),
    ];

    return (
        <Modal
            open={true}
            onClose={onFechar}
            size="lg"
            title={ehEdicao ? "Editar título" : "Novo título"}
            description={
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    Campos marcados com <span style={{ color: "var(--warning)", fontWeight: 600 }}>*</span> são obrigatórios
                </span>
            }
        >
            <Modal.Body>
                <div className="tm-tab-content">

                        {/* Identificação — somente na edição (readonly) */}
                        {ehEdicao && (
                            <div className="tm-grid-3">
                                <Campo
                                    label="Número"
                                    value={form.numero}
                                    onChange={() => {}}
                                    disabled={true}
                                />
                                <Campo
                                    label="Parcela"
                                    value={form.parcelaAtual && form.parcelaTotal
                                        ? `${String(form.parcelaAtual).padStart(2, "0")} / ${String(form.parcelaTotal).padStart(2, "0")}`
                                        : form.parcela}
                                    onChange={() => {}}
                                    disabled={true}
                                />
                                <Campo
                                    label="Chave"
                                    value={form.chave || ""}
                                    onChange={() => {}}
                                    disabled={true}
                                />
                            </div>
                        )}

                        <div className="tm-grid-3">
                            <Campo
                                label="Tipo pagamento"
                                tipo="select"
                                value={form.tipo}
                                onChange={v => atualizar("tipo", v)}
                                options={TIPOS_PAGAMENTO}
                                disabled={salvando}
                            />
                            <Campo
                                label="Status"
                                tipo="select"
                                value={form.status}
                                onChange={v => atualizar("status", v)}
                                options={STATUS_OPS}
                                disabled={salvando}
                            />
                            <Campo
                                label="Categoria"
                                tipo="select"
                                value={form.tipoGastoId}
                                onChange={v => atualizar("tipoGastoId", v)}
                                options={tipoGastoOpts}
                                disabled={salvando}
                            />
                        </div>

                        {/* Fornecedor */}
                        <div className="tm-grid-2">
                            <Campo
                                label="Nome do fornecedor"
                                obrigatorio
                                value={form.fornecedorNome}
                                onChange={v => atualizar("fornecedorNome", v)}
                                maxLength={150}
                                disabled={salvando}
                            />
                            <Campo
                                label="CNPJ / CPF"
                                value={form.fornecedorDocumento}
                                onChange={v => atualizar("fornecedorDocumento", v)}
                                maxLength={18}
                                disabled={salvando}
                            />
                        </div>

                        {/* Datas */}
                        <div className="tm-grid-2">
                            <Campo
                                label="Emissão"
                                tipo="date"
                                value={form.emissao}
                                onChange={v => atualizar("emissao", v)}
                                disabled={salvando}
                            />
                            <Campo
                                label="Vencimento"
                                obrigatorio
                                tipo="date"
                                value={form.vencimento}
                                onChange={v => atualizar("vencimento", v)}
                                disabled={salvando}
                            />
                        </div>

                        {/* Valores */}
                        <div className="tm-grid-4">
                            <Campo
                                label="Valor (R$)"
                                obrigatorio
                                moeda
                                value={form.valor}
                                onChange={v => atualizar("valor", v)}
                                disabled={salvando}
                            />
                            <Campo
                                label="Desconto"
                                moeda
                                value={form.desconto}
                                onChange={v => atualizar("desconto", v)}
                                disabled={salvando}
                            />
                            <Campo
                                label="Juros"
                                moeda
                                value={form.juros}
                                onChange={v => atualizar("juros", v)}
                                disabled={salvando}
                            />
                            <Campo
                                label="Multa"
                                moeda
                                value={form.multa}
                                onChange={v => atualizar("multa", v)}
                                disabled={salvando}
                            />
                        </div>

                        {/* Observação */}
                        <Campo
                            label="Observação"
                            value={form.observacao}
                            onChange={v => atualizar("observacao", v)}
                            maxLength={500}
                            disabled={salvando}
                        />
                    </div>


                {erro && <div className="tm-erro">{erro}</div>}
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

                {!ehEdicao && (
                    <button
                        type="button"
                        className="ph-btn ph-btn--ghost"
                        onClick={abrirParcelar}
                        disabled={salvando}
                    >
                        <LuLayers size={14}/>
                        Parcelar
                    </button>
                )}

                <button
                    type="button"
                    className="ph-btn ph-btn--primary"
                    onClick={handleSalvar}
                    disabled={salvando}
                >
                    {salvando ? "Salvando..." : (ehEdicao ? "Salvar alterações" : "Cadastrar título")}
                </button>
            </Modal.Footer>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Campo — input genérico (text/select/date/moeda)
   ═════════════════════════════════════════════════════════════════════════════ */

function Campo({ label, value, onChange, tipo = "text", obrigatorio, moeda, options, maxLength, placeholder, disabled }) {
    return (
        <div className="tm-field">
            <label className="tm-label">
                {label}
                {obrigatorio && <span className="tm-label-req">*</span>}
            </label>

            {tipo === "select" ? (
                <select
                    className="tm-input"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                >
                    {options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={moeda ? "text" : tipo}
                    className={`tm-input ${obrigatorio && !value ? "tm-input--required-empty" : ""}`}
                    inputMode={moeda ? "numeric" : undefined}
                    value={value}
                    onChange={e => {
                        let v = e.target.value;
                        if (moeda) v = mascaraMoeda(v);
                        onChange(v);
                    }}
                    placeholder={placeholder ?? (moeda ? "0,00" : "")}
                    maxLength={maxLength}
                    disabled={disabled}
                />
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Secao — bloco visual com kicker mono uppercase + ícone
   ═════════════════════════════════════════════════════════════════════════════ */

function Secao({ icon, title, children }) {
    return (
        <div className="tm-secao">
            <div className="tm-secao-head">
                <span className="tm-secao-icon">{icon}</span>
                <span className="tm-secao-title">{title}</span>
            </div>
            <div className="tm-secao-body">{children}</div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .tm-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
/* ── Tab content ─────────────────────────────────────────────────────── */

.tm-tab-content {
    padding-top: 16px;
}

/* ── Grids ───────────────────────────────────────────────────────────── */

.tm-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 12px;
}

.tm-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0 12px;
}

.tm-grid-4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 0 12px;
}

.tm-grid-conta {
    display: grid;
    grid-template-columns: 2fr 1fr 3fr 1fr;
    gap: 0 12px;
}

.tm-grid-pix {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0 12px;
}

.tm-grid-end {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 0 12px;
}

/* ── Campos ──────────────────────────────────────────────────────────── */

.tm-field {
    margin-bottom: 14px;
    min-width: 0;
}

.tm-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink-2);
}

.tm-label-req {
    margin-left: 3px;
    font-weight: 700;
}

.tm-input {
    width: 100%;
    padding: 9px 12px;
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

.tm-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.tm-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}


/* ── Info box ────────────────────────────────────────────────────────── */

.tm-info-box {
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.2);
    font-size: 12px;
    line-height: 1.5;
    color: var(--ink-2);
}

/* ── Seção ───────────────────────────────────────────────────────────── */

.tm-secao {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--hair);
}

.tm-secao:last-child {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
}

.tm-secao-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.tm-secao-icon {
    color: var(--cyan-dark);
    display: inline-flex;
    line-height: 0;
}

.tm-secao-title {
    color: var(--text-dim);
}

/* ── Erro ────────────────────────────────────────────────────────────── */

.tm-erro {
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

@media (max-width: 700px) {
    .tm-grid-3,
    .tm-grid-4,
    .tm-grid-conta,
    .tm-grid-end {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 460px) {
    .tm-grid-2,
    .tm-grid-3,
    .tm-grid-4,
    .tm-grid-conta,
    .tm-grid-pix,
    .tm-grid-end {
        grid-template-columns: 1fr;
    }
}
`;
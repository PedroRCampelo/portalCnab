import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import {
    LuHandCoins, LuSearch, LuPlus, LuTrash2, LuX, LuLoader,
    LuCircleCheck, LuClock, LuCircleAlert, LuCircleX, LuCircleEllipsis,
    LuCalendar, LuUser, LuChevronDown, LuChevronUp, LuPencil,
    LuLayers, LuUndo2, LuMessageCircle,
} from "react-icons/lu";
import CobrancaWhatsappModal from "../components/CobrancaWhatsappModal.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const FORMAS_PAGAMENTO = [
    { value: "PIX",            label: "Pix" },
    { value: "BOLETO",         label: "Boleto" },
    { value: "DINHEIRO",       label: "Dinheiro" },
    { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
    { value: "CARTAO_DEBITO",  label: "Cartão de débito" },
    { value: "TRANSFERENCIA",  label: "Transferência" },
    { value: "OUTROS",         label: "Outros" },
];

const STATUS_INFO = {
    PENDENTE:  { label: "A receber",  cor: "#D4A017", bg: "rgba(212,160,23,0.10)", border: "rgba(212,160,23,0.25)", icon: <LuClock size={12}/> },
    PARCIAL:   { label: "Parcial",    cor: "#0EA5E9", bg: "rgba(14,165,233,0.10)", border: "rgba(14,165,233,0.25)", icon: <LuCircleEllipsis size={12}/> },
    RECEBIDO:  { label: "Recebido",   cor: "#10B981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", icon: <LuCircleCheck size={12}/> },
    ATRASADO:  { label: "Atrasado",   cor: "#DC2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.20)",  icon: <LuCircleAlert size={12}/> },
    CANCELADO: { label: "Cancelado",  cor: "#94A3B8", bg: "rgba(148,163,184,0.10)",border: "rgba(148,163,184,0.25)",icon: <LuCircleX size={12}/> },
};

const FILTROS_STATUS = [
    { value: "",          label: "Todos" },
    { value: "PENDENTE",  label: "A receber" },
    { value: "ATRASADO",  label: "Atrasados" },
    { value: "PARCIAL",   label: "Parciais" },
    { value: "RECEBIDO",  label: "Recebidos" },
];

const RECEBIMENTO_VAZIO = {
    clienteId: "", descricao: "", categoria: "",
    dataVencimento: "", valor: "", formaPagamento: "PIX",
    parcelaAtual: 1, parcelaTotal: 1,
    recorrente: false, recorrenciaTipo: "", observacao: "",
};

const PARCELADO_VAZIO = {
    clienteId: "", descricao: "", categoria: "",
    dataVencimentoPrimeira: "", valorTotal: "",
    qtdParcelas: 2, intervaloDias: 30,
    formaPagamento: "PIX", observacao: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function hoje() { return new Date().toISOString().split("T")[0]; }

function fmtData(d) {
    if (!d) return "—";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
}

function fmtValor(v) {
    if (v == null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function diasAteVencer(data) {
    if (!data) return null;
    const venc = new Date(data + "T00:00:00");
    const h = new Date(); h.setHours(0,0,0,0);
    return Math.round((venc - h) / (1000 * 60 * 60 * 24));
}

function mascaraMoeda(valor) {
    const nums = String(valor).replace(/\D/g, "");
    if (!nums) return "";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .format(parseFloat(nums) / 100);
}

function parseMoeda(valor) {
    if (!valor) return 0;
    return parseFloat(String(valor).replace(/\./g, "").replace(",", ".")) || 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Badge de Status
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const info = STATUS_INFO[status];
    if (!info) return null;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: info.bg, border: `1px solid ${info.border}`, color: info.cor,
            whiteSpace: "nowrap",
        }}>
            {info.icon} {info.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Autocomplete de cliente
// ─────────────────────────────────────────────────────────────────────────────
function ClienteAutocomplete({ valor, onChange, disabled }) {
    const [termo, setTermo]               = useState("");
    const [resultados, setResultados]     = useState([]);
    const [aberto, setAberto]             = useState(false);
    const [carregando, setCarregando]     = useState(false);
    const [clienteAtual, setClienteAtual] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (valor && (!clienteAtual || clienteAtual.id !== valor)) {
            api.get(`/api/clientes/${valor}`)
                .then(({ data }) => setClienteAtual(data))
                .catch(() => {});
        }
        if (!valor) setClienteAtual(null);
    }, [valor, clienteAtual]);

    useEffect(() => {
        if (!aberto) return;
        setCarregando(true);
        const t = setTimeout(async () => {
            try {
                const { data } = await api.get(`/api/clientes/buscar${termo.trim() ? `?termo=${encodeURIComponent(termo.trim())}` : ""}`);
                setResultados(data);
            } finally { setCarregando(false); }
        }, 250);
        return () => clearTimeout(t);
    }, [termo, aberto]);

    useEffect(() => {
        function handleFora(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setAberto(false);
        }
        document.addEventListener("mousedown", handleFora);
        return () => document.removeEventListener("mousedown", handleFora);
    }, []);

    function selecionar(c) {
        setClienteAtual(c);
        onChange(c.id);
        setAberto(false);
        setTermo("");
    }

    function limpar() {
        setClienteAtual(null);
        onChange("");
        setTermo("");
    }

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            {clienteAtual ? (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 8,
                    background: "rgba(21,195,221,0.06)",
                    border: "1px solid rgba(21,195,221,0.20)",
                }}>
                    <LuUser size={14} style={{ color: "var(--cyan-dark)" }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{clienteAtual.nome}</div>
                        {clienteAtual.telefoneFormatado && (
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{clienteAtual.telefoneFormatado}</div>
                        )}
                    </div>
                    {!disabled && (
                        <button type="button" onClick={limpar} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "var(--text-dim)", padding: 4, lineHeight: 0,
                        }} title="Trocar cliente"><LuX size={14}/></button>
                    )}
                </div>
            ) : (
                <input type="text" value={termo}
                       onChange={e => { setTermo(e.target.value); setAberto(true); }}
                       onFocus={() => setAberto(true)}
                       placeholder="Buscar cliente..." disabled={disabled}/>
            )}

            {aberto && !clienteAtual && (
                <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    marginTop: 4, background: "var(--bg)",
                    border: "1px solid var(--border)", borderRadius: 8,
                    maxHeight: 240, overflowY: "auto", zIndex: 100,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}>
                    {carregando && <div style={{ padding: 16, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>Buscando...</div>}
                    {!carregando && resultados.length === 0 && (
                        <div style={{ padding: 16, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                            <div style={{ marginBottom: 8 }}>Nenhum cliente encontrado.</div>
                            <Link to="/clientes" style={{ color: "var(--cyan-dark)", textDecoration: "none", fontWeight: 600 }}>
                                + Cadastrar novo cliente
                            </Link>
                        </div>
                    )}
                    {!carregando && resultados.map(c => (
                        <button key={c.id} type="button" onClick={() => selecionar(c)}
                                style={{ width: "100%", padding: "10px 12px", textAlign: "left",
                                    background: "transparent", border: "none", cursor: "pointer",
                                    borderBottom: "1px solid var(--border)",
                                    display: "flex", alignItems: "center", gap: 8 }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(21,195,221,0.04)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <LuUser size={14} style={{ color: "var(--text-dim)", flexShrink: 0 }}/>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.nome}</div>
                                {c.telefoneFormatado && (
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.telefoneFormatado}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Modal de cadastro/edição (simples)
// ─────────────────────────────────────────────────────────────────────────────
const RecebimentoModal = memo(function RecebimentoModal({
                                                            recebimento, onSalvar, onFechar, salvando,
                                                        }) {
    const [form, setForm] = useState(() => {
        if (recebimento) {
            return {
                clienteId:       recebimento.cliente?.id ?? "",
                descricao:       recebimento.descricao ?? "",
                categoria:       recebimento.categoria ?? "",
                dataVencimento:  recebimento.dataVencimento ?? "",
                valor:           recebimento.valor != null
                    ? new Intl.NumberFormat("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}).format(Number(recebimento.valor))
                    : "",
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
    const [maisDetalhes, setMais] = useState(false);
    const [erro, setErro]         = useState("");

    function atualizar(c, v) { setForm(p => ({ ...p, [c]: v })); }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
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
        <div style={overlayStyle} onClick={onFechar}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        {recebimento ? "Editar recebimento" : "Novo recebimento"}
                    </h2>
                    <button onClick={onFechar} style={closeBtn}><LuX size={20}/></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
                    <div className="field-group">
                        <label>Cliente *</label>
                        <ClienteAutocomplete valor={form.clienteId}
                                             onChange={id => atualizar("clienteId", id)} disabled={salvando}/>
                    </div>

                    <div className="field-group">
                        <label>Descrição *</label>
                        <input type="text" value={form.descricao}
                               onChange={e => atualizar("descricao", e.target.value)}
                               placeholder="ex: Consultoria mês de abril"
                               required disabled={salvando} maxLength={255}/>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Valor (R$) *</label>
                            <input type="text" value={form.valor}
                                   onChange={e => atualizar("valor", mascaraMoeda(e.target.value))}
                                   placeholder="0,00" required disabled={salvando}/>
                        </div>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Vencimento *</label>
                            <input type="date" value={form.dataVencimento}
                                   onChange={e => atualizar("dataVencimento", e.target.value)}
                                   required disabled={salvando}/>
                        </div>
                    </div>

                    <div className="field-group" style={{ marginTop: 12 }}>
                        <label>Forma de pagamento</label>
                        <select value={form.formaPagamento}
                                onChange={e => atualizar("formaPagamento", e.target.value)}
                                disabled={salvando}>
                            {FORMAS_PAGAMENTO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                    </div>

                    <button type="button" onClick={() => setMais(m => !m)}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--cyan-dark)", fontSize: 13, fontWeight: 600,
                                padding: "8px 0", display: "flex", alignItems: "center", gap: 4,
                                margin: "8px 0 16px",
                            }}>
                        {maisDetalhes ? <LuChevronUp size={14}/> : <LuChevronDown size={14}/>}
                        {maisDetalhes ? "Esconder detalhes" : "+ Adicionar mais detalhes"}
                    </button>

                    {maisDetalhes && (
                        <div style={{
                            padding: "16px", borderRadius: 8, marginBottom: 16,
                            background: "rgba(21,195,221,0.03)",
                            border: "1px solid rgba(21,195,221,0.10)",
                        }}>
                            <div className="field-group">
                                <label>Categoria</label>
                                <input type="text" value={form.categoria}
                                       onChange={e => atualizar("categoria", e.target.value)}
                                       placeholder="ex: serviço, produto"
                                       disabled={salvando} maxLength={50}/>
                            </div>

                            <div className="field-group">
                                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                    <input type="checkbox" checked={form.recorrente}
                                           onChange={e => atualizar("recorrente", e.target.checked)}
                                           disabled={salvando} style={{ margin: 0 }}/>
                                    <span style={{ fontSize: 13 }}>Recebimento recorrente (cliente fixo)</span>
                                </label>
                                {form.recorrente && (
                                    <select value={form.recorrenciaTipo || "MENSAL"}
                                            onChange={e => atualizar("recorrenciaTipo", e.target.value)}
                                            disabled={salvando} style={{ marginTop: 8 }}>
                                        <option value="SEMANAL">Toda semana</option>
                                        <option value="QUINZENAL">A cada 15 dias</option>
                                        <option value="MENSAL">Todo mês</option>
                                        <option value="ANUAL">Todo ano</option>
                                    </select>
                                )}
                            </div>

                            <div className="field-group" style={{ marginBottom: 0 }}>
                                <label>Observação</label>
                                <textarea value={form.observacao}
                                          onChange={e => atualizar("observacao", e.target.value)}
                                          placeholder="Notas internas..." disabled={salvando} rows={2}
                                          style={{ resize: "vertical", fontFamily: "inherit" }}/>
                            </div>
                        </div>
                    )}

                    {erro && <div style={erroBoxStyle}>{erro}</div>}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                        <button type="button" onClick={onFechar} className="btn-secondary" disabled={salvando}>Cancelar</button>
                        <button type="submit" className="auth-box-btn" disabled={salvando}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            {salvando ? "Salvando..." : (recebimento ? "Salvar alterações" : "Criar recebimento")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Modal de criação parcelada
// ─────────────────────────────────────────────────────────────────────────────
const ParceladoModal = memo(function ParceladoModal({ onSalvar, onFechar, salvando }) {
    const [form, setForm] = useState({ ...PARCELADO_VAZIO, dataVencimentoPrimeira: hoje() });
    const [erro, setErro] = useState("");

    function atualizar(c, v) { setForm(p => ({ ...p, [c]: v })); }

    const valorTotalNum = parseMoeda(form.valorTotal);
    const qtd = Number(form.qtdParcelas) || 0;
    const valorPorParcela = qtd > 0 ? valorTotalNum / qtd : 0;
    const valorParcelaArredondado = Math.round(valorPorParcela * 100) / 100;
    const totalArredondado = valorParcelaArredondado * (qtd - 1);
    const ultimaParcela = qtd > 0 ? valorTotalNum - totalArredondado : 0;

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (!form.clienteId)                  { setErro("Selecione um cliente"); return; }
        if (!form.descricao.trim())           { setErro("Descrição é obrigatória"); return; }
        if (valorTotalNum <= 0)               { setErro("Informe o valor total"); return; }
        if (qtd < 2 || qtd > 360)             { setErro("Número de parcelas entre 2 e 360"); return; }
        if (!form.dataVencimentoPrimeira)     { setErro("Data do primeiro vencimento é obrigatória"); return; }
        const intervalo = Number(form.intervaloDias);
        if (intervalo < 1 || intervalo > 365) { setErro("Intervalo entre 1 e 365 dias"); return; }

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
        <div style={overlayStyle} onClick={onFechar}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <LuLayers size={20}/> Recebimento parcelado
                    </h2>
                    <button onClick={onFechar} style={closeBtn}><LuX size={20}/></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
                    <div className="field-group">
                        <label>Cliente *</label>
                        <ClienteAutocomplete valor={form.clienteId}
                                             onChange={id => atualizar("clienteId", id)} disabled={salvando}/>
                    </div>

                    <div className="field-group">
                        <label>Descrição *</label>
                        <input type="text" value={form.descricao}
                               onChange={e => atualizar("descricao", e.target.value)}
                               placeholder="ex: Pacote de consultoria 6 meses"
                               required disabled={salvando} maxLength={255}/>
                        <small style={{ color: "var(--text-dim)", fontSize: 11 }}>
                            Cada parcela receberá "(N/total)" automaticamente após a descrição.
                        </small>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Valor total (R$) *</label>
                            <input type="text" value={form.valorTotal}
                                   onChange={e => atualizar("valorTotal", mascaraMoeda(e.target.value))}
                                   placeholder="0,00" required disabled={salvando}/>
                        </div>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Quantidade de parcelas *</label>
                            <input type="number" min="2" max="360" value={form.qtdParcelas}
                                   onChange={e => atualizar("qtdParcelas", e.target.value)}
                                   required disabled={salvando}/>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>1º vencimento *</label>
                            <input type="date" value={form.dataVencimentoPrimeira}
                                   onChange={e => atualizar("dataVencimentoPrimeira", e.target.value)}
                                   required disabled={salvando}/>
                        </div>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Intervalo (dias) *</label>
                            <select value={form.intervaloDias}
                                    onChange={e => atualizar("intervaloDias", Number(e.target.value))}
                                    disabled={salvando}>
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

                    <div className="field-group" style={{ marginTop: 12 }}>
                        <label>Forma de pagamento</label>
                        <select value={form.formaPagamento}
                                onChange={e => atualizar("formaPagamento", e.target.value)}
                                disabled={salvando}>
                            {FORMAS_PAGAMENTO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                    </div>

                    {qtd >= 2 && valorTotalNum > 0 && (
                        <div style={{
                            marginTop: 16, padding: "14px 16px", borderRadius: 8,
                            background: "rgba(21,195,221,0.05)",
                            border: "1px solid rgba(21,195,221,0.20)",
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)",
                                textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                                Preview das parcelas
                            </div>
                            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>
                                {qtd} parcelas de <strong>{fmtValor(valorParcelaArredondado)}</strong>
                                {Math.abs(ultimaParcela - valorParcelaArredondado) > 0.001 && (
                                    <> (última de <strong>{fmtValor(ultimaParcela)}</strong> p/ ajuste centesimal)</>
                                )}
                                <br/>
                                Total: <strong>{fmtValor(valorTotalNum)}</strong>
                            </div>
                        </div>
                    )}

                    {erro && <div style={erroBoxStyle}>{erro}</div>}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                        <button type="button" onClick={onFechar} className="btn-secondary" disabled={salvando}>Cancelar</button>
                        <button type="submit" className="auth-box-btn" disabled={salvando}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            {salvando ? "Criando..." : `Criar ${qtd} parcelas`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Modal de baixa parcial
// ─────────────────────────────────────────────────────────────────────────────
function ReceberParcialModal({ recebimento, onConfirmar, onFechar }) {
    const [valor, setValor] = useState("");
    const [data, setData]   = useState(hoje());
    const [erro, setErro]   = useState("");
    const [salvando, setSalvando] = useState(false);

    const saldo = Number(recebimento.saldoPendente);

    async function confirmar() {
        setErro("");
        const valorNum = parseMoeda(valor);
        if (valorNum <= 0) { setErro("Informe um valor válido"); return; }
        if (valorNum > saldo) { setErro(`Valor maior que saldo pendente (${fmtValor(saldo)})`); return; }
        setSalvando(true);
        try {
            await onConfirmar({ valor: valorNum, dataRecebimento: data });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao registrar");
            setSalvando(false);
        }
    }

    return (
        <div style={overlayStyle} onClick={onFechar}>
            <div style={{ ...modalStyle, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Registrar recebimento</h2>
                    <button onClick={onFechar} style={closeBtn}><LuX size={18}/></button>
                </div>
                <div style={{ padding: "16px 24px" }}>
                    <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-muted)" }}>
                        Saldo pendente: <strong style={{ color: "var(--text)" }}>{fmtValor(saldo)}</strong>
                    </div>

                    <div className="field-group">
                        <label>Valor recebido (R$)</label>
                        <input type="text" value={valor}
                               onChange={e => setValor(mascaraMoeda(e.target.value))}
                               placeholder={`Máx ${fmtValor(saldo).replace("R$ ", "")}`}
                               autoFocus disabled={salvando}/>
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                            <button type="button" className="btn-secondary"
                                    onClick={() => setValor(new Intl.NumberFormat("pt-BR", {minimumFractionDigits:2}).format(saldo))}
                                    style={{ padding: "5px 10px", fontSize: 12 }}>
                                Total ({fmtValor(saldo)})
                            </button>
                            <button type="button" className="btn-secondary"
                                    onClick={() => setValor(new Intl.NumberFormat("pt-BR", {minimumFractionDigits:2}).format(saldo / 2))}
                                    style={{ padding: "5px 10px", fontSize: 12 }}>
                                Metade
                            </button>
                        </div>
                    </div>

                    <div className="field-group">
                        <label>Data do recebimento</label>
                        <input type="date" value={data} onChange={e => setData(e.target.value)} disabled={salvando}/>
                    </div>

                    {erro && <div style={erroBoxStyle}>{erro}</div>}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                        <button onClick={onFechar} className="btn-secondary" disabled={salvando}>Cancelar</button>
                        <button onClick={confirmar} className="auth-box-btn" disabled={salvando || !valor}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            {salvando ? "Registrando..." : "Confirmar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function RecebimentosPage() {
    const [searchParams] = useSearchParams();
    const clienteFiltroId = searchParams.get("clienteId");

    const [recebimentos, setRecebimentos]     = useState([]);
    const [resumo, setResumo]                 = useState({ aReceberMes: 0, qtdAtrasados: 0, qtdProximosVencer: 0 });
    const [carregando, setCarregando]         = useState(true);
    const [filtroStatus, setFiltroStatus]     = useState("");
    const [busca, setBusca]                   = useState("");
    const [paginaAtual, setPaginaAtual]       = useState(0);
    const [totalPaginas, setTotalPaginas]     = useState(0);
    const [erro, setErro]                     = useState("");

    const [modalAberto, setModalAberto]       = useState(false);
    const [modalParcelado, setModalParcelado] = useState(false);
    const [editando, setEditando]             = useState(null);
    const [salvando, setSalvando]             = useState(false);
    const [parcialAberto, setParcialAberto]   = useState(null);
    const [cobrancaAberta, setCobrancaAberta] = useState(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const params = new URLSearchParams();
            params.set("pagina", paginaAtual);
            params.set("tamanho", "20");
            if (filtroStatus)    params.set("status", filtroStatus);
            if (clienteFiltroId) params.set("clienteId", clienteFiltroId);

            const [{ data: page }, { data: res }] = await Promise.all([
                api.get(`/api/recebimentos?${params}`),
                api.get("/api/recebimentos/resumo"),
            ]);

            setRecebimentos(page.content);
            setTotalPaginas(page.totalPages);
            setResumo(res);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar recebimentos");
        } finally {
            setCarregando(false);
        }
    }, [filtroStatus, clienteFiltroId, paginaAtual]);

    useEffect(() => { carregar(); }, [carregar]);

    const recebimentosFiltrados = busca.trim()
        ? recebimentos.filter(r =>
            r.descricao.toLowerCase().includes(busca.toLowerCase()) ||
            r.cliente?.nome.toLowerCase().includes(busca.toLowerCase())
        )
        : recebimentos;

    function abrirNovo() { setEditando(null); setModalAberto(true); }

    function abrirEdicao(r) {
        // Regra ERP: não permite editar recebimento com baixa
        if (Number(r.valorRecebido) > 0 || r.status === "CANCELADO") {
            setErro("Este recebimento não pode ser editado. Estorne a baixa primeiro.");
            return;
        }
        setEditando(r);
        setModalAberto(true);
    }

    async function salvar(payload) {
        setSalvando(true);
        try {
            if (editando) {
                await api.put(`/api/recebimentos/${editando.id}`, payload);
            } else {
                await api.post("/api/recebimentos", payload);
            }
            setModalAberto(false);
            setEditando(null);
            await carregar();
        } finally {
            setSalvando(false);
        }
    }

    async function salvarParcelado(payload) {
        setSalvando(true);
        try {
            await api.post("/api/recebimentos/parcelado", payload);
            setModalParcelado(false);
            await carregar();
        } finally {
            setSalvando(false);
        }
    }

    async function receberRapido(r) {
        try {
            await api.post(`/api/recebimentos/${r.id}/receber`);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao registrar recebimento");
        }
    }

    async function receberParcial({ valor, dataRecebimento }) {
        await api.post(`/api/recebimentos/${parcialAberto.id}/receber`, { valor, dataRecebimento });
        setParcialAberto(null);
        await carregar();
    }

    async function estornar(r) {
        const valorBaixado = Number(r.valorRecebido);
        if (!window.confirm(
            `Estornar a baixa de ${fmtValor(valorBaixado)}?\n\n` +
            `O recebimento voltará para o status de pendente. ` +
            `Esta ação fica registrada no histórico.`
        )) return;
        try {
            await api.post(`/api/recebimentos/${r.id}/estornar`);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao estornar");
        }
    }

    async function cancelar(r) {
        // Regra ERP: não permite cancelar recebimento com baixa
        if (Number(r.valorRecebido) > 0) {
            setErro("Este recebimento não pode ser cancelado. Estorne a baixa primeiro.");
            return;
        }
        if (!window.confirm(`Cancelar recebimento "${r.descricao}"?`)) return;
        try {
            await api.post(`/api/recebimentos/${r.id}/cancelar`);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao cancelar");
        }
    }

    return (
        <div style={containerStyle}>
            {/* Cabeçalho */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}>
                        <LuHandCoins size={26}/> Recebimentos
                    </h1>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
                        Acompanhe o que você tem a receber e envie cobranças via WhatsApp.
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setModalParcelado(true)} className="btn-secondary"
                            style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                        <LuLayers size={16}/> Parcelado
                    </button>
                    <button onClick={abrirNovo} className="auth-box-btn"
                            style={{ width: "auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 6 }}>
                        <LuPlus size={16}/> Novo recebimento
                    </button>
                </div>
            </div>

            {/* Resumo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                <ResumoBox label="A receber esse mês" valor={fmtValor(resumo.aReceberMes)} cor="#10B981" icon={<LuHandCoins size={20}/>}/>
                <ResumoBox label="Atrasados" valor={resumo.qtdAtrasados} cor="#DC2626" icon={<LuCircleAlert size={20}/>}/>
                <ResumoBox label="Próximos 7 dias" valor={resumo.qtdProximosVencer} cor="#D4A017" icon={<LuCalendar size={20}/>}/>
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {FILTROS_STATUS.map(f => (
                        <button key={f.value || "todos"}
                                onClick={() => { setFiltroStatus(f.value); setPaginaAtual(0); }}
                                style={{
                                    padding: "6px 14px", borderRadius: 999,
                                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    border: "1px solid",
                                    borderColor: filtroStatus === f.value ? "var(--cyan-deep)" : "var(--border)",
                                    background: filtroStatus === f.value ? "rgba(21,195,221,0.08)" : "var(--surface)",
                                    color: filtroStatus === f.value ? "var(--cyan-dark)" : "var(--text-muted)",
                                    transition: "all 0.15s",
                                }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                    <LuSearch size={14} style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                        color: "var(--text-dim)",
                    }}/>
                    <input type="text" value={busca}
                           onChange={e => setBusca(e.target.value)}
                           placeholder="Buscar por descrição ou cliente..."
                           style={{
                               width: "100%", padding: "8px 12px 8px 34px",
                               border: "1px solid var(--border)", borderRadius: 8,
                               fontSize: 13, background: "var(--surface)",
                           }}/>
                </div>
            </div>

            {erro && <div style={erroBoxStyle}>{erro}</div>}

            {/* Lista */}
            {carregando ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>
                    <LuLoader size={20} style={{ animation: "spin 1s linear infinite" }}/>
                    <div style={{ marginTop: 8 }}>Carregando...</div>
                </div>
            ) : recebimentosFiltrados.length === 0 ? (
                <div style={{
                    padding: 40, textAlign: "center", borderRadius: 12,
                    background: "var(--surface)", border: "1px dashed var(--border)",
                }}>
                    <LuHandCoins size={32} style={{ color: "var(--text-dim)", margin: "0 auto 12px", display: "block" }}/>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        {busca || filtroStatus ? "Nenhum recebimento encontrado" : "Nenhum recebimento cadastrado ainda"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                        {busca || filtroStatus ? "Tente ajustar os filtros." : "Cadastre seu primeiro recebimento para começar."}
                    </div>
                    {!busca && !filtroStatus && (
                        <button className="auth-box-btn" onClick={abrirNovo}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            <LuPlus size={14} style={{ marginRight: 6 }}/>
                            Criar primeiro recebimento
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {recebimentosFiltrados.map(r => (
                            <RecebimentoCard
                                key={r.id} recebimento={r}
                                onReceber={() => receberRapido(r)}
                                onReceberParcial={() => setParcialAberto(r)}
                                onEditar={() => abrirEdicao(r)}
                                onEstornar={() => estornar(r)}
                                onCancelar={() => cancelar(r)}
                                onCobrar={() => setCobrancaAberta(r)}/>
                        ))}
                    </div>

                    {totalPaginas > 1 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                            <button onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                                    disabled={paginaAtual === 0} className="btn-secondary">← Anterior</button>
                            <span style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-muted)" }}>
                                Página {paginaAtual + 1} de {totalPaginas}
                            </span>
                            <button onClick={() => setPaginaAtual(p => p + 1)}
                                    disabled={paginaAtual >= totalPaginas - 1} className="btn-secondary">Próxima →</button>
                        </div>
                    )}
                </>
            )}

            {/* Modais */}
            {modalAberto && (
                <RecebimentoModal recebimento={editando}
                                  onSalvar={salvar}
                                  onFechar={() => { setModalAberto(false); setEditando(null); }}
                                  salvando={salvando}/>
            )}
            {modalParcelado && (
                <ParceladoModal onSalvar={salvarParcelado}
                                onFechar={() => setModalParcelado(false)} salvando={salvando}/>
            )}
            {parcialAberto && (
                <ReceberParcialModal recebimento={parcialAberto}
                                     onConfirmar={receberParcial} onFechar={() => setParcialAberto(null)}/>
            )}
            {cobrancaAberta && (
                <CobrancaWhatsappModal
                    recebimento={cobrancaAberta}
                    onFechar={() => setCobrancaAberta(null)}
                    onSucesso={() => carregar()}/>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
                .receb-card:hover {
                    border-color: var(--cyan-deep) !important;
                    background: rgba(21,195,221,0.03) !important;
                }
                .btn-secondary {
                    padding: 8px 16px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background: var(--surface);
                    color: var(--text);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .btn-secondary:hover:not(:disabled) {
                    border-color: var(--cyan-deep);
                    color: var(--cyan-dark);
                }
                .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
                .receb-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────────────────────────
function ResumoBox({ label, valor, cor, icon }) {
    return (
        <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-dim)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <span style={{ color: cor }}>{icon}</span>
                {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{valor}</div>
        </div>
    );
}

function RecebimentoCard({ recebimento: r, onReceber, onReceberParcial, onEditar, onEstornar, onCancelar, onCobrar }) {
    const dias = diasAteVencer(r.dataVencimento);
    const ehFinalizado = r.status === "RECEBIDO" || r.status === "CANCELADO";
    const ehParcelado  = (r.parcelaTotal ?? 1) > 1;

    // Lógica calculada localmente (não depende de flags do backend)
    const temBaixa     = Number(r.valorRecebido) > 0;
    const podeEditar   = !temBaixa && r.status !== "CANCELADO";
    const podeCancelar = !temBaixa && r.status !== "CANCELADO";
    const podeEstornar = temBaixa && r.status !== "CANCELADO";
    const podeCobrar   = ["PENDENTE", "ATRASADO", "PARCIAL"].includes(r.status) && r.cliente?.telefone;

    return (
        <div style={cardStyle} className="receb-card">
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <StatusBadge status={r.status}/>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                        {r.cliente?.nome || "Sem cliente"}
                    </span>
                    {ehParcelado && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 999,
                            fontSize: 10, fontWeight: 600,
                            background: "rgba(99,102,241,0.10)",
                            border: "1px solid rgba(99,102,241,0.25)",
                            color: "#6366F1",
                        }}>
                            <LuLayers size={10}/> {r.parcelaAtual}/{r.parcelaTotal}
                        </span>
                    )}
                </div>

                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                    {r.descricao}
                </div>

                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-muted)", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{fmtValor(r.valor)}</span>
                    {r.status === "PARCIAL" && (
                        <span style={{ color: "#0EA5E9" }}>
                            Recebido: {fmtValor(r.valorRecebido)} de {fmtValor(r.valor)}
                        </span>
                    )}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <LuCalendar size={12}/>
                        Venc: {fmtData(r.dataVencimento)}
                        {!ehFinalizado && dias != null && (
                            <span style={{
                                marginLeft: 4, fontWeight: 600,
                                color: dias < 0 ? "#DC2626" : dias <= 3 ? "#D4A017" : "var(--text-muted)",
                            }}>
                                {dias < 0  ? `(${Math.abs(dias)}d atraso)` :
                                    dias === 0 ? "(hoje)" :
                                        dias === 1 ? "(amanhã)" :
                                            `(em ${dias}d)`}
                            </span>
                        )}
                        {r.status === "RECEBIDO" && r.dataRecebimento && (
                            <span style={{ marginLeft: 4, color: "#10B981", fontWeight: 600 }}>
                                · Recebido em {fmtData(r.dataRecebimento)}
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* Ações — calculadas localmente, regras ERP aplicadas */}
            <div className="receb-actions">

                {/* Cobrar via WhatsApp */}
                {podeCobrar && (
                    <button onClick={onCobrar} className="btn-secondary"
                            style={{
                                padding: "8px 14px",
                                background: "rgba(37,211,102,0.08)",
                                borderColor: "rgba(37,211,102,0.30)",
                                color: "#15803D",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                            }} title="Cobrar via WhatsApp">
                        <LuMessageCircle size={14}/>
                        Cobrar
                    </button>
                )}

                {/* Receber: pra pendente/atrasado/parcial */}
                {(r.status === "PENDENTE" || r.status === "ATRASADO" || r.status === "PARCIAL") && (
                    <>
                        <button onClick={onReceber} className="btn-secondary"
                                style={{
                                    background: "rgba(16,185,129,0.08)",
                                    borderColor: "rgba(16,185,129,0.25)",
                                    color: "#10B981", padding: "8px 14px",
                                }} title="Marcar como recebido (total)">
                            <LuCircleCheck size={14} style={{ marginRight: 4 }}/>
                            Receber
                        </button>
                        <button onClick={onReceberParcial} className="btn-secondary"
                                style={{ padding: "8px 10px" }} title="Recebimento parcial">
                            <LuCircleEllipsis size={14}/>
                        </button>
                    </>
                )}

                {/* Estornar: só se tem baixa registrada */}
                {podeEstornar && (
                    <button onClick={onEstornar} className="btn-secondary"
                            style={{
                                padding: "8px 14px",
                                background: "rgba(245,158,11,0.10)",
                                borderColor: "rgba(245,158,11,0.35)",
                                color: "#D97706",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                            }} title="Desfazer baixa — volta o recebimento para pendente">
                        <LuUndo2 size={14}/>
                        Estornar
                    </button>
                )}

                {/* Editar: só aparece se editável (sem baixa, não cancelado) */}
                {podeEditar && (
                    <button onClick={onEditar} className="btn-secondary"
                            style={{ padding: "8px 10px" }} title="Editar">
                        <LuPencil size={14}/>
                    </button>
                )}

                {/* Cancelar: só se cancelável (sem baixa, não cancelado) */}
                {podeCancelar && (
                    <button onClick={onCancelar} className="btn-secondary"
                            style={{ padding: "8px 10px", color: "#DC2626" }} title="Cancelar">
                        <LuTrash2 size={14}/>
                    </button>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos compartilhados
// ─────────────────────────────────────────────────────────────────────────────
const containerStyle  = { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" };
const overlayStyle    = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 };
const modalStyle      = { width: "100%", maxWidth: 520, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" };
const modalHeader     = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" };
const closeBtn        = { background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 4, lineHeight: 0 };
const cardStyle       = { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", transition: "all 0.15s" };
const erroBoxStyle    = { padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", color: "#DC2626", fontSize: 13 };
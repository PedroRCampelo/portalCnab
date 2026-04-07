import { useState, useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_COR = {
    PENDENTE: { bg: "rgba(212,160,23,0.12)", border: "rgba(212,160,23,0.3)", color: "#6c5310" },
    VENCIDO:  { bg: "rgba(17,17,17,0.08)",  border: "rgba(17,17,17,0.18)",  color: "var(--text-muted)" },
    PAGO:     { bg: "rgba(17,17,17,0.06)",  border: "rgba(17,17,17,0.14)",  color: "var(--text)" },
};
const TIPOS        = ["BOLETO", "PIX", "TED"];
const STATUS_OPS   = ["PENDENTE", "VENCIDO", "PAGO"];
// fornecedorDocumento removido — não obrigatório
const OBRIGATORIOS = ["numero", "fornecedorNome", "vencimento", "valor"];

const TITULO_VAZIO = {
    prefixo: "AP", numero: "", parcela: "001", tipo: "BOLETO",
    tipoGastoId: "",
    fornecedorNome: "", fornecedorDocumento: "",
    emissao: hoje(), vencimento: "", valor: "",
    desconto: "", juros: "", multa: "",
    observacao: "", status: "PENDENTE",
    codigoBarras: "", linhaDigitavel: "",
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
    if (v == null) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
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

function mascaraDoc(valor) {
    const nums = valor.replace(/\D/g, "").slice(0, 14);
    if (nums.length <= 11) return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

// ─────────────────────────────────────────────────────────────────────────────
// CampoInput — componente separado para evitar perda de foco no React
// ─────────────────────────────────────────────────────────────────────────────
const CampoInput = memo(function CampoInput({ label, value, onChange, tipo = "text", obrigatorio, moeda, select, options, maxLength, placeholder }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 4, display: "block" }}>
                {label}{obrigatorio && <span style={{ color: "var(--warning)", marginLeft: 3 }}>*</span>}
            </label>
            {select ? (
                <select value={value} onChange={e => onChange(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg)",
                            border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}>
                    {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                </select>
            ) : (
                <input
                    type={moeda ? "text" : tipo}
                    inputMode={moeda ? "numeric" : undefined}
                    value={value}
                    onChange={e => {
                        let v = e.target.value;
                        if (moeda) v = mascaraMoeda(v);
                        onChange(v);
                    }}
                    placeholder={placeholder ?? (moeda ? "0,00" : "")}
                    maxLength={maxLength}
                    style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg)",
                        border: `1px solid ${obrigatorio && !value ? "rgba(212,160,23,0.45)" : "var(--border)"}`,
                        color: "var(--text)", fontSize: 14, boxSizing: "border-box"
                    }}
                />
            )}
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip (abre para BAIXO)
// ─────────────────────────────────────────────────────────────────────────────
function Tooltip({ texto }) {
    const [vis, setVis] = useState(false);
    return (
        <span style={{ position: "relative", display: "inline-flex" }}>
            <button type="button"
                    onMouseEnter={() => setVis(true)} onMouseLeave={() => setVis(false)}
                    onClick={() => setVis(v => !v)}
                    style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "rgba(255,255,255,0.08)", border: "1px solid var(--border)",
                        color: "var(--text-dim)", fontSize: 11, fontWeight: 700,
                        cursor: "pointer", display: "inline-flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0
                    }}>?</button>
            {vis && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "#ffffff", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "12px 14px", width: 280,
                    fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65,
                    zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    whiteSpace: "pre-line"
                }}>
                    <div style={{
                        position: "absolute", top: -5, right: 10,
                        width: 8, height: 8, background: "var(--surface)",
                        border: "1px solid var(--border)", borderBottom: "none",
                        borderRight: "none", transform: "rotate(45deg)"
                    }}/>
                    {texto}
                </div>
            )}
        </span>
    );
}

const TOOLTIP_EXCEL = `O arquivo Excel deve ter as colunas:

• numero — Número do título (obrigatório)
• parcela — Ex: 001
• fornecedor_nome — Nome (obrigatório)
• fornecedor_documento — CNPJ ou CPF
• vencimento — DD/MM/AAAA (obrigatório)
• valor — Numérico, ex: 1234.56 (obrigatório)
• emissao — Data de emissão
• tipo — BOLETO, PIX ou TED
• status — PENDENTE, VENCIDO ou PAGO
• desconto, juros, multa — Numéricos
• observacao — Texto livre
• codigo_barras, linha_digitavel

Compatível com exportação Protheus SE2/E2.`;

// ─────────────────────────────────────────────────────────────────────────────
// Modal base
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ children, largura = 560 }) {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px", overflowY: "auto"
        }}>
            <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 20, padding: "32px", maxWidth: largura, width: "100%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
            }}>
                {children}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function TitulosPage() {
    const [titulos,      setTitulos]      = useState([]);
    const [resumo,       setResumo]       = useState(null);
    const [pagina,       setPagina]       = useState(0);
    const [total,        setTotal]        = useState(0);
    const [busca,        setBusca]        = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");
    const [carregando,   setCarregando]   = useState(true);
    const [tiposGasto,   setTiposGasto]   = useState([]);

    // Modal cadastro/edição
    const [modalAberto,  setModalAberto]  = useState(false);
    const [editando,     setEditando]     = useState(null);
    const [form,         setForm]         = useState(TITULO_VAZIO);
    const [salvando,     setSalvando]     = useState(false);
    const [erro,         setErro]         = useState("");

    // Modal exclusão
    const [modalExcluir, setModalExcluir] = useState(null);

    // Modal baixa
    const [modalBaixa,   setModalBaixa]   = useState(null);
    const [baixaValor,   setBaixaValor]   = useState("");
    const [baixaData,    setBaixaData]    = useState(hoje());
    const [baixaObs,     setBaixaObs]     = useState("");
    const [baixando,     setBaixando]     = useState(false);
    const [erroBaixa,    setErroBaixa]    = useState("");

    const [importando,   setImportando]   = useState(false);
    const [msgImport,    setMsgImport]    = useState("");
    const inputFileRef = useRef();

    useEffect(() => {
        carregarResumo();
        carregarTiposGasto();
    }, []);

    useEffect(() => { carregarTitulos(); }, [pagina, busca, filtroStatus]);

    async function carregarResumo() {
        try { const { data } = await api.get("/api/titulos/resumo"); setResumo(data); } catch {}
    }

    async function carregarTiposGasto() {
        try { const { data } = await api.get("/api/tipos-gasto"); setTiposGasto(data); } catch {}
    }

    async function carregarTitulos() {
        setCarregando(true);
        try {
            const params = new URLSearchParams({
                pagina, tamanho: 20,
                ...(busca        ? { busca }               : {}),
                ...(filtroStatus ? { status: filtroStatus } : {}),
            });
            const { data } = await api.get(`/api/titulos?${params}`);
            setTitulos(data.content ?? []);
            setTotal(data.totalElements ?? 0);
        } catch { setTitulos([]); }
        finally { setCarregando(false); }
    }

    function setField(key) { return val => setForm(f => ({ ...f, [key]: key === "fornecedorDocumento" ? mascaraDoc(val) : val })); }

    function abrirNovo() {
        setEditando(null); setForm(TITULO_VAZIO); setErro(""); setModalAberto(true);
    }

    function abrirEditar(t) {
        setEditando(t.id);
        setForm({
            prefixo: t.prefixo ?? "AP", numero: t.numero ?? "",
            parcela: t.parcela ?? "001", tipo: t.tipo ?? "BOLETO",
            tipoGastoId: t.tipoGastoId ?? "",
            fornecedorNome: t.fornecedorNome ?? "",
            fornecedorDocumento: t.fornecedorDocumento ?? "",
            emissao: t.emissao ?? hoje(), vencimento: t.vencimento ?? "",
            valor:    t.valor    ? mascaraMoeda(String(Math.round(t.valor    * 100))) : "",
            desconto: t.desconto ? mascaraMoeda(String(Math.round(t.desconto * 100))) : "",
            juros:    t.juros    ? mascaraMoeda(String(Math.round(t.juros    * 100))) : "",
            multa:    t.multa    ? mascaraMoeda(String(Math.round(t.multa    * 100))) : "",
            observacao: t.observacao ?? "", status: t.status ?? "PENDENTE",
            codigoBarras: t.codigoBarras ?? "", linhaDigitavel: t.linhaDigitavel ?? "",
        });
        setErro(""); setModalAberto(true);
    }

    function abrirBaixa(t) {
        setModalBaixa(t);
        setBaixaValor(t.saldo ? mascaraMoeda(String(Math.round(t.saldo * 100))) : "");
        setBaixaData(hoje()); setBaixaObs(""); setErroBaixa("");
    }

    async function salvar() {
        setErro("");
        const faltando = OBRIGATORIOS.filter(c => !form[c] || String(form[c]).trim() === "");
        if (faltando.length > 0) { setErro("Preencha todos os campos obrigatórios (marcados com *)."); return; }
        if (parseMoeda(form.valor) <= 0) { setErro("O valor deve ser maior que zero."); return; }

        setSalvando(true);
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
            if (editando) await api.put(`/api/titulos/${editando}`, payload);
            else          await api.post("/api/titulos", payload);
            setModalAberto(false); carregarTitulos(); carregarResumo();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar título.");
        } finally { setSalvando(false); }
    }

    async function confirmarExcluir() {
        try {
            await api.delete(`/api/titulos/${modalExcluir.id}`);
            setModalExcluir(null); carregarTitulos(); carregarResumo();
        } catch {}
    }

    async function confirmarBaixa() {
        setErroBaixa("");
        const valorNum = parseMoeda(baixaValor);
        if (valorNum <= 0) { setErroBaixa("Informe um valor maior que zero."); return; }
        setBaixando(true);
        try {
            await api.post(`/api/titulos/${modalBaixa.id}/baixa`, {
                valorPago: valorNum, dataBaixa: baixaData, observacao: baixaObs,
            });
            setModalBaixa(null); carregarTitulos(); carregarResumo();
        } catch (err) {
            setErroBaixa(err.response?.data?.mensagem ?? "Erro ao registrar baixa.");
        } finally { setBaixando(false); }
    }

    async function importarExcel(e) {
        const arquivo = e.target.files?.[0]; if (!arquivo) return;
        setImportando(true); setMsgImport("");
        try {
            const fd = new FormData(); fd.append("arquivo", arquivo);
            const { data } = await api.post("/api/titulos/importar", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setMsgImport(`✅ ${data.importados} título(s) importado(s).${data.erros?.length ? ` ${data.erros.length} erro(s).` : ""}`);
            carregarTitulos(); carregarResumo();
        } catch (err) {
            setMsgImport("❌ " + (err.response?.data?.mensagem ?? "Erro ao importar."));
        } finally { setImportando(false); e.target.value = ""; }
    }

    // Cálculo da baixa
    const saldoAtual = modalBaixa?.saldo ?? modalBaixa?.valor ?? 0;
    const valorBaixa = parseMoeda(baixaValor);
    const novoSaldo  = Math.max(0, saldoAtual - valorBaixa);
    const acrescimo  = valorBaixa > saldoAtual ? valorBaixa - saldoAtual : 0;
    const quita      = valorBaixa >= saldoAtual && valorBaixa > 0;

    // Opções de tipo de gasto para o select
    const tipoGastoOpts = [
        { value: "", label: "— Sem categoria —" },
        ...tiposGasto.map(t => ({ value: t.id, label: t.nome })),
    ];

    return (
        <div className="admin-page">

            {/* ── Cabeçalho ── */}
            <div className="admin-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 className="admin-title">Títulos a Pagar</h1>
                    <p className="admin-subtitle">Gerencie suas contas a pagar e importe via Excel</p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="file" ref={inputFileRef} accept=".xlsx" style={{ display: "none" }} onChange={importarExcel}/>
                    <Link to="/tipos-gasto" style={{
                        padding: "9px 14px", borderRadius: 10, background: "transparent",
                        border: "1px solid var(--border)", color: "var(--text-muted)",
                        fontWeight: 600, fontSize: 13, textDecoration: "none",
                        display: "inline-flex", alignItems: "center", gap: 6
                    }}>
                        🏷️ Tipos de Gasto
                    </Link>
                    <button onClick={() => inputFileRef.current.click()} disabled={importando}
                            style={{ padding: "9px 16px", borderRadius: 10, background: "transparent",
                                border: "1px solid var(--border)", color: "var(--text-muted)",
                                fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        {importando ? "Importando..." : "📥 Importar Excel"}
                    </button>
                    <Tooltip texto={TOOLTIP_EXCEL}/>
                </div>
                <button onClick={abrirNovo}
                        style={{ padding: "9px 18px", borderRadius: 10, background: "var(--purple)",
                            border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    + Novo título
                </button>
            </div>

            {msgImport && (
                <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                    background: msgImport.startsWith("✅") ? "rgba(17,17,17,0.06)" : "rgba(212,160,23,0.08)",
                    border: `1px solid ${msgImport.startsWith("✅") ? "rgba(17,17,17,0.16)" : "rgba(212,160,23,0.3)"}`,
                    color: msgImport.startsWith("✅") ? "var(--text)" : "var(--warning)", fontSize: 13 }}>
                    {msgImport}
                </div>
            )}

            {/* ── Resumo ── */}
            {resumo && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                    {[
                        { label: "Total em aberto", valor: fmtValor(resumo.totalAberto), cor: "var(--text)" },
                        { label: "Pendentes",        valor: resumo.qtdPendentes,          cor: "#6c5310" },
                        { label: "Vencidos",         valor: resumo.qtdVencidos,           cor: "var(--text-muted)" },
                        { label: "Pagos",            valor: resumo.qtdPagos,              cor: "var(--text)" },
                    ].map(c => (
                        <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
                            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{c.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: c.cor }}>{c.valor}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filtros ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input placeholder="Buscar por fornecedor, número ou documento..."
                       value={busca} onChange={e => { setBusca(e.target.value); setPagina(0); }}
                       style={{ flex: 1, minWidth: 240, padding: "8px 12px", borderRadius: 8,
                           background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}/>
                <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); setPagina(0); }}
                        style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)",
                            border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}>
                    <option value="">Todos os status</option>
                    {STATUS_OPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* ── Tabela ── */}
            <div className="admin-card">
                {carregando ? (
                    <p className="admin-loading">Carregando...</p>
                ) : titulos.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Nenhum título encontrado.</p>
                        <button onClick={abrirNovo} style={{ marginTop: 12, padding: "10px 20px",
                            borderRadius: 10, background: "var(--purple)", border: "none",
                            color: "white", fontWeight: 600, cursor: "pointer" }}>
                            Cadastrar primeiro título
                        </button>
                    </div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead><tr>
                                <th>Número / Parcela</th>
                                <th>Fornecedor</th>
                                <th>Tipo gasto</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Saldo</th>
                                <th>Status</th>
                                <th></th>
                            </tr></thead>
                            <tbody>
                            {titulos.map(t => {
                                const cor      = STATUS_COR[t.status] ?? STATUS_COR.PENDENTE;
                                const nomeGasto = tiposGasto.find(tg => tg.id === t.tipoGastoId)?.nome;
                                return (
                                    <tr key={t.id}>
                                        <td>
                                            <span style={{ fontWeight: 600, color: "var(--text)" }}>{t.numero}</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: 12 }}> / {t.parcela}</span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{t.fornecedorNome}</div>
                                            {t.fornecedorDocumento && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{t.fornecedorDocumento}</div>}
                                        </td>
                                        <td style={{ fontSize: 12, color: nomeGasto ? "var(--text-muted)" : "var(--border)" }}>
                                            {nomeGasto ?? "—"}
                                        </td>
                                        <td style={{ fontSize: 13 }}>{fmtData(t.vencimento)}</td>
                                        <td style={{ fontWeight: 600 }}>{fmtValor(t.valor)}</td>
                                        <td style={{ fontWeight: 600, color: t.saldo > 0 ? "var(--warning)" : "var(--text)" }}>{fmtValor(t.saldo)}</td>
                                        <td>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px",
                                                borderRadius: 20, background: cor.bg, border: `1px solid ${cor.border}`, color: cor.color }}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 5 }}>
                                                {t.status !== "PAGO" && (
                                                    <button onClick={() => abrirBaixa(t)} title="Registrar baixa"
                                                            className="btn-acao"
                                                            style={{ fontSize: 12, background: "rgba(17,17,17,0.06)", borderColor: "rgba(17,17,17,0.18)", color: "var(--text)" }}>
                                                        💰
                                                    </button>
                                                )}
                                                <button onClick={() => abrirEditar(t)} className="btn-acao" title="Editar" style={{ fontSize: 12 }}>✏️</button>
                                                <button onClick={() => setModalExcluir({ id: t.id, numero: t.numero })}
                                                        className="btn-acao btn-acao--excluir" title="Excluir" style={{ fontSize: 12 }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
                {total > 20 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0 0" }}>
                        <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)} className="btn-acao">← Anterior</button>
                        <span style={{ color: "var(--text-dim)", fontSize: 13, alignSelf: "center" }}>Página {pagina + 1} de {Math.ceil(total / 20)}</span>
                        <button disabled={(pagina + 1) * 20 >= total} onClick={() => setPagina(p => p + 1)} className="btn-acao">Próxima →</button>
                    </div>
                )}
            </div>

            {/* ── Modal: Cadastro / Edição ── */}
            {modalAberto && (
                <Modal largura={640}>
                    <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
                        {editando ? "Editar título" : "Novo título"}
                    </h2>
                    <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "0 0 20px" }}>
                        Campos marcados com <span style={{ color: "var(--warning)" }}>*</span> são obrigatórios
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                        <CampoInput label="Prefixo"   value={form.prefixo}  onChange={setField("prefixo")}  maxLength={10}/>
                        <CampoInput label="Número *"  value={form.numero}   onChange={setField("numero")}   maxLength={20} obrigatorio/>
                        <CampoInput label="Parcela"   value={form.parcela}  onChange={setField("parcela")}  maxLength={3}/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                        <CampoInput label="Tipo pagamento" value={form.tipo}   onChange={setField("tipo")}   select options={TIPOS}/>
                        <CampoInput label="Status"         value={form.status} onChange={setField("status")} select options={STATUS_OPS}/>
                        <CampoInput label="Tipo de gasto"  value={form.tipoGastoId} onChange={setField("tipoGastoId")} select options={tipoGastoOpts}/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <CampoInput label="Nome do fornecedor *" value={form.fornecedorNome}      onChange={setField("fornecedorNome")}      maxLength={150} obrigatorio/>
                        <CampoInput label="CNPJ / CPF"           value={form.fornecedorDocumento} onChange={v => setForm(f => ({ ...f, fornecedorDocumento: mascaraDoc(v) }))} maxLength={20}/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <CampoInput label="Emissão"     value={form.emissao}    onChange={setField("emissao")}    tipo="date"/>
                        <CampoInput label="Vencimento *" value={form.vencimento} onChange={setField("vencimento")} tipo="date" obrigatorio/>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 12px" }}>
                        <CampoInput label="Valor (R$) *" value={form.valor}    onChange={setField("valor")}    moeda obrigatorio/>
                        <CampoInput label="Desconto"     value={form.desconto} onChange={setField("desconto")} moeda/>
                        <CampoInput label="Juros"        value={form.juros}    onChange={setField("juros")}    moeda/>
                        <CampoInput label="Multa"        value={form.multa}    onChange={setField("multa")}    moeda/>
                    </div>
                    <CampoInput label="Código de barras" value={form.codigoBarras}   onChange={setField("codigoBarras")}   maxLength={50}/>
                    <CampoInput label="Linha digitável"  value={form.linhaDigitavel} onChange={setField("linhaDigitavel")} maxLength={100}/>
                    <CampoInput label="Observação"       value={form.observacao}     onChange={setField("observacao")}     maxLength={500}/>

                    {erro && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                            background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.3)",
                            color: "var(--warning)", fontSize: 13 }}>{erro}</div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <button onClick={() => setModalAberto(false)}
                                style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent",
                                    border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                        </button>
                        <button onClick={salvar} disabled={salvando}
                                style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--purple)",
                                    border: "none", color: "white", fontWeight: 700, cursor: "pointer", opacity: salvando ? 0.6 : 1 }}>
                            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar título"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Modal: Confirmar exclusão ── */}
            {modalExcluir && (
                <Modal largura={420}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                            background: "rgba(17,17,17,0.08)", border: "1px solid rgba(17,17,17,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🗑️</div>
                        <h3 style={{ color: "var(--text)", fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>Excluir título?</h3>
                        <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 24px" }}>
                            O título <strong style={{ color: "var(--text)" }}>#{modalExcluir.numero}</strong> será excluído permanentemente.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setModalExcluir(null)}
                                    style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent",
                                        border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}>
                                Cancelar
                            </button>
                            <button onClick={confirmarExcluir}
                                    style={{ flex: 1, padding: "12px", borderRadius: 10,
                                        background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.35)",
                                        color: "var(--warning)", fontWeight: 700, cursor: "pointer" }}>
                                Excluir
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal: Baixa ── */}
            {modalBaixa && (
                <Modal largura={440}>
                    <h3 style={{ color: "var(--text)", fontSize: 17, fontWeight: 800, margin: "0 0 4px" }}>Registrar baixa</h3>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 20px" }}>
                        {modalBaixa.fornecedorNome} · #{modalBaixa.numero}
                    </p>
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)",
                        borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Saldo atual</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--warning)" }}>{fmtValor(saldoAtual)}</span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
                            Valor pago (R$) <span style={{ color: "var(--warning)" }}>*</span>
                        </label>
                        <input inputMode="numeric" value={baixaValor}
                               onChange={e => setBaixaValor(mascaraMoeda(e.target.value))}
                               placeholder="0,00"
                               style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "var(--bg)",
                                   border: "1px solid var(--border)", color: "var(--text)", fontSize: 16,
                                   fontWeight: 700, boxSizing: "border-box" }}/>
                    </div>
                    {valorBaixa > 0 && (
                        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                            background: quita ? "rgba(17,17,17,0.06)" : "rgba(212,160,23,0.08)",
                            border: `1px solid ${quita ? "rgba(17,17,17,0.16)" : "rgba(212,160,23,0.25)"}`,
                            fontSize: 13 }}>
                            {quita ? (
                                <span style={{ color: "var(--text)" }}>
                                    ✅ Título quitado
                                    {acrescimo > 0 && <span style={{ color: "var(--text-dim)" }}> · acréscimo de {fmtValor(acrescimo)}</span>}
                                </span>
                            ) : (
                                <span style={{ color: "#6c5310" }}>
                                    ⚡ Pagamento parcial · saldo restante: <strong>{fmtValor(novoSaldo)}</strong>
                                </span>
                            )}
                        </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px", marginBottom: 12 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>Data da baixa</label>
                            <input type="date" value={baixaData} onChange={e => setBaixaData(e.target.value)}
                                   style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg)",
                                       border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}/>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>Observação</label>
                            <input type="text" value={baixaObs} onChange={e => setBaixaObs(e.target.value)}
                                   placeholder="Opcional" maxLength={200}
                                   style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg)",
                                       border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}/>
                        </div>
                    </div>
                    {erroBaixa && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                            background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.3)",
                            color: "var(--warning)", fontSize: 13 }}>{erroBaixa}</div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button onClick={() => setModalBaixa(null)}
                                style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent",
                                    border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                        </button>
                        <button onClick={confirmarBaixa} disabled={baixando || valorBaixa <= 0}
                                style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--grad)",
                                    border: "1px solid rgba(212,160,23,0.45)", color: "#1a1a1a", fontWeight: 700, cursor: "pointer",
                                    opacity: (baixando || valorBaixa <= 0) ? 0.5 : 1 }}>
                            {baixando ? "Registrando..." : quita ? "✅ Confirmar quitação" : "⚡ Confirmar baixa parcial"}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
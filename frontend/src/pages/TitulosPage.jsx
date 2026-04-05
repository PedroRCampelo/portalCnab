import { useState, useEffect, useRef } from "react";
import api from "../services/api.js";

const STATUS_COR = {
    PENDENTE: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", color: "#FCD34D" },
    VENCIDO:  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  color: "#F87171" },
    PAGO:     { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  color: "#4ADE80" },
};

const TIPOS = ["BOLETO", "PIX", "TED"];
const STATUS_OPCOES = ["PENDENTE", "VENCIDO", "PAGO"];

const CAMPOS_OBRIGATORIOS = ["numero", "fornecedorNome", "fornecedorDocumento", "vencimento", "valor"];

const TITULO_VAZIO = {
    prefixo: "AP", numero: "", parcela: "001", tipo: "BOLETO",
    fornecedorNome: "", fornecedorDocumento: "",
    emissao: hoje(), vencimento: "", valor: "",
    desconto: "", juros: "", multa: "",
    observacao: "", status: "PENDENTE",
    codigoBarras: "", linhaDigitavel: "",
};

function hoje() {
    return new Date().toISOString().split("T")[0];
}

function fmtData(d) {
    if (!d) return "—";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
}

function fmtValor(v) {
    if (v == null) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// Máscara de valor monetário: 1.234,56
function aplicarMascaraMoeda(valor) {
    const nums = String(valor).replace(/\D/g, "");
    if (!nums) return "";
    const numero = parseFloat(nums) / 100;
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero);
}

// Converte valor mascarado (1.234,56) para número (1234.56)
function parseMoeda(valor) {
    if (!valor) return 0;
    return parseFloat(String(valor).replace(/\./g, "").replace(",", ".")) || 0;
}

function aplicarMascaraDocumento(valor) {
    const nums = valor.replace(/\D/g, "").slice(0, 14);
    if (nums.length <= 11) {
        return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export default function TitulosPage() {
    const [titulos,    setTitulos]    = useState([]);
    const [resumo,     setResumo]     = useState(null);
    const [pagina,     setPagina]     = useState(0);
    const [total,      setTotal]      = useState(0);
    const [busca,      setBusca]      = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [editando,   setEditando]   = useState(null);
    const [form,       setForm]       = useState(TITULO_VAZIO);
    const [salvando,   setSalvando]   = useState(false);
    const [erro,       setErro]       = useState("");
    const [importando, setImportando] = useState(false);
    const [msgImport,  setMsgImport]  = useState("");
    const inputFileRef = useRef();

    useEffect(() => {
        carregarResumo();
    }, []);

    useEffect(() => {
        carregarTitulos();
    }, [pagina, busca, filtroStatus]);

    async function carregarResumo() {
        try {
            const { data } = await api.get("/api/titulos/resumo");
            setResumo(data);
        } catch {}
    }

    async function carregarTitulos() {
        setCarregando(true);
        try {
            const params = new URLSearchParams({
                pagina, tamanho: 20,
                ...(busca         ? { busca }         : {}),
                ...(filtroStatus  ? { status: filtroStatus } : {}),
            });
            const { data } = await api.get(`/api/titulos?${params}`);
            setTitulos(data.content ?? []);
            setTotal(data.totalElements ?? 0);
        } catch {
            setTitulos([]);
        } finally {
            setCarregando(false);
        }
    }

    function abrirNovo() {
        setEditando(null);
        setForm(TITULO_VAZIO);
        setErro("");
        setModalAberto(true);
    }

    function abrirEditar(t) {
        setEditando(t.id);
        setForm({
            prefixo: t.prefixo ?? "AP",
            numero: t.numero ?? "",
            parcela: t.parcela ?? "001",
            tipo: t.tipo ?? "BOLETO",
            fornecedorNome: t.fornecedorNome ?? "",
            fornecedorDocumento: t.fornecedorDocumento ?? "",
            emissao: t.emissao ?? hoje(),
            vencimento: t.vencimento ?? "",
            valor: t.valor ?? "",
            saldo: t.saldo ?? "",
            desconto: t.desconto ?? "0",
            juros: t.juros ?? "0",
            multa: t.multa ?? "0",
            observacao: t.observacao ?? "",
            status: t.status ?? "PENDENTE",
            codigoBarras: t.codigoBarras ?? "",
            linhaDigitavel: t.linhaDigitavel ?? "",
        });
        setErro("");
        setModalAberto(true);
    }

    async function salvar() {
        setErro("");

        // Validação frontend antes de enviar
        const faltando = CAMPOS_OBRIGATORIOS.filter(c => !form[c] || String(form[c]).trim() === "");
        if (faltando.length > 0) {
            setErro("Preencha todos os campos obrigatórios (marcados com *).");
            return;
        }

        const valorNum = parseMoeda(form.valor);
        if (valorNum <= 0) {
            setErro("O valor deve ser maior que zero.");
            return;
        }

        setSalvando(true);
        try {
            const payload = {
                ...form,
                valor:    valorNum,
                saldo:    parseMoeda(form.valor), // saldo inicial = valor
                desconto: parseMoeda(form.desconto),
                juros:    parseMoeda(form.juros),
                multa:    parseMoeda(form.multa),
            };

            if (editando) {
                await api.put(`/api/titulos/${editando}`, payload);
            } else {
                await api.post("/api/titulos", payload);
            }

            setModalAberto(false);
            carregarTitulos();
            carregarResumo();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar título.");
        } finally {
            setSalvando(false);
        }
    }

    async function excluir(id) {
        if (!window.confirm("Excluir este título?")) return;
        try {
            await api.delete(`/api/titulos/${id}`);
            carregarTitulos();
            carregarResumo();
        } catch {}
    }

    async function importarExcel(e) {
        const arquivo = e.target.files?.[0];
        if (!arquivo) return;
        setImportando(true);
        setMsgImport("");
        try {
            const fd = new FormData();
            fd.append("arquivo", arquivo);
            const { data } = await api.post("/api/titulos/importar", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setMsgImport(`✅ ${data.importados} título(s) importado(s).${data.erros?.length ? ` ${data.erros.length} erro(s).` : ""}`);
            carregarTitulos();
            carregarResumo();
        } catch (err) {
            setMsgImport("❌ " + (err.response?.data?.mensagem ?? "Erro ao importar."));
        } finally {
            setImportando(false);
            e.target.value = "";
        }
    }

    function campo(label, key, tipo = "text", opts = {}) {
        const obrigatorio = CAMPOS_OBRIGATORIOS.includes(key);
        const isMoeda     = opts.moeda;

        function handleChange(e) {
            let val = e.target.value;
            if (key === "fornecedorDocumento") val = aplicarMascaraDocumento(val);
            else if (isMoeda) val = aplicarMascaraMoeda(val);
            setForm(f => ({ ...f, [key]: val }));
        }

        return (
            <div className="field-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 4, display: "block" }}>
                    {label}
                    {obrigatorio && <span style={{ color: "#F87171", marginLeft: 3 }}>*</span>}
                </label>
                {opts.select ? (
                    <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg)",
                                border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}>
                        {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                ) : (
                    <input
                        type={isMoeda ? "text" : tipo}
                        inputMode={isMoeda ? "numeric" : undefined}
                        value={form[key]}
                        onChange={handleChange}
                        placeholder={opts.placeholder ?? (isMoeda ? "0,00" : "")}
                        maxLength={opts.maxLength}
                        required={obrigatorio}
                        style={{
                            width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg)",
                            border: `1px solid ${obrigatorio && !form[key] ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
                            color: "var(--text)", fontSize: 14, boxSizing: "border-box"
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="admin-page">

            {/* Cabeçalho */}
            <div className="admin-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 className="admin-title">Títulos a Pagar</h1>
                    <p className="admin-subtitle">Gerencie suas contas a pagar e importe via Excel</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <input type="file" ref={inputFileRef} accept=".xlsx" style={{ display: "none" }} onChange={importarExcel}/>
                    <button onClick={() => inputFileRef.current.click()} disabled={importando}
                            style={{ padding: "9px 16px", borderRadius: 10, background: "transparent",
                                border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600,
                                fontSize: 13, cursor: "pointer" }}>
                        {importando ? "Importando..." : "📥 Importar Excel"}
                    </button>
                    <button onClick={abrirNovo}
                            style={{ padding: "9px 18px", borderRadius: 10, background: "var(--purple)",
                                border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        + Novo título
                    </button>
                </div>
            </div>

            {msgImport && (
                <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                    background: msgImport.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${msgImport.startsWith("✅") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    color: msgImport.startsWith("✅") ? "#4ADE80" : "#F87171", fontSize: 13 }}>
                    {msgImport}
                </div>
            )}

            {/* Cards de resumo */}
            {resumo && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                    {[
                        { label: "Total em aberto", valor: fmtValor(resumo.totalAberto), cor: "#A78BFA" },
                        { label: "Pendentes",       valor: resumo.qtdPendentes,          cor: "#FCD34D" },
                        { label: "Vencidos",        valor: resumo.qtdVencidos,           cor: "#F87171" },
                        { label: "Pagos",           valor: resumo.qtdPagos,              cor: "#4ADE80" },
                    ].map(c => (
                        <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)",
                            borderRadius: 12, padding: "16px 20px" }}>
                            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600,
                                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                                {c.label}
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: c.cor }}>{c.valor}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filtros */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                    placeholder="Buscar por fornecedor, número ou documento..."
                    value={busca}
                    onChange={e => { setBusca(e.target.value); setPagina(0); }}
                    style={{ flex: 1, minWidth: 240, padding: "8px 12px", borderRadius: 8,
                        background: "var(--surface)", border: "1px solid var(--border)",
                        color: "var(--text)", fontSize: 14 }}
                />
                <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); setPagina(0); }}
                        style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface)",
                            border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}>
                    <option value="">Todos os status</option>
                    {STATUS_OPCOES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Tabela */}
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
                            <thead>
                            <tr>
                                <th>Número / Parcela</th>
                                <th>Fornecedor</th>
                                <th>Tipo</th>
                                <th>Emissão</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Saldo</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {titulos.map(t => {
                                const cor = STATUS_COR[t.status] ?? STATUS_COR.PENDENTE;
                                return (
                                    <tr key={t.id}>
                                        <td>
                                            <span style={{ fontWeight: 600, color: "var(--text)" }}>{t.numero}</span>
                                            <span style={{ color: "var(--text-dim)", fontSize: 12 }}> / {t.parcela}</span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{t.fornecedorNome}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{t.fornecedorDocumento}</div>
                                        </td>
                                        <td>
                        <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6,
                            background: "rgba(124,58,237,0.1)", color: "#A78BFA", fontWeight: 600 }}>
                          {t.tipo}
                        </span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{fmtData(t.emissao)}</td>
                                        <td style={{ fontSize: 13 }}>{fmtData(t.vencimento)}</td>
                                        <td style={{ fontWeight: 600 }}>{fmtValor(t.valor)}</td>
                                        <td style={{ fontWeight: 600, color: t.saldo > 0 ? "#F87171" : "#4ADE80" }}>
                                            {fmtValor(t.saldo)}
                                        </td>
                                        <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px",
                            borderRadius: 20, background: cor.bg, border: `1px solid ${cor.border}`,
                            color: cor.color }}>
                          {t.status}
                        </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button onClick={() => abrirEditar(t)} className="btn-acao"
                                                        style={{ fontSize: 12 }}>✏️</button>
                                                <button onClick={() => excluir(t.id)} className="btn-acao btn-acao--excluir"
                                                        style={{ fontSize: 12 }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginação */}
                {total > 20 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0 0" }}>
                        <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}
                                className="btn-acao">← Anterior</button>
                        <span style={{ color: "var(--text-dim)", fontSize: 13, alignSelf: "center" }}>
              Página {pagina + 1} de {Math.ceil(total / 20)}
            </span>
                        <button disabled={(pagina + 1) * 20 >= total} onClick={() => setPagina(p => p + 1)}
                                className="btn-acao">Próxima →</button>
                    </div>
                )}
            </div>

            {/* Modal de cadastro / edição */}
            {modalAberto && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "flex-start", justifyContent: "center",
                    padding: "24px", overflowY: "auto"
                }}>
                    <div style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 20, padding: "32px", maxWidth: 640, width: "100%",
                        margin: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
                    }}>
                        <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
                            {editando ? "Editar título" : "Novo título"}
                        </h2>
                        <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "0 0 20px" }}>
                            Campos marcados com <span style={{ color: "#F87171" }}>*</span> são obrigatórios
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                            {campo("Prefixo", "prefixo", "text", { maxLength: 10 })}
                            {campo("Número *", "numero", "text", { maxLength: 20 })}
                            {campo("Parcela", "parcela", "text", { maxLength: 3 })}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                            {campo("Tipo *", "tipo", "text", { select: true, options: TIPOS })}
                            {campo("Status", "status", "text", { select: true, options: STATUS_OPCOES })}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                            {campo("Nome do fornecedor *", "fornecedorNome", "text", { maxLength: 150 })}
                            {campo("CNPJ / CPF *", "fornecedorDocumento", "text", { maxLength: 20 })}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                            {campo("Emissão", "emissao", "date")}
                            {campo("Vencimento *", "vencimento", "date")}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 12px" }}>
                            {campo("Valor (R$) *", "valor", "text", { moeda: true })}
                            {campo("Desconto (R$)", "desconto", "text", { moeda: true })}
                            {campo("Juros (R$)", "juros", "text", { moeda: true })}
                            {campo("Multa (R$)", "multa", "text", { moeda: true })}
                        </div>

                        {campo("Código de barras", "codigoBarras", "text", { maxLength: 50 })}
                        {campo("Linha digitável", "linhaDigitavel", "text", { maxLength: 100 })}
                        {campo("Observação", "observacao", "text", { maxLength: 500 })}

                        {erro && (
                            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                color: "#F87171", fontSize: 13 }}>
                                {erro}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                            <button onClick={() => setModalAberto(false)}
                                    style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent",
                                        border: "1px solid var(--border)", color: "var(--text-muted)",
                                        fontWeight: 600, cursor: "pointer" }}>
                                Cancelar
                            </button>
                            <button onClick={salvar} disabled={salvando}
                                    style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--purple)",
                                        border: "none", color: "white", fontWeight: 700, cursor: "pointer",
                                        opacity: salvando ? 0.6 : 1 }}>
                                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar título"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
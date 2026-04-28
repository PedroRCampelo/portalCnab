import { useState, useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import InsightCard from "../components/InsightCard.jsx";
import { LuUndo2 } from "react-icons/lu";

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
    // CNAB — dados bancários do favorecido (Seg A)
    favorecidoBancoCode: "", favorecidoAgencia: "", favorecidoAgenciaDv: "",
    favorecidoConta: "", favorecidoContaDv: "",
    favorecidoTipoConta: "CC", favorecidoTipoInscricao: "2",
    finalidadeTed: "", finalidadeDoc: "", aviso: "0",
    // CNAB — PIX
    tipoChavePix: "", chavePix: "",
    // CNAB — endereço favorecido
    favorecidoLogradouro: "", favorecidoCidade: "", favorecidoEstado: "", favorecidoCep: "",
    // CNAB — controle
    seuNumero: "", nossoNumero: "",
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
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "12px 14px",
                    fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
                    width: 320, zIndex: 100, textAlign: "left",
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

    // NOVO: contas bancárias e seleção
    const [contasBancarias,   setContasBancarias]   = useState([]);
    const [baixaContaId,      setBaixaContaId]      = useState("");
    const [carregandoContas,  setCarregandoContas]  = useState(false);

    const [abaModal,     setAbaModal]     = useState("geral"); // "geral" | "cnab"
    const [modalParcelado, setModalParcelado] = useState(false);
    const [formParcelado,  setFormParcelado]  = useState({
        qtdParcelas: "2", intervaloDias: "30", vencimento1: hoje(),
    });
    const [salvandoParcelado, setSalvandoParcelado] = useState(false);
    const [erroParcelado,     setErroParcelado]     = useState("");
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
        setEditando(null); setForm(TITULO_VAZIO); setErro(""); setAbaModal("geral"); setModalAberto(true);
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
            // CNAB
            favorecidoBancoCode: t.favorecidoBancoCode ?? "",
            favorecidoAgencia: t.favorecidoAgencia ?? "",
            favorecidoAgenciaDv: t.favorecidoAgenciaDv ?? "",
            favorecidoConta: t.favorecidoConta ?? "",
            favorecidoContaDv: t.favorecidoContaDv ?? "",
            favorecidoTipoConta: t.favorecidoTipoConta ?? "CC",
            favorecidoTipoInscricao: t.favorecidoTipoInscricao ?? "2",
            finalidadeTed: t.finalidadeTed ?? "",
            finalidadeDoc: t.finalidadeDoc ?? "",
            aviso: t.aviso ?? "0",
            tipoChavePix: t.tipoChavePix ?? "",
            chavePix: t.chavePix ?? "",
            favorecidoLogradouro: t.favorecidoLogradouro ?? "",
            favorecidoCidade: t.favorecidoCidade ?? "",
            favorecidoEstado: t.favorecidoEstado ?? "",
            favorecidoCep: t.favorecidoCep ?? "",
            seuNumero: t.seuNumero ?? "",
            nossoNumero: t.nossoNumero ?? "",
        });
        setErro(""); setAbaModal("geral"); setModalAberto(true);
    }

    async function salvarParcelado() {
        setErroParcelado("");
        const qtd      = parseInt(formParcelado.qtdParcelas);
        const intervalo = parseInt(formParcelado.intervaloDias);
        if (!form.numero || !form.fornecedorNome || !form.valor) {
            setErroParcelado("Preencha Número, Fornecedor e Valor antes de parcelar."); return;
        }
        if (qtd < 2 || qtd > 360) { setErroParcelado("Número de parcelas deve ser entre 2 e 360."); return; }
        if (intervalo < 1)         { setErroParcelado("Intervalo deve ser de pelo menos 1 dia."); return; }

        setSalvandoParcelado(true);
        try {
            const payload = {
                titulo: {
                    ...form,
                    tipoGastoId: form.tipoGastoId || null,
                    valor:    parseMoeda(form.valor),
                    saldo:    parseMoeda(form.valor),
                    desconto: parseMoeda(form.desconto),
                    juros:    parseMoeda(form.juros),
                    multa:    parseMoeda(form.multa),
                    vencimento: formParcelado.vencimento1,
                },
                qtdParcelas:  qtd,
                intervaloDias: intervalo,
            };
            const { data } = await api.post("/api/titulos/parcelado", payload);
            setModalParcelado(false);
            setModalAberto(false);
            carregarTitulos();
            carregarResumo();
            alert(`✅ ${data.mensagem}`);
        } catch (err) {
            setErroParcelado(err.response?.data?.mensagem ?? "Erro ao criar parcelas.");
        } finally { setSalvandoParcelado(false); }
    }

    // ATUALIZADO: agora carrega contas bancárias ao abrir o modal
    async function abrirBaixa(t) {
        setModalBaixa(t);
        setBaixaValor(t.saldo ? mascaraMoeda(String(Math.round(t.saldo * 100))) : "");
        setBaixaData(hoje());
        setBaixaObs("");
        setErroBaixa("");
        setBaixaContaId("");

        // Carrega contas ativas
        setCarregandoContas(true);
        try {
            const { data } = await api.get("/api/saldos-bancarios");
            setContasBancarias(data || []);

            // Pré-seleciona conta principal (ou primeira)
            const principal = data?.find(c => c.principal);
            const padrao = principal ?? data?.[0];
            if (padrao) {
                setBaixaContaId(padrao.id);
            }
        } catch (err) {
            console.error("Erro ao carregar contas", err);
            setContasBancarias([]);
        } finally {
            setCarregandoContas(false);
        }
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
            // Erro 400 do backend (ex: bloqueio de edição em título pago)
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar título.");
        } finally { setSalvando(false); }
    }

    async function confirmarExcluir() {
        try {
            await api.delete(`/api/titulos/${modalExcluir.id}`);
            setModalExcluir(null); carregarTitulos(); carregarResumo();
        } catch (err) {
            const msg = err.response?.data?.mensagem ?? "Erro ao excluir título.";
            setModalExcluir(null);
            alert("⚠️ " + msg);
        }
    }

    async function estornarTitulo(t) {
        const confirmacao = window.confirm(
            `Estornar a baixa do título #${t.numero}?\n\n` +
            `O título voltará para o status de pendente. ` +
            `O movimento bancário do pagamento será compensado e ficará registrado no histórico.`
        );
        if (!confirmacao) return;
        try {
            await api.post(`/api/titulos/${t.id}/estornar`);
            carregarTitulos(); carregarResumo();
        } catch (err) {
            const msg = err.response?.data?.mensagem ?? "Erro ao estornar título.";
            alert("⚠️ " + msg);
        }
    }

    // ATUALIZADO: envia contaId no payload
    async function confirmarBaixa() {
        setErroBaixa("");
        const valorNum = parseMoeda(baixaValor);
        if (valorNum <= 0) { setErroBaixa("Informe um valor maior que zero."); return; }
        if (!baixaContaId) { setErroBaixa("Selecione a conta bancária do pagamento."); return; }
        setBaixando(true);
        try {
            await api.post(`/api/titulos/${modalBaixa.id}/baixa`, {
                valorPago: valorNum,
                dataBaixa: baixaData,
                observacao: baixaObs,
                contaId: baixaContaId,  // NOVO
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
                    <Link to="/relatorios-titulos" style={{
                        padding: "9px 14px", borderRadius: 10, background: "transparent",
                        border: "1px solid var(--border)", color: "var(--text-muted)",
                        fontWeight: 600, fontSize: 13, textDecoration: "none",
                        display: "inline-flex", alignItems: "center", gap: 6
                    }}>
                        📊 Relatórios
                    </Link>
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

            {/* ── Insight de IA ── */}
            <div style={{ marginBottom: 24 }}>
                <InsightCard/>
            </div>

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
                                            {(() => {
                                                // Estado do título pra decidir quais botões mostrar
                                                const ehPago     = t.status === "PAGO";
                                                const temBaixa   = ehPago || (t.saldo != null && t.valor != null && t.saldo < t.valor);
                                                const podeBaixar = !ehPago;       // pode baixar enquanto não totalmente pago
                                                const podeEstornar = temBaixa;    // pode estornar se tem qualquer baixa
                                                const podeEditar = !temBaixa;     // só edita se não tem baixa
                                                const podeExcluir = !temBaixa;    // só exclui se não tem baixa

                                                return (
                                                    <div style={{ display: "flex", gap: 5 }}>
                                                        {podeBaixar && (
                                                            <button onClick={() => abrirBaixa(t)} title="Registrar baixa"
                                                                    className="btn-acao"
                                                                    style={{ fontSize: 12, background: "rgba(17,17,17,0.06)", borderColor: "rgba(17,17,17,0.18)", color: "var(--text)" }}>
                                                                💰
                                                            </button>
                                                        )}
                                                        {podeEstornar && (
                                                            <button onClick={() => estornarTitulo(t)} title="Estornar baixa"
                                                                    className="btn-acao"
                                                                    style={{ fontSize: 12,
                                                                        background: "rgba(245,158,11,0.10)",
                                                                        borderColor: "rgba(245,158,11,0.35)",
                                                                        color: "#D97706",
                                                                        display: "inline-flex", alignItems: "center" }}>
                                                                <LuUndo2 size={13}/>
                                                            </button>
                                                        )}
                                                        {podeEditar && (
                                                            <button onClick={() => abrirEditar(t)} className="btn-acao" title="Editar" style={{ fontSize: 12 }}>✏️</button>
                                                        )}
                                                        {podeExcluir && (
                                                            <button onClick={() => setModalExcluir({ id: t.id, numero: t.numero })}
                                                                    className="btn-acao btn-acao--excluir" title="Excluir" style={{ fontSize: 12 }}>🗑️</button>
                                                        )}
                                                    </div>
                                                );
                                            })()}
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
                <Modal largura={680}>
                    <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
                        {editando ? "Editar título" : "Novo título"}
                    </h2>
                    <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "0 0 12px" }}>
                        Campos marcados com <span style={{ color: "var(--warning)" }}>*</span> são obrigatórios
                    </p>

                    {/* Abas */}
                    <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
                        {[{ id: "geral", label: "📋 Geral" }, { id: "cnab", label: "🏦 CNAB / Remessa" }].map(aba => (
                            <button key={aba.id} onClick={() => setAbaModal(aba.id)}
                                    style={{
                                        padding: "8px 16px", border: "none", cursor: "pointer",
                                        background: "transparent", fontSize: 13, fontWeight: 600,
                                        color: abaModal === aba.id ? "var(--text)" : "var(--text-dim)",
                                        borderBottom: abaModal === aba.id ? "2px solid var(--gold, #F59E0B)" : "2px solid transparent",
                                        marginBottom: -1,
                                    }}>
                                {aba.label}
                            </button>
                        ))}
                    </div>

                    {/* Aba Geral */}
                    {abaModal === "geral" && (<>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                            <CampoInput label="Prefixo"   value={form.prefixo}  onChange={setField("prefixo")}  maxLength={10}/>
                            <CampoInput label="Número *"  value={form.numero}   onChange={setField("numero")}   maxLength={20} obrigatorio/>
                            <CampoInput label="Parcela"   value={form.parcela}  onChange={setField("parcela")}  maxLength={3}/>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                            <CampoInput label="Tipo pagamento" value={form.tipo}        onChange={setField("tipo")}        select options={TIPOS}/>
                            <CampoInput label="Status"         value={form.status}      onChange={setField("status")}      select options={STATUS_OPS}/>
                            <CampoInput label="Tipo de gasto"  value={form.tipoGastoId} onChange={setField("tipoGastoId")} select options={tipoGastoOpts}/>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                            <CampoInput label="Nome do fornecedor *" value={form.fornecedorNome}      onChange={setField("fornecedorNome")}      maxLength={150} obrigatorio/>
                            <CampoInput label="CNPJ / CPF"           value={form.fornecedorDocumento} onChange={v => setForm(f => ({ ...f, fornecedorDocumento: mascaraDoc(v) }))} maxLength={20}/>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                            <CampoInput label="Emissão"      value={form.emissao}    onChange={setField("emissao")}    tipo="date"/>
                            <CampoInput label="Vencimento *" value={form.vencimento} onChange={setField("vencimento")} tipo="date" obrigatorio/>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 12px" }}>
                            <CampoInput label="Valor (R$) *" value={form.valor}    onChange={setField("valor")}    moeda obrigatorio/>
                            <CampoInput label="Desconto"     value={form.desconto} onChange={setField("desconto")} moeda/>
                            <CampoInput label="Juros"        value={form.juros}    onChange={setField("juros")}    moeda/>
                            <CampoInput label="Multa"        value={form.multa}    onChange={setField("multa")}    moeda/>
                        </div>
                        <CampoInput label="Observação" value={form.observacao} onChange={setField("observacao")} maxLength={500}/>
                    </>)}

                    {/* Aba CNAB */}
                    {abaModal === "cnab" && (
                        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
                            <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "0 0 16px", padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                Preencha os dados para gerar remessa CNAB deste título. Preencha apenas o grupo correspondente ao tipo de pagamento.
                            </p>

                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>🔑 Boleto (Segmento J)</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                                <CampoInput label="Código de barras" value={form.codigoBarras}   onChange={setField("codigoBarras")}   maxLength={50}/>
                                <CampoInput label="Linha digitável"  value={form.linhaDigitavel} onChange={setField("linhaDigitavel")} maxLength={100}/>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0 16px" }}/>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>🏦 TED / DOC / Crédito em conta (Segmento A)</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                                <CampoInput label="Banco favorecido" value={form.favorecidoBancoCode} onChange={setField("favorecidoBancoCode")} maxLength={3} placeholder="341"/>
                                <CampoInput label="Tipo de conta" value={form.favorecidoTipoConta} onChange={setField("favorecidoTipoConta")} select
                                            options={[{ value: "CC", label: "Conta Corrente" }, { value: "CP", label: "Poupança" }, { value: "PP", label: "Pgto" }]}/>
                                <CampoInput label="Tipo inscrição" value={form.favorecidoTipoInscricao} onChange={setField("favorecidoTipoInscricao")} select
                                            options={[{ value: "1", label: "CPF" }, { value: "2", label: "CNPJ" }]}/>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 3fr 1fr", gap: "0 12px" }}>
                                <CampoInput label="Agência"  value={form.favorecidoAgencia}   onChange={setField("favorecidoAgencia")}   maxLength={5}/>
                                <CampoInput label="DV ag."   value={form.favorecidoAgenciaDv} onChange={setField("favorecidoAgenciaDv")} maxLength={1}/>
                                <CampoInput label="Conta"    value={form.favorecidoConta}     onChange={setField("favorecidoConta")}     maxLength={12}/>
                                <CampoInput label="DV conta" value={form.favorecidoContaDv}   onChange={setField("favorecidoContaDv")}   maxLength={1}/>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
                                <CampoInput label="Finalidade TED" value={form.finalidadeTed} onChange={setField("finalidadeTed")} maxLength={5} placeholder="00001"/>
                                <CampoInput label="Finalidade DOC" value={form.finalidadeDoc} onChange={setField("finalidadeDoc")} maxLength={2}/>
                                <CampoInput label="Aviso" value={form.aviso} onChange={setField("aviso")} select
                                            options={[{ value: "0", label: "Não avisar" }, { value: "2", label: "Avisar favorecido" }]}/>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0 16px" }}/>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>⚡ PIX</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0 12px" }}>
                                <CampoInput label="Tipo de chave" value={form.tipoChavePix} onChange={setField("tipoChavePix")} select
                                            options={[
                                                { value: "", label: "— Selecione —" },
                                                { value: "CPF", label: "CPF" }, { value: "CNPJ", label: "CNPJ" },
                                                { value: "EMAIL", label: "E-mail" }, { value: "TELEFONE", label: "Telefone" },
                                                { value: "EVP", label: "Chave aleatória (EVP)" },
                                            ]}/>
                                <CampoInput label="Chave PIX" value={form.chavePix} onChange={setField("chavePix")} maxLength={99}/>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0 16px" }}/>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>📍 Endereço do favorecido (Segmento B)</div>
                            <CampoInput label="Logradouro" value={form.favorecidoLogradouro} onChange={setField("favorecidoLogradouro")} maxLength={40}/>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0 12px" }}>
                                <CampoInput label="Cidade" value={form.favorecidoCidade} onChange={setField("favorecidoCidade")} maxLength={15}/>
                                <CampoInput label="UF"     value={form.favorecidoEstado} onChange={setField("favorecidoEstado")} maxLength={2}/>
                                <CampoInput label="CEP"    value={form.favorecidoCep}    onChange={setField("favorecidoCep")}    maxLength={8}/>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0 16px" }}/>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>🔢 Controle / Referência</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                                <CampoInput label="Seu número"              value={form.seuNumero}   onChange={setField("seuNumero")}   maxLength={20}/>
                                <CampoInput label="Nosso número (retorno)"  value={form.nossoNumero} onChange={setField("nossoNumero")} maxLength={20}/>
                            </div>
                        </div>
                    )}

                    {erro && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, margin: "8px 0",
                            background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.3)",
                            color: "var(--warning)", fontSize: 13 }}>{erro}</div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <button onClick={() => setModalAberto(false)}
                                style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent",
                                    border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                        </button>
                        {!editando && (
                            <button onClick={() => { setErroParcelado(""); setModalParcelado(true); }}
                                    style={{ flex: 1, padding: "12px", borderRadius: 10,
                                        background: "transparent", border: "1px solid var(--border)",
                                        color: "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}>
                                📅 Parcelar
                            </button>
                        )}
                        <button onClick={salvar} disabled={salvando}
                                style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--purple)",
                                    border: "none", color: "white", fontWeight: 700, cursor: "pointer", opacity: salvando ? 0.6 : 1 }}>
                            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar título"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Modal: Parcelamento ── */}
            {modalParcelado && (
                <Modal largura={440}>
                    <h3 style={{ color: "var(--text)", fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>
                        📅 Lançamento parcelado
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 20px", lineHeight: 1.6 }}>
                        Serão criados <strong style={{ color: "var(--text)" }}>{formParcelado.qtdParcelas}</strong> títulos
                        com o número <strong style={{ color: "var(--text)" }}>{form.numero || "—"}</strong>,
                        parcelas 001 a {String(parseInt(formParcelado.qtdParcelas) || 2).padStart(3, "0")},
                        valor de <strong style={{ color: "var(--text)" }}>{form.valor || "0,00"}</strong> cada.
                    </p>

                    <CampoInput label="Vencimento da 1ª parcela *"
                                value={formParcelado.vencimento1}
                                onChange={v => setFormParcelado(f => ({ ...f, vencimento1: v }))}
                                tipo="date" obrigatorio/>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                        <CampoInput label="Número de parcelas *"
                                    value={formParcelado.qtdParcelas}
                                    onChange={v => setFormParcelado(f => ({ ...f, qtdParcelas: v.replace(/\D/g, "") }))}
                                    placeholder="Ex: 12" obrigatorio/>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 4, display: "block" }}>
                                Intervalo entre parcelas *
                            </label>
                            <select
                                value={formParcelado.intervaloDias}
                                onChange={e => setFormParcelado(f => ({ ...f, intervaloDias: e.target.value }))}
                                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--bg)",
                                    border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}>
                                <option value="7">Semanal (7 dias)</option>
                                <option value="15">Quinzenal (15 dias)</option>
                                <option value="30">Mensal (30 dias)</option>
                                <option value="60">Bimestral (60 dias)</option>
                                <option value="90">Trimestral (90 dias)</option>
                                <option value="customizado">Personalizado</option>
                            </select>
                        </div>
                    </div>

                    {formParcelado.intervaloDias === "customizado" && (
                        <CampoInput label="Dias entre parcelas *"
                                    value={formParcelado.diasCustomizados ?? ""}
                                    onChange={v => setFormParcelado(f => ({ ...f, diasCustomizados: v.replace(/\D/g, "") }))}
                                    placeholder="Ex: 45" obrigatorio/>
                    )}

                    {/* Preview de datas */}
                    {formParcelado.vencimento1 && formParcelado.qtdParcelas >= 2 && (() => {
                        const intervalo = formParcelado.intervaloDias === "customizado"
                            ? parseInt(formParcelado.diasCustomizados || 0)
                            : parseInt(formParcelado.intervaloDias);
                        const qtd = Math.min(parseInt(formParcelado.qtdParcelas) || 0, 4);
                        const datas = [];
                        for (let i = 0; i < qtd; i++) {
                            const d = new Date(formParcelado.vencimento1 + "T00:00:00");
                            d.setDate(d.getDate() + intervalo * i);
                            datas.push(`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`);
                        }
                        const total = parseInt(formParcelado.qtdParcelas) || 0;
                        return intervalo > 0 ? (
                            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8,
                                background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-dim)" }}>
                                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Preview das datas:</div>
                                {datas.map((d, i) => (
                                    <div key={i}>{String(i+1).padStart(3,"0")} → {d}</div>
                                ))}
                                {total > 4 && <div style={{ marginTop: 2 }}>... e mais {total - 4} parcela{total - 4 > 1 ? "s" : ""}</div>}
                            </div>
                        ) : null;
                    })()}

                    {erroParcelado && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                            background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
                            color: "#DC2626", fontSize: 13 }}>{erroParcelado}</div>
                    )}

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setModalParcelado(false)}
                                style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent",
                                    border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                        </button>
                        <button onClick={() => {
                            const intervalo = formParcelado.intervaloDias === "customizado"
                                ? parseInt(formParcelado.diasCustomizados || 0)
                                : parseInt(formParcelado.intervaloDias);
                            setFormParcelado(f => ({ ...f, intervaloDias: String(intervalo) }));
                            salvarParcelado();
                        }} disabled={salvandoParcelado}
                                style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--purple)",
                                    border: "none", color: "white", fontWeight: 700, cursor: "pointer",
                                    opacity: salvandoParcelado ? 0.6 : 1 }}>
                            {salvandoParcelado ? "Criando parcelas..." : `Criar ${formParcelado.qtdParcelas || 0} parcelas`}
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

                    {/* NOVO: Seleção de conta bancária */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
                            Conta bancária <span style={{ color: "var(--warning)" }}>*</span>
                        </label>
                        {carregandoContas ? (
                            <div style={{
                                padding: "10px 12px", borderRadius: 8, background: "var(--bg)",
                                border: "1px solid var(--border)", fontSize: 13, color: "var(--text-dim)",
                            }}>
                                Carregando contas...
                            </div>
                        ) : contasBancarias.length === 0 ? (
                            <div style={{
                                padding: "10px 12px", borderRadius: 8,
                                background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)",
                                fontSize: 12, color: "#DC2626", lineHeight: 1.5,
                            }}>
                                ⚠️ Nenhuma conta bancária cadastrada. Cadastre uma conta em{" "}
                                <Link to="/fluxo-caixa" style={{ color: "#DC2626", fontWeight: 700 }}>Fluxo de Caixa</Link>{" "}
                                antes de registrar a baixa.
                            </div>
                        ) : (
                            <select
                                value={baixaContaId}
                                onChange={e => setBaixaContaId(e.target.value)}
                                style={{
                                    width: "100%", padding: "10px 12px", borderRadius: 8,
                                    background: "var(--bg)", border: "1px solid var(--border)",
                                    color: "var(--text)", fontSize: 14, boxSizing: "border-box",
                                }}>
                                <option value="">Selecione a conta</option>
                                {contasBancarias.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nomeConta}{c.banco ? ` — ${c.banco}` : ""} · saldo: {
                                        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(c.saldoAtual))
                                    }
                                        {c.principal ? " ⭐" : ""}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

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
                        <button onClick={confirmarBaixa} disabled={baixando || valorBaixa <= 0 || !baixaContaId || contasBancarias.length === 0}
                                style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--grad)",
                                    border: "1px solid rgba(212,160,23,0.45)", color: "#1a1a1a", fontWeight: 700, cursor: "pointer",
                                    opacity: (baixando || valorBaixa <= 0 || !baixaContaId || contasBancarias.length === 0) ? 0.5 : 1 }}>
                            {baixando ? "Registrando..." : quita ? "✅ Confirmar quitação" : "⚡ Confirmar baixa parcial"}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
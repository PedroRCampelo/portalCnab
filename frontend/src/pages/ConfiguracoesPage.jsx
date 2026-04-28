import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import {
    LuSettings, LuBuilding, LuLandmark, LuLoader, LuCircleCheck,
    LuCircleAlert, LuInfo, LuPercent, LuLock,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIAS_DAS = [
    { value: "COMERCIO_INDUSTRIA", label: "Comércio / Indústria",  valor: 76.90, descricao: "Paga ICMS" },
    { value: "SERVICOS",           label: "Serviços",                valor: 80.90, descricao: "Paga ISS" },
    { value: "AMBOS",              label: "Comércio + Serviços",     valor: 81.90, descricao: "Paga ICMS + ISS" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtValor(v) {
    if (v == null) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function mascaraMoeda(valor) {
    const nums = String(valor).replace(/\D/g, "");
    if (!nums) return "";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .format(parseFloat(nums) / 100);
}

function parseMoeda(valor) {
    if (!valor) return null;
    const num = parseFloat(String(valor).replace(/\./g, "").replace(",", "."));
    return isNaN(num) ? null : num;
}

function formatarMoedaParaInput(valor) {
    if (valor == null) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(Number(valor));
}

function mascaraCnpj(valor) {
    if (!valor) return "";
    const d = String(valor).replace(/\D/g, "").slice(0, 14);
    let r = d;
    if (d.length > 2)  r = d.slice(0, 2) + "." + d.slice(2);
    if (d.length > 5)  r = r.slice(0, 6) + "." + r.slice(6);
    if (d.length > 8)  r = r.slice(0, 10) + "/" + r.slice(10);
    if (d.length > 12) r = r.slice(0, 15) + "-" + r.slice(15);
    return r;
}

function cnpjEhValido(cnpj) {
    const d = String(cnpj).replace(/\D/g, "");
    if (d.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(d)) return false;

    const calcular = (digitos, pesos) => {
        let soma = 0;
        for (let i = 0; i < pesos.length; i++) {
            soma += parseInt(digitos[i]) * pesos[i];
        }
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const peso1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const peso2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    if (calcular(d, peso1) !== parseInt(d[12])) return false;
    if (calcular(d, peso2) !== parseInt(d[13])) return false;
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
    const [empresa, setEmpresa]       = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro]             = useState("");
    const [sucesso, setSucesso]       = useState("");

    const [nome, setNome]                       = useState("");
    const [cnpj, setCnpj]                       = useState("");
    const [limiteAnual, setLimiteAnual]         = useState("");
    const [dasAtivo, setDasAtivo]               = useState(false);
    const [dasCategoria, setDasCategoria]       = useState("");
    const [dasValorCustom, setDasValorCustom]   = useState("");
    const [usarValorCustom, setUsarValorCustom] = useState(false);

    const [salvando, setSalvando] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const { data } = await api.get("/api/empresa");
            setEmpresa(data);
            setNome(data.nome ?? "");
            setCnpj(data.cnpj ?? "");
            setLimiteAnual(formatarMoedaParaInput(data.limiteAnualMei));
            setDasAtivo(!!data.dasAtivo);
            setDasCategoria(data.dasCategoria ?? "");
            setUsarValorCustom(data.dasValorMensal != null);
            setDasValorCustom(data.dasValorMensal != null ? formatarMoedaParaInput(data.dasValorMensal) : "");
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar empresa");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    // Estados derivados
    const cnpjBloqueado = empresa?.cnpj != null && empresa.cnpj.length > 0;
    const temCnpj       = cnpjBloqueado;  // só conta CNPJ "real" do servidor, não o digitado
    const seccoesMeiBloqueadas = !temCnpj;

    async function salvar() {
        setErro("");
        setSucesso("");

        // Bloqueia salvar features MEI se sem CNPJ
        if (seccoesMeiBloqueadas && dasAtivo) {
            setErro("Adicione e salve seu CNPJ antes de ativar o controle do DAS.");
            return;
        }

        if (dasAtivo && !dasCategoria) {
            setErro("Selecione a categoria do DAS antes de ativar");
            return;
        }
        const limiteNum = parseMoeda(limiteAnual);
        if (!limiteNum || limiteNum <= 0) {
            setErro("Limite anual MEI deve ser maior que zero");
            return;
        }

        // Valida CNPJ se foi preenchido (e não está bloqueado)
        if (!cnpjBloqueado && cnpj && cnpj.replace(/\D/g, "").length > 0) {
            if (!cnpjEhValido(cnpj)) {
                setErro("CNPJ inválido. Verifique os números.");
                return;
            }
        }

        const valorCustomNum = usarValorCustom ? parseMoeda(dasValorCustom) : null;

        const payload = {
            nome: nome.trim(),
            cnpj: !cnpjBloqueado && cnpj && cnpj.replace(/\D/g, "").length > 0 ? cnpj : null,
            limiteAnualMei: limiteNum,
            dasAtivo: temCnpj ? dasAtivo : false, // segurança: nunca envia true sem CNPJ
            dasCategoria: dasAtivo && temCnpj ? dasCategoria : null,
            dasValorMensal: valorCustomNum,
            dasValorMensalEditado: true,
        };

        setSalvando(true);
        try {
            const { data } = await api.put("/api/empresa", payload);
            setEmpresa(data);
            setCnpj(data.cnpj ?? "");
            setSucesso("Configurações salvas com sucesso!");
            setTimeout(() => setSucesso(""), 3000);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar");
        } finally {
            setSalvando(false);
        }
    }

    if (carregando) {
        return (
            <div style={containerStyle}>
                <div style={{ padding: 60, textAlign: "center", color: "var(--text-dim)" }}>
                    <LuLoader size={24} style={{ animation: "spin 1s linear infinite" }}/>
                    <div style={{ marginTop: 8 }}>Carregando configurações...</div>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const categoriaInfo = CATEGORIAS_DAS.find(c => c.value === dasCategoria);
    const valorEfetivo = dasAtivo
        ? (usarValorCustom && parseMoeda(dasValorCustom) ? parseMoeda(dasValorCustom) : categoriaInfo?.valor ?? 0)
        : null;

    return (
        <div style={containerStyle}>
            {/* Cabeçalho */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{
                    margin: 0, fontSize: 26, fontWeight: 700, color: "var(--text)",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <LuSettings size={26} style={{ color: "var(--cyan-dark)" }}/>
                    Configurações
                </h1>
                <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
                    Personalize sua empresa, limite MEI e controle do DAS.
                </p>
            </div>

            {/* Mensagens globais */}
            {erro && (
                <div style={erroBoxStyle}>
                    <LuCircleAlert size={16} style={{ marginRight: 6, verticalAlign: "middle" }}/>
                    {erro}
                </div>
            )}
            {sucesso && (
                <div style={sucessoBoxStyle}>
                    <LuCircleCheck size={16} style={{ marginRight: 6, verticalAlign: "middle" }}/>
                    {sucesso}
                </div>
            )}

            {/* Seção: Empresa */}
            <Section icon={<LuBuilding size={20}/>} titulo="Empresa">
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Nome da empresa</label>
                    <input type="text" value={nome}
                           onChange={e => setNome(e.target.value)}
                           placeholder="ex: Pedro Campelo MEI"
                           disabled={salvando} maxLength={150}/>
                </div>

                <div>
                    <label style={labelStyle}>
                        CNPJ
                        {cnpjBloqueado && (
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                marginLeft: 8, color: "#94A3B8", fontSize: 10,
                                fontWeight: 700, letterSpacing: "0.04em",
                            }}>
                                <LuLock size={11}/> bloqueado
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={cnpjBloqueado ? empresa.cnpj : cnpj}
                        onChange={e => setCnpj(mascaraCnpj(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        disabled={salvando || cnpjBloqueado}
                        maxLength={18}
                        style={cnpjBloqueado ? {
                            background: "var(--surface)",
                            color: "var(--text-muted)",
                            cursor: "not-allowed",
                        } : {}}/>
                    {cnpjBloqueado ? (
                        <small style={{ color: "var(--text-dim)", fontSize: 11, display: "block", marginTop: 4 }}>
                            <LuInfo size={11} style={{ verticalAlign: "middle", marginRight: 4 }}/>
                            CNPJ não pode ser alterado depois de cadastrado. Para correção,
                            entre em contato com o suporte.
                        </small>
                    ) : (
                        <small style={{ color: "var(--text-dim)", fontSize: 11, display: "block", marginTop: 4 }}>
                            Opcional. Adicione se você é MEI/empresa para desbloquear features fiscais (limite anual e DAS).
                        </small>
                    )}
                </div>
            </Section>

            {/* Seção: Limite MEI */}
            <Section
                icon={<LuPercent size={20}/>}
                titulo="Limite anual MEI"
                bloqueada={seccoesMeiBloqueadas}
                hintBloqueio="Adicione seu CNPJ na seção Empresa para usar.">

                <div style={infoBoxStyle}>
                    <LuInfo size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "var(--cyan-dark)" }}/>
                    Limite legal vigente: <strong>R$ 81.000,00 por ano</strong>. Se a regra mudar (ex: aumento pra R$ 144.913),
                    você pode ajustar aqui sem esperar atualização do app.
                </div>

                <div>
                    <label style={labelStyle}>Limite anual de faturamento (R$)</label>
                    <input type="text" value={limiteAnual}
                           onChange={e => setLimiteAnual(mascaraMoeda(e.target.value))}
                           placeholder="81.000,00"
                           disabled={salvando || seccoesMeiBloqueadas}/>
                </div>
            </Section>

            {/* Seção: DAS */}
            <Section
                icon={<LuLandmark size={20}/>}
                titulo="Controle do DAS"
                bloqueada={seccoesMeiBloqueadas}
                hintBloqueio="Adicione seu CNPJ na seção Empresa para usar.">

                <div style={infoBoxStyle}>
                    <LuInfo size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "var(--cyan-dark)" }}/>
                    Ative pra acompanhar os DAS mensais (R$ 76,90 a R$ 81,90 dependendo da categoria).
                    Quando ativar, o Whallet cria automaticamente os DAS pendentes do mês atual até dezembro.
                </div>

                <label style={{
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: seccoesMeiBloqueadas ? "not-allowed" : "pointer",
                    padding: "12px 0",
                    opacity: seccoesMeiBloqueadas ? 0.6 : 1,
                }}>
                    <input type="checkbox" checked={dasAtivo && !seccoesMeiBloqueadas}
                           onChange={e => setDasAtivo(e.target.checked)}
                           disabled={salvando || seccoesMeiBloqueadas}
                           style={{ margin: 0, width: 18, height: 18 }}/>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                        Quero controlar o DAS no Whallet
                    </span>
                </label>

                {dasAtivo && !seccoesMeiBloqueadas && (
                    <div style={{
                        marginTop: 12, padding: 16, borderRadius: 10,
                        background: "rgba(21,195,221,0.04)",
                        border: "1px solid rgba(21,195,221,0.15)",
                    }}>
                        <label style={labelStyle}>Categoria do MEI *</label>
                        <select value={dasCategoria}
                                onChange={e => setDasCategoria(e.target.value)}
                                disabled={salvando}
                                style={{ marginBottom: 12 }}>
                            <option value="">Selecione a categoria...</option>
                            {CATEGORIAS_DAS.map(c => (
                                <option key={c.value} value={c.value}>
                                    {c.label} — {fmtValor(c.valor)} ({c.descricao})
                                </option>
                            ))}
                        </select>
                        {dasCategoria && (
                            <small style={{ color: "var(--text-muted)", fontSize: 12, display: "block", marginBottom: 12 }}>
                                Valor padrão: <strong>{fmtValor(categoriaInfo?.valor)}</strong> · {categoriaInfo?.descricao}
                            </small>
                        )}

                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
                            <input type="checkbox" checked={usarValorCustom}
                                   onChange={e => setUsarValorCustom(e.target.checked)}
                                   disabled={salvando}
                                   style={{ margin: 0 }}/>
                            <span style={{ fontSize: 13, color: "var(--text)" }}>
                                Meu município cobra valor diferente
                            </span>
                        </label>

                        {usarValorCustom && (
                            <div style={{ marginTop: 8 }}>
                                <input type="text" value={dasValorCustom}
                                       onChange={e => setDasValorCustom(mascaraMoeda(e.target.value))}
                                       placeholder={categoriaInfo ? formatarMoedaParaInput(categoriaInfo.valor) : "0,00"}
                                       disabled={salvando}/>
                                <small style={{ color: "var(--text-dim)", fontSize: 11 }}>
                                    Verifique no carnê do DAS ou no portal Simples Nacional.
                                </small>
                            </div>
                        )}

                        {valorEfetivo && (
                            <div style={{
                                marginTop: 16, padding: "10px 14px", borderRadius: 8,
                                background: "rgba(16,185,129,0.06)",
                                border: "1px solid rgba(16,185,129,0.20)",
                                fontSize: 13,
                            }}>
                                <strong style={{ color: "#10B981" }}>Valor mensal usado:</strong>{" "}
                                {fmtValor(valorEfetivo)}
                            </div>
                        )}
                    </div>
                )}
            </Section>

            {/* Botão salvar */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <button onClick={salvar} className="auth-box-btn" disabled={salvando}
                        style={{ width: "auto", padding: "12px 32px", fontSize: 14 }}>
                    {salvando ? "Salvando..." : "Salvar configurações"}
                </button>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

function Section({ icon, titulo, children, bloqueada = false, hintBloqueio }) {
    return (
        <div style={{
            padding: 20, borderRadius: 12, marginBottom: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            opacity: bloqueada ? 0.65 : 1,
            position: "relative",
        }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                paddingBottom: 12, borderBottom: "1px solid var(--border)",
                justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--cyan-dark)", lineHeight: 0 }}>{icon}</span>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{titulo}</h2>
                </div>

                {bloqueada && (
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                        background: "rgba(148,163,184,0.10)",
                        border: "1px solid rgba(148,163,184,0.25)",
                        color: "#64748B",
                        letterSpacing: "0.04em",
                    }}>
                        <LuLock size={11}/> BLOQUEADO
                    </span>
                )}
            </div>

            {bloqueada && hintBloqueio && (
                <div style={{
                    padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                    background: "rgba(148,163,184,0.06)",
                    border: "1px solid rgba(148,163,184,0.20)",
                    fontSize: 12, color: "#64748B",
                    display: "flex", alignItems: "center", gap: 6,
                }}>
                    <LuInfo size={13} style={{ flexShrink: 0 }}/>
                    {hintBloqueio}
                </div>
            )}

            {children}
        </div>
    );
}

const containerStyle = { maxWidth: 760, margin: "0 auto", padding: "32px 24px" };
const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-dim)",
    marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em",
};
const infoBoxStyle = {
    padding: "10px 14px", borderRadius: 8, marginBottom: 16,
    background: "rgba(21,195,221,0.04)",
    border: "1px solid rgba(21,195,221,0.15)",
    fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
};
const erroBoxStyle = {
    padding: "10px 14px", borderRadius: 8, marginBottom: 16,
    background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.20)",
    color: "#DC2626", fontSize: 13,
};
const sucessoBoxStyle = {
    padding: "10px 14px", borderRadius: 8, marginBottom: 16,
    background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)",
    color: "#10B981", fontSize: 13,
};
import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import {
    LuSettings, LuBuilding, LuLandmark, LuLoader, LuCircleCheck,
    LuCircleAlert, LuInfo, LuPercent,
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

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
    const [empresa, setEmpresa]       = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro]             = useState("");
    const [sucesso, setSucesso]       = useState("");

    // Form values (editáveis)
    const [nome, setNome]                       = useState("");
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

    async function salvar() {
        setErro("");
        setSucesso("");

        // Validações de frontend
        if (dasAtivo && !dasCategoria) {
            setErro("Selecione a categoria do DAS antes de ativar");
            return;
        }
        const limiteNum = parseMoeda(limiteAnual);
        if (!limiteNum || limiteNum <= 0) {
            setErro("Limite anual MEI deve ser maior que zero");
            return;
        }

        const valorCustomNum = usarValorCustom ? parseMoeda(dasValorCustom) : null;

        const payload = {
            nome: nome.trim(),
            limiteAnualMei: limiteNum,
            dasAtivo,
            dasCategoria: dasAtivo ? dasCategoria : null,
            dasValorMensal: valorCustomNum,
            dasValorMensalEditado: true, // sempre envia o valor (null pra resetar)
        };

        setSalvando(true);
        try {
            const { data } = await api.put("/api/empresa", payload);
            setEmpresa(data);
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

                <div style={{ marginBottom: 0 }}>
                    <label style={labelStyle}>CNPJ</label>
                    <input type="text" value={empresa?.cnpj ?? ""} disabled
                           style={{ background: "var(--surface)", color: "var(--text-muted)", cursor: "not-allowed" }}/>
                    <small style={{ color: "var(--text-dim)", fontSize: 11 }}>
                        CNPJ não pode ser alterado pelo app. Entre em contato com o suporte se precisar.
                    </small>
                </div>
            </Section>

            {/* Seção: Limite MEI */}
            <Section icon={<LuPercent size={20}/>} titulo="Limite anual MEI">
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
                           disabled={salvando}/>
                </div>
            </Section>

            {/* Seção: DAS */}
            <Section icon={<LuLandmark size={20}/>} titulo="Controle do DAS">
                <div style={infoBoxStyle}>
                    <LuInfo size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "var(--cyan-dark)" }}/>
                    Ative pra acompanhar os DAS mensais (R$ 76,90 a R$ 81,90 dependendo da categoria).
                    Quando ativar, o Whallet cria automaticamente os DAS pendentes do mês atual até dezembro.
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 0" }}>
                    <input type="checkbox" checked={dasAtivo}
                           onChange={e => setDasAtivo(e.target.checked)}
                           disabled={salvando}
                           style={{ margin: 0, width: 18, height: 18 }}/>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                        Quero controlar o DAS no Whallet
                    </span>
                </label>

                {dasAtivo && (
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

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Section
// ─────────────────────────────────────────────────────────────────────────────
function Section({ icon, titulo, children }) {
    return (
        <div style={{
            padding: 20, borderRadius: 12, marginBottom: 16,
            background: "var(--surface)", border: "1px solid var(--border)",
        }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                paddingBottom: 12, borderBottom: "1px solid var(--border)",
            }}>
                <span style={{ color: "var(--cyan-dark)", lineHeight: 0 }}>{icon}</span>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{titulo}</h2>
            </div>
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos compartilhados
// ─────────────────────────────────────────────────────────────────────────────
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
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api.js";
import {
    LuSettings, LuBuilding, LuLandmark, LuLoader, LuCircleCheck,
    LuCircleAlert, LuInfo, LuPercent, LuLock, LuFileText,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes — alinhado com enums do backend
// ─────────────────────────────────────────────────────────────────────────────
const REGIMES = [
    {
        value: "NENHUM",
        label: "Pessoa Física / Sem regime",
        descricao: "Quero apenas controlar gastos e recebimentos",
        cobertura: "completa",
    },
    {
        value: "MEI",
        label: "MEI",
        descricao: "Microempreendedor Individual (até R$ 81 mil/ano)",
        cobertura: "completa",
    },
    {
        value: "SIMPLES_NACIONAL",
        label: "Simples Nacional (ME / EPP)",
        descricao: "Microempresa ou Empresa de Pequeno Porte",
        cobertura: "parcial",  // sem DAS automático ainda
    },
    {
        value: "LUCRO_PRESUMIDO",
        label: "Lucro Presumido",
        descricao: "Empresas até R$ 78 milhões/ano",
        cobertura: "limitada",
    },
    {
        value: "LUCRO_REAL",
        label: "Lucro Real",
        descricao: "Empresas grandes ou setores específicos",
        cobertura: "limitada",
    },
    {
        value: "OUTRO",
        label: "Outro",
        descricao: "Cooperativas, casos especiais",
        cobertura: "limitada",
    },
];

const CATEGORIAS_MEI = [
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

    // Form values
    const [nome, setNome]                       = useState("");
    const [cnpj, setCnpj]                       = useState("");
    const [regime, setRegime]                   = useState("NENHUM");
    const [limiteAnual, setLimiteAnual]         = useState("");
    const [dasAtivo, setDasAtivo]               = useState(false);
    const [meiCategoria, setMeiCategoria]       = useState("");
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
            setRegime(data.regimeTributario ?? "NENHUM");
            setLimiteAnual(formatarMoedaParaInput(data.limiteFaturamentoAnual));
            setDasAtivo(!!data.dasAtivo);
            setMeiCategoria(data.meiCategoria ?? "");
            setUsarValorCustom(data.meiValorDasMensal != null);
            setDasValorCustom(data.meiValorDasMensal != null ? formatarMoedaParaInput(data.meiValorDasMensal) : "");
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar empresa");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    // Quando troca o regime, sugere limite padrão se ainda não tem
    function trocarRegime(novoRegime) {
        setRegime(novoRegime);

        // Sugere limite padrão se vazio
        if (!limiteAnual) {
            if (novoRegime === "MEI")              setLimiteAnual("81.000,00");
            else if (novoRegime === "SIMPLES_NACIONAL") setLimiteAnual("360.000,00");
        }

        // Se sair de MEI, desativa DAS
        if (novoRegime !== "MEI") {
            setDasAtivo(false);
            setMeiCategoria("");
            setUsarValorCustom(false);
            setDasValorCustom("");
        }
    }

    // Estados derivados
    const cnpjBloqueado     = empresa?.cnpj != null && empresa.cnpj.length > 0;
    const temCnpj           = cnpjBloqueado;
    const ehMei             = regime === "MEI";
    const seccoesFiscaisBloqueadas = !temCnpj || regime === "NENHUM";
    const dasDisponivel     = ehMei && temCnpj;  // futuramente expande pra Simples
    const temLimite         = regime !== "NENHUM";  // todos os regimes com CNPJ têm limite
    const regimeInfo        = REGIMES.find(r => r.value === regime);

    async function salvar() {
        setErro("");
        setSucesso("");

        // Bloqueia DAS sem MEI
        if (dasAtivo && !ehMei) {
            setErro("DAS automático disponível apenas para regime MEI nesta versão.");
            return;
        }

        if (dasAtivo && !meiCategoria) {
            setErro("Selecione a categoria MEI antes de ativar o DAS");
            return;
        }

        // Limite obrigatório se regime exige
        if (temLimite && temCnpj) {
            const limiteNum = parseMoeda(limiteAnual);
            if (!limiteNum || limiteNum <= 0) {
                setErro("Limite anual deve ser maior que zero");
                return;
            }
        }

        // Valida CNPJ se digitado e não bloqueado
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
            regimeTributario: regime,
            limiteFaturamentoAnual: temLimite ? parseMoeda(limiteAnual) : null,
            meiCategoria: ehMei ? (meiCategoria || null) : null,
            meiValorDasMensal: ehMei ? valorCustomNum : null,
            meiValorDasMensalEditado: ehMei,
            dasAtivo: dasDisponivel ? dasAtivo : false,
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

    const categoriaInfo = CATEGORIAS_MEI.find(c => c.value === meiCategoria);
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
                    Personalize sua empresa, regime tributário e controle do DAS.
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
                            Opcional. Adicione se você é MEI/empresa para desbloquear features fiscais.
                        </small>
                    )}
                </div>
            </Section>

            {/* Seção: Regime tributário */}
            <Section icon={<LuFileText size={20}/>} titulo="Regime tributário">
                <div style={infoBoxStyle}>
                    <LuInfo size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "var(--cyan-dark)" }}/>
                    Define quais features fiscais ficam disponíveis (limite de faturamento, DAS, etc).
                    {!temCnpj && " Adicione o CNPJ na seção Empresa para liberar regimes empresariais."}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {REGIMES.map(r => (
                        <RegimeOption
                            key={r.value}
                            regime={r}
                            selecionado={regime === r.value}
                            disabled={salvando || (!temCnpj && r.value !== "NENHUM")}
                            onSelecionar={() => trocarRegime(r.value)}/>
                    ))}
                </div>
            </Section>

            {/* Seção: Limite anual de faturamento */}
            {regime !== "NENHUM" && (
                <Section
                    icon={<LuPercent size={20}/>}
                    titulo="Limite anual de faturamento"
                    bloqueada={seccoesFiscaisBloqueadas}
                    hintBloqueio="Adicione seu CNPJ na seção Empresa para usar.">

                    <div style={infoBoxStyle}>
                        <LuInfo size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "var(--cyan-dark)" }}/>
                        {regime === "MEI" && (
                            <>Limite legal MEI: <strong>R$ 81.000,00 por ano</strong>. Ajuste se a regra mudar.</>
                        )}
                        {regime === "SIMPLES_NACIONAL" && (
                            <>ME até R$ 360 mil/ano · EPP até R$ 4,8 milhões/ano. Ajuste conforme seu enquadramento.</>
                        )}
                        {(regime === "LUCRO_PRESUMIDO" || regime === "LUCRO_REAL" || regime === "OUTRO") && (
                            <>Defina o limite que se aplica ao seu regime. Será usado para o termômetro de faturamento.</>
                        )}
                    </div>

                    <div>
                        <label style={labelStyle}>Limite anual (R$)</label>
                        <input type="text" value={limiteAnual}
                               onChange={e => setLimiteAnual(mascaraMoeda(e.target.value))}
                               placeholder="81.000,00"
                               disabled={salvando || seccoesFiscaisBloqueadas}/>
                    </div>
                </Section>
            )}

            {/* Seção: DAS (só MEI por enquanto) */}
            {ehMei && (
                <Section
                    icon={<LuLandmark size={20}/>}
                    titulo="Controle do DAS"
                    bloqueada={!dasDisponivel}
                    hintBloqueio="Adicione seu CNPJ na seção Empresa para usar.">

                    <div style={infoBoxStyle}>
                        <LuInfo size={14} style={{ marginRight: 6, verticalAlign: "middle", color: "var(--cyan-dark)" }}/>
                        Ative pra acompanhar os DAS mensais (R$ 76,90 a R$ 81,90 dependendo da categoria).
                        Quando ativar, o Whallet cria automaticamente os DAS pendentes do mês atual até dezembro.
                    </div>

                    <label style={{
                        display: "flex", alignItems: "center", gap: 10,
                        cursor: !dasDisponivel ? "not-allowed" : "pointer",
                        padding: "12px 0",
                        opacity: !dasDisponivel ? 0.6 : 1,
                    }}>
                        <input type="checkbox" checked={dasAtivo && dasDisponivel}
                               onChange={e => setDasAtivo(e.target.checked)}
                               disabled={salvando || !dasDisponivel}
                               style={{ margin: 0, width: 18, height: 18 }}/>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                            Quero controlar o DAS no Whallet
                        </span>
                    </label>

                    {dasAtivo && dasDisponivel && (
                        <div style={{
                            marginTop: 12, padding: 16, borderRadius: 10,
                            background: "rgba(21,195,221,0.04)",
                            border: "1px solid rgba(21,195,221,0.15)",
                        }}>
                            <label style={labelStyle}>Categoria do MEI *</label>
                            <select value={meiCategoria}
                                    onChange={e => setMeiCategoria(e.target.value)}
                                    disabled={salvando}
                                    style={{ marginBottom: 12 }}>
                                <option value="">Selecione a categoria...</option>
                                {CATEGORIAS_MEI.map(c => (
                                    <option key={c.value} value={c.value}>
                                        {c.label} — {fmtValor(c.valor)} ({c.descricao})
                                    </option>
                                ))}
                            </select>
                            {meiCategoria && (
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
            )}

            {/* Aviso pra Simples Nacional / outros regimes */}
            {regime !== "NENHUM" && regime !== "MEI" && temCnpj && (
                <div style={{
                    padding: "14px 16px", borderRadius: 10, marginBottom: 16,
                    background: "rgba(212,160,23,0.06)",
                    border: "1px solid rgba(212,160,23,0.20)",
                    fontSize: 12, color: "#92400E", lineHeight: 1.6,
                }}>
                    <LuInfo size={14} style={{ marginRight: 6, verticalAlign: "middle" }}/>
                    <strong>Em breve:</strong> features fiscais específicas para {regimeInfo?.label}
                    {" "}(DAS percentual, alíquotas por anexo, etc). Por enquanto, você pode usar
                    todas as features de gestão financeira normalmente.
                </div>
            )}

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
// Componente: opção de regime (radio card)
// ─────────────────────────────────────────────────────────────────────────────
function RegimeOption({ regime, selecionado, disabled, onSelecionar }) {
    return (
        <div
            onClick={!disabled ? onSelecionar : undefined}
            style={{
                padding: "12px 14px", borderRadius: 10,
                border: "2px solid",
                borderColor: selecionado ? "var(--cyan-deep)" : "var(--border)",
                background: selecionado ? "rgba(21,195,221,0.05)" : "var(--bg)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "all 0.15s",
                display: "flex", alignItems: "flex-start", gap: 10,
            }}>
            <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                border: "2px solid",
                borderColor: selecionado ? "var(--cyan-deep)" : "var(--border)",
                background: selecionado ? "var(--cyan-deep)" : "transparent",
                position: "relative",
            }}>
                {selecionado && (
                    <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 6, height: 6, borderRadius: "50%", background: "white",
                    }}/>
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 2,
                    flexWrap: "wrap",
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                        {regime.label}
                    </span>
                    {regime.cobertura === "parcial" && (
                        <span style={{
                            padding: "1px 6px", borderRadius: 4,
                            fontSize: 9, fontWeight: 700,
                            background: "rgba(212,160,23,0.10)",
                            border: "1px solid rgba(212,160,23,0.25)",
                            color: "#D4A017",
                            textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>
                            DAS em breve
                        </span>
                    )}
                    {regime.cobertura === "limitada" && (
                        <span style={{
                            padding: "1px 6px", borderRadius: 4,
                            fontSize: 9, fontWeight: 700,
                            background: "rgba(148,163,184,0.10)",
                            border: "1px solid rgba(148,163,184,0.25)",
                            color: "#64748B",
                            textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>
                            básico
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{regime.descricao}</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Section (com suporte a bloqueio)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
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
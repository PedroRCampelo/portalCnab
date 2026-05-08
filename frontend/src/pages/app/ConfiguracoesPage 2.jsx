import { useState, useEffect, useCallback } from "react";
import {
    LuBuilding, LuLandmark, LuLoader, LuCircleCheck,
    LuTriangleAlert, LuInfo, LuPercent, LuLock, LuFileText,
    LuSave,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader from "../../components/shell/PageHeader.jsx";
import Card       from "../../components/ui/Card.jsx";
import {
    REGIMES, CATEGORIAS_MEI,
    fmtValor, mascaraMoeda, parseMoeda, formatarMoedaParaInput,
    mascaraCnpj, cnpjEhValido,
} from "./configuracoes/_helpers.js";

/**
 * ConfiguracoesPage — Configurações da empresa
 * Sprint A3.6.7 · Refatoração
 *
 * Seções (condicionais):
 *  1. Empresa — Nome + CNPJ (CNPJ bloqueado depois de cadastrado)
 *  2. Regime tributário — 6 opções (NENHUM / MEI / SN / LP / LR / OUTRO)
 *  3. Limite anual — Aparece se regime != NENHUM
 *  4. Controle DAS — Aparece se MEI (categoria + valor opcional)
 *
 * Endpoints:
 *  - GET /api/empresa
 *  - PUT /api/empresa (payload com nome, cnpj, regime, limite, dasAtivo, etc)
 */
export default function ConfiguracoesPage() {
    const [empresa,    setEmpresa]    = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro,       setErro]       = useState("");
    const [sucesso,    setSucesso]    = useState("");
    const [salvando,   setSalvando]   = useState(false);

    // Form values
    const [nome,            setNome]            = useState("");
    const [cnpj,            setCnpj]            = useState("");
    const [regime,          setRegime]          = useState("NENHUM");
    const [limiteAnual,     setLimiteAnual]     = useState("");
    const [dasAtivo,        setDasAtivo]        = useState(false);
    const [meiCategoria,    setMeiCategoria]    = useState("");
    const [dasValorCustom,  setDasValorCustom]  = useState("");
    const [usarValorCustom, setUsarValorCustom] = useState(false);

    // ── Carregamento ────────────────────────────────────────────────────────

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

    // ── Handlers ───────────────────────────────────────────────────────────

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
    const cnpjBloqueado            = empresa?.cnpj != null && empresa.cnpj.length > 0;
    const temCnpj                  = cnpjBloqueado;
    const ehMei                    = regime === "MEI";
    const seccoesFiscaisBloqueadas = !temCnpj || regime === "NENHUM";
    const dasDisponivel            = ehMei && temCnpj;
    const temLimite                = regime !== "NENHUM";
    const regimeInfo               = REGIMES.find(r => r.value === regime);
    const categoriaInfo            = CATEGORIAS_MEI.find(c => c.value === meiCategoria);
    const valorEfetivo             = dasAtivo
        ? (usarValorCustom && parseMoeda(dasValorCustom) ? parseMoeda(dasValorCustom) : categoriaInfo?.valor ?? 0)
        : null;

    // ── Salvar ─────────────────────────────────────────────────────────────

    async function salvar() {
        setErro("");
        setSucesso("");

        // Validações
        if (dasAtivo && !ehMei) {
            setErro("DAS automático disponível apenas para regime MEI nesta versão.");
            return;
        }
        if (dasAtivo && !meiCategoria) {
            setErro("Selecione a categoria MEI antes de ativar o DAS");
            return;
        }
        if (temLimite && temCnpj) {
            const limiteNum = parseMoeda(limiteAnual);
            if (!limiteNum || limiteNum <= 0) {
                setErro("Limite anual deve ser maior que zero");
                return;
            }
        }
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

    // ── Render ──────────────────────────────────────────────────────────────

    if (carregando) {
        return (
            <>
                <PageHeader title="Configurações"/>
                <div className="cfg-loading">
                    <LuLoader size={20} className="cfg-spin"/>
                    <span>Carregando configurações...</span>
                </div>
                <style>{COMPONENT_CSS}</style>
            </>
        );
    }

    return (
        <div className="cfg-container">
            <PageHeader
                title="Configurações"
                actions={
                    <button
                        className="ph-btn ph-btn--primary"
                        onClick={salvar}
                        disabled={salvando}
                    >
                        <LuSave size={14}/>
                        {salvando ? "Salvando..." : "Salvar configurações"}
                    </button>
                }
            />

            <p className="cfg-subtitulo">
                Personalize sua empresa, regime tributário e controle do DAS.
            </p>

            {/* Mensagens globais */}
            {erro && (
                <div className="cfg-msg cfg-msg--erro">
                    <LuTriangleAlert size={14}/>
                    {erro}
                </div>
            )}
            {sucesso && (
                <div className="cfg-msg cfg-msg--sucesso">
                    <LuCircleCheck size={14}/>
                    {sucesso}
                </div>
            )}

            {/* ── Seção: Empresa ── */}
            <Secao
                icon={<LuBuilding size={14}/>}
                title="Empresa"
            >
                <div className="cfg-field">
                    <label className="cfg-label">Nome da empresa</label>
                    <input
                        type="text"
                        className="cfg-input"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="ex: Pedro Campelo MEI"
                        disabled={salvando}
                        maxLength={150}
                    />
                </div>

                <div className="cfg-field">
                    <label className="cfg-label">
                        CNPJ
                        {cnpjBloqueado && (
                            <span className="cfg-lock-badge">
                                <LuLock size={10}/> Bloqueado
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        className={`cfg-input ${cnpjBloqueado ? "cfg-input--locked" : ""}`}
                        value={cnpjBloqueado ? empresa.cnpj : cnpj}
                        onChange={e => setCnpj(mascaraCnpj(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        disabled={salvando || cnpjBloqueado}
                        maxLength={18}
                    />
                    <small className="cfg-hint">
                        <LuInfo size={11}/>
                        {cnpjBloqueado
                            ? "CNPJ não pode ser alterado depois de cadastrado. Pra correção, fale com o suporte."
                            : "Opcional. Adicione se você é MEI/empresa pra desbloquear features fiscais."}
                    </small>
                </div>
            </Secao>

            {/* ── Seção: Regime tributário ── */}
            <Secao
                icon={<LuFileText size={14}/>}
                title="Regime tributário"
            >
                <div className="cfg-info-box">
                    <LuInfo size={13}/>
                    <span>
                        Define quais features fiscais ficam disponíveis (limite de faturamento, DAS, etc).
                        {!temCnpj && " Adicione o CNPJ na seção Empresa pra liberar regimes empresariais."}
                    </span>
                </div>

                <div className="cfg-regime-list">
                    {REGIMES.map(r => (
                        <RegimeOption
                            key={r.value}
                            regime={r}
                            selecionado={regime === r.value}
                            disabled={salvando || (!temCnpj && r.value !== "NENHUM")}
                            onSelecionar={() => trocarRegime(r.value)}
                        />
                    ))}
                </div>
            </Secao>

            {/* ── Seção: Limite anual de faturamento ── */}
            {regime !== "NENHUM" && (
                <Secao
                    icon={<LuPercent size={14}/>}
                    title="Limite anual de faturamento"
                    bloqueada={seccoesFiscaisBloqueadas}
                    hintBloqueio="Adicione seu CNPJ na seção Empresa pra usar."
                >
                    <div className="cfg-info-box">
                        <LuInfo size={13}/>
                        <span>
                            {regime === "MEI" && (
                                <>Limite legal MEI: <strong>R$ 81.000,00 por ano</strong>. Ajuste se a regra mudar.</>
                            )}
                            {regime === "SIMPLES_NACIONAL" && (
                                <>ME até R$ 360 mil/ano · EPP até R$ 4,8 milhões/ano. Ajuste conforme seu enquadramento.</>
                            )}
                            {(regime === "LUCRO_PRESUMIDO" || regime === "LUCRO_REAL" || regime === "OUTRO") && (
                                <>Defina o limite que se aplica ao seu regime. Será usado pro termômetro de faturamento.</>
                            )}
                        </span>
                    </div>

                    <div className="cfg-field">
                        <label className="cfg-label">Limite anual (R$)</label>
                        <input
                            type="text"
                            className="cfg-input"
                            value={limiteAnual}
                            onChange={e => setLimiteAnual(mascaraMoeda(e.target.value))}
                            placeholder="81.000,00"
                            disabled={salvando || seccoesFiscaisBloqueadas}
                        />
                    </div>
                </Secao>
            )}

            {/* ── Seção: DAS (só MEI) ── */}
            {ehMei && (
                <Secao
                    icon={<LuLandmark size={14}/>}
                    title="Controle do DAS"
                    bloqueada={!dasDisponivel}
                    hintBloqueio="Adicione seu CNPJ na seção Empresa pra usar."
                >
                    <div className="cfg-info-box">
                        <LuInfo size={13}/>
                        <span>
                            Ative pra acompanhar os DAS mensais (R$ 76,90 a R$ 81,90 dependendo da categoria).
                            Quando ativar, o Whallet cria automaticamente os DAS pendentes do mês atual até dezembro.
                        </span>
                    </div>

                    <label className={`cfg-checkbox ${!dasDisponivel ? "cfg-checkbox--disabled" : ""}`}>
                        <input
                            type="checkbox"
                            checked={dasAtivo && dasDisponivel}
                            onChange={e => setDasAtivo(e.target.checked)}
                            disabled={salvando || !dasDisponivel}
                        />
                        <span>Quero controlar o DAS no Whallet</span>
                    </label>

                    {dasAtivo && dasDisponivel && (
                        <div className="cfg-das-config">
                            <div className="cfg-field">
                                <label className="cfg-label">
                                    Categoria do MEI
                                    <span className="cfg-label-req">*</span>
                                </label>
                                <select
                                    className="cfg-input"
                                    value={meiCategoria}
                                    onChange={e => setMeiCategoria(e.target.value)}
                                    disabled={salvando}
                                >
                                    <option value="">Selecione a categoria...</option>
                                    {CATEGORIAS_MEI.map(c => (
                                        <option key={c.value} value={c.value}>
                                            {c.label} — {fmtValor(c.valor)} ({c.descricao})
                                        </option>
                                    ))}
                                </select>
                                {meiCategoria && (
                                    <small className="cfg-hint">
                                        Valor padrão: <strong>{fmtValor(categoriaInfo?.valor)}</strong> · {categoriaInfo?.descricao}
                                    </small>
                                )}
                            </div>

                            <label className="cfg-checkbox">
                                <input
                                    type="checkbox"
                                    checked={usarValorCustom}
                                    onChange={e => setUsarValorCustom(e.target.checked)}
                                    disabled={salvando}
                                />
                                <span>Meu município cobra valor diferente</span>
                            </label>

                            {usarValorCustom && (
                                <div className="cfg-field">
                                    <input
                                        type="text"
                                        className="cfg-input"
                                        value={dasValorCustom}
                                        onChange={e => setDasValorCustom(mascaraMoeda(e.target.value))}
                                        placeholder={categoriaInfo ? formatarMoedaParaInput(categoriaInfo.valor) : "0,00"}
                                        disabled={salvando}
                                    />
                                    <small className="cfg-hint">
                                        <LuInfo size={11}/>
                                        Verifique no carnê do DAS ou no portal Simples Nacional.
                                    </small>
                                </div>
                            )}

                            {valorEfetivo && (
                                <div className="cfg-valor-efetivo">
                                    <strong>Valor mensal usado:</strong> {fmtValor(valorEfetivo)}
                                </div>
                            )}
                        </div>
                    )}
                </Secao>
            )}

            {/* Aviso pra Simples Nacional / outros regimes */}
            {regime !== "NENHUM" && regime !== "MEI" && temCnpj && (
                <div className="cfg-msg cfg-msg--info">
                    <LuInfo size={14}/>
                    <span>
                        <strong>Em breve:</strong> features fiscais específicas para {regimeInfo?.label}
                        {" "}(DAS percentual, alíquotas por anexo, etc). Por enquanto, você pode usar
                        todas as features de gestão financeira normalmente.
                    </span>
                </div>
            )}

            {/* Footer com botão sticky em mobile */}
            <div className="cfg-footer">
                <button
                    className="ph-btn ph-btn--primary"
                    onClick={salvar}
                    disabled={salvando}
                >
                    <LuSave size={14}/>
                    {salvando ? "Salvando..." : "Salvar configurações"}
                </button>
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Secao — bloco visual com header (ícone + título) e suporte a bloqueio
   ═════════════════════════════════════════════════════════════════════════════ */

function Secao({ icon, title, children, bloqueada = false, hintBloqueio }) {
    return (
        <Card>
            <Card.Header>
                <div className="cfg-secao-head">
                    <span className="cfg-secao-icon">{icon}</span>
                    <Card.Title>{title}</Card.Title>
                </div>

                {bloqueada && (
                    <span className="cfg-secao-lock">
                        <LuLock size={10}/> Bloqueado
                    </span>
                )}
            </Card.Header>

            <Card.Body>
                {bloqueada && hintBloqueio && (
                    <div className="cfg-hint-bloqueio">
                        <LuInfo size={13}/>
                        <span>{hintBloqueio}</span>
                    </div>
                )}

                <div className={bloqueada ? "cfg-secao-content cfg-secao-content--bloqueada" : "cfg-secao-content"}>
                    {children}
                </div>
            </Card.Body>
        </Card>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   RegimeOption — radio card (label + descricao + badge de cobertura)
   ═════════════════════════════════════════════════════════════════════════════ */

function RegimeOption({ regime, selecionado, disabled, onSelecionar }) {
    return (
        <div
            className={`cfg-regime ${selecionado ? "cfg-regime--selected" : ""} ${disabled ? "cfg-regime--disabled" : ""}`}
            onClick={!disabled ? onSelecionar : undefined}
        >
            <div className={`cfg-regime-radio ${selecionado ? "cfg-regime-radio--selected" : ""}`}>
                {selecionado && <div className="cfg-regime-radio-inner"/>}
            </div>

            <div className="cfg-regime-text">
                <div className="cfg-regime-head">
                    <span className="cfg-regime-label">{regime.label}</span>
                    {regime.cobertura === "parcial" && (
                        <span className="cfg-regime-tag cfg-regime-tag--warning">DAS em breve</span>
                    )}
                    {regime.cobertura === "limitada" && (
                        <span className="cfg-regime-tag cfg-regime-tag--neutral">Básico</span>
                    )}
                </div>
                <div className="cfg-regime-desc">{regime.descricao}</div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .cfg-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.cfg-container {
    max-width: 760px;
    padding-bottom: 80px;
}

.cfg-subtitulo {
    margin: 0 0 20px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

.cfg-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 20px;
    color: var(--text-dim);
    font-size: 14px;
}

.cfg-spin {
    animation: cfg-spin 1s linear infinite;
}

@keyframes cfg-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* ── Mensagens globais ───────────────────────────────────────────────── */

.cfg-msg {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.5;
}

.cfg-msg svg {
    flex-shrink: 0;
    margin-top: 1px;
}

.cfg-msg--erro {
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
}

.cfg-msg--sucesso {
    background: var(--success-bg);
    border: 1px solid rgba(24, 178, 107, 0.25);
    color: var(--success);
}

.cfg-msg--info {
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.25);
    color: var(--ink-2);
}

.cfg-msg--info svg {
    color: var(--warning);
}

.cfg-msg--info strong {
    color: var(--warning);
    font-weight: 700;
}

/* ── Section header (dentro do Card) ─────────────────────────────────── */

.cfg-secao-head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.cfg-secao-icon {
    color: var(--cyan-dark);
    display: inline-flex;
    line-height: 0;
}

.cfg-secao-lock {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 100px;
    background: var(--bg);
    border: 1px solid var(--hair);
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.cfg-secao-content--bloqueada {
    opacity: 0.55;
    pointer-events: none;
}

.cfg-hint-bloqueio {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    background: var(--bg);
    border: 1px solid var(--hair);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-muted);
}

.cfg-hint-bloqueio svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--text-dim);
}

/* ── Info box (dentro de seções) ─────────────────────────────────────── */

.cfg-info-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.15);
    font-size: 12px;
    line-height: 1.55;
    color: var(--ink-2);
}

.cfg-info-box svg {
    color: var(--cyan-dark);
    flex-shrink: 0;
    margin-top: 1px;
}

.cfg-info-box strong {
    color: var(--navy-deep);
    font-weight: 700;
}

/* ── Fields ──────────────────────────────────────────────────────────── */

.cfg-field {
    margin-bottom: 14px;
}

.cfg-field:last-child {
    margin-bottom: 0;
}

.cfg-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink-2);
}

.cfg-label-req {
    color: var(--warning);
    font-weight: 700;
}

.cfg-lock-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 100px;
    background: var(--bg);
    color: var(--text-dim);
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.cfg-input {
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

.cfg-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.cfg-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}

.cfg-input--locked {
    background: var(--bg);
    color: var(--text-muted);
    cursor: not-allowed;
}

.cfg-hint {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
}

.cfg-hint svg {
    flex-shrink: 0;
    margin-top: 1px;
}

.cfg-hint strong {
    color: var(--ink-2);
    font-weight: 600;
}

/* ── Checkbox ────────────────────────────────────────────────────────── */

.cfg-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    cursor: pointer;
    font-size: 13px;
    color: var(--ink-2);
    letter-spacing: -0.005em;
}

.cfg-checkbox input {
    margin: 0;
    width: 16px;
    height: 16px;
    accent-color: var(--cyan);
    cursor: pointer;
}

.cfg-checkbox input:disabled {
    cursor: not-allowed;
}

.cfg-checkbox--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ── Regime cards ────────────────────────────────────────────────────── */

.cfg-regime-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.cfg-regime {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--hair);
    background: var(--surface);
    cursor: pointer;
    transition: all 0.15s;
}

.cfg-regime:hover:not(.cfg-regime--disabled) {
    border-color: var(--text-dim);
    background: var(--bg);
}

.cfg-regime--selected {
    border-color: var(--cyan) !important;
    background: var(--cyan-soft) !important;
}

.cfg-regime--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.cfg-regime-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 2px;
    border: 2px solid var(--hair);
    background: var(--surface);
    position: relative;
    transition: all 0.15s;
}

.cfg-regime-radio--selected {
    border-color: var(--cyan);
    background: var(--cyan);
}

.cfg-regime-radio-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: white;
}

.cfg-regime-text {
    flex: 1;
    min-width: 0;
}

.cfg-regime-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 2px;
}

.cfg-regime-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}

.cfg-regime-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.cfg-regime-tag--warning {
    background: var(--warning-bg);
    color: var(--warning);
}

.cfg-regime-tag--neutral {
    background: var(--bg);
    color: var(--text-dim);
}

.cfg-regime-desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-muted);
}

/* ── DAS config (sub-bloco interno) ──────────────────────────────────── */

.cfg-das-config {
    margin-top: 12px;
    padding: 16px;
    border-radius: 10px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.18);
}

.cfg-valor-efetivo {
    margin-top: 14px;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--success-bg);
    border: 1px solid rgba(24, 178, 107, 0.25);
    font-size: 13px;
    color: var(--ink-2);
}

.cfg-valor-efetivo strong {
    color: var(--success);
    font-weight: 700;
}

/* ── Footer com botão salvar ─────────────────────────────────────────── */

.cfg-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--hair);
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .cfg-container {
        padding-bottom: 100px;
    }

    .cfg-regime-head {
        gap: 6px;
    }

    .cfg-footer {
        position: sticky;
        bottom: 0;
        margin: 0 -20px -20px;
        padding: 14px 20px;
        background: var(--surface);
        border-top: 1px solid var(--hair);
        z-index: 10;
    }

    .cfg-footer .ph-btn {
        flex: 1;
        justify-content: center;
    }
}
`;
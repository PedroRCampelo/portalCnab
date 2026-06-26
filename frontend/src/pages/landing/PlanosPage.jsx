import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import { getTrialStatus, ativarTrial } from "../../services/trialService.js";
import { LuPlus, LuCheck, LuX, LuArrowRight, LuArrowLeft } from "react-icons/lu";
import "./PlanosPage.css";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

function fmtData(ts) {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
    });
}

function fmtValor(centavos, moeda) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: (moeda || "brl").toUpperCase(),
    }).format(centavos / 100);
}

const FEATURE_GROUPS = [
    {
        title: "CNAB",
        features: [
            { name: "Validar arquivos CNAB",                free: true,  plus: true },
            { name: "Bot Elvis · assistente CNAB",          sub: "sujeito a uso justo", free: false, plus: true },
        ],
    },
    {
        title: "Gestão financeira",
        features: [
            { name: "Visualizar telas (somente leitura)",   free: true,  plus: true },
            { name: "Recebimentos · criar e editar",        free: false, plus: true },
            { name: "Cobrança via WhatsApp",                sub: "em manutenção · migração Meta API", free: false, plus: true },
            { name: "Títulos a pagar · criar e editar",     free: false, plus: true },
            { name: "Lançamento parcelado",                 free: false, plus: true },
            { name: "Importar títulos via Excel",           free: false, plus: true },
            { name: "Tipos de gasto (categorização)",       free: false, plus: true },
            { name: "Cadastro de clientes",                 free: false, plus: true },
        ],
    },
    {
        title: "Bancos & saldo",
        features: [
            { name: "Múltiplas contas bancárias",           free: false, plus: true },
            { name: "Saldo em tempo real",                  free: false, plus: true },
            { name: "Extrato e movimentações",              free: false, plus: true },
        ],
    },
    {
        title: "Análises e alertas",
        features: [
            { name: "Saúde do mês",                         free: false, plus: true },
            { name: "Fluxo de caixa · 60 dias",             free: false, plus: true },
            { name: "Alerta preditivo de saldo",            free: false, plus: true },
            { name: "Relatórios de títulos",                free: false, plus: true },
        ],
    },
    {
        title: "Empresa e regime",
        features: [
            { name: "CNPJ + regime tributário",             free: true,  plus: true },
            { name: "Termômetro de faturamento",            sub: "em breve", free: false, plus: true },
            { name: "Geração e controle de DAS",            sub: "em breve · MEI", free: false, plus: true },
        ],
    },
    {
        title: "Suporte",
        features: [
            { name: "Suporte por email",                    free: true,  plus: true },
            { name: "Suporte prioritário",                  free: false, plus: true },
        ],
    },
];

const FAQ = [
    {
        q: "O Whallet+ é realmente gratuito agora?",
        a: "Sim. Durante o período beta, o Whallet+ está completamente gratuito. Basta criar uma conta e ativar — sem cartão de crédito, sem compromisso. Quando o período beta encerrar, avisaremos com antecedência.",
    },
    {
        q: "Se eu cancelar o Whallet+, perco meus dados?",
        a: "Não. Seus recebimentos, títulos, contas bancárias e clientes continuam todos no Whallet. Você consegue visualizar tudo normalmente no plano Free, só não consegue criar nem editar registros novos. Quando você reassinar, volta tudo ao normal.",
    },
    {
        q: "Posso cancelar quando quiser?",
        a: "Sim. Cancele direto no painel de assinatura, sem precisar falar com ninguém. Sua assinatura fica ativa até o fim do ciclo já pago e depois volta automaticamente para o Free. Sem multa, sem fidelidade.",
    },
    {
        q: "Quais bancos são suportados?",
        a: "Todos os principais bancos brasileiros: Itaú, Bradesco, Banco do Brasil, Caixa, Santander, Sicredi, Sicoob, Inter, Nubank, BTG, e mais. Para validação de CNAB, suportamos os formatos 240 e 400 da Febraban.",
    },
    {
        q: "Whallet substitui meu contador?",
        a: "Não. O Whallet é um sistema de gestão financeira do dia a dia: ajuda você a saber quanto entrou, quanto saiu e quanto sobrou. Para questões fiscais (declarações, impostos, regime), seu contador continua sendo essencial. O Whallet serve pra você levar dados organizados pra ele.",
    },
    {
        q: "Tenho funcionários. O Whallet+ atende vários usuários?",
        a: "Hoje, o Whallet+ é por usuário (1 conta = 1 pessoa). Estamos finalizando os planos Time (até 3 pessoas) e Empresa (até 10 pessoas) — entre na lista de espera ali em cima pra ser avisado quando lançar.",
    },
];

export default function PlanosPage() {
    const { autenticado, usuario, atualizarUsuario } = useAuth();
    const navigate = useNavigate();

    const [carregandoPlus,    setCarregandoPlus]    = useState(false);
    const [cancelando,        setCancelando]        = useState(false);
    const [cancelamentoInfo,  setCancelamentoInfo]  = useState(null);
    const [erroCancelamento,  setErroCancelamento]  = useState("");
    const [modalAberto,       setModalAberto]       = useState(false);
    const [pagamentos,        setPagamentos]        = useState([]);
    const [carregandoPag,     setCarregandoPag]     = useState(false);
    const [statusAssinatura,  setStatusAssinatura]  = useState(null);
    const [faqAberto,         setFaqAberto]         = useState(null);
    const [waitlistEmail,     setWaitlistEmail]     = useState("");
    const [waitlistEnviado,   setWaitlistEnviado]   = useState(false);
    const [waitlistEnviando,  setWaitlistEnviando]  = useState(false);
    const [trial,             setTrial]             = useState(null);
    const [ativandoTrial,     setAtivandoTrial]     = useState(false);

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = isAdmin || usuario?.planoId === PLANO_WHALLET_PLUS;

    const statusFinal = statusAssinatura?.status ?? usuario?.assinaturaStatus ?? "";
    const assinaturaCancelando = String(statusFinal).toUpperCase() === "CANCELANDO";
    const expiresAt = statusAssinatura?.expiresAt
        ?? cancelamentoInfo?.expiresAt
        ?? (usuario?.assinaturaExpiraEm
            ? new Date(usuario.assinaturaExpiraEm).getTime() / 1000
            : null);

    useEffect(() => {
        if (autenticado && !isAdmin) atualizarUsuario();
    }, [autenticado, isAdmin]);

    useEffect(() => {
        if (autenticado && !isAdmin) {
            getTrialStatus().then(setTrial).catch(() => {});
        }
    }, [autenticado, isAdmin]);

    useEffect(() => {
        if (autenticado && !isAdmin) {
            api.get("/api/stripe/status-assinatura")
                .then(({ data }) => setStatusAssinatura(data))
                .catch(() => {});
        }
    }, [autenticado, isAdmin]);

    useEffect(() => {
        if (autenticado && temWhalletPlus) {
            setCarregandoPag(true);
            api.get("/api/stripe/historico-pagamentos")
                .then(({ data }) => setPagamentos(data))
                .catch(() => {})
                .finally(() => setCarregandoPag(false));
        }
    }, [autenticado, temWhalletPlus]);

    async function handleAtivarTrial() {
        setAtivandoTrial(true);
        try {
            await ativarTrial();
            await atualizarUsuario();
            navigate("/fluxo-caixa");
        } catch (err) {
            alert(err.response?.data?.mensagem ?? "Erro ao ativar trial.");
        } finally {
            setAtivandoTrial(false);
        }
    }

    async function handleAssinarPlus() {
        if (!autenticado) {
            navigate("/cadastro");
            return;
        }
        setCarregandoPlus(true);
        try {
            await api.post("/api/stripe/ativar-gratuito");
            await atualizarUsuario();
            navigate("/fluxo-caixa");
        } catch (err) {
            setCarregandoPlus(false);
            const msg = err.response?.data?.mensagem ?? "";
            if (msg.includes("e-mail")) {
                alert("Confirme seu e-mail primeiro. Verifique sua caixa de entrada.");
            } else {
                alert(msg || "Erro ao ativar plano.");
            }
        }
    }

    async function confirmarCancelamento() {
        setModalAberto(false);
        setCancelando(true);
        setErroCancelamento("");
        try {
            const { data } = await api.post("/api/stripe/cancelar");
            setStatusAssinatura({ status: "CANCELANDO", expiresAt: data.expiresAt });
            setCancelamentoInfo({ expiresAt: data.expiresAt });
            await atualizarUsuario();
        } catch (err) {
            setErroCancelamento(err.response?.data?.mensagem ?? "Erro ao cancelar. Tente novamente.");
        } finally {
            setCancelando(false);
        }
    }

    async function enviarWaitlist(e) {
        e.preventDefault();
        if (!waitlistEmail.includes("@")) return;
        setWaitlistEnviando(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            setWaitlistEnviado(true);
        } catch {
            setWaitlistEnviado(true);
        } finally {
            setWaitlistEnviando(false);
        }
    }

    return (
        <div className="pp">

            {/* Aviso de manutenção do WhatsApp */}
            <div style={{
                background: "rgba(245,166,35,.08)",
                borderBottom: "1px solid rgba(245,166,35,.25)",
                padding: "12px 24px",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, fontSize: 13, color: "var(--warning)", textAlign: "center",
                flexWrap: "wrap",
            }}>
                <span>🔧</span>
                <span>
                    <strong>Bot WhatsApp em manutenção.</strong>{" "}
                    Estamos migrando para a API Oficial do Meta. O serviço voltará em breve com mais estabilidade.
                </span>
            </div>

            <button
                onClick={() => navigate("/")}
                style={{
                    position: "absolute", top: 24, left: 24, zIndex: 10,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 100,
                    background: "var(--surface)", border: "1px solid var(--hair)",
                    color: "var(--ink-2)", fontFamily: "var(--ff-mono)", fontSize: 11,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.15s",
                }}
            >
                <LuArrowLeft size={12}/>
                Voltar
            </button>

            {/* ── HERO ──────────────────────────────────────────────── */}
            <section className="pp-hero">
                <div className="pp-container pp-hero-inner">
                    <div className="pp-hero-kicker">Planos</div>
                    <h1 className="pp-hero-title">
                        Comece grátis. Cresça <em>quando precisar.</em>
                    </h1>
                    <p className="pp-hero-sub">
                        Sem fidelidade, sem multa. Cancele quando quiser e seus
                        dados continuam intactos no plano Free.
                    </p>
                </div>
            </section>

            {/* ── TABELA COMPARATIVA ────────────────────────────────── */}
            <section className="pp-container">
                <div className="pp-table-wrap">

                    <div className="pp-table-header">
                        <div className="pp-table-header-cell">
                            <h3 className="pp-plan-name" style={{ visibility: "hidden" }}>.</h3>
                            <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
                                Compare os planos e escolha o que faz sentido pro seu momento.
                            </p>
                        </div>

                        {/* Free */}
                        <div className="pp-table-header-cell">
                            <h3 className="pp-plan-name">Free</h3>
                            <div className="pp-plan-price">
                                <span className="pp-plan-price-value">R$ 0</span>
                                <span className="pp-plan-price-period">/ mês</span>
                            </div>
                            {!autenticado ? (
                                <button
                                    className="pp-plan-cta pp-plan-cta--ghost"
                                    onClick={() => navigate("/cadastro")}
                                >
                                    Comece grátis
                                </button>
                            ) : !temWhalletPlus ? (
                                <button className="pp-plan-cta pp-plan-cta--current">
                                    Plano atual
                                </button>
                            ) : (
                                <button className="pp-plan-cta pp-plan-cta--ghost" disabled>
                                    Disponível ao cancelar Whallet+
                                </button>
                            )}
                        </div>

                        {/* Whallet+ */}
                        <div className="pp-table-header-cell featured">
                            <span className="pp-plan-tag">Recomendado</span>
                            <h3 className="pp-plan-name">Whallet+</h3>
                            <div className="pp-plan-price">
                                <span className="pp-plan-price-value" style={{ textDecoration: "line-through", opacity: 0.4, fontSize: "0.75em" }}>R$ 39,90</span>
                                <span className="pp-plan-price-value" style={{ color: "var(--cyan)" }}>Grátis</span>
                            </div>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: "rgba(21,195,221,0.1)", border: "1px solid rgba(21,195,221,0.25)",
                                color: "var(--cyan-deep)", borderRadius: 999,
                                padding: "4px 12px", fontSize: 12, fontWeight: 600, marginBottom: 8,
                            }}>
                                🎉 Gratuito durante o período beta
                            </div>

                            {!autenticado ? (
                                <button
                                    className="pp-plan-cta pp-plan-cta--primary"
                                    onClick={() => navigate("/cadastro")}
                                >
                                    Começar grátis
                                    <LuArrowRight size={14}/>
                                </button>
                            ) : temWhalletPlus ? (
                                <button className="pp-plan-cta pp-plan-cta--current">
                                    Plano atual
                                </button>
                            ) : (
                                <button
                                    className="pp-plan-cta pp-plan-cta--primary"
                                    onClick={handleAssinarPlus}
                                    disabled={carregandoPlus}
                                >
                                    {carregandoPlus ? "Ativando..." : "Ativar grátis"}
                                    {!carregandoPlus && <LuArrowRight size={14}/>}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="pp-table-body">
                        {FEATURE_GROUPS.map((group) => (
                            <div key={group.title}>
                                <div className="pp-feature-group-title">
                                    <div className="pp-feature-group-title-cell">{group.title}</div>
                                    <div className="pp-feature-group-title-cell"/>
                                    <div className="pp-feature-group-title-cell"/>
                                </div>

                                {group.features.map((f) => (
                                    <div key={f.name} className="pp-feature-row">
                                        <div className="pp-feature-cell feature-name">
                                            {f.name}
                                            {f.sub && <small>{f.sub}</small>}
                                        </div>
                                        <div
                                            className={`pp-feature-cell value ${f.free ? "included" : "excluded"}`}
                                            data-plan="Free"
                                        >
                                            {f.free
                                                ? <span className="pp-icon-check"><LuCheck size={11}/></span>
                                                : <span className="pp-icon-x"><LuX size={11}/></span>
                                            }
                                        </div>
                                        <div
                                            className={`pp-feature-cell value featured ${f.plus ? "included" : "excluded"}`}
                                            data-plan="Whallet+"
                                        >
                                            {f.plus
                                                ? <span className="pp-icon-check"><LuCheck size={11}/></span>
                                                : <span className="pp-icon-x"><LuX size={11}/></span>
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WAITLIST — Time / Empresa ────────────────────────── */}
            <section className="pp-container">
                <div className="pp-waitlist">
                    <div className="pp-waitlist-content">
                        <div className="pp-waitlist-eyebrow">Em breve</div>
                        <h2 className="pp-waitlist-title">
                            Quando você crescer,<br/>
                            a gente <em>cresce junto.</em>
                        </h2>
                        <p className="pp-waitlist-desc">
                            Estamos finalizando os planos pra times. Mesmo Whallet+ —
                            mais usuários e gestão de papéis (DONO, MEMBRO, VISUALIZADOR).
                        </p>
                        <div className="pp-waitlist-tiers">
                            <div className="pp-waitlist-tier">
                                <span className="pp-waitlist-tier-num">TIME</span>
                                <strong>R$ 49,90</strong>
                                <span className="pp-waitlist-tier-meta">até 3 usuários</span>
                            </div>
                            <div className="pp-waitlist-tier">
                                <span className="pp-waitlist-tier-num">EMPRESA</span>
                                <strong>R$ 79,90</strong>
                                <span className="pp-waitlist-tier-meta">até 10 usuários</span>
                            </div>
                        </div>
                    </div>

                    <form className="pp-waitlist-form" onSubmit={enviarWaitlist}>
                        <label className="pp-waitlist-form-label">Lista de espera</label>

                        {waitlistEnviado ? (
                            <div className="pp-waitlist-form-success">
                                <LuCheck size={16}/>
                                Pronto! Avisaremos quando lançar.
                            </div>
                        ) : (
                            <>
                                <div className="pp-waitlist-form-row">
                                    <input
                                        type="email"
                                        className="pp-waitlist-form-input"
                                        placeholder="seu@email.com"
                                        value={waitlistEmail}
                                        onChange={e => setWaitlistEmail(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="pp-waitlist-form-button"
                                        disabled={waitlistEnviando}
                                    >
                                        {waitlistEnviando ? "..." : "Notifique-me"}
                                    </button>
                                </div>
                                <div className="pp-waitlist-form-meta">
                                    Sem spam · só quando lançar
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </section>

            {/* ── FAQ ────────────────────────────────────────────── */}
            <section className="pp-container pp-faq">
                <div className="pp-faq-head">
                    <div className="pp-faq-eyebrow">Dúvidas frequentes</div>
                    <h2 className="pp-faq-title">
                        Antes de assinar, <em>algumas respostas.</em>
                    </h2>
                </div>

                <div className="pp-faq-list">
                    {FAQ.map((item, i) => (
                        <div key={i} className={`pp-faq-item ${faqAberto === i ? "open" : ""}`}>
                            <button
                                className="pp-faq-button"
                                onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                            >
                                {item.q}
                                <span className="pp-faq-icon"><LuPlus size={13}/></span>
                            </button>
                            <div className="pp-faq-answer">
                                <p>{item.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PAINEL DE ASSINATURA (só pra logado com Whallet+) ── */}
            {autenticado && temWhalletPlus && !isAdmin && (
                <section className="pp-container">
                    <div className="pp-billing">
                        <div className="pp-billing-head">
                            <div>
                                <p className="pp-billing-title">Sua assinatura</p>
                                <h3 className="pp-billing-name">Whallet+ · R$ 39,90/mês</h3>
                            </div>
                            <span className={`pp-billing-status ${assinaturaCancelando ? "cancelling" : "active"}`}>
                                {assinaturaCancelando ? "Cancelando" : "Ativa"}
                            </span>
                        </div>

                        {assinaturaCancelando && expiresAt && (
                            <div className="pp-billing-info" style={{
                                background: "var(--warning-bg)",
                                border: "1px solid rgba(230, 162, 60, 0.2)",
                                color: "var(--warning)",
                            }}>
                                Sua assinatura permanece ativa até <strong>{fmtData(expiresAt)}</strong>.
                                Depois disso, sua conta volta automaticamente para o Free
                                e você continua vendo todos os seus dados em modo de leitura.
                            </div>
                        )}

                        {erroCancelamento && (
                            <div className="pp-billing-info" style={{
                                background: "var(--error-bg)",
                                border: "1px solid rgba(229, 72, 77, 0.2)",
                                color: "var(--error)",
                            }}>
                                {erroCancelamento}
                            </div>
                        )}

                        {!assinaturaCancelando && (
                            <div className="pp-billing-actions">
                                <button
                                    className="pp-billing-btn pp-billing-btn--danger"
                                    onClick={() => setModalAberto(true)}
                                    disabled={cancelando}
                                >
                                    {cancelando ? "Cancelando..." : "Cancelar assinatura"}
                                </button>
                            </div>
                        )}

                        {pagamentos.length > 0 && (
                            <div className="pp-billing-history">
                                <div className="pp-billing-history-title">Histórico de pagamentos</div>
                                <ul className="pp-billing-history-list">
                                    {pagamentos.slice(0, 6).map((p, i) => (
                                        <li key={i} className="pp-billing-history-item">
                                            <span className="pp-billing-history-date">
                                                {p.data ? fmtData(p.data) : "—"}
                                            </span>
                                            <span className="pp-billing-history-value">
                                                {fmtValor(p.valor || 0, p.moeda)}
                                            </span>
                                            <span className="pp-billing-history-status">
                                                {p.status === "paid" ? "Pago" : p.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {carregandoPag && pagamentos.length === 0 && (
                            <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 16 }}>
                                Carregando histórico...
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ── CTA FINAL ────────────────────────────────────────── */}
            <section className="pp-container">
                <div className="pp-cta-final">
                    <h2 className="pp-cta-final-title">
                        Pronto pra acabar com<br/>o <em>caos?</em>
                    </h2>
                    {!autenticado ? (
                        <>
                            <button
                                className="pp-cta-final-button"
                                onClick={() => navigate("/cadastro")}
                            >
                                Comece grátis →
                            </button>
                            <div className="pp-cta-final-meta">
                                Grátis durante o período beta · Sem cartão · Cancele quando quiser
                            </div>
                        </>
                    ) : !temWhalletPlus ? (
                        <>
                            <button
                                className="pp-cta-final-button"
                                onClick={handleAssinarPlus}
                                disabled={carregandoPlus}
                            >
                                {carregandoPlus ? "Ativando..." : "Ativar Whallet+ grátis →"}
                            </button>
                        </>
                    ) : (
                        <button
                            className="pp-cta-final-button"
                            onClick={() => navigate("/fluxo-caixa")}
                        >
                            Acessar app →
                        </button>
                    )}
                </div>
            </section>

            {/* ── MODAL CANCELAMENTO ───────────────────────────────── */}
            {modalAberto && (
                <div className="pp-modal-overlay" onClick={() => setModalAberto(false)}>
                    <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="pp-modal-title">Cancelar assinatura?</h3>
                        <p className="pp-modal-desc">
                            Sua assinatura ficará ativa até o fim do período já pago.
                            Depois disso, você continua acessando seus dados no plano Free
                            (modo de leitura) — mas não consegue mais criar nem editar registros.
                            Pode reassinar quando quiser.
                        </p>
                        <div className="pp-modal-actions">
                            <button
                                className="pp-billing-btn pp-billing-btn--ghost"
                                onClick={() => setModalAberto(false)}
                            >
                                Continuar com Whallet+
                            </button>
                            <button
                                className="pp-billing-btn pp-billing-btn--danger"
                                onClick={confirmarCancelamento}
                                style={{ background: "var(--error)", color: "white", borderColor: "var(--error)" }}
                            >
                                Sim, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
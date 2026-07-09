import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    LuLock, LuTrendingUp, LuLandmark, LuPercent, LuMessageCircle,
    LuFileText, LuCircleCheck, LuArrowRight, LuShield, LuSparkles,
    LuUsers, LuBell, LuLayers, LuCalendarCheck,
    LuPlus, LuMinus,
} from "react-icons/lu";

/**
 * PaywallPage — Mostrada quando MEI tenta acessar feature Whallet+ sem plano
 * Sprint A3.6.11 · Refatoração com foco em conversão
 *
 * Acessível em /upgrade ou disparada via interceptor 402 do axios.
 *
 * Estrutura nova:
 *  - Hero com badge Whallet+ + ícone de lock
 *  - Banner de trial (7 dias grátis - só mostra se aplicável)
 *  - 3 grupos de features (Gestão / Automação / Fiscal MEI)
 *  - CTA com preço grande + 2 garantias
 *  - 3 FAQ accordion (objections handlers)
 *  - Footer com link "Voltar pro grátis" (não bloqueia o usuário)
 *
 * Não usa AppLayout — é tela cheia centralizada (vibe landing/marketing).
 */
export default function PaywallPage() {
    const navigate = useNavigate();

    function irParaPlanos() {
        navigate("/planos");
    }

    function voltarParaConversor() {
        navigate("/");
    }

    return (
        <div className="paywall-page">
            <div className="pw-container">

                {/* ── HERO ── */}
                <div className="pw-hero">
                    <div className="pw-hero-icon">
                        <LuLock size={28}/>
                    </div>

                    <div className="pw-badge">
                        <LuSparkles size={11}/>
                        Feature Whallet+
                    </div>

                    <h1 className="pw-title">
                        Pra quem quer <em>parar</em> de usar Excel<br/>
                        e <span className="pw-title-highlight">controlar de verdade</span>.
                    </h1>

                    <p className="pw-subtitle">
                        Fluxo de caixa, recebimentos, títulos a pagar, alertas e cobrança
                        via WhatsApp num só lugar — feito sob medida pra MEI brasileiro.
                    </p>
                </div>

                {/* ── TRIAL BANNER ── */}
                <div className="pw-trial">
                    <div className="pw-trial-icon">
                        <LuCalendarCheck size={16}/>
                    </div>
                    <div>
                        <strong>7 dias grátis pra testar</strong>
                        <span> · sem precisar de cartão</span>
                    </div>
                </div>

                {/* ── FEATURES (3 grupos) ── */}
                <section className="pw-section">
                    <div className="pw-group">
                        <h2 className="pw-group-title">Gestão financeira</h2>
                        <div className="pw-features">
                            <Feature
                                icon={<LuTrendingUp size={16}/>}
                                titulo="Fluxo de caixa em tempo real"
                                descricao="Saldos consolidados, alertas e saúde do mês"
                            />
                            <Feature
                                icon={<LuFileText size={16}/>}
                                titulo="Recebimentos e títulos a pagar"
                                descricao="Cadastro, baixa e parcelamento"
                            />
                            <Feature
                                icon={<LuLandmark size={16}/>}
                                titulo="Múltiplas contas bancárias"
                                descricao="Acompanhe saldo de todas as contas"
                            />
                            <Feature
                                icon={<LuUsers size={16}/>}
                                titulo="Cadastro de clientes"
                                descricao="Score de pagamento e histórico completo"
                            />
                        </div>
                    </div>

                    <div className="pw-group">
                        <h2 className="pw-group-title">Automação</h2>
                        <div className="pw-features">
                            <Feature
                                icon={<LuMessageCircle size={16}/>}
                                titulo="Cobrança via WhatsApp"
                                descricao="Mensagens automáticas pros clientes"
                            />
                            <Feature
                                icon={<LuBell size={16}/>}
                                titulo="Alertas de e-mail"
                                descricao="Vencidos e próximos do vencimento"
                            />
                            <Feature
                                icon={<LuLayers size={16}/>}
                                titulo="Importação de Excel"
                                descricao="Carregue centenas de títulos de uma vez"
                            />
                        </div>
                    </div>

                    <div className="pw-group">
                        <h2 className="pw-group-title">Fiscal MEI</h2>
                        <div className="pw-features">
                            <Feature
                                icon={<LuPercent size={16}/>}
                                titulo="Termômetro do limite anual"
                                descricao="Quanto falta pra estourar R$ 81 mil/ano"
                            />
                            <Feature
                                icon={<LuCircleCheck size={16}/>}
                                titulo="Controle do DAS"
                                descricao="Calendário, alertas e geração automática"
                            />
                        </div>
                    </div>
                </section>

                {/* ── CTA principal ── */}
                <div className="pw-cta">
                    <div className="pw-cta-price">
                        <div className="pw-cta-currency">R$</div>
                        <div className="pw-cta-value">39,90</div>
                        <div className="pw-cta-period">/mês</div>
                    </div>

                    <button onClick={irParaPlanos} className="pw-cta-btn">
                        Começar 7 dias grátis
                        <LuArrowRight size={18}/>
                    </button>

                    <div className="pw-cta-guards">
                        <div className="pw-guard">
                            <LuShield size={12}/>
                            <span>Cancele quando quiser</span>
                        </div>
                        <div className="pw-guard">
                            <LuCircleCheck size={12}/>
                            <span>Sem fidelidade</span>
                        </div>
                    </div>
                </div>

                {/* ── FAQ ── */}
                <section className="pw-faq">
                    <h2 className="pw-faq-title">Dúvidas frequentes</h2>

                    <FaqItem
                        pergunta="O que acontece depois dos 7 dias?"
                        resposta="Você decide se continua. Se não quiser, é só cancelar — sem cobrança e sem precisar justificar. Seus dados ficam guardados caso queira voltar depois."
                    />
                    <FaqItem
                        pergunta="Posso usar grátis pra sempre?"
                        resposta="Sim! Você pode visualizar seus dados no plano Free. O Whallet+ é pra quem quer o controle financeiro completo: criar, editar e acompanhar tudo."
                    />
                    <FaqItem
                        pergunta="Tem fidelidade ou taxa de cancelamento?"
                        resposta="Não. Você cancela direto pelo app, qualquer hora. Não tem multa, não tem retenção, não tem nada disso."
                    />
                </section>

                {/* ── Voltar (escape) ── */}
                <div className="pw-back">
                    <button onClick={voltarParaConversor} className="pw-back-btn">
                        Continuar usando o conversor grátis
                    </button>
                </div>
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Feature — item individual de feature
   ═════════════════════════════════════════════════════════════════════════════ */

function Feature({ icon, titulo, descricao }) {
    return (
        <div className="pw-feature">
            <div className="pw-feature-icon">{icon}</div>
            <div className="pw-feature-text">
                <div className="pw-feature-title">{titulo}</div>
                <div className="pw-feature-desc">{descricao}</div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   FaqItem — pergunta/resposta com accordion
   ═════════════════════════════════════════════════════════════════════════════ */

function FaqItem({ pergunta, resposta }) {
    const [aberto, setAberto] = useState(false);
    return (
        <div className={`pw-faq-item ${aberto ? "pw-faq-item--open" : ""}`}>
            <button
                className="pw-faq-q"
                onClick={() => setAberto(a => !a)}
                aria-expanded={aberto}
            >
                <span>{pergunta}</span>
                {aberto ? <LuMinus size={16}/> : <LuPlus size={16}/>}
            </button>
            {aberto && (
                <div className="pw-faq-a">{resposta}</div>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .pw-* + .paywall-page (root)
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.paywall-page {
    min-height: 100vh;
    background: var(--bg);
    padding: 48px 24px 64px;
}

.pw-container {
    max-width: 600px;
    margin: 0 auto;
}

/* ── Hero ────────────────────────────────────────────────────────────── */

.pw-hero {
    text-align: center;
    margin-bottom: 24px;
}

.pw-hero-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 18px;
    border-radius: 16px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cyan-dark);
}

.pw-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 100px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.3);
    color: var(--cyan-dark);
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
}

.pw-title {
    margin: 0 0 12px;
    font-size: 30px;
    font-weight: 700;
    color: var(--navy-deep);
    line-height: 1.15;
    letter-spacing: -0.025em;
}

.pw-title em {
    font-family: var(--ff-italic, "Instrument Serif", Georgia, serif);
    font-style: italic;
    font-weight: 400;
}

.pw-title-highlight {
    color: var(--cyan-dark);
    font-weight: 700;
}

.pw-subtitle {
    margin: 0 auto;
    max-width: 480px;
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.55;
    letter-spacing: -0.005em;
}

/* ── Trial banner ────────────────────────────────────────────────────── */

.pw-trial {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--success-bg);
    border: 1px solid rgba(24, 178, 107, 0.25);
    color: var(--ink-2);
    font-size: 14px;
    margin-bottom: 32px;
}

.pw-trial-icon {
    color: var(--success);
    display: inline-flex;
    line-height: 0;
}

.pw-trial strong {
    color: var(--success);
    font-weight: 700;
}

/* ── Section (3 grupos) ──────────────────────────────────────────────── */

.pw-section {
    margin-bottom: 32px;
}

.pw-group {
    margin-bottom: 24px;
}

.pw-group:last-child {
    margin-bottom: 0;
}

.pw-group-title {
    margin: 0 0 12px;
    font-family: var(--ff-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--hair);
}

.pw-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.pw-feature {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.pw-feature-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    flex-shrink: 0;
    background: var(--cyan-soft);
    color: var(--cyan-dark);
    display: flex;
    align-items: center;
    justify-content: center;
}

.pw-feature-text {
    flex: 1;
    min-width: 0;
}

.pw-feature-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    margin-bottom: 2px;
    line-height: 1.3;
}

.pw-feature-desc {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
    letter-spacing: -0.005em;
}

/* ── CTA (preço + botão) ─────────────────────────────────────────────── */

.pw-cta {
    text-align: center;
    padding: 32px 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(21, 195, 221, 0.06), rgba(21, 195, 221, 0.02));
    border: 1.5px solid rgba(21, 195, 221, 0.25);
    margin-bottom: 32px;
}

.pw-cta-price {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 20px;
}

.pw-cta-currency {
    font-size: 18px;
    color: var(--text-muted);
    font-weight: 600;
    letter-spacing: -0.01em;
}

.pw-cta-value {
    font-family: var(--ff-sans);
    font-size: 56px;
    font-weight: 700;
    color: var(--navy-deep);
    line-height: 1;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
}

.pw-cta-period {
    font-size: 16px;
    color: var(--text-muted);
    font-weight: 500;
}

.pw-cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 12px;
    border: none;
    background: var(--cyan-dark);
    color: white;
    font-family: var(--ff-sans);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
    box-shadow: 0 4px 14px rgba(21, 195, 221, 0.3);
    letter-spacing: -0.01em;
    width: 100%;
    max-width: 320px;
}

.pw-cta-btn:hover {
    background: var(--cyan-deep, var(--navy-deep));
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(21, 195, 221, 0.4);
}

.pw-cta-guards {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 14px;
    flex-wrap: wrap;
}

.pw-guard {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

.pw-guard svg {
    color: var(--success);
    flex-shrink: 0;
}

/* ── FAQ ─────────────────────────────────────────────────────────────── */

.pw-faq {
    margin-bottom: 28px;
}

.pw-faq-title {
    margin: 0 0 12px;
    font-family: var(--ff-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.pw-faq-item {
    border-bottom: 1px solid var(--hair);
}

.pw-faq-item:first-child {
    border-top: 1px solid var(--hair);
}

.pw-faq-q {
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 14px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    text-align: left;
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    transition: color 0.15s;
}

.pw-faq-q:hover {
    color: var(--cyan-dark);
}

.pw-faq-q svg {
    color: var(--text-dim);
    flex-shrink: 0;
}

.pw-faq-item--open .pw-faq-q svg {
    color: var(--cyan-dark);
}

.pw-faq-a {
    padding: 0 0 14px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

/* ── Voltar / escape ─────────────────────────────────────────────────── */

.pw-back {
    text-align: center;
    padding-top: 16px;
}

.pw-back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-dim);
    font-family: var(--ff-sans);
    font-size: 13px;
    text-decoration: underline;
    text-decoration-color: var(--hair);
    text-underline-offset: 4px;
    transition: color 0.15s;
}

.pw-back-btn:hover {
    color: var(--navy-deep);
    text-decoration-color: var(--text-dim);
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .paywall-page {
        padding: 32px 20px 48px;
    }

    .pw-title {
        font-size: 24px;
    }

    .pw-subtitle {
        font-size: 14px;
    }

    .pw-features {
        grid-template-columns: 1fr;
    }

    .pw-cta {
        padding: 24px 20px;
    }

    .pw-cta-value {
        font-size: 48px;
    }

    .pw-cta-guards {
        flex-direction: column;
        gap: 6px;
    }
}
`;
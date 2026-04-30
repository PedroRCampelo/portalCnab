import { useNavigate, Link } from "react-router-dom";
import {
    LuArrowRight, LuCircleCheck, LuBot, LuShield, LuClock4,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext.jsx";
import elvisImg from "../../assets/bots/elvis.png";
import CnabChatPage from "./CnabChatPage.jsx";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

/**
 * Lista de planos exibida na seção "Escolha um plano"
 * Sprint A3.6.12 v2 · Refatoração com 2 planos (Free + Whallet+)
 *
 * Estrutura:
 *  - 2 cards (Gratuito, Whallet+)
 *  - Whallet+ destacado como recomendado
 *  - Itens iniciados com "✓" são features-chave (ganham cor cyan)
 *  - Itens iniciados com "🕐" são features "em breve" (badge mono)
 */
const PLANOS = [
    {
        id:       "gratuito",
        emoji:    "🚀",
        nome:     "Gratuito",
        preco:    "R$ 0",
        per:      "/mês",
        items:    [
            "8 conversões CNAB/mês",
            "Excel e PDF",
            "Todos os bancos",
            "🕐 Elvis com 5 perguntas/mês",
        ],
        cta:      "Criar conta grátis",
        destaque: false,
    },
    {
        id:       "whallet-plus",
        emoji:    "✨",
        nome:     "Whallet+",
        preco:    "R$ 39,90",
        per:      "/mês",
        items:    [
            "Conversões CNAB ilimitadas",
            "✓ Elvis ilimitado — IA CNAB",
            "Gestão financeira completa",
            "Recebimentos, títulos e clientes",
            "Cobrança automática via WhatsApp",
            "Alertas de e-mail",
            "Termômetro do limite MEI",
            "Insights de IA (Aurora, Frank, Anne)",
        ],
        cta:      "Assinar Whallet+",
        destaque: true,
    },
];

/**
 * AssistenteCnabPage — Paywall + entrada do Elvis (chat IA de CNAB)
 * Sprint A3.6.12 v2 · Refatoração
 *
 * Comportamento:
 *  - Whallet+ ou ADMIN → entrega CnabChatPage direto
 *  - Anônimo ou Free → mostra paywall com hero + 2 planos
 *
 * NOTA SOBRE FREE COM ELVIS LIMITADO:
 *   A regra "5 perguntas/mês para Free" requer backend do limite.
 *   Por enquanto, o card Free mostra "Em breve" — quando o backend estiver
 *   pronto, basta:
 *     1. Adicionar `|| (autenticado && perguntas_disponiveis > 0)` em `temAcesso`
 *     2. Trocar o badge "🕐" por contador no card Free
 *     3. Passar limite/uso pro CnabChatPage
 */
export default function AssistenteCnabPage() {
    const { autenticado, usuario } = useAuth();
    const navigate = useNavigate();

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS;
    const temAcesso      = isAdmin || temWhalletPlus;

    // ── Tem acesso? Entrega o chat direto ────────────────────────────────
    if (autenticado && temAcesso) {
        return <CnabChatPage/>;
    }

    // ── Sem acesso → paywall ─────────────────────────────────────────────
    return (
        <div className="elvis-page">

            {/* ═══ HERO ═══ */}
            <section className="elvis-hero">
                <div className="elvis-hero-orb"/>

                <div className="elvis-hero-text">
                    <div className="elvis-badge">
                        <LuBot size={11}/>
                        Agente de IA · CNAB
                    </div>

                    <h1 className="elvis-title">
                        Conheça o Elvis,<br/>
                        <span className="elvis-title-cyan">seu especialista em CNAB</span>
                    </h1>

                    <p className="elvis-subtitle">
                        Envie dúvidas sobre layouts bancários, segmentos e campos CNAB.
                        O Elvis analisa arquivos de remessa e responde com base na
                        documentação oficial dos bancos.
                    </p>

                    <ul className="elvis-features">
                        {[
                            "Responde perguntas sobre CNAB 240 e 400",
                            "Analisa arquivos de remessa em tempo real",
                            "Identifica erros com base no manual do banco",
                            "Suporte a Itaú, Bradesco, BB e Caixa",
                        ].map(f => (
                            <li key={f} className="elvis-feature">
                                <LuCircleCheck size={13} className="elvis-feature-icon"/>
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA conforme estado */}
                    {!autenticado ? (
                        <div className="elvis-cta-row">
                            <Link
                                to="/cadastro"
                                state={{ plano: "whallet-plus" }}
                                className="elvis-cta-primary"
                            >
                                Criar conta e usar Elvis
                                <LuArrowRight size={14}/>
                            </Link>
                            <Link to="/login" className="elvis-cta-secondary">
                                Já tenho conta
                            </Link>
                        </div>
                    ) : (
                        <Link to="/planos" className="elvis-cta-primary">
                            Fazer upgrade pra Whallet+
                            <LuArrowRight size={14}/>
                        </Link>
                    )}
                </div>

                {/* Foto do Elvis com halo animado + balão de exemplo */}
                <div className="elvis-photo">
                    <div className="elvis-photo-wrap">
                        <div className="elvis-halo"/>
                        <img src={elvisImg} alt="Elvis" className="elvis-img"/>
                    </div>
                    <div className="elvis-name">Elvis</div>
                    <div className="elvis-role">Especialista em CNAB</div>

                    <div className="elvis-bubble">
                        "O segmento J é obrigatório para pagamento de boletos no CNAB 240..."
                    </div>
                </div>
            </section>

            {/* ═══ PLANOS ═══ */}
            <section className="elvis-planos">
                <div className="elvis-planos-head">
                    <h2 className="elvis-planos-title">Escolha um plano para começar</h2>
                    <p className="elvis-planos-desc">
                        O Elvis ilimitado faz parte do Whallet+. No plano Free, em breve
                        você poderá fazer 5 perguntas por mês.
                    </p>
                </div>

                <div className="elvis-planos-grid">
                    {PLANOS.map(plano => (
                        <CardPlano
                            key={plano.id}
                            plano={plano}
                            ehAtual={plano.id === "whallet-plus" && temWhalletPlus}
                            autenticado={autenticado}
                            onAssinar={() => {
                                if (!autenticado) {
                                    navigate("/cadastro", { state: { plano: plano.id } });
                                } else {
                                    navigate("/upgrade");
                                }
                            }}
                        />
                    ))}
                </div>

                <div className="elvis-garantias">
                    <span className="elvis-garantia">
                        <LuShield size={12}/> Cancele quando quiser
                    </span>
                    <span className="elvis-garantia">
                        <LuCircleCheck size={12}/> Sem fidelidade
                    </span>
                </div>
            </section>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   CardPlano — card individual de plano
   ═════════════════════════════════════════════════════════════════════════════ */

function CardPlano({ plano, ehAtual, autenticado, onAssinar }) {
    return (
        <div className={`elvis-card ${plano.destaque ? "elvis-card--destaque" : ""}`}>
            {plano.destaque && (
                <div className="elvis-card-flag">Recomendado</div>
            )}

            <div className="elvis-card-head">
                <span className="elvis-card-emoji">{plano.emoji}</span>
                <span className="elvis-card-nome">{plano.nome}</span>
            </div>

            <div className="elvis-card-preco">
                <span className="elvis-card-valor">{plano.preco}</span>
                <span className="elvis-card-per">{plano.per}</span>
            </div>

            <ul className="elvis-card-items">
                {plano.items.map(item => {
                    const ehFeature = item.startsWith("✓");
                    const ehEmBreve = item.startsWith("🕐");
                    let texto = item;
                    if (ehFeature)  texto = item.replace("✓ ", "");
                    if (ehEmBreve)  texto = item.replace("🕐 ", "");

                    return (
                        <li
                            key={item}
                            className={`elvis-card-item ${ehFeature ? "elvis-card-item--feature" : ""} ${ehEmBreve ? "elvis-card-item--em-breve" : ""}`}
                        >
                            {ehFeature ? (
                                <LuCircleCheck size={12} className="elvis-card-check"/>
                            ) : ehEmBreve ? (
                                <LuClock4 size={12} className="elvis-card-clock"/>
                            ) : (
                                <span className="elvis-card-bullet">•</span>
                            )}
                            <span>
                                {texto}
                                {ehEmBreve && <span className="elvis-card-em-breve-tag">em breve</span>}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {ehAtual ? (
                <div className="elvis-card-atual">
                    <LuCircleCheck size={13}/>
                    Seu plano atual
                </div>
            ) : plano.id === "gratuito" ? (
                <Link
                    to={autenticado ? "/" : "/cadastro"}
                    className="elvis-card-cta elvis-card-cta--ghost"
                >
                    {autenticado ? "Plano atual" : "Começar grátis"}
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={onAssinar}
                    className={`elvis-card-cta ${plano.destaque ? "elvis-card-cta--gradient" : "elvis-card-cta--dark"}`}
                >
                    {autenticado ? "Fazer upgrade" : plano.cta}
                </button>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .elvis-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.elvis-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 48px 24px 80px;
}

/* ── HERO ────────────────────────────────────────────────────────────── */

.elvis-hero {
    background: var(--navy-deep, #0B1E36);
    border-radius: 24px;
    padding: 48px 40px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 40px;
    align-items: center;
    margin-bottom: 48px;
    overflow: hidden;
    position: relative;
}

.elvis-hero-orb {
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(21, 195, 221, 0.08);
    top: -100px;
    right: 200px;
    pointer-events: none;
    filter: blur(2px);
}

.elvis-hero-text {
    position: relative;
    z-index: 1;
}

.elvis-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 100px;
    background: rgba(21, 195, 221, 0.15);
    border: 1px solid rgba(21, 195, 221, 0.3);
    color: #4CDDE8;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 18px;
}

.elvis-title {
    margin: 0 0 14px;
    font-size: clamp(26px, 3vw, 38px);
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
    letter-spacing: -0.03em;
}

.elvis-title-cyan {
    color: #4CDDE8;
}

.elvis-subtitle {
    color: rgba(255, 255, 255, 0.6);
    font-size: 15px;
    line-height: 1.65;
    margin: 0 0 24px;
    max-width: 460px;
    letter-spacing: -0.005em;
}

.elvis-features {
    list-style: none;
    margin: 0 0 28px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.elvis-feature {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: -0.005em;
}

.elvis-feature-icon {
    color: #4CDDE8;
    flex-shrink: 0;
}

/* CTAs do hero */

.elvis-cta-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.elvis-cta-primary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 11px 22px;
    border-radius: 10px;
    background: linear-gradient(135deg, #15C3DD, #0891A8);
    color: #0B1E36;
    font-family: var(--ff-sans);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: -0.005em;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 14px rgba(21, 195, 221, 0.3);
}

.elvis-cta-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(21, 195, 221, 0.4);
}

.elvis-cta-secondary {
    display: inline-flex;
    align-items: center;
    padding: 11px 22px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
    font-family: var(--ff-sans);
    font-size: 14px;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
}

.elvis-cta-secondary:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
}

/* ── Foto do Elvis ───────────────────────────────────────────────────── */

.elvis-photo {
    text-align: center;
    position: relative;
    z-index: 1;
    flex-shrink: 0;
}

.elvis-photo-wrap {
    position: relative;
    display: inline-block;
}

.elvis-halo {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: rgba(21, 195, 221, 0.15);
    animation: elvisHalo 3s ease-in-out infinite;
}

@keyframes elvisHalo {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50%      { transform: scale(1.1); opacity: 1; }
}

.elvis-img {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(21, 195, 221, 0.45);
    position: relative;
    z-index: 1;
}

.elvis-name {
    margin-top: 14px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
}

.elvis-role {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: -0.005em;
    margin-bottom: 16px;
}

.elvis-bubble {
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px 14px 14px 14px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    text-align: left;
    max-width: 220px;
    letter-spacing: -0.005em;
}

/* ── PLANOS ──────────────────────────────────────────────────────────── */

.elvis-planos-head {
    margin-bottom: 18px;
}

.elvis-planos-title {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.025em;
}

.elvis-planos-desc {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
    letter-spacing: -0.005em;
    max-width: 600px;
}

.elvis-planos-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

/* ── Card de plano ───────────────────────────────────────────────────── */

.elvis-card {
    background: #fff;
    border: 1px solid var(--hair);
    border-radius: 16px;
    padding: 28px 24px;
    position: relative;
    transition: transform 0.15s, box-shadow 0.15s;
}

.elvis-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(11, 30, 54, 0.08);
}

.elvis-card--destaque {
    background: var(--navy-deep, #0B1E36);
    border: none;
    box-shadow: 0 8px 32px rgba(11, 30, 54, 0.15);
}

.elvis-card--destaque:hover {
    box-shadow: 0 12px 40px rgba(11, 30, 54, 0.25);
}

.elvis-card-flag {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #15C3DD, #0891A8);
    color: #0B1E36;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 20px;
    white-space: nowrap;
}

.elvis-card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
}

.elvis-card-emoji {
    font-size: 22px;
}

.elvis-card-nome {
    font-size: 17px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.01em;
}

.elvis-card--destaque .elvis-card-nome {
    color: #fff;
}

.elvis-card-preco {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 22px;
}

.elvis-card-valor {
    font-family: var(--ff-sans);
    font-size: 32px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.025em;
    font-variant-numeric: tabular-nums;
    line-height: 1;
}

.elvis-card--destaque .elvis-card-valor {
    color: #fff;
}

.elvis-card-per {
    font-size: 13px;
    color: var(--text-dim);
}

.elvis-card--destaque .elvis-card-per {
    color: rgba(255, 255, 255, 0.5);
}

.elvis-card-items {
    list-style: none;
    margin: 0 0 24px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.elvis-card-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

.elvis-card--destaque .elvis-card-item {
    color: rgba(255, 255, 255, 0.75);
}

.elvis-card-item--feature {
    font-weight: 600;
    color: var(--cyan-dark);
}

.elvis-card--destaque .elvis-card-item--feature {
    color: #4CDDE8;
}

.elvis-card-item--em-breve {
    color: var(--text-dim);
}

.elvis-card-check {
    color: var(--cyan-dark);
    flex-shrink: 0;
    margin-top: 3px;
}

.elvis-card--destaque .elvis-card-check {
    color: #4CDDE8;
}

.elvis-card-clock {
    color: var(--text-dim);
    flex-shrink: 0;
    margin-top: 3px;
}

.elvis-card-bullet {
    flex-shrink: 0;
    color: rgba(11, 30, 54, 0.3);
    line-height: 1;
    font-size: 14px;
    margin-top: 2px;
}

.elvis-card--destaque .elvis-card-bullet {
    color: rgba(255, 255, 255, 0.3);
}

.elvis-card-em-breve-tag {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--bg);
    border: 1px solid var(--hair);
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-dim);
    vertical-align: 1px;
}

/* CTAs dos cards */

.elvis-card-cta {
    display: block;
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    text-align: center;
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    letter-spacing: -0.005em;
    transition: opacity 0.15s, transform 0.15s;
    box-sizing: border-box;
}

.elvis-card-cta:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.elvis-card-cta--ghost {
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
}

.elvis-card-cta--ghost:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
}

.elvis-card-cta--dark {
    background: var(--navy-deep);
    color: #fff;
}

.elvis-card-cta--gradient {
    background: linear-gradient(135deg, #15C3DD, #0891A8);
    color: #0B1E36;
}

.elvis-card-atual {
    padding: 11px;
    border-radius: 10px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.25);
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--cyan-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.elvis-card--destaque .elvis-card-atual {
    background: rgba(76, 221, 232, 0.12);
    border-color: rgba(76, 221, 232, 0.3);
    color: #4CDDE8;
}

/* ── Garantias ───────────────────────────────────────────────────────── */

.elvis-garantias {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 24px;
    flex-wrap: wrap;
}

.elvis-garantia {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

.elvis-garantia svg {
    color: var(--success);
    flex-shrink: 0;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 768px) {
    .elvis-page {
        padding: 32px 20px 64px;
    }

    .elvis-hero {
        grid-template-columns: 1fr;
        padding: 32px 24px;
        gap: 32px;
        text-align: center;
    }

    .elvis-hero-orb {
        right: -50px;
        top: -150px;
    }

    .elvis-features {
        max-width: 360px;
        margin: 0 auto 28px;
    }

    .elvis-feature {
        text-align: left;
    }

    .elvis-cta-row {
        justify-content: center;
    }

    .elvis-photo {
        order: -1;
    }

    .elvis-bubble {
        margin: 16px auto 0;
        max-width: 280px;
    }

    .elvis-planos-grid {
        grid-template-columns: 1fr;
    }

    .elvis-garantias {
        flex-direction: column;
        gap: 6px;
    }
}

@media (max-width: 540px) {
    .elvis-title {
        font-size: 26px;
    }

    .elvis-subtitle {
        font-size: 14px;
    }
}
`;
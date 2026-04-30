import { Link } from "react-router-dom";
import { LuBot, LuSparkles, LuArrowRight, LuCircleCheck, LuClock4 } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";
import elvisImg from "../assets/bots/elvis.png";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

/**
 * ElvisMiniChat — Mini-card lateral promovendo o Elvis (IA do CNAB)
 * Sprint A3.6.15 fix · Removida referência ao plano Pro (descontinuado)
 *
 * Estados:
 *  - Whallet+ ou Admin → CTA "Conversar com Elvis" (acesso liberado)
 *  - Logado Free        → CTA "Liberar Elvis ilimitado" (upgrade)
 *  - Anônimo            → CTA "Criar conta grátis"
 *
 * Usado pela ValidaCnabPage como aside lateral.
 */
export default function ElvisMiniChat() {
    const { autenticado, usuario } = useAuth();

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS;
    const temAcessoTotal = isAdmin || temWhalletPlus;

    /* ─── Whallet+ ou Admin: acesso total ─────────────────────────────── */
    if (autenticado && temAcessoTotal) {
        return (
            <div className="elv-mini elv-mini--ativo">
                <div className="elv-head">
                    <img src={elvisImg} alt="Elvis" className="elv-avatar"/>
                    <div>
                        <div className="elv-nome">Elvis</div>
                        <div className="elv-role">Agente especialista em CNAB</div>
                    </div>
                    <div className="elv-online" title="Online"/>
                </div>

                <p className="elv-desc">
                    Envie dúvidas sobre layouts CNAB, segmentos e campos. O Elvis analisa
                    arquivos de remessa e responde com base na documentação oficial dos bancos.
                </p>

                <Link to="/assistente-cnab" className="elv-cta elv-cta--primary">
                    Conversar com Elvis
                    <LuArrowRight size={14}/>
                </Link>

                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    /* ─── Logado Free: upgrade pra Whallet+ ──────────────────────────── */
    if (autenticado && !temAcessoTotal) {
        return (
            <div className="elv-mini">
                <div className="elv-head">
                    <img src={elvisImg} alt="Elvis" className="elv-avatar"/>
                    <div>
                        <div className="elv-nome">Elvis · Agente CNAB</div>
                        <div className="elv-role-badge">
                            <LuClock4 size={10}/>
                            Em breve no Free · 5 perg/mês
                        </div>
                    </div>
                </div>

                <p className="elv-desc">
                    Com o Elvis você analisa arquivos de remessa, tira dúvidas sobre CNAB
                    240/400 e identifica erros com base na documentação oficial dos bancos.
                </p>

                <ul className="elv-features">
                    {[
                        "Identifica erros no arquivo de remessa",
                        "Responde sobre segmentos e campos",
                        "Suporte a Itaú, Bradesco, BB e Caixa",
                    ].map(f => (
                        <li key={f} className="elv-feature">
                            <LuCircleCheck size={12}/>
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>

                <Link to="/planos" className="elv-cta elv-cta--primary">
                    <LuSparkles size={14}/>
                    Liberar Elvis ilimitado
                </Link>

                <div className="elv-cta-sub">
                    Whallet+ por R$ 39,90/mês
                </div>

                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    /* ─── Anônimo: criar conta ───────────────────────────────────────── */
    return (
        <div className="elv-mini">
            <div className="elv-head">
                <img src={elvisImg} alt="Elvis" className="elv-avatar"/>
                <div>
                    <div className="elv-nome">Elvis · Agente CNAB</div>
                    <div className="elv-role">IA especialista em layouts</div>
                </div>
            </div>

            <p className="elv-desc">
                Crie uma conta grátis e tenha o Elvis pra tirar dúvidas sobre CNAB 240/400,
                segmentos, campos e layouts bancários.
            </p>

            <ul className="elv-features">
                {[
                    "Análise de arquivos de remessa",
                    "Documentação oficial dos bancos",
                    "Suporte a Itaú, Bradesco, BB e Caixa",
                ].map(f => (
                    <li key={f} className="elv-feature">
                        <LuCircleCheck size={12}/>
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <Link to="/cadastro" className="elv-cta elv-cta--primary">
                <LuBot size={14}/>
                Criar conta grátis
            </Link>

            <Link to="/login" className="elv-cta elv-cta--secondary">
                Já tenho conta
            </Link>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .elv-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.elv-mini {
    background: var(--navy-deep, #0B1E36);
    border-radius: 16px;
    padding: 22px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    overflow: hidden;
    position: relative;
}

/* Glow sutil cyan no canto pra ativos */
.elv-mini--ativo::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(21, 195, 221, 0.15) 0%, transparent 70%);
    pointer-events: none;
}

/* ── Header ──────────────────────────────────────────────────────────── */

.elv-head {
    display: flex;
    align-items: center;
    gap: 12px;
}

.elv-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(21, 195, 221, 0.35);
    flex-shrink: 0;
}

.elv-nome {
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
}

.elv-role {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: -0.005em;
}

.elv-role-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4CDDE8;
}

.elv-online {
    margin-left: auto;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4CDDE8;
    box-shadow: 0 0 8px rgba(21, 195, 221, 0.7);
    animation: elv-blink 2s infinite;
    flex-shrink: 0;
}

@keyframes elv-blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.3; }
}

/* ── Descrição ───────────────────────────────────────────────────────── */

.elv-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
    margin: 0;
    line-height: 1.6;
    letter-spacing: -0.005em;
}

/* ── Features ────────────────────────────────────────────────────────── */

.elv-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.elv-feature {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: -0.005em;
}

.elv-feature svg {
    color: rgba(21, 195, 221, 0.8);
    flex-shrink: 0;
}

/* ── CTAs ────────────────────────────────────────────────────────────── */

.elv-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 11px 16px;
    border-radius: 10px;
    font-family: var(--ff-sans);
    font-weight: 700;
    font-size: 13px;
    letter-spacing: -0.005em;
    text-decoration: none;
    transition: all 0.15s;
}

.elv-cta--primary {
    background: linear-gradient(135deg, #15C3DD, #0891A8);
    color: #0B1E36;
    box-shadow: 0 2px 12px rgba(21, 195, 221, 0.25);
}

.elv-cta--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(21, 195, 221, 0.4);
}

.elv-cta--secondary {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
    margin-top: -4px;
}

.elv-cta--secondary:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
}

.elv-cta-sub {
    text-align: center;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: -4px;
    letter-spacing: -0.005em;
}
`;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuBot, LuSparkles, LuArrowRight, LuCircleCheck, LuTriangleAlert } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";
import { getElvisQuota } from "../services/elvisQuotaService.js";
import elvisImg from "../assets/bots/elvis.png";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

/**
 * ElvisMiniChat — Mini-card lateral promovendo o Elvis (IA do CNAB)
 * Sprint A3.9.4 · Fair use no Whallet+
 *
 * Estados:
 *  - Admin                            → "Conversar" (sem badge - ilimitado)
 *  - Whallet+ uso normal (0-79%)      → "Conversar" (sem badge - UX limpa)
 *  - Whallet+ uso alto (80-99%)       → "Conversar" + badge cyan "X de 100"
 *  - Whallet+ esgotado (100%)         → "Reseta dia 1" + badge âmbar
 *  - Free com perguntas (0-79%)       → "X de 5 grátis" + badge cyan
 *  - Free aproximando (80-99%)        → "X de 5 grátis" + badge âmbar
 *  - Free esgotado (100%)             → "Liberar Elvis ilimitado" + badge vermelho
 *  - Anônimo                          → "Criar conta grátis"
 *
 * Threshold "alto uso": 80% do limite.
 * Estratégia: comunicação silenciosa pra Whallet+ (não polui UX de pagantes).
 */
export default function ElvisMiniChat() {
    const { autenticado, usuario } = useAuth();
    const [quota, setQuota] = useState(null);

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS;

    useEffect(() => {
        if (!autenticado || isAdmin) return;
        getElvisQuota().then(setQuota).catch(() => setQuota(null));
    }, [autenticado, isAdmin]);

    /* ─── Helpers de classificação ────────────────────────────────────── */

    // Calcula percentual de uso (0-100)
    const percentual = quota?.limite
        ? Math.round((quota.usadas / quota.limite) * 100)
        : 0;

    const usoAlto    = percentual >= 80 && percentual < 100;
    const esgotado   = quota?.podePerguntar === false;

    /* ─── Admin: acesso total + sem badge ─────────────────────────────── */
    if (autenticado && isAdmin) {
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
                    Conversar com Elvis <LuArrowRight size={14}/>
                </Link>
                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    /* ─── Whallet+ ─────────────────────────────────────────────────────── */
    if (autenticado && temWhalletPlus) {
        return (
            <div className="elv-mini elv-mini--ativo">
                <div className="elv-head">
                    <img src={elvisImg} alt="Elvis" className="elv-avatar"/>
                    <div>
                        <div className="elv-nome">Elvis</div>
                        <div className="elv-role">Agente especialista em CNAB</div>

                        {/* Badge silencioso: só aparece se uso >= 80% */}
                        {(usoAlto || esgotado) && quota && (
                            <div className={`elv-counter ${esgotado ? "elv-counter--esgotado" : "elv-counter--alerta"}`}>
                                {esgotado ? (
                                    <><LuTriangleAlert size={9}/> Limite atingido</>
                                ) : (
                                    `${quota.usadas} de ${quota.limite} perguntas`
                                )}
                            </div>
                        )}
                    </div>
                    {!esgotado && <div className="elv-online" title="Online"/>}
                </div>

                <p className="elv-desc">
                    {esgotado ? (
                        <>
                            Você atingiu o limite mensal. Reseta dia 1 do próximo mês.
                            Em caso de necessidade, <Link to="/contato" className="elv-link">fale com a gente</Link>.
                        </>
                    ) : (
                        <>
                            Envie dúvidas sobre layouts CNAB, segmentos e campos. O Elvis analisa
                            arquivos de remessa e responde com base na documentação oficial dos bancos.
                        </>
                    )}
                </p>

                <Link
                    to="/assistente-cnab"
                    className={`elv-cta elv-cta--primary ${esgotado ? "elv-cta--disabled" : ""}`}
                >
                    {esgotado ? "Ver chat (limite atingido)" : "Conversar com Elvis"}
                    <LuArrowRight size={14}/>
                </Link>

                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    /* ─── Logado Free: acesso com contador ────────────────────────────── */
    if (autenticado && !temWhalletPlus) {
        const usadas    = quota?.usadas ?? 0;
        const limite    = quota?.limite ?? 5;
        const restantes = quota?.restantes ?? limite;

        // Free: badge sempre visível (limite baixo de 5, estratégia diferente do Plus)
        const corBadge = esgotado ? "elv-counter--esgotado"
            : usoAlto  ? "elv-counter--alerta"
                : "";

        return (
            <div className="elv-mini">
                <div className="elv-head">
                    <img src={elvisImg} alt="Elvis" className="elv-avatar"/>
                    <div>
                        <div className="elv-nome">Elvis · Agente CNAB</div>
                        <div className={`elv-counter ${corBadge}`}>
                            {esgotado
                                ? `Limite atingido (${usadas}/${limite})`
                                : `${restantes} de ${limite} perguntas grátis`}
                        </div>
                    </div>
                </div>
                <p className="elv-desc">
                    {esgotado ? (
                        <>
                            Você usou todas suas perguntas grátis deste mês.
                            Faça upgrade pra <strong>perguntas ilimitadas*</strong> com o Whallet+.
                        </>
                    ) : (
                        <>
                            Tire dúvidas sobre CNAB 240/400, segmentos e campos.
                            Responde com base na documentação oficial dos bancos.
                        </>
                    )}
                </p>

                {esgotado ? (
                    <>
                        <Link to="/planos" className="elv-cta elv-cta--primary">
                            <LuSparkles size={14}/> Liberar Elvis ilimitado*
                        </Link>
                        <div className="elv-cta-sub">Whallet+ por R$ 39,90/mês</div>
                    </>
                ) : (
                    <>
                        <Link to="/assistente-cnab" className="elv-cta elv-cta--primary">
                            Conversar com Elvis <LuArrowRight size={14}/>
                        </Link>
                        <div className="elv-cta-sub">Reseta dia 1 do próximo mês</div>
                    </>
                )}
                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    /* ─── Anônimo ──────────────────────────────────────────────────────── */
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
                segmentos, campos e layouts bancários. <strong>5 perguntas grátis/mês.</strong>
            </p>
            <ul className="elv-features">
                {[
                    "5 perguntas grátis por mês",
                    "Análise de arquivos de remessa",
                    "Suporte a Itaú, Bradesco, BB e Caixa",
                ].map(f => (
                    <li key={f} className="elv-feature">
                        <LuCircleCheck size={12}/> <span>{f}</span>
                    </li>
                ))}
            </ul>
            <Link to="/cadastro" className="elv-cta elv-cta--primary">
                <LuBot size={14}/> Criar conta grátis
            </Link>
            <Link to="/login" className="elv-cta elv-cta--secondary">
                Já tenho conta
            </Link>
            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

const COMPONENT_CSS = `
.elv-mini { background: var(--navy-deep, #0B1E36); border-radius: 16px; padding: 22px 20px; display: flex; flex-direction: column; gap: 14px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden; position: relative; }
.elv-mini--ativo::before { content: ''; position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: radial-gradient(circle, rgba(21,195,221,0.15) 0%, transparent 70%); pointer-events: none; }
.elv-head { display: flex; align-items: center; gap: 12px; }
.elv-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(21,195,221,0.35); flex-shrink: 0; }
.elv-nome { font-family: var(--ff-sans); font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
.elv-role { font-size: 11px; color: rgba(255,255,255,0.45); letter-spacing: -0.005em; }
.elv-counter { display: inline-flex; align-items: center; gap: 4px; margin-top: 3px; padding: 2px 8px; border-radius: 100px; font-family: var(--ff-mono); font-size: 9px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: rgba(76,221,232,0.12); color: #4CDDE8; border: 1px solid rgba(76,221,232,0.25); }
.elv-counter--alerta { background: rgba(230,162,60,0.15); color: #F5C572; border-color: rgba(230,162,60,0.3); }
.elv-counter--esgotado { background: rgba(229,72,77,0.12); color: #FF6B70; border-color: rgba(229,72,77,0.3); }
.elv-online { margin-left: auto; width: 8px; height: 8px; border-radius: 50%; background: #4CDDE8; box-shadow: 0 0 8px rgba(21,195,221,0.7); animation: elv-blink 2s infinite; flex-shrink: 0; }
@keyframes elv-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.elv-desc { font-size: 13px; color: rgba(255,255,255,0.55); margin: 0; line-height: 1.6; letter-spacing: -0.005em; }
.elv-desc strong { color: #fff; font-weight: 600; }
.elv-link { color: #4CDDE8; text-decoration: underline; text-decoration-color: rgba(76,221,232,0.4); text-underline-offset: 3px; }
.elv-link:hover { text-decoration-color: #4CDDE8; }
.elv-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.elv-feature { display: flex; align-items: center; gap: 7px; font-size: 12px; color: rgba(255,255,255,0.55); letter-spacing: -0.005em; }
.elv-feature svg { color: rgba(21,195,221,0.8); flex-shrink: 0; }
.elv-cta { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 11px 16px; border-radius: 10px; font-family: var(--ff-sans); font-weight: 700; font-size: 13px; letter-spacing: -0.005em; text-decoration: none; transition: all 0.15s; }
.elv-cta--primary { background: linear-gradient(135deg, #15C3DD, #0891A8); color: #0B1E36; box-shadow: 0 2px 12px rgba(21,195,221,0.25); }
.elv-cta--primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(21,195,221,0.4); }
.elv-cta--disabled { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); box-shadow: none; cursor: not-allowed; pointer-events: auto; }
.elv-cta--disabled:hover { transform: none; box-shadow: none; }
.elv-cta--secondary { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); margin-top: -4px; }
.elv-cta--secondary:hover { background: rgba(255,255,255,0.05); color: #fff; }
.elv-cta-sub { text-align: center; font-size: 11px; color: rgba(255,255,255,0.4); margin-top: -4px; letter-spacing: -0.005em; }
`;
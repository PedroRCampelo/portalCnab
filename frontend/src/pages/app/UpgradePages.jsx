import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
    LuPartyPopper, LuArrowRight, LuCircleSlash, LuCircleCheck,
    LuTriangleAlert,
} from "react-icons/lu";

/**
 * Páginas de retorno do checkout Stripe
 * Sprint A3.8 · Removida lógica do plano Pro (descontinuado)
 *
 * Exporta 2 componentes:
 *  - UpgradeSucessoPage   — após pagamento bem-sucedido
 *  - UpgradeCanceladoPage — quando user fecha modal do Stripe
 *
 * Comportamento da Sucesso:
 *  - Tenta atualizar usuário até 8x (espera webhook do Stripe processar)
 *  - Quando detecta plano ativo, mostra tela de boas-vindas
 *  - Após 8 tentativas, oferece "verificar novamente"
 *  - CTA leva pra /titulos (entrada principal do app pago)
 */

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

/* ─── UpgradeSucessoPage ──────────────────────────────────────────────── */

export function UpgradeSucessoPage() {
    const { usuario, atualizarUsuario } = useAuth();
    const [tentativas, setTentativas]   = useState(0);
    const [planoAtivado, setPlanoAtivado] = useState(false);

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS || isAdmin;

    // Polling pra esperar o webhook do Stripe
    useEffect(() => {
        if (planoAtivado || temWhalletPlus) {
            setPlanoAtivado(true);
            return;
        }
        if (tentativas >= 8) return;

        const delay = tentativas === 0 ? 1500 : 2000;
        const timer = setTimeout(async () => {
            await atualizarUsuario();
            setTentativas(t => t + 1);
        }, delay);

        return () => clearTimeout(timer);
    }, [tentativas, temWhalletPlus, planoAtivado, atualizarUsuario]);

    // Detecta ativação
    useEffect(() => {
        if (temWhalletPlus) setPlanoAtivado(true);
    }, [temWhalletPlus]);

    return (
        <div className="upg-wrap">
            <div className="upg-card">

                {planoAtivado ? (
                    /* ── Sucesso confirmado ──────────────────────────── */
                    <>
                        <div className="upg-icon upg-icon--success">
                            <LuPartyPopper size={32}/>
                        </div>

                        <h1 className="upg-title">Bem-vindo ao Whallet+!</h1>

                        <p className="upg-desc">
                            Sua assinatura foi confirmada. Agora você tem acesso
                            completo a todas as funcionalidades.
                        </p>

                        <ul className="upg-features">
                            <li>
                                <LuCircleCheck size={14}/>
                                Gestão financeira completa
                            </li>
                            <li>
                                <LuCircleCheck size={14}/>
                                Cobrança via WhatsApp
                            </li>
                        </ul>

                        <Link to="/titulos" className="upg-cta upg-cta--primary">
                            Começar a usar
                            <LuArrowRight size={15}/>
                        </Link>

                        <Link to="/planos" className="upg-cta upg-cta--secondary">
                            Ver detalhes da assinatura
                        </Link>
                    </>
                ) : (
                    /* ── Aguardando confirmação ──────────────────────── */
                    <>
                        <div className="upg-spinner"/>

                        <h1 className="upg-title">Confirmando pagamento…</h1>

                        <p className="upg-desc">
                            Aguarde enquanto processamos sua assinatura.
                            Isso costuma levar alguns segundos.
                        </p>

                        {tentativas >= 8 && (
                            <div className="upg-alerta">
                                <LuTriangleAlert size={16}/>
                                <div>
                                    <strong>O processamento está demorando.</strong><br/>
                                    Seu pagamento foi confirmado pelo Stripe — o acesso
                                    será liberado em instantes. Tente{" "}
                                    <button
                                        className="upg-link"
                                        onClick={() => setTentativas(0)}
                                    >
                                        verificar novamente
                                    </button>
                                    {" "}ou faça logout e login.
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ─── UpgradeCanceladoPage ────────────────────────────────────────────── */

export function UpgradeCanceladoPage() {
    return (
        <div className="upg-wrap">
            <div className="upg-card">

                <div className="upg-icon upg-icon--neutral">
                    <LuCircleSlash size={32}/>
                </div>

                <h1 className="upg-title">Pagamento cancelado</h1>

                <p className="upg-desc">
                    Nenhuma cobrança foi realizada. Você pode tentar novamente
                    quando quiser — sem compromisso.
                </p>

                <div className="upg-actions">
                    <Link to="/planos" className="upg-cta upg-cta--primary">
                        Ver planos
                        <LuArrowRight size={15}/>
                    </Link>
                    <Link to="/" className="upg-cta upg-cta--secondary">
                        Voltar pra home
                    </Link>
                </div>
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .upg-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.upg-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
}

.upg-card {
    width: 100%;
    max-width: 460px;
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 16px;
    padding: 36px 32px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(11, 30, 54, 0.04);
}

/* ── Ícones ──────────────────────────────────────────────────────────── */

.upg-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
}

.upg-icon--success {
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.upg-icon--neutral {
    background: var(--bg);
    color: var(--text-dim);
    border: 1px solid var(--hair);
}

/* ── Spinner ─────────────────────────────────────────────────────────── */

.upg-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid var(--cyan-soft);
    border-top-color: var(--cyan);
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: upg-spin 0.8s linear infinite;
}

@keyframes upg-spin {
    to { transform: rotate(360deg); }
}

/* ── Tipografia ──────────────────────────────────────────────────────── */

.upg-title {
    margin: 0 0 10px;
    font-family: var(--ff-sans);
    font-size: 24px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.025em;
    line-height: 1.2;
}

.upg-desc {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

/* ── Lista de features ───────────────────────────────────────────────── */

.upg-features {
    list-style: none;
    padding: 0;
    margin: 0 0 28px;
    text-align: left;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.15);
    border-radius: 12px;
    padding: 16px 18px;
}

.upg-features li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
    font-size: 13px;
    color: var(--ink-2);
    letter-spacing: -0.005em;
}

.upg-features svg {
    color: var(--cyan-dark);
    flex-shrink: 0;
}

/* ── Botões ──────────────────────────────────────────────────────────── */

.upg-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 18px;
    border-radius: 10px;
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.005em;
    text-decoration: none;
    transition: all 0.15s;
    margin-bottom: 8px;
}

.upg-cta--primary {
    background: linear-gradient(135deg, #15C3DD, #0891A8);
    color: #0B1E36;
    box-shadow: 0 2px 12px rgba(21, 195, 221, 0.25);
}

.upg-cta--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(21, 195, 221, 0.4);
}

.upg-cta--secondary {
    background: transparent;
    border: 1px solid var(--hair);
    color: var(--text-muted);
}

.upg-cta--secondary:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.upg-actions {
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* ── Alerta (timeout) ────────────────────────────────────────────────── */

.upg-alerta {
    margin-top: 20px;
    padding: 14px 16px;
    border-radius: 10px;
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.2);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--ink-2);
    text-align: left;
    letter-spacing: -0.005em;
}

.upg-alerta svg {
    color: var(--warning);
    flex-shrink: 0;
    margin-top: 2px;
}

.upg-alerta strong {
    color: var(--navy-deep);
    font-weight: 600;
}

.upg-link {
    background: none;
    border: none;
    color: var(--cyan-dark);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
}

.upg-link:hover {
    color: var(--navy-deep);
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 480px) {
    .upg-card {
        padding: 28px 22px;
    }

    .upg-title {
        font-size: 22px;
    }
}
`;
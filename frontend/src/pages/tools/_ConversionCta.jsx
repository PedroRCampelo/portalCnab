import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    LuX, LuArrowRight, LuSparkles, LuMessageCircle,
    LuTrendingUp, LuCircleCheck,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * ConversionCta — Banner pós-conversão pra atrair pra Whallet+
 * Sprint A3.6.15 · Otimização de marketing
 *
 * Aparece automaticamente quando uma conversão CNAB é bem-sucedida.
 * Usa MutationObserver pra detectar quando elemento `.msg--success` aparece
 * no DOM (sem precisar editar BankForm/ProtheusForm).
 *
 * Comportamento:
 *  - Anônimo: convida a criar conta grátis (8 conversões/mês)
 *  - Logado Free: convida pra Whallet+
 *  - Whallet+/Admin: NÃO mostra
 *
 * UX:
 *  - Slide-in suave do bottom (não bloqueia, não interrompe)
 *  - Botão X pra dispensar (não volta na sessão atual)
 *  - Auto-dismiss em 30s (caso usuário ignore)
 */
export default function ConversionCta() {
    const { autenticado, usuario } = useAuth();
    const [mostrar, setMostrar] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const observerRef = useRef(null);
    const timerRef = useRef(null);

    // Whallet+ ou Admin: não tem nada pra vender
    const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";
    const ehWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS;
    const ehAdmin       = usuario?.perfil === "ADMIN";
    const naoMostrarNunca = ehWhalletPlus || ehAdmin;

    // ── Detector de sucesso (via MutationObserver) ──────────────────────
    useEffect(() => {
        if (naoMostrarNunca || dismissed) return;

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue; // só elementos
                    // Detecta classe msg--success em qualquer elemento adicionado
                    if (node.classList?.contains("msg--success") ||
                        node.querySelector?.(".msg--success")) {
                        // Atrasa 1.5s pra não ser invasivo (deixa user celebrar)
                        setTimeout(() => setMostrar(true), 1500);
                        return;
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        observerRef.current = observer;

        return () => observer.disconnect();
    }, [naoMostrarNunca, dismissed]);

    // ── Auto-dismiss em 30s ─────────────────────────────────────────────
    useEffect(() => {
        if (!mostrar) return;

        timerRef.current = setTimeout(() => {
            setMostrar(false);
        }, 30_000);

        return () => clearTimeout(timerRef.current);
    }, [mostrar]);

    // ── Render ──────────────────────────────────────────────────────────
    if (naoMostrarNunca) return null;
    if (!mostrar) return null;

    function dispensar() {
        setMostrar(false);
        setDismissed(true);
    }

    // CTA varia conforme estado de auth
    return (
        <div className="cv-cta">
            <div className="cv-cta-card">
                <button
                    className="cv-cta-close"
                    onClick={dispensar}
                    title="Fechar"
                    aria-label="Fechar"
                >
                    <LuX size={14}/>
                </button>

                <div className="cv-cta-head">
                    <div className="cv-cta-icon">
                        <LuSparkles size={18}/>
                    </div>
                    <div>
                        <div className="cv-cta-success">
                            <LuCircleCheck size={11}/>
                            Conversão concluída
                        </div>
                        <h3 className="cv-cta-title">
                            {!autenticado
                                ? "Curtiu? Crie conta grátis 🎉"
                                : "Faça mais com o Whallet+"}
                        </h3>
                    </div>
                </div>

                <p className="cv-cta-desc">
                    {!autenticado ? (
                        <>
                            Com cadastro grátis você ganha <strong>8 conversões/mês</strong>,
                            histórico completo e acesso ao Elvis (IA do CNAB).
                        </>
                    ) : (
                        <>
                            Conversões ilimitadas, gestão financeira completa e cobrança
                            via WhatsApp — tudo por <strong>R$ 39,90/mês</strong>.
                        </>
                    )}
                </p>

                {/* Features mini-list */}
                <ul className="cv-cta-features">
                    {!autenticado ? (
                        <>
                            <li>
                                <LuTrendingUp size={11}/>
                                <span>8 conversões/mês grátis</span>
                            </li>
                            <li>
                                <LuMessageCircle size={11}/>
                                <span>Elvis (IA CNAB) com 5 perguntas/mês</span>
                            </li>
                            <li>
                                <LuCircleCheck size={11}/>
                                <span>Histórico completo</span>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <LuTrendingUp size={11}/>
                                <span>Conversões CNAB ilimitadas</span>
                            </li>
                            <li>
                                <LuMessageCircle size={11}/>
                                <span>Elvis ilimitado + cobrança via WhatsApp</span>
                            </li>
                            <li>
                                <LuCircleCheck size={11}/>
                                <span>Gestão financeira completa</span>
                            </li>
                        </>
                    )}
                </ul>

                <div className="cv-cta-actions">
                    {!autenticado ? (
                        <>
                            <Link to="/cadastro" className="cv-cta-primary">
                                Criar conta grátis
                                <LuArrowRight size={13}/>
                            </Link>
                            <Link to="/login" className="cv-cta-secondary">
                                Já tenho conta
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/planos" className="cv-cta-primary">
                                Ver Whallet+
                                <LuArrowRight size={13}/>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .cv-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.cv-cta {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    width: 360px;
    max-width: calc(100vw - 32px);
    animation: cv-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cv-slide-in {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.cv-cta-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 14px;
    padding: 18px 18px 16px;
    box-shadow:
        0 12px 40px rgba(11, 30, 54, 0.18),
        0 4px 12px rgba(11, 30, 54, 0.08);
}

/* Borda lateral cyan pra destaque visual */
.cv-cta-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #15C3DD, #0891A8);
    border-radius: 14px 0 0 14px;
}

.cv-cta-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s, color 0.12s;
}

.cv-cta-close:hover {
    background: var(--bg);
    color: var(--navy-deep);
}

.cv-cta-head {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
    padding-right: 24px;
}

.cv-cta-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.cv-cta-success {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--success);
}

.cv-cta-title {
    margin: 0;
    font-family: var(--ff-sans);
    font-size: 15px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.01em;
    line-height: 1.25;
}

.cv-cta-desc {
    margin: 0 0 12px;
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

.cv-cta-desc strong {
    color: var(--navy-deep);
    font-weight: 700;
}

.cv-cta-features {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.cv-cta-features li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--ink-2);
    letter-spacing: -0.005em;
}

.cv-cta-features svg {
    color: var(--cyan-dark);
    flex-shrink: 0;
}

.cv-cta-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

.cv-cta-primary {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 9px 16px;
    border-radius: 8px;
    background: linear-gradient(135deg, #15C3DD, #0891A8);
    color: #0B1E36;
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.005em;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 2px 8px rgba(21, 195, 221, 0.25);
    flex: 1;
    justify-content: center;
}

.cv-cta-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(21, 195, 221, 0.4);
}

.cv-cta-secondary {
    padding: 9px 14px;
    border-radius: 8px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
    font-family: var(--ff-sans);
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    letter-spacing: -0.005em;
    transition: all 0.12s;
}

.cv-cta-secondary:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .cv-cta {
        bottom: 16px;
        right: 16px;
        left: 16px;
        width: auto;
    }

    .cv-cta-actions {
        flex-direction: column;
        gap: 6px;
    }

    .cv-cta-primary,
    .cv-cta-secondary {
        flex: none;
        width: 100%;
        text-align: center;
        justify-content: center;
    }
}
`;
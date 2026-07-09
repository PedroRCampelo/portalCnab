import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuShield, LuCircleCheck, LuLayoutDashboard } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ToolLayout — Layout compartilhado das ferramentas CNAB
 * Sprint A3.6.15 fix · Auth-aware UI + voltar inteligente
 *
 * Usado pelas 3 telas tools:
 *  - /valida-cnab (ValidaCnabPage)
 *  - /excel       (ExcelPage)
 *  - /pdf         (PdfPage)
 *
 * Comportamento:
 *  - FORA do AppLayout (sem sidebar/topbar do shell ERP)
 *  - Header com:
 *    · Voltar INTELIGENTE: só aparece se veio de dentro do app
 *      (document.referrer interno OU history.length > 2)
 *    · Brand "whallet." (sempre clicável → home)
 *    · CTA: anônimo → "Entrar" | logado → "Meu Whallet"
 *  - Footer com garantias (LGPD, gratuito, etc)
 *  - Background limpo, vibe landing
 *
 * Lógica do "Voltar":
 *  - Cara veio do Google/digitou URL → SEM botão Voltar (não tem pra onde voltar)
 *  - Cara navegou de dentro do app → COM botão Voltar (volta na história)
 *  - Logo "whallet." sempre disponível pra ir pra home (estilo Stripe/Linear)
 *
 * Props:
 *  icon         — componente ou JSX do ícone do hero
 *  title        — título principal
 *  subtitle     — subtítulo descritivo
 *  iconColor    — variant: "excel" (verde) | "pdf" (vermelho) | "tool" (cyan)
 *  toolbar      — JSX opcional (ex: tabs Excel/PDF na ValidaCnab)
 *  children     — conteúdo principal
 *  rightAside   — JSX opcional pra coluna direita (ex: ElvisMiniChat)
 */
export default function ToolLayout({
                                       icon,
                                       title,
                                       subtitle,
                                       iconColor = "tool",
                                       toolbar,
                                       children,
                                       rightAside,
                                   }) {
    const navigate = useNavigate();
    const { autenticado } = useAuth();

    /* ─── Detector de navegação interna ─────────────────────────────── */

    const [veioDeDentro, setVeioDeDentro] = useState(false);

    useEffect(() => {
        // Roda só uma vez na montagem
        const referrer = document.referrer || "";
        const origin   = window.location.origin;

        // 1. Veio de outra página do mesmo domínio?
        const referrerInterno = referrer.startsWith(origin);

        // 2. Tem histórico de navegação SPA?
        //    history.length > 2 indica que houve push interno
        //    (length 1 = primeira página, 2 = redirect inicial)
        const temHistorico = window.history.length > 2;

        setVeioDeDentro(referrerInterno || temHistorico);
    }, []);

    /* ─── Render ─────────────────────────────────────────────────────── */

    return (
        <div className="tool-layout">

            {/* ── Header ───────────────────────────────────────────── */}
            <header className="tool-header">
                <div className="tool-header-inner">

                    {/* Voltar - só aparece se veio de dentro */}
                    {veioDeDentro ? (
                        <button
                            className="tool-back"
                            onClick={() => navigate(-1)}
                        >
                            <LuArrowLeft size={14}/>
                            Voltar
                        </button>
                    ) : (
                        // Espaçador invisível pra manter o brand centralizado
                        <span className="tool-back-spacer"/>
                    )}

                    <Link to="/" className="tool-brand">CNAB Portal</Link>

                    {autenticado ? (
                        <a href="https://whallet.com.br/fluxo-caixa" className="tool-cta-app">
                            <LuLayoutDashboard size={13}/>
                            <span className="tool-cta-app-text">Meu Whallet</span>
                        </a>
                    ) : (
                        <Link to="/login" className="tool-login">Entrar</Link>
                    )}
                </div>
            </header>

            {/* ── Hero (título + ícone) ───────────────────────────── */}
            <section className="tool-hero">
                <div className={`tool-hero-icon tool-hero-icon--${iconColor}`}>
                    {icon}
                </div>
                <div>
                    <h1 className="tool-hero-title">{title}</h1>
                    <p className="tool-hero-subtitle">{subtitle}</p>
                </div>
            </section>

            {/* ── Toolbar opcional (ex: tabs Excel/PDF) ───────────── */}
            {toolbar && (
                <div className="tool-toolbar">{toolbar}</div>
            )}

            {/* ── Body principal (2 col se houver rightAside) ──── */}
            <main className={`tool-main ${rightAside ? "tool-main--with-aside" : ""}`}>
                <div className="tool-main-content">
                    {children}
                </div>
                {rightAside && (
                    <aside className="tool-main-aside">
                        {rightAside}
                    </aside>
                )}
            </main>

            {/* ── Footer com garantias ────────────────────────────── */}
            <footer className="tool-footer">
                <div className="tool-footer-inner">
                    <span className="tool-footer-item">
                        <LuShield size={12}/>
                        {autenticado
                            ? "Você está logado"
                            : "Sem cadastro pra começar"}
                    </span>
                    <span className="tool-footer-item">
                        <LuCircleCheck size={12}/>
                        Arquivos não são salvos no servidor
                    </span>
                    <span className="tool-footer-spacer"/>
                    <a href="https://whallet.com.br/privacidade" className="tool-footer-link">Privacidade</a>
                    <a href="https://whallet.com.br/termos"      className="tool-footer-link">Termos</a>
                    <a href="mailto:usewhallet@gmail.com"        className="tool-footer-link">Contato</a>
                </div>
            </footer>

            <style>{TOOL_LAYOUT_CSS}</style>
        </div>
    );
}

const TOOL_LAYOUT_CSS = `
.tool-layout {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
}

/* ── Header ──────────────────────────────────────────────────────────── */

.tool-header {
    background: var(--bg);
    border-bottom: 1px solid var(--hair);
    flex-shrink: 0;
    padding-top: env(safe-area-inset-top);
}

.tool-header-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.tool-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: -0.005em;
    transition: all 0.12s;
}

.tool-back:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

/* Espaçador invisível pra manter alinhamento quando não há Voltar */
.tool-back-spacer {
    /* Mesma largura aproximada do botão "Voltar" */
    display: inline-block;
    min-width: 0;
}

.tool-brand {
    margin: 0 auto;
    font-family: var(--ff-sans);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--navy-deep);
    text-decoration: none;
    transition: opacity 0.12s;
}

.tool-brand:hover {
    opacity: 0.7;
}

.tool-login {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--navy-deep);
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    letter-spacing: -0.005em;
    transition: all 0.12s;
}

.tool-login:hover {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

/* CTA "Meu Whallet" - usuário logado */
.tool-cta-app {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    letter-spacing: -0.005em;
    transition: all 0.12s;
}

.tool-cta-app:hover {
    background: var(--cyan-dark);
    border-color: var(--cyan-dark);
    color: white;
}

/* ── Hero ────────────────────────────────────────────────────────────── */

.tool-hero {
    max-width: 1180px;
    margin: 0 auto;
    padding: 36px 24px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
}

.tool-hero-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.tool-hero-icon--excel {
    background: var(--success-bg);
    color: var(--success);
}

.tool-hero-icon--pdf {
    background: var(--error-bg);
    color: var(--error);
}

.tool-hero-title {
    margin: 0 0 4px;
    font-family: var(--ff-sans);
    font-size: 26px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.025em;
    line-height: 1.15;
}

.tool-hero-subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.5;
    letter-spacing: -0.005em;
}

/* ── Toolbar (opcional - tabs) ───────────────────────────────────────── */

.tool-toolbar {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px 16px;
    width: 100%;
    box-sizing: border-box;
}

/* ── Main ────────────────────────────────────────────────────────────── */

.tool-main {
    max-width: 1180px;
    width: 100%;
    margin: 0 auto;
    padding: 0 24px 48px;
    box-sizing: border-box;
    flex: 1;
}

.tool-main--with-aside {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
}

.tool-main-aside {
    position: sticky;
    top: 24px;
}

/* ── Footer ──────────────────────────────────────────────────────────── */

.tool-footer {
    background: var(--surface);
    border-top: 1px solid var(--hair);
    padding: 20px 0;
    flex-shrink: 0;
}

.tool-footer-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
}

.tool-footer-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--text-dim);
    letter-spacing: -0.005em;
}

.tool-footer-item svg {
    color: var(--success);
    flex-shrink: 0;
}

.tool-footer-link {
    color: var(--cyan-dark);
    text-decoration: none;
    font-weight: 600;
}

.tool-footer-link:hover {
    text-decoration: underline;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 900px) {
    .tool-main--with-aside {
        grid-template-columns: 1fr;
    }

    .tool-main-aside {
        position: static;
    }
}

@media (max-width: 600px) {
    .tool-header-inner {
        padding: 12px 16px;
        gap: 10px;
    }

    .tool-hero {
        padding: 24px 16px 16px;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
    }

    .tool-hero-title {
        font-size: 22px;
    }

    .tool-toolbar,
    .tool-main {
        padding-left: 16px;
        padding-right: 16px;
    }

    .tool-footer-inner {
        padding: 0 16px;
        gap: 12px;
    }

    /* Em mobile, esconde o texto "Meu Whallet" — deixa só o ícone */
    .tool-cta-app-text {
        display: none;
    }
}
`;
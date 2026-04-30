import { Link, useNavigate } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

/**
 * LegalLayout — Layout compartilhado de páginas legais
 * Sprint A3.7.1 · Privacidade, Termos, Contato
 *
 * Características:
 *  - FORA do AppLayout (público)
 *  - Header simples: voltar (smart back) + brand + login (se anônimo)
 *  - Container max-width 720px (otimizado pra leitura longa)
 *  - Footer minimalista
 *  - Tipografia Geist + Instrument Serif pros títulos
 *
 * Props:
 *  title       — título principal (h1)
 *  kicker      — texto pequeno mono em cima do h1 (opcional)
 *  ultimaAt    — data da última atualização (opcional, formato "DD de MMM, YYYY")
 *  children    — conteúdo da página
 */
export default function LegalLayout({ title, kicker, ultimaAt, children }) {
    const navigate = useNavigate();

    return (
        <div className="legal-layout">

            {/* ── Header ──────────────────────────────────────────────── */}
            <header className="legal-header">
                <div className="legal-header-inner">
                    <button
                        className="legal-back"
                        onClick={() => navigate(-1)}
                    >
                        <LuArrowLeft size={14}/>
                        Voltar
                    </button>

                    <Link to="/" className="legal-brand">whallet.</Link>

                    <div className="legal-header-right">
                        <Link to="/login" className="legal-login">Entrar</Link>
                    </div>
                </div>
            </header>

            {/* ── Conteúdo ───────────────────────────────────────────── */}
            <main className="legal-main">
                <div className="legal-container">

                    {/* Cabeçalho do documento */}
                    <div className="legal-doc-head">
                        {kicker && (
                            <div className="legal-kicker">{kicker}</div>
                        )}
                        <h1 className="legal-title">{title}</h1>
                        {ultimaAt && (
                            <div className="legal-ultima-at">
                                Última atualização: {ultimaAt}
                            </div>
                        )}
                    </div>

                    {/* Conteúdo da página */}
                    <div className="legal-content">
                        {children}
                    </div>
                </div>
            </main>

            {/* ── Footer minimalista ─────────────────────────────────── */}
            <footer className="legal-footer">
                <div className="legal-footer-inner">
                    <div className="legal-footer-brand">
                        <span className="legal-footer-logo">whallet.</span>
                        <span>© 2026 · Operado como pessoa física</span>
                    </div>
                    <nav className="legal-footer-nav">
                        <Link to="/privacidade" className="legal-footer-link">Privacidade</Link>
                        <Link to="/termos"      className="legal-footer-link">Termos</Link>
                        <Link to="/contato"     className="legal-footer-link">Contato</Link>
                    </nav>
                </div>
            </footer>

            <style>{LEGAL_LAYOUT_CSS}</style>
        </div>
    );
}

const LEGAL_LAYOUT_CSS = `
.legal-layout {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    flex-direction: column;
}

/* ── Header ──────────────────────────────────────────────────────────── */

.legal-header {
    background: var(--surface);
    border-bottom: 1px solid var(--hair);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
}

.legal-header-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.legal-back {
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

.legal-back:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.legal-brand {
    margin: 0 auto;
    font-family: var(--ff-sans);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--navy-deep);
    text-decoration: none;
    transition: opacity 0.12s;
}

.legal-brand:hover {
    opacity: 0.7;
}

.legal-header-right {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.legal-login {
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

.legal-login:hover {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

/* ── Main ────────────────────────────────────────────────────────────── */

.legal-main {
    flex: 1;
    padding: 48px 24px 64px;
    width: 100%;
    box-sizing: border-box;
}

.legal-container {
    max-width: 720px;
    margin: 0 auto;
}

/* ── Cabeçalho do documento ──────────────────────────────────────────── */

.legal-doc-head {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--hair);
}

.legal-kicker {
    font-family: var(--ff-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--cyan-dark);
    margin-bottom: 12px;
}

.legal-title {
    margin: 0 0 12px;
    font-family: var(--ff-sans);
    font-size: 38px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.03em;
    line-height: 1.1;
}

.legal-ultima-at {
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
}

/* ── Conteúdo (estilo prose pra leitura longa) ──────────────────────── */

.legal-content {
    font-family: var(--ff-sans);
    font-size: 15px;
    line-height: 1.75;
    color: var(--ink-2);
    letter-spacing: -0.005em;
}

.legal-content h2 {
    margin: 40px 0 12px;
    font-size: 22px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.02em;
    line-height: 1.25;
    scroll-margin-top: 80px;
}

.legal-content h2:first-child {
    margin-top: 0;
}

.legal-content h3 {
    margin: 24px 0 8px;
    font-size: 17px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.015em;
    line-height: 1.3;
}

.legal-content p {
    margin: 0 0 14px;
}

.legal-content strong {
    color: var(--navy-deep);
    font-weight: 600;
}

.legal-content a {
    color: var(--cyan-dark);
    text-decoration: underline;
    text-decoration-color: rgba(8, 145, 168, 0.3);
    text-underline-offset: 3px;
    transition: text-decoration-color 0.12s;
}

.legal-content a:hover {
    text-decoration-color: var(--cyan-dark);
}

.legal-content ul, .legal-content ol {
    margin: 0 0 14px;
    padding-left: 24px;
}

.legal-content li {
    margin-bottom: 6px;
}

.legal-content li::marker {
    color: var(--text-dim);
}

.legal-content code {
    font-family: var(--ff-mono);
    font-size: 13px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--bg);
    border: 1px solid var(--hair);
    color: var(--cyan-dark);
}

.legal-content blockquote {
    margin: 18px 0;
    padding: 12px 18px;
    border-left: 3px solid var(--cyan);
    background: var(--cyan-soft);
    color: var(--ink-2);
    font-size: 14px;
    border-radius: 0 8px 8px 0;
}

.legal-content blockquote p:last-child {
    margin-bottom: 0;
}

.legal-content hr {
    border: none;
    border-top: 1px solid var(--hair);
    margin: 32px 0;
}

/* Caixa de destaque (info/warning/etc) */
.legal-callout {
    margin: 18px 0;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid var(--hair);
    background: var(--bg);
    font-size: 14px;
    line-height: 1.6;
}

.legal-callout--info {
    background: var(--cyan-soft);
    border-color: rgba(21, 195, 221, 0.2);
}

.legal-callout--warning {
    background: var(--warning-bg);
    border-color: rgba(230, 162, 60, 0.25);
}

.legal-callout-title {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 6px;
}

.legal-callout--info .legal-callout-title {
    color: var(--cyan-dark);
}

.legal-callout--warning .legal-callout-title {
    color: var(--warning);
}

/* ── Footer ──────────────────────────────────────────────────────────── */

.legal-footer {
    background: var(--surface);
    border-top: 1px solid var(--hair);
    padding: 24px 0;
    flex-shrink: 0;
}

.legal-footer-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
}

.legal-footer-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--text-dim);
    letter-spacing: -0.005em;
}

.legal-footer-logo {
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.025em;
}

.legal-footer-nav {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
}

.legal-footer-link {
    font-size: 12px;
    color: var(--text-muted);
    text-decoration: none;
    letter-spacing: -0.005em;
    transition: color 0.12s;
}

.legal-footer-link:hover {
    color: var(--navy-deep);
    text-decoration: underline;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 700px) {
    .legal-main {
        padding: 32px 20px 48px;
    }

    .legal-title {
        font-size: 30px;
    }

    .legal-content {
        font-size: 14px;
    }

    .legal-content h2 {
        font-size: 20px;
        margin-top: 32px;
    }

    .legal-footer-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
    }
}
`;
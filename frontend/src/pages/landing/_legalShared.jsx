import { LuMail, LuArrowRight } from "react-icons/lu";

/**
 * Componentes compartilhados entre as páginas legais
 * Sprint A3.7.1 · Privacidade, Termos, Contato
 */

/* ─── Section — seção numerada do documento legal ────────────────────── */

/**
 * Wrapper semântico pra seções numeradas com âncora
 *
 * Uso:
 *   <Section id="dados-coletados" numero="2" titulo="Dados que coletamos">
 *     <p>...</p>
 *   </Section>
 *
 * Gera <h2> com âncora + scroll suave + numeração visual mono
 */
export function Section({ id, numero, titulo, children }) {
    return (
        <section id={id} className="ls-section">
            <h2 className="ls-section-title">
                {numero && <span className="ls-section-num">{numero}.</span>}
                <span>{titulo}</span>
            </h2>
            <div className="ls-section-body">
                {children}
            </div>

            <style>{SECTION_CSS}</style>
        </section>
    );
}

const SECTION_CSS = `
.ls-section {
    margin-bottom: 36px;
    scroll-margin-top: 80px;
}

.ls-section-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 14px;
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.02em;
    line-height: 1.25;
}

.ls-section-num {
    font-family: var(--ff-mono);
    font-size: 14px;
    font-weight: 600;
    color: var(--cyan-dark);
    letter-spacing: 0;
    flex-shrink: 0;
}

.ls-section-body {
    /* Estilos de prose herdam de .legal-content */
}

@media (max-width: 700px) {
    .ls-section-title {
        font-size: 20px;
    }
    .ls-section-num {
        font-size: 13px;
    }
}
`;

/* ─── ContactBlock — bloco "fale conosco" reutilizável ──────────────── */

/**
 * Bloco visual padronizado mostrando email de contato
 *
 * Uso:
 *   <ContactBlock />                                 — usa email padrão
 *   <ContactBlock label="DPO" />                     — com label customizado
 *   <ContactBlock email="dpo@whallet.com.br" />      — sobrescreve email
 */
export function ContactBlock({
                                 label = "Email de contato",
                                 email = "usewhallet@gmail.com",
                                 descricao,
                             }) {
    return (
        <div className="ls-contact">
            <div className="ls-contact-icon">
                <LuMail size={16}/>
            </div>
            <div className="ls-contact-info">
                <div className="ls-contact-label">{label}</div>
                <a href={`mailto:${email}`} className="ls-contact-email">
                    {email}
                </a>
                {descricao && (
                    <div className="ls-contact-desc">{descricao}</div>
                )}
            </div>

            <style>{CONTACT_CSS}</style>
        </div>
    );
}

const CONTACT_CSS = `
.ls-contact {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.18);
    margin: 18px 0;
}

.ls-contact-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cyan-dark);
    flex-shrink: 0;
    border: 1px solid rgba(21, 195, 221, 0.18);
}

.ls-contact-info {
    flex: 1;
    min-width: 0;
}

.ls-contact-label {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cyan-dark);
    margin-bottom: 4px;
}

.ls-contact-email {
    display: inline-block;
    font-family: var(--ff-sans);
    font-size: 16px;
    font-weight: 600;
    color: var(--navy-deep);
    text-decoration: none;
    letter-spacing: -0.01em;
    transition: color 0.12s;
    word-break: break-all;
}

.ls-contact-email:hover {
    color: var(--cyan-dark);
    text-decoration: underline;
}

.ls-contact-desc {
    margin-top: 6px;
    font-size: 13px;
    color: var(--text-muted);
    letter-spacing: -0.005em;
    line-height: 1.5;
}
`;

/* ─── BackToHome — link "voltar pra home" estilizado ─────────────────── */

export function BackToHome() {
    return (
        <div className="ls-back-home">
            <a href="/" className="ls-back-home-link">
                Voltar pra home
                <LuArrowRight size={14}/>
            </a>

            <style>{BACK_HOME_CSS}</style>
        </div>
    );
}

const BACK_HOME_CSS = `
.ls-back-home {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--hair);
    text-align: center;
}

.ls-back-home-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--cyan-dark);
    text-decoration: none;
    letter-spacing: -0.005em;
    transition: gap 0.15s;
}

.ls-back-home-link:hover {
    gap: 10px;
    text-decoration: underline;
}
`;
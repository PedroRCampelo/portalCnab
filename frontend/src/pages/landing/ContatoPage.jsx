import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
    LuMail, LuClock, LuShield, LuMessageCircleQuestion,
    LuCircleHelp, LuArrowRight,
} from "react-icons/lu";
import LegalLayout from "./_LegalLayout.jsx";
import { ContactBlock, BackToHome } from "./_legalShared.jsx";

/**
 * ContatoPage — Canal de contato
 * Sprint A3.7.1 · Email-only (sem form, sem WhatsApp)
 *
 * Estratégia:
 *  - Email único: usewhallet@gmail.com
 *  - SLA de resposta: até 1 dia útil
 *  - Mostra cards "antes de escrever" (FAQ, suporte por categoria)
 *  - Sem form pra evitar dependência de backend
 */
export default function ContatoPage() {
    useEffect(() => {
        document.title = "Contato · Whallet";
        document.querySelector('meta[name="description"]')?.setAttribute(
            "content",
            "Entre em contato com a equipe Whallet. Suporte, dúvidas comerciais e questões legais por e-mail."
        );
    }, []);

    return (
        <LegalLayout
            kicker="Fale com a gente"
            title="Contato"
        >
            <p>
                Estamos aqui pra ajudar! Entre em contato pelo e-mail abaixo e respondemos
                o mais rápido possível.
            </p>

            {/* ── Bloco de contato principal ─────────────────────────── */}
            <ContactBlock
                label="Email principal"
                email="usewhallet@gmail.com"
                descricao="Resposta em até 1 dia útil. Para questões urgentes de cobrança ou pagamento, mencione 'urgente' no assunto."
            />

            {/* ── Antes de escrever — categorias de ajuda ───────────── */}
            <div className="cont-categorias">
                <h2 style={{ marginTop: 0 }}>Antes de escrever, dá uma olhada:</h2>

                <div className="cont-cards">
                    <div className="cont-card">
                        <div className="cont-card-icon cont-card-icon--info">
                            <LuMessageCircleQuestion size={18}/>
                        </div>
                        <div className="cont-card-content">
                            <h3 className="cont-card-title">Dúvidas sobre o Whallet</h3>
                            <p className="cont-card-desc">
                                Como usar uma feature, planos disponíveis, requisitos técnicos,
                                integração com bancos.
                            </p>
                            <a href="mailto:usewhallet@gmail.com?subject=Dúvida%20sobre%20o%20Whallet" className="cont-card-link">
                                Enviar dúvida
                                <LuArrowRight size={13}/>
                            </a>
                        </div>
                    </div>

                    <div className="cont-card">
                        <div className="cont-card-icon cont-card-icon--success">
                            <LuShield size={18}/>
                        </div>
                        <div className="cont-card-content">
                            <h3 className="cont-card-title">Privacidade e dados</h3>
                            <p className="cont-card-desc">
                                Solicitações LGPD: acesso, correção, exclusão ou portabilidade
                                dos seus dados pessoais.
                            </p>
                            <a href="mailto:usewhallet@gmail.com?subject=LGPD%20-%20Solicitação" className="cont-card-link">
                                Solicitação LGPD
                                <LuArrowRight size={13}/>
                            </a>
                        </div>
                    </div>

                    <div className="cont-card">
                        <div className="cont-card-icon cont-card-icon--warning">
                            <LuCircleHelp size={18}/>
                        </div>
                        <div className="cont-card-content">
                            <h3 className="cont-card-title">Problemas técnicos</h3>
                            <p className="cont-card-desc">
                                Bugs, dificuldade de cadastro ou login, ou outros
                                problemas técnicos.
                            </p>
                            <a href="mailto:usewhallet@gmail.com?subject=Problema%20técnico" className="cont-card-link">
                                Reportar bug
                                <LuArrowRight size={13}/>
                            </a>
                        </div>
                    </div>

                    <div className="cont-card">
                        <div className="cont-card-icon cont-card-icon--cyan">
                            <LuMail size={18}/>
                        </div>
                        <div className="cont-card-content">
                            <h3 className="cont-card-title">Comercial / Parcerias</h3>
                            <p className="cont-card-desc">
                                Propostas de parceria, demonstrações para empresas,
                                imprensa ou licenciamento.
                            </p>
                            <a href="mailto:usewhallet@gmail.com?subject=Comercial%20-%20Whallet" className="cont-card-link">
                                Falar com comercial
                                <LuArrowRight size={13}/>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SLA / Expectativa ──────────────────────────────────── */}
            <div className="cont-sla">
                <div className="cont-sla-item">
                    <LuClock size={16}/>
                    <div>
                        <div className="cont-sla-label">Tempo de resposta</div>
                        <div className="cont-sla-value">Até 1 dia útil</div>
                    </div>
                </div>
                <div className="cont-sla-item">
                    <LuMail size={16}/>
                    <div>
                        <div className="cont-sla-label">Atendimento</div>
                        <div className="cont-sla-value">Segunda a sexta, 9h às 18h (BRT)</div>
                    </div>
                </div>
                <div className="cont-sla-item">
                    <LuShield size={16}/>
                    <div>
                        <div className="cont-sla-label">Idiomas</div>
                        <div className="cont-sla-value">Português (BR) · English on request</div>
                    </div>
                </div>
            </div>

            {/* ── Outras formas ──────────────────────────────────────── */}
            <h2>Outras formas de obter ajuda</h2>
            <ul>
                <li>
                    Consulte a <Link to="/privacidade">Política de Privacidade</Link> e
                    os <Link to="/termos">Termos de Uso</Link> antes de questões legais
                </li>
                <li>
                    Veja os <Link to="/planos">planos disponíveis</Link> e o que cada um inclui
                </li>
            </ul>

            <BackToHome/>

            <style>{COMPONENT_CSS}</style>
        </LegalLayout>
    );
}

const COMPONENT_CSS = `
.cont-categorias {
    margin: 32px 0;
}

.cont-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
    margin: 16px 0;
}

.cont-card {
    display: flex;
    gap: 12px;
    padding: 18px;
    border-radius: 12px;
    border: 1px solid var(--hair);
    background: var(--surface);
    transition: border-color 0.15s;
}

.cont-card:hover {
    border-color: var(--text-dim);
}

.cont-card-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cont-card-icon--info {
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.cont-card-icon--success {
    background: var(--success-bg);
    color: var(--success);
}

.cont-card-icon--warning {
    background: var(--warning-bg);
    color: var(--warning);
}

.cont-card-icon--cyan {
    background: rgba(11, 30, 54, 0.06);
    color: var(--navy-deep);
}

.cont-card-content {
    flex: 1;
    min-width: 0;
}

.cont-card-title {
    margin: 0 0 4px;
    font-family: var(--ff-sans);
    font-size: 14px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.01em;
}

.cont-card-desc {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.55;
    letter-spacing: -0.005em;
}

.cont-card-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--ff-sans);
    font-size: 12px;
    font-weight: 600;
    color: var(--cyan-dark);
    text-decoration: none;
    letter-spacing: -0.005em;
    transition: gap 0.15s;
}

.cont-card-link:hover {
    gap: 7px;
    text-decoration: underline;
}

/* ── SLA ─────────────────────────────────────────────────────────────── */

.cont-sla {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    padding: 18px;
    border-radius: 12px;
    background: var(--bg);
    border: 1px solid var(--hair);
    margin: 24px 0;
}

.cont-sla-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.cont-sla-item svg {
    color: var(--cyan-dark);
    flex-shrink: 0;
    margin-top: 2px;
}

.cont-sla-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 2px;
}

.cont-sla-value {
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}
`;
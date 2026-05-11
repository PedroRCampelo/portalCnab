import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./HomePage.css";

/* ── Screenshots do app real ── */
import screenshotFluxo       from "../../assets/screenshots/fluxo-caixa.png";
import screenshotRecebimentos from "../../assets/screenshots/recebimentos.png";
import screenshotRelatorios   from "../../assets/screenshots/relatorios.png";
import screenshotElvis        from "../../assets/screenshots/elvis.png";

/**
 * HomePage — Landing pública do Whallet
 * Sprint 2.2 · Hero com mockup + Features com screenshots reais
 *
 * Posicionamento: "O dinheiro do seu negócio merece mais que uma planilha"
 * Público: autônomo / MEI / pequena empresa
 */
export default function HomePage() {
    const navigate = useNavigate();

    const [logado, setLogado] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        try {
            const auth = localStorage.getItem("auth");
            setLogado(!!auth);
        } catch {
            setLogado(false);
        }
    }, []);

    useEffect(() => {
        function onScroll() {
            setScrolled(window.scrollY > 24);
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    function irParaLogin()    { navigate("/login"); }
    function irParaCadastro() { navigate("/cadastro"); }
    function irParaPlanos()   { navigate("/planos"); }
    function irParaApp()      { navigate("/fluxo-caixa"); }

    return (
        <div className="lp">

            {/* ── Navbar pública (fixa) ──────────────────────────────── */}
            <header className={`lp-nav ${scrolled ? "scrolled" : ""}`}>
                <div className="lp-container lp-nav-inner">
                    <button className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        whallet<span className="dot"/>
                    </button>

                    <nav className="lp-nav-links">
                        <button className="lp-nav-link" onClick={() => scrollTo("recursos")}>Recursos</button>
                        <button className="lp-nav-link" onClick={() => scrollTo("para-quem")}>Pra quem</button>
                        <button className="lp-nav-link" onClick={irParaPlanos}>Preços</button>
                        {logado ? (
                            <button className="lp-nav-cta" onClick={irParaApp}>
                                Acessar app →
                            </button>
                        ) : (
                            <>
                                <button className="lp-nav-link always-show" onClick={irParaLogin}>Entrar</button>
                                <button className="lp-nav-cta" onClick={irParaCadastro}>
                                    Comece grátis
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* ═════════════════════════════════════════════════════════════════
                HERO — copy + mockup do app ao lado
                ═════════════════════════════════════════════════════════════════ */}
            <section className="lp-hero">
                <div className="lp-container">
                    <div className="lp-hero-grid">

                        {/* ── Coluna esquerda: copy ── */}
                        <div className="lp-hero-content">
                            <div className="lp-hero-kicker">
                                Comece grátis · 7 dias de Whallet+
                            </div>

                            <h1 className="lp-hero-title">
                                O dinheiro do seu negócio<br/>
                                merece mais que uma <em>planilha.</em>
                            </h1>

                            <p className="lp-hero-sub">
                                Pra quem trabalha por conta própria e quer saber, todo dia,
                                se está ganhando ou perdendo dinheiro. Sem planilha,
                                sem complicação.
                            </p>

                            <div className="lp-hero-ctas">
                                <button className="lp-cta-primary" onClick={irParaCadastro}>
                                    Comece grátis
                                    <span className="arrow">→</span>
                                </button>
                                <button className="lp-cta-secondary" onClick={() => scrollTo("recursos")}>
                                    Ver como funciona
                                </button>
                            </div>

                            <div className="lp-hero-meta">
                                Sem cartão de crédito · Cancele quando quiser
                            </div>
                        </div>

                        {/* ── Coluna direita: mockup app ── */}
                        <div className="lp-hero-mockup">

                            {/* Card flutuante decorativo */}
                            <div className="lp-hero-mock-float">
                                <div className="lp-hero-mock-float-icon">+</div>
                                <div className="lp-hero-mock-float-text">
                                    <small>Recebido agora</small>
                                    R$ 2.500,00
                                </div>
                            </div>

                            <div className="lp-hero-frame">

                                {/* Barra estilo "browser" */}
                                <div className="lp-hero-frame-bar">
                                    <div className="lp-hero-frame-dots">
                                        <span className="lp-hero-frame-dot"/>
                                        <span className="lp-hero-frame-dot"/>
                                        <span className="lp-hero-frame-dot"/>
                                    </div>
                                    <div className="lp-hero-frame-url">whallet.com.br/fluxo-caixa</div>
                                    <div className="lp-hero-frame-live">
                                        <span className="lp-hero-frame-live-dot"/>
                                        ao vivo
                                    </div>
                                </div>

                                {/* Conteúdo do mockup */}
                                <div className="lp-hero-frame-content">

                                    <div className="lp-hero-mock-head">
                                        <div>
                                            <div className="lp-hero-mock-icon">Saúde do mês</div>
                                            <h3 className="lp-hero-mock-title">Fluxo de Caixa</h3>
                                        </div>
                                        <div className="lp-hero-mock-tabs">
                                            <span className="lp-hero-mock-tab active">Saúde do mês</span>
                                            <span className="lp-hero-mock-tab">Contas</span>
                                            <span className="lp-hero-mock-tab">Extrato</span>
                                        </div>
                                    </div>

                                    <div className="lp-hero-mock-kpis">
                                        <div className="lp-hero-mock-kpi">
                                            <div className="lp-hero-mock-kpi-label">Saldo atual</div>
                                            <div className="lp-hero-mock-kpi-value">R$ 28.538</div>
                                            <div className="lp-hero-mock-kpi-trend">3 contas</div>
                                        </div>
                                        <div className="lp-hero-mock-kpi">
                                            <div className="lp-hero-mock-kpi-label">A receber</div>
                                            <div className="lp-hero-mock-kpi-value up">R$ 12.100</div>
                                            <div className="lp-hero-mock-kpi-trend">Em dia</div>
                                        </div>
                                        <div className="lp-hero-mock-kpi">
                                            <div className="lp-hero-mock-kpi-label">A pagar</div>
                                            <div className="lp-hero-mock-kpi-value down">R$ 2.130</div>
                                            <div className="lp-hero-mock-kpi-trend">2 atrasados</div>
                                        </div>
                                        <div className="lp-hero-mock-kpi featured">
                                            <div className="lp-hero-mock-kpi-label">Sobra projetada</div>
                                            <div className="lp-hero-mock-kpi-value featured">R$ 38.507</div>
                                            <div className="lp-hero-mock-kpi-trend">Mês positivo 🎉</div>
                                        </div>
                                    </div>

                                    <div className="lp-hero-mock-chart">
                                        <div className="lp-hero-mock-chart-head">
                                            <span className="lp-hero-mock-chart-label">Termômetro MEI 2026</span>
                                            <span className="lp-hero-mock-chart-period">34% do limite</span>
                                        </div>
                                        <div className="lp-hero-mock-thermometer">
                                            <div className="lp-hero-mock-thermometer-fill" style={{ width: "34%" }} />
                                        </div>
                                        <div className="lp-hero-mock-thermometer-meta">
                                            <span>R$ 27.600 faturado</span>
                                            <span>R$ 81.000 limite</span>
                                        </div>
                                    </div>

                                    <div className="lp-hero-mock-status">
                                        <div className="lp-hero-mock-status-icon">🎉</div>
                                        <div className="lp-hero-mock-status-text">
                                            <div className="lp-hero-mock-status-label">Situação do mês</div>
                                            <div className="lp-hero-mock-status-msg">
                                                Você termina o mês positivo, com sobra de <strong>R$ 38.507,60</strong>.
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── PROBLEMA (seção dark) ──────────────────────────────── */}
            <section className="lp-section lp-section--dark">
                <div className="lp-container">
                    <div className="lp-section-head">
                        <div>
                            <div className="lp-section-eyebrow">O Problema</div>
                            <h2 className="lp-section-title">
                                Você trabalha duro.<br/>
                                Mas não sabe se <em>valeu a pena.</em>
                            </h2>
                        </div>
                        <p className="lp-section-desc">
                            Quem trabalha por conta própria conhece bem essa sensação.
                            Tem dinheiro entrando, tem boleto saindo, mas o resultado real
                            do mês é um mistério.
                        </p>
                    </div>

                    <div className="lp-pain-list">
                        <div className="lp-pain-item">
                            <div className="lp-pain-num">01 / Caos</div>
                            <p className="lp-pain-text">
                                Recibos espalhados<br/>no WhatsApp.
                            </p>
                        </div>
                        <div className="lp-pain-item">
                            <div className="lp-pain-num">02 / Esquecimento</div>
                            <p className="lp-pain-text">
                                Boletos que ninguém<br/>lembra de pagar.
                            </p>
                        </div>
                        <div className="lp-pain-item">
                            <div className="lp-pain-num">03 / Incerteza</div>
                            <p className="lp-pain-text">
                                "Quanto eu ganhei<br/>esse mês?" Sem resposta.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════════════════════════
                FEATURES — Screenshots reais do app
                ═════════════════════════════════════════════════════════════════ */}
            <section className="lp-section" id="recursos">
                <div className="lp-container">
                    <div className="lp-section-head">
                        <div>
                            <div className="lp-section-eyebrow">O App</div>
                            <h2 className="lp-section-title">
                                Tudo num lugar só.<br/>
                                Sem complicação, <em>de verdade.</em>
                            </h2>
                        </div>
                        <p className="lp-section-desc">
                            Não é mais uma planilha bonita. É um sistema que te mostra,
                            em segundos, a saúde financeira do seu negócio.
                        </p>
                    </div>

                    <div className="lp-features">

                        {/* Feature 1 — Fluxo de Caixa */}
                        <div className="lp-feature">
                            <div className="lp-feature-text">
                                <div className="lp-feature-num">01 / Saúde do mês</div>
                                <h3 className="lp-feature-title">
                                    Saiba quanto tem,<br/>quanto entra e <em>quanto sai.</em>
                                </h3>
                                <p className="lp-feature-desc">
                                    Saldo de todas as contas, recebimentos previstos, contas a pagar
                                    e sobra projetada — tudo atualizado em tempo real. Sem precisar
                                    abrir planilha ou conferir app de banco.
                                </p>
                                <ul className="lp-feature-bullets">
                                    <li>Saldo consolidado de múltiplas contas</li>
                                    <li>Termômetro do limite MEI (R$ 81 mil/ano)</li>
                                    <li>Projeção automática da sobra do mês</li>
                                </ul>
                            </div>
                            <div className="lp-feature-screenshot">
                                <img src={screenshotFluxo} alt="Tela de Fluxo de Caixa do Whallet mostrando saldo, recebimentos e contas a pagar" loading="lazy" />
                            </div>
                        </div>

                        {/* Feature 2 — Recebimentos */}
                        <div className="lp-feature lp-feature--reverse">
                            <div className="lp-feature-text">
                                <div className="lp-feature-num">02 / Recebimentos</div>
                                <h3 className="lp-feature-title">
                                    Nunca mais perca<br/>um pagamento <em>de vista.</em>
                                </h3>
                                <p className="lp-feature-desc">
                                    Cadastre o que cada cliente te deve e quando vence. O Whallet
                                    te avisa antes de atrasar — e manda cobrança automática por
                                    WhatsApp se você quiser.
                                </p>
                                <ul className="lp-feature-bullets">
                                    <li>Filtro rápido: a receber, atrasados, parciais</li>
                                    <li>Cobrança automática via WhatsApp</li>
                                    <li>Relatórios por cliente e aging</li>
                                </ul>
                            </div>
                            <div className="lp-feature-screenshot">
                                <img src={screenshotRecebimentos} alt="Tela de Recebimentos do Whallet com lista de clientes e status" loading="lazy" />
                            </div>
                        </div>

                        {/* Feature 3 — Relatórios */}
                        <div className="lp-feature">
                            <div className="lp-feature-text">
                                <div className="lp-feature-num">03 / Relatórios</div>
                                <h3 className="lp-feature-title">
                                    Relatórios que<br/>seu contador <em>vai amar.</em>
                                </h3>
                                <p className="lp-feature-desc">
                                    10 relatórios prontos — de aging a DRE mensal.
                                    Exporte pra Excel com um clique, mande pro contador
                                    e pronto. Sem formatar tabela no braço.
                                </p>
                                <ul className="lp-feature-bullets">
                                    <li>DRE, fluxo de caixa, saldo por conta</li>
                                    <li>Aging a receber e a pagar</li>
                                    <li>Exportação Excel e PDF em um clique</li>
                                </ul>
                            </div>
                            <div className="lp-feature-screenshot">
                                <img src={screenshotRelatorios} alt="Relatório por tipo de gasto do Whallet com distribuição visual" loading="lazy" />
                            </div>
                        </div>

                        {/* Feature 4 — Elvis (IA) */}
                        <div className="lp-feature lp-feature--reverse">
                            <div className="lp-feature-text">
                                <div className="lp-feature-num">04 / Inteligência Artificial</div>
                                <h3 className="lp-feature-title">
                                    Elvis, o agente de IA<br/>que entende <em>CNAB.</em>
                                </h3>
                                <p className="lp-feature-desc">
                                    Precisa converter um arquivo CNAB pra Excel? Quer entender
                                    um campo de retorno bancário? Pergunta pro Elvis. Ele domina
                                    os layouts dos principais bancos do mercado.
                                </p>
                                <ul className="lp-feature-bullets">
                                    <li>Conversão CNAB 240 e 400 para Excel e PDF</li>
                                    <li>Análise de arquivos de remessa em tempo real</li>
                                    <li>5 perguntas grátis/mês · Ilimitado no Whallet+</li>
                                </ul>
                            </div>
                            <div className="lp-feature-screenshot">
                                <img src={screenshotElvis} alt="Elvis, agente de IA do Whallet respondendo pergunta sobre CNAB" loading="lazy" />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── PRA QUEM É ────────────────────────────────────────── */}
            <section className="lp-section" id="para-quem">
                <div className="lp-container">
                    <div className="lp-section-head">
                        <div>
                            <div className="lp-section-eyebrow">Pra quem é</div>
                            <h2 className="lp-section-title">
                                Feito pra quem<br/>trabalha <em>por conta.</em>
                            </h2>
                        </div>
                        <p className="lp-section-desc">
                            Não é ERP de empresa grande. Não é app de banco.
                            É a primeira ferramenta financeira pensada pra
                            quem é o próprio chefe.
                        </p>
                    </div>

                    <div className="lp-personas">
                        <div className="lp-persona">
                            <div className="lp-persona-tag">Pessoa Física</div>
                            <h3 className="lp-persona-title">Autônomo</h3>
                            <p className="lp-persona-desc">
                                Sem CNPJ, faz boia, presta serviço. Quer parar de
                                misturar dinheiro pessoal com o do trabalho.
                            </p>
                            <ul className="lp-persona-list">
                                <li>Sem complicação fiscal</li>
                                <li>Foco em entradas e saídas</li>
                                <li>Saldo separado do pessoal</li>
                            </ul>
                        </div>

                        <div className="lp-persona">
                            <div className="lp-persona-tag">CNPJ MEI</div>
                            <h3 className="lp-persona-title">MEI</h3>
                            <p className="lp-persona-desc">
                                Já formalizado. Quer controlar limite anual,
                                saber quanto pode faturar sem virar ME.
                            </p>
                            <ul className="lp-persona-list">
                                <li>Termômetro de R$ 81 mil/ano</li>
                                <li>DAS automático</li>
                                <li>Cobrança via WhatsApp</li>
                            </ul>
                        </div>

                        <div className="lp-persona">
                            <div className="lp-persona-tag">CNPJ ME / EPP</div>
                            <h3 className="lp-persona-title">Pequena empresa</h3>
                            <p className="lp-persona-desc">
                                Cresceu, tem time. Precisa de algo mais simples
                                que ERP, mas mais sério que planilha.
                            </p>
                            <ul className="lp-persona-list">
                                <li>Múltiplos usuários</li>
                                <li>Contas a pagar parceladas</li>
                                <li>Relatórios pra o contador</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PREÇO ──────────────────────────────────────────────── */}
            <section className="lp-pricing">
                <div className="lp-container">
                    <div className="lp-pricing-eyebrow">Preço</div>
                    <h2 className="lp-pricing-title">
                        Comece grátis. Quando quiser mais,<br/>
                        Whallet+ por <em>R$ 39,90/mês.</em>
                    </h2>
                    <p className="lp-pricing-desc">
                        Plano Free pra explorar. Whallet+ pra usar de verdade,
                        com 7 dias grátis sem precisar de cartão.
                    </p>
                    <button className="lp-pricing-cta" onClick={irParaPlanos}>
                        Ver detalhes dos planos →
                    </button>
                </div>
            </section>

            {/* ── CTA FINAL ─────────────────────────────────────────── */}
            <section className="lp-cta-final">
                <div className="lp-container lp-cta-final-inner">
                    <div className="lp-cta-final-eyebrow">Comece em 30 segundos</div>
                    <h2 className="lp-cta-final-title">
                        Pronto pra acabar com<br/>o <em>caos?</em>
                    </h2>
                    <button className="lp-cta-final-button" onClick={irParaCadastro}>
                        Comece grátis hoje →
                    </button>
                    <div className="lp-cta-final-meta">
                        7 dias de Whallet+ · Sem cartão · Cancele quando quiser
                    </div>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-container lp-footer-inner">
                    <div className="lp-footer-brand">
                        <span style={{
                            display: "inline-flex", alignItems: "baseline", gap: "3px",
                            fontWeight: 800, fontSize: 18, letterSpacing: "-0.05em",
                            color: "var(--navy-deep)", textTransform: "none",
                        }}>
                            whallet
                            <span style={{
                                width: 6, height: 6, borderRadius: "50%",
                                background: "var(--cyan)",
                            }}/>
                        </span>
                        <span>© 2026 · Whallet Tecnologia</span>
                    </div>
                    <div className="lp-footer-links">
                        <button className="lp-footer-link" onClick={irParaPlanos}>PREÇOS</button>
                        <Link to="/privacidade" className="lp-footer-link">Privacidade</Link>
                        <Link to="/termos"      className="lp-footer-link">Termos</Link>
                        <Link to="/contato"     className="lp-footer-link">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Helper de scroll suave
function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
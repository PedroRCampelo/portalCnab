import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./HomePage.css";

/**
 * HomePage — Landing pública do Whallet
 * Sprint A2 + revisão · Hero com mockup ao lado
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
    function irParaApp()      { navigate("/fluxo-caixa"); }  // FIX: era /dashboard

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
                HERO unificado — copy + mockup do app ao lado
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
                                    R$ 1.500,00
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
                                            <div className="lp-hero-mock-kpi-value">R$ 25.994</div>
                                            <div className="lp-hero-mock-kpi-trend">3 contas conectadas</div>
                                        </div>
                                        <div className="lp-hero-mock-kpi">
                                            <div className="lp-hero-mock-kpi-label">A receber</div>
                                            <div className="lp-hero-mock-kpi-value up">R$ 8.450</div>
                                            <div className="lp-hero-mock-kpi-trend">12 entradas previstas</div>
                                        </div>
                                        <div className="lp-hero-mock-kpi">
                                            <div className="lp-hero-mock-kpi-label">A pagar</div>
                                            <div className="lp-hero-mock-kpi-value down">R$ 7.610</div>
                                            <div className="lp-hero-mock-kpi-trend">8 títulos em aberto</div>
                                        </div>
                                        <div className="lp-hero-mock-kpi featured">
                                            <div className="lp-hero-mock-kpi-label">Sobra projetada</div>
                                            <div className="lp-hero-mock-kpi-value featured">R$ 18.484</div>
                                            <div className="lp-hero-mock-kpi-trend">↑ 12% vs mês passado</div>
                                        </div>
                                    </div>

                                    <div className="lp-hero-mock-chart">
                                        <div className="lp-hero-mock-chart-head">
                                            <span className="lp-hero-mock-chart-label">Próximos 30 dias</span>
                                            <span className="lp-hero-mock-chart-period">↻ atualizado agora</span>
                                        </div>
                                        <div className="lp-hero-mock-chart-bars">
                                            {[42, 68, 55, 75, 60, 82, 70, 50, 92, 78, 65, 80].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className={`lp-hero-mock-chart-bar ${i > 7 ? "muted" : ""}`}
                                                    style={{ height: `${h}%` }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="lp-hero-mock-status">
                                        <div className="lp-hero-mock-status-icon">🎉</div>
                                        <div className="lp-hero-mock-status-text">
                                            <div className="lp-hero-mock-status-label">Situação do mês</div>
                                            <div className="lp-hero-mock-status-msg">
                                                Você termina o mês positivo, com sobra de <strong>R$ 18.484,23</strong>.
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ⚠️ Seção <section className="lp-showcase"> antiga FOI REMOVIDA — fundida no hero */}

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

            {/* ── 3 FEATURES-PILARES ─────────────────────────────────── */}
            <section className="lp-section" id="recursos">
                <div className="lp-container">
                    <div className="lp-section-head">
                        <div>
                            <div className="lp-section-eyebrow">A solução</div>
                            <h2 className="lp-section-title">
                                Três telas. Três respostas. <em>Todo dia.</em>
                            </h2>
                        </div>
                        <p className="lp-section-desc">
                            Whallet não é mais uma planilha. É um sistema feito pra
                            te dar, em segundos, a clareza que você precisa pra
                            tomar decisão.
                        </p>
                    </div>

                    <div className="lp-features">
                        {/* Feature 1 - Recebimentos */}
                        <div className="lp-feature">
                            <div className="lp-feature-text">
                                <div className="lp-feature-num">01 / Veja</div>
                                <h3 className="lp-feature-title">
                                    O que entra<br/>e o que sai.
                                </h3>
                                <p className="lp-feature-desc">
                                    Recebimentos e contas a pagar num único lugar.
                                    Você cadastra uma vez e o Whallet te lembra
                                    no dia certo, sem você precisar olhar planilha.
                                </p>
                            </div>
                            <div className="lp-feature-mock">
                                <div className="lp-mock-list">
                                    <MockRow type="in"  name="Cliente João - Projeto Web" date="HOJE · PIX"           value="+R$ 1.500" />
                                    <MockRow type="out" name="Aluguel sala comercial"     date="03/10 · BOLETO"        value="-R$ 850" />
                                    <MockRow type="in"  name="Maria - Consultoria"        date="05/10 · TRANSFERÊNCIA" value="+R$ 2.200" />
                                    <MockRow type="pending" name="DAS · Outubro"          date="VENCE EM 8 DIAS"       value="-R$ 80,90" />
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 - Saldos */}
                        <div className="lp-feature lp-feature--reverse">
                            <div className="lp-feature-text">
                                <div className="lp-feature-num">02 / Saiba</div>
                                <h3 className="lp-feature-title">
                                    Saldo atualizado<br/>em <em>tempo real.</em>
                                </h3>
                                <p className="lp-feature-desc">
                                    Junta as suas contas bancárias num só lugar e mostra
                                    quanto tem agora, somando tudo. Quando entra dinheiro
                                    ou paga boleto, o saldo já reflete.
                                </p>
                            </div>
                            <div className="lp-feature-mock">
                                <div className="lp-mock-accounts">
                                    <MockAccount bank="Inter PJ"      name="Conta principal" value="R$ 4.230,15" />
                                    <MockAccount bank="Nubank"        name="Reserva"         value="R$ 1.800,00" />
                                    <MockAccount bank="Mercado Pago"  name="Vendas online"   value="R$ 642,80" />
                                    <div className="lp-mock-account" style={{
                                        background: "var(--cyan-soft)",
                                        borderColor: "var(--cyan)",
                                    }}>
                                        <div>
                                            <div className="lp-mock-account-bank" style={{ color: "var(--cyan-dark)" }}>
                                                TOTAL · 3 contas
                                            </div>
                                            <div className="lp-mock-account-name">Saldo geral</div>
                                        </div>
                                        <div className="lp-mock-account-value" style={{ color: "var(--cyan-dark)" }}>
                                            R$ 6.672,95
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 - Alerta preditivo */}
                        <div className="lp-feature">
                            <div className="lp-feature-text">
                                <div className="lp-feature-num">03 / Antecipe</div>
                                <h3 className="lp-feature-title">
                                    Saiba antes<br/>que <em>aperte.</em>
                                </h3>
                                <p className="lp-feature-desc">
                                    O Whallet calcula seu fluxo dos próximos 60 dias
                                    e avisa se vai faltar dinheiro. Antes de virar
                                    problema, você já sabe — e pode agir.
                                </p>
                            </div>
                            <div className="lp-feature-mock">
                                <div className="lp-mock-alert">
                                    <div className="lp-mock-alert-head">
                                        <div className="lp-mock-alert-badge">⚠ Alerta</div>
                                        <div className="lp-mock-alert-title">Aperto previsto em 12 dias</div>
                                    </div>
                                    <p className="lp-mock-alert-desc">
                                        Suas saídas projetadas vão exceder o saldo disponível
                                        em <strong>R$ 320</strong> entre 26/10 e 02/11.
                                    </p>
                                    <div className="lp-mock-alert-bar">
                                        <div className="lp-mock-alert-bar-fill"/>
                                    </div>
                                    <div className="lp-mock-alert-meta">
                                        <span>Saldo · R$ 6.672</span>
                                        <span>Saídas · R$ 6.992</span>
                                    </div>
                                </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// Componentes auxiliares dos mockups das features
// ─────────────────────────────────────────────────────────────────────────────

function MockRow({ type, name, date, value }) {
    return (
        <div className="lp-mock-row">
            <div className="lp-mock-row-left">
                <div className={`lp-mock-dot ${type}`}/>
                <div className="lp-mock-row-text">
                    <span className="lp-mock-row-name">{name}</span>
                    <span className="lp-mock-row-date">{date}</span>
                </div>
            </div>
            <span className={`lp-mock-row-value ${type === "in" ? "in" : type === "out" ? "out" : ""}`}>
                {value}
            </span>
        </div>
    );
}

function MockAccount({ bank, name, value }) {
    return (
        <div className="lp-mock-account">
            <div>
                <div className="lp-mock-account-bank">{bank}</div>
                <div className="lp-mock-account-name">{name}</div>
            </div>
            <div className="lp-mock-account-value">{value}</div>
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
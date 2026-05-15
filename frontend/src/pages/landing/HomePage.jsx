import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import "./HomePage.css";

/* Screenshots do app real */
import screenshotFluxo from "../../assets/screenshots/fluxo-caixa.png";
import screenshotReceb from "../../assets/screenshots/recebimentos.png";
import screenshotRelat from "../../assets/screenshots/relatorios.png";
import screenshotElvis from "../../assets/screenshots/elvis.png";
import logo from '../../assets/logos/logo.svg';
import logoIcon from '../../assets/logos/logo-icon.svg';
import heroVisual from '../../assets/lp-hero-visual.webp';
/* ──────────────────────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────────────────────── */
const WA_MESSAGES = [
    { dir: "out", text: "quanto recebi essa semana?", time: "09:41" },
    { dir: "typing" },
    { dir: "in", type: "card", hd: "RECEITA SEMANAL", val: "R$ 14.320,00", meta: "↑ 12% vs. semana passada\n23 títulos liquidados", time: "09:41" },
    { dir: "out", text: "e a sobra de caixa?", time: "09:42" },
    { dir: "typing" },
    { dir: "in", text: "Sua sobra de caixa hoje está em <b>R$ 8.450,00</b>. Isso cobre 18 dias de operação no ritmo atual.", time: "09:42" },
    { dir: "out", type: "voice", time: "09:43" },
    { dir: "typing" },
    { dir: "in", text: "Entendi! Você tem <b>3 títulos</b> vencendo amanhã totalizando <b>R$ 2.100,00</b>. Quer que eu detalhe?", tag: "VENCIMENTOS", time: "09:43" },
    { dir: "out", text: "gera meu relatório mensal", time: "09:44" },
    { dir: "typing" },
    { dir: "in", text: "Pronto! Relatório de <b>Abril 2025</b> gerado. Receita total R$ 58.200 (+8% vs março). Enviei o PDF aqui.", tag: "RELATÓRIO", time: "09:44" },
];

const MARQUEE_ITEMS = [
    "Sem planilha, sem estresse",
    "Gestão financeira por voz",
    "Bot WhatsApp inteligente",
    "IA que entende seu caixa",
    "Setup em 2 minutos",
    "Transcrição de áudio",
    "Alertas de vencimento",
    "Relatórios automáticos",
];

const FEATURES = [
    {
        num: "01",
        title: "Fluxo de Caixa",
        titleEm: "inteligente",
        desc: "Visão completa de entradas, saídas e saldo projetado. Importação CNAB automática com conciliação inteligente.",
        bullets: ["Dashboard visual em tempo real","Importação CNAB 240/400 chars","Categorização automática por IA","Projeção de saldo futuro"],
        img: screenshotFluxo,
        url: "whallet.com.br/app/fluxo",
    },
    {
        num: "02",
        title: "Recebimentos &",
        titleEm: "Títulos",
        desc: "Controle total sobre o que entra. Vencimentos, liquidações e inadimplência numa tela só.",
        bullets: ["Filtros avançados por banco/status","Alerta de vencimentos","Histórico de liquidações","Exportação CSV/PDF"],
        img: screenshotReceb,
        url: "whallet.com.br/app/recebimentos",
    },
    {
        num: "03",
        title: "Relatórios que",
        titleEm: "falam",
        desc: "Anne gera relatórios narrativos. Não é gráfico mudo — é análise que você entende na primeira leitura.",
        bullets: ["Geração com IA (agente Anne)","Comparativo mês a mês","Insights automáticos","Download PDF/XLSX"],
        img: screenshotRelat,
        url: "whallet.com.br/app/relatorios",
    },
    {
        num: "04",
        title: "Elvis — seu",
        titleEm: "consultor IA",
        desc: "Pergunte qualquer coisa sobre CNAB, financeiro, ou seu próprio caixa. Elvis responde com contexto real.",
        bullets: ["RAG sobre base CNAB completa","Entende seu histórico financeiro","Respostas com fontes citadas","100 consultas/mês no Whallet+"],
        img: screenshotElvis,
        url: "whallet.com.br/app/elvis",
    },
];

const STEPS = [
    { n: "1", title: "Crie sua conta", desc: "Cadastro rápido com e-mail ou Google. Sem cartão, sem compromisso." },
    { n: "2", title: "Vincule o WhatsApp", desc: "Código de 6 dígitos no app → bot ativo. Comece a conversar com sua gestão financeira." },
    { n: "3", title: "Gerencie pelo chat", desc: "Envie áudios, pergunte saldos, peça relatórios. Tudo pelo WhatsApp que você já usa." },
];

const PERSONAS = [
    {
        tag: "MEI",
        title: "Microempreendedor",
        desc: "Quem fatura até R$ 81mil/ano e precisa de controle sem burocracia.",
        items: ["Fluxo de caixa simplificado","Bot WhatsApp para consultas rápidas","Relatório mensal automático"],
    },
    {
        tag: "PME",
        title: "Pequena Empresa",
        desc: "Equipes de 2-20 pessoas que lidam com CNAB, bancos e fornecedores todo dia.",
        items: ["Importação CNAB multi-banco","Elvis para dúvidas técnicas","Dashboard consolidado"],
    },
    {
        tag: "CONTADOR",
        title: "Escritório Contábil",
        desc: "Profissionais que gerenciam o financeiro de múltiplos clientes.",
        items: ["Multi-empresa num painel só","Relatórios exportáveis por cliente","Auditoria e rastreabilidade"],
    },
];

const FAQ_DATA = [
    { q: "Como funciona o Bot WhatsApp?", a: "Depois de vincular seu número com um código de 6 dígitos, o bot fica disponível 24h. Você envia mensagens de texto ou áudio e ele responde com dados reais do seu caixa — saldos, vencimentos, relatórios." },
    { q: "Preciso instalar algum app?", a: "Não. O Whallet é 100% web. O bot funciona no seu WhatsApp normal — sem apps extras, sem configurações complexas." },
    { q: "Meus dados financeiros estão seguros?", a: "Sim. Usamos criptografia em trânsito e em repouso, autenticação JWT, e não armazenamos dados bancários de acesso. Hospedagem em servidores certificados." },
    { q: "Posso testar antes de pagar?", a: "Sim! O plano Free é permanente e inclui validação CNAB + 5 consultas Elvis/mês. O Whallet+ tem 7 dias grátis, sem cartão obrigatório no cadastro." },
    { q: "O bot entende áudio?", a: "Sim. Você grava um áudio no WhatsApp e o bot transcreve automaticamente, interpreta sua pergunta e responde com dados reais." },
];

/* ──────────────────────────────────────────────────────────────
   COMPONENTS
   ────────────────────────────────────────────────────────────── */

/* ── iPhone WhatsApp Mockup ── */
function IPhoneMockup({ messages, className = "" }) {
    const [visibleCount, setVisibleCount] = useState(0);
    const [showTyping, setShowTyping] = useState(false);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const startedRef = useRef(false);

    const runSequence = useCallback(() => {
        let idx = 0;
        const step = () => {
            if (idx >= messages.length) {
                // loop: reset after pause
                timerRef.current = setTimeout(() => {
                    setVisibleCount(0);
                    setShowTyping(false);
                    idx = 0;
                    timerRef.current = setTimeout(step, 800);
                }, 4000);
                return;
            }
            const msg = messages[idx];
            if (msg.dir === "typing") {
                setShowTyping(true);
                idx++;
                timerRef.current = setTimeout(step, 1200);
            } else {
                setShowTyping(false);
                setVisibleCount(idx + 1);
                idx++;
                timerRef.current = setTimeout(step, msg.dir === "out" ? 700 : 900);
            }
        };
        step();
    }, [messages]);

    useEffect(() => {
        if (startedRef.current) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !startedRef.current) {
                    startedRef.current = true;
                    runSequence();
                    obs.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        if (containerRef.current) obs.observe(containerRef.current);
        return () => { obs.disconnect(); clearTimeout(timerRef.current); };
    }, [runSequence]);

    const renderMsg = (msg, i) => {
        const vis = i < visibleCount ? " visible" : "";
        if (msg.dir === "typing") return null;

        if (msg.type === "voice") {
            return (
                <div key={i} className={`wa-msg wa-out wa-voice${vis}`}>
                    <span className="wa-play">▶</span>
                    <span className="wa-wave">
            {Array.from({ length: 15 }, (_, j) => <i key={j} />)}
          </span>
                    <span className="wa-voice-time">0:04</span>
                    <span className="wa-msg-time">{msg.time}</span>
                </div>
            );
        }

        if (msg.type === "card") {
            return (
                <div key={i} className={`wa-msg wa-in wa-card-msg${vis}`}>
                    <div className="wa-card-hd">{msg.hd}</div>
                    <div className="wa-card-val">{msg.val}</div>
                    <div className="wa-card-meta">{msg.meta}</div>
                    <span className="wa-msg-time">{msg.time}</span>
                </div>
            );
        }

        return (
            <div key={i} className={`wa-msg ${msg.dir === "out" ? "wa-out" : "wa-in"}${vis}`}>
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                {msg.tag && <div className="wa-tag">{msg.tag}</div>}
                <span className="wa-msg-time">{msg.time}</span>
            </div>
        );
    };

    return (
        <div className={`lp-iphone ${className}`} ref={containerRef}>
            <div className="lp-iphone-notch" />
            <div className="lp-iphone-screen">
                <div className="wa-status-bar">
                    <span>9:41</span>
                    <span>⦁⦁⦁⦁ 5G</span>
                </div>
                <div className="wa-header">
                    <span className="wa-back">‹</span>
                    <div className="wa-avatar">
                        <img src={logo} width={20} height={20} alt="Whallet Logo" loading="eager" />
                    </div>
                    <div className="wa-meta">
                        <div className="wa-name">
                            Whallet
                            <span className="wa-verified">✓</span>
                        </div>
                        <div className="wa-online">online</div>
                    </div>
                </div>
                <div className="wa-chat-area">
                    <div className="wa-date-chip">Hoje</div>
                    {messages.map((m, i) => renderMsg(m, i))}
                    <div className={`wa-typing${showTyping ? " visible" : ""}`}>
                        <span /><span /><span />
                    </div>
                </div>
                <div className="wa-input-bar">
                    <div className="wa-input-fake">Mensagem</div>
                    <span className="wa-mic">🎤</span>
                </div>
            </div>
        </div>
    );
}

/* ── Feature Showcase ── */
const CYCLE_MS = 7000;

function FeatureShowcase({ features }) {
    const [active, setActive] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const intervalRef = useRef(null);
    const startRef = useRef(Date.now());

    const resetTimer = useCallback((idx) => {
        clearInterval(intervalRef.current);
        setActive(idx);
        setProgress(0);
        startRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            if (paused) return;
            const elapsed = Date.now() - startRef.current;
            const pct = Math.min((elapsed / CYCLE_MS) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                clearInterval(intervalRef.current);
                setActive((prev) => {
                    const next = (prev + 1) % features.length;
                    startRef.current = Date.now();
                    setProgress(0);
                    return next;
                });
            }
        }, 50);
    }, [features.length, paused]);

    useEffect(() => {
        resetTimer(0);
        return () => clearInterval(intervalRef.current);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!paused) {
            startRef.current = Date.now() - (progress / 100) * CYCLE_MS;
        }
    }, [paused]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="lp-features-shell">
            <div className="lp-feat-list">
                {features.map((f, i) => (
                    <div
                        key={i}
                        className={`lp-feat-card${i === active ? " active" : ""}${paused ? " paused" : ""}`}
                        onClick={() => resetTimer(i)}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                    >
                        <div className="lp-feat-num">{f.num}</div>
                        <h4 className="lp-feat-title">{f.title} <em>{f.titleEm}</em></h4>
                        <p className="lp-feat-desc">{f.desc}</p>
                        <ul className="lp-feat-bullets">
                            {f.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                        <div className="lp-feat-prog">
                            <div
                                className="lp-feat-prog-fill"
                                style={{ width: i === active ? `${progress}%` : "0%" }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="lp-feat-stage">
                {features.map((f, i) => (
                    <div key={i} className={`lp-feat-slide${i === active ? " active" : ""}`}>
                        <div className="lp-frame">
                            <div className="lp-frame-bar">
                                <div className="lp-frame-dots">
                                    <span className="lp-frame-dot r" />
                                    <span className="lp-frame-dot y" />
                                    <span className="lp-frame-dot g" />
                                </div>
                                <div className="lp-frame-url">{f.url}</div>
                                <span className="lp-frame-live">AO VIVO</span>
                            </div>
                            <img src={f.img} alt={f.title} loading="lazy" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────────── */
export default function HomePage() {
    const navigate = useNavigate();
    const [navScrolled, setNavScrolled] = useState(false);
    const [logado, setLogado] = useState(false);

    /* Check if user is logged in */
    useEffect(() => {
        try {
            const auth = localStorage.getItem("auth");
            if (auth) {
                const parsed = JSON.parse(auth);
                setLogado(!!parsed?.token && (!parsed.expiraEm || parsed.expiraEm > Date.now()));
            }
        } catch { setLogado(false); }
    }, []);

    /* Scroll reveal */
    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
            { threshold: 0.12 }
        );
        document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    /* Navbar scroll */
    useEffect(() => {
        const fn = () => setNavScrolled(window.scrollY > 40);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="lp">
            {/* ═══ NAV ═══ */}
            <nav className={`lp-nav${navScrolled ? " scrolled" : ""}`}>
                <div className="lp-container lp-nav-inner">
                    <button className="lp-brand" onClick={() => scrollTo("hero")}>
                        <img src={logoIcon} alt="" className="lp-brand-icon" />
                        whallet
                    </button>
                    <div className="lp-nav-links">
                        <button className="lp-nav-link" onClick={() => scrollTo("recursos")}>Recursos</button>
                        <button className="lp-nav-link" onClick={() => scrollTo("pra-quem")}>Pra quem</button>
                        <button className="lp-nav-link" onClick={() => scrollTo("precos")}>Preços</button>
                        <button className="lp-nav-link" onClick={() => scrollTo("duvidas")}>Dúvidas</button>
                        {logado ? (
                            <button className="lp-nav-cta" onClick={() => navigate("/fluxo-caixa")}>
                                Acessar app <span className="arrow">→</span>
                            </button>
                        ) : (
                            <>
                                <button className="lp-nav-link always-show" onClick={() => navigate("/login")}>Entrar</button>
                                <button className="lp-nav-cta" onClick={() => navigate("/cadastro")}>
                                    <span className="lp-nav-cta-full">Começar grátis</span>
                                    <span className="lp-nav-cta-short">Começar</span>
                                    <span className="arrow">→</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ═══ HERO ═══ */}
            <section className="lp-hero" id="hero">
                <div className="lp-container">
                    <div className="lp-hero-grid">
                        <div style={{ paddingTop: "61px" }}>
                            <h1 className="lp-hero-title">
                                Seu financeiro<br />
                                <span className="lp-hero-highlight">organizado.</span>
                            </h1>
                            <p className="lp-hero-sub">
                                Controle financeiro com IA e WhatsApp.<br />
                                Organize, acompanhe e cresça.
                            </p>
                            <div className="lp-hero-ctas">
                                <button className="lp-cta-primary" onClick={() => navigate("/cadastro")}>
                                    Começar grátis <span className="arrow">→</span>
                                </button>
                                <button className="lp-cta-secondary" onClick={() => scrollTo("whatsapp")}>
                                    Ver como funciona ↓
                                </button>
                            </div>
                            <p className="lp-hero-meta">Sem cartão · Setup 2 min · Cancele quando quiser</p>
                        </div>

                        <div className="lp-hero-visual">
                            <img src={heroVisual} alt="Whallet — App mobile e dashboard web" className="lp-hero-visual-img" loading="eager" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ MARQUEE ═══ */}
            <div className="lp-strip">
                <div className="lp-strip-inner">
                    {MARQUEE_ITEMS.map((t, i) => (
                        <span key={i} className="lp-marquee-item">{t}</span>
                    ))}
                </div>
            </div>

            {/* ═══ WHATSAPP SECTION ═══ */}
            <section className="lp-wa-section" id="whatsapp">
                <div className="lp-container">
                    <div className="lp-wa-grid">
                        <div className="lp-wa-content reveal">
                            <span className="lp-section-eyebrow">BOT WHATSAPP</span>
                            <h2>Sua gestão financeira a uma <em>mensagem</em> de distância.</h2>
                            <p className="lp-wa-sub">
                                Vinculou? Pronto. Mande texto ou áudio — o bot transcreve, interpreta e
                                responde com dados reais do seu caixa. É como ter um CFO no bolso.
                            </p>
                            <div className="lp-wa-actions">
                                <div className="lp-wa-action"><strong>💬 Texto</strong><br/>Pergunte saldos, vencimentos, receita</div>
                                <div className="lp-wa-action"><strong>🎤 Áudio</strong><br/>Transcrição automática + resposta IA</div>
                                <div className="lp-wa-action"><strong>📊 Relatórios</strong><br/>Peça e receba PDF no chat</div>
                                <div className="lp-wa-action"><strong>🔔 Alertas</strong><br/>Notificações proativas de vencimentos</div>
                            </div>
                            <button className="lp-wa-cta-btn" onClick={() => navigate("/cadastro")}>
                                Ativar Bot WhatsApp →
                            </button>
                        </div>
                        <div className="lp-wa-mockup reveal reveal-d2">
                            <IPhoneMockup messages={WA_MESSAGES} />
                            <div className="wa-float wa-float-1">
                                <div className="wa-float-icon" style={{ background: "#25D366" }}>🎤</div>
                                <div><small>ÁUDIO PROCESSADO</small><strong>Transcrição IA</strong></div>
                            </div>
                            <div className="wa-float wa-float-2">
                                <div className="wa-float-icon" style={{ background: "#15C3DD" }}>📄</div>
                                <div><small>RELATÓRIO</small><strong>PDF gerado</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ PROBLEM ═══ */}
            <section className="lp-section lp-section--dark">
                <div className="lp-container">
                    <div className="lp-section-head reveal">
                        <div>
                            <span className="lp-section-eyebrow">O PROBLEMA</span>
                            <h2 className="lp-section-title">O dinheiro do seu negócio merece mais que uma <em>planilha.</em></h2>
                        </div>
                        <p className="lp-section-desc">
                            Planilhas quebram. Sistemas legados custam caro. Você precisa de respostas — não de 47 abas abertas.
                        </p>
                    </div>
                    <div className="lp-pain-list">
                        {[
                            { n: "DOR 01", t: "Planilhas que ninguém atualiza e todo mundo desconfia." },
                            { n: "DOR 02", t: "Arquivos CNAB que parecem código alienígena." },
                            { n: "DOR 03", t: "Zero visibilidade do caixa real — só achismo." },
                        ].map((p, i) => (
                            <div key={i} className={`lp-pain-item reveal reveal-d${i + 1}`}>
                                <div className="lp-pain-num">{p.n}</div>
                                <p className="lp-pain-text">{p.t}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FEATURES ═══ */}
            <section className="lp-section" id="recursos">
                <div className="lp-container">
                    <div className="lp-section-head reveal" style={{ marginBottom: 48 }}>
                        <div>
                            <span className="lp-section-eyebrow" style={{ color: "var(--cyan-deep)" }}>RECURSOS</span>
                            <h2 className="lp-section-title" style={{ color: "var(--navy-deep)" }}>
                                Tudo que o financeiro do seu negócio <em>precisa.</em>
                            </h2>
                        </div>
                        <p className="lp-section-desc" style={{ color: "var(--ink-2)" }}>
                            Quatro pilares — fluxo de caixa, recebimentos, relatórios e IA — trabalhando juntos.
                        </p>
                    </div>
                    <div className="reveal">
                        <FeatureShowcase features={FEATURES} />
                    </div>
                </div>
            </section>

            {/* ═══ STEPS ═══ */}
            <section className="lp-section" style={{ background: "#fff" }}>
                <div className="lp-container">
                    <div className="lp-section-head reveal" style={{ marginBottom: 48 }}>
                        <div>
                            <span className="lp-section-eyebrow" style={{ color: "var(--cyan-deep)" }}>COMO FUNCIONA</span>
                            <h2 className="lp-section-title" style={{ color: "var(--navy-deep)" }}>
                                Do cadastro ao primeiro<br />insight em <em>2 minutos.</em>
                            </h2>
                        </div>
                    </div>
                    <div className="lp-steps">
                        {STEPS.map((s, i) => (
                            <div key={i} className={`lp-step reveal reveal-d${i + 1}`}>
                                <div className="lp-step-num">{s.n}</div>
                                <h4>{s.title}</h4>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ PERSONAS ═══ */}
            <section className="lp-section" id="pra-quem">
                <div className="lp-container">
                    <div className="lp-section-head reveal" style={{ marginBottom: 48 }}>
                        <div>
                            <span className="lp-section-eyebrow" style={{ color: "var(--cyan-deep)" }}>PRA QUEM</span>
                            <h2 className="lp-section-title" style={{ color: "var(--navy-deep)" }}>
                                Feito pra quem toca o financeiro <em>na prática.</em>
                            </h2>
                        </div>
                    </div>
                    <div className="lp-personas">
                        {PERSONAS.map((p, i) => (
                            <div key={i} className={`lp-persona reveal reveal-d${i + 1}`}>
                                <span className="lp-persona-tag">{p.tag}</span>
                                <h3>{p.title}</h3>
                                <p>{p.desc}</p>
                                <ul className="lp-persona-list">
                                    {p.items.map((it, j) => <li key={j}>{it}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ PRICING ═══ */}
            <section className="lp-pricing" id="precos">
                <div className="lp-container" style={{ textAlign: "center" }}>
                    <span className="lp-section-eyebrow reveal" style={{ justifyContent: "center", display: "inline-flex", width: "100%", color: "var(--cyan)" }}>PREÇOS</span>
                    <h2 className="lp-section-title reveal" style={{ color: "#fff", textAlign: "center", marginBottom: 12 }}>
                        Simples. <em>Transparente.</em>
                    </h2>
                    <p className="lp-section-desc reveal" style={{ color: "rgba(255,255,255,0.65)", margin: "0 auto 48px", textAlign: "center" }}>
                        Comece grátis, evolua quando precisar. Sem surpresas na fatura.
                    </p>
                    <div className="lp-pricing-grid reveal">
                        {/* Free */}
                        <div className="lp-plan">
                            <div className="lp-plan-name">FREE</div>
                            <div className="lp-plan-price">R$ 0 <span className="per">/ mês</span></div>
                            <p className="lp-plan-desc">Para conhecer a plataforma e validar seus CNABs.</p>
                            <ul className="lp-plan-feats">
                                <li>Validação e visualização CNAB</li>
                                <li>Dashboard básico</li>
                                <li>Elvis — 5 consultas/mês</li>
                                <li>1 empresa</li>
                            </ul>
                            <button className="lp-plan-cta free" onClick={() => navigate("/cadastro")}>Criar conta grátis</button>
                        </div>
                        {/* Whallet+ */}
                        <div className="lp-plan featured">
                            <span className="lp-plan-badge">MAIS POPULAR</span>
                            <div className="lp-plan-name">WHALLET+</div>
                            <div className="lp-plan-price">R$ 39,90 <span className="per">/ mês</span></div>
                            <p className="lp-plan-desc">Gestão completa + Bot WhatsApp + IA sem limites práticos.</p>
                            <ul className="lp-plan-feats">
                                <li>Tudo do Free</li>
                                <li>Bot WhatsApp (texto + áudio)</li>
                                <li>Elvis — 100 consultas/mês</li>
                                <li>Agentes Aurora, Frank e Anne</li>
                                <li>Relatórios avançados</li>
                                <li>Suporte prioritário</li>
                            </ul>
                            <button className="lp-plan-cta pro" onClick={() => navigate("/cadastro")}>Começar 7 dias grátis</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FAQ ═══ */}
            <section className="lp-section" id="duvidas">
                <div className="lp-container">
                    <div className="lp-section-head reveal" style={{ marginBottom: 48 }}>
                        <div>
                            <span className="lp-section-eyebrow" style={{ color: "var(--cyan-deep)" }}>DÚVIDAS</span>
                            <h2 className="lp-section-title" style={{ color: "var(--navy-deep)" }}>
                                Perguntas <em>frequentes.</em>
                            </h2>
                        </div>
                    </div>
                    <div className="lp-faq-grid">
                        {FAQ_DATA.map((f, i) => (
                            <div key={i} className="lp-faq-item reveal">
                                <h4 className="lp-faq-q"><span className="lp-faq-n">0{i + 1}</span>{f.q}</h4>
                                <p className="lp-faq-a">{f.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA FINAL ═══ */}
            <section className="lp-cta-final">
                <div className="lp-container">
                    <span className="lp-section-eyebrow reveal" style={{ justifyContent: "center", display: "inline-flex", width: "100%", color: "var(--cyan)" }}>PRONTO PRA COMEÇAR?</span>
                    <h2 className="lp-cta-final-title reveal">
                        Seu caixa merece<br />mais que <em>achismo.</em>
                    </h2>
                    <div className="reveal reveal-d2">
                        <button className="lp-cta-final-button" onClick={() => navigate("/cadastro")}>
                            Começar grátis agora →
                        </button>
                        <p className="lp-cta-final-meta">Sem cartão · 2 minutos · Cancele quando quiser</p>
                    </div>
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="lp-footer">
                <div className="lp-container lp-footer-inner">
                    <div className="lp-footer-brand">
                        <span className="lp-brand" style={{ fontSize: 20 }}>whallet<span className="dot" /></span>
                        <span>© {new Date().getFullYear()} Whallet</span>
                    </div>
                    <div className="lp-footer-links">
                        <Link to="/privacidade" className="lp-footer-link">Privacidade</Link>
                        <Link to="/termos" className="lp-footer-link">Termos</Link>
                        <Link to="/contato" className="lp-footer-link">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
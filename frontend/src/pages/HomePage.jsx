import { useEffect } from "react";
import { Link } from "react-router-dom";
import logoWhale from "../assets/logo.png";
import { LuWalletCards, LuBuilding2, LuBellRing, LuFileText, LuSparkles, LuCircleCheck, LuSheet, LuTrendingUp, LuShieldCheck } from "react-icons/lu";
import { IcoArrow } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function HomePage() {
    const { autenticado, usuario } = useAuth();
    const temWhalletPlus = usuario?.perfil === "ADMIN" || usuario?.planoId === PLANO_WHALLET_PLUS;
    const rotaGestao = temWhalletPlus ? "/titulos" : "/gestao-financeira";

    useEffect(() => {
        document.title = "Whallet · Portal Financeiro — CNAB e Gestão Financeira";
    }, []);

    return (
        <>
            {/* ── Hero ── */}
            <section style={{
                maxWidth: 1200, margin: "0 auto", padding: "72px 32px 80px",
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 64, alignItems: "center",
            }} className="hp-hero-grid">

                {/* Texto */}
                <div>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)",
                        borderRadius: 999, padding: "5px 14px", marginBottom: 24,
                        fontSize: 11.5, fontWeight: 700, color: "var(--cyan-dark)", letterSpacing: "0.06em",
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", display: "inline-block" }}/>
                        PORTAL FINANCEIRO · CNAB + GESTÃO
                    </div>

                    <h1 style={{
                        fontSize: "clamp(30px, 3.5vw, 46px)", fontWeight: 800,
                        letterSpacing: "-0.03em", lineHeight: 1.1,
                        color: "var(--text)", margin: "0 0 18px",
                    }}>
                        Ferramentas financeiras<br/>
                        para empresas que<br/>
                        <span style={{ color: "var(--cyan)" }}>querem mais controle</span>
                    </h1>

                    <p style={{
                        fontSize: 16, color: "var(--text-muted)", lineHeight: 1.75,
                        margin: "0 0 32px", maxWidth: 440,
                    }}>
                        Do arquivo CNAB bancário à gestão completa de contas a pagar —
                        sem planilhas paralelas, sem retrabalho.
                    </p>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
                        <Link to="/valida-cnab" style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "12px 24px", borderRadius: 10,
                            background: "var(--text)", color: "#fff",
                            fontSize: 14, fontWeight: 700, textDecoration: "none",
                            boxShadow: "0 4px 14px rgba(30,41,59,0.18)",
                            transition: "opacity 0.15s, transform 0.15s",
                        }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
                        >
                            <LuSheet size={15}/> Conversor CNAB
                        </Link>
                        <Link to={rotaGestao} style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "12px 24px", borderRadius: 10,
                            border: "1.5px solid rgba(30,41,59,0.15)", background: "#fff",
                            color: "var(--text)", fontSize: 14, fontWeight: 700, textDecoration: "none",
                            transition: "border-color 0.15s",
                        }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"}
                              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(30,41,59,0.15)"}
                        >
                            <LuWalletCards size={15}/> Gestão Financeira <IcoArrow/>
                        </Link>
                    </div>

                    {/* Trust logos / badges */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {["Itaú","Bradesco","Banco do Brasil","Caixa"].map(b => (
                            <span key={b} style={{
                                padding: "4px 12px", borderRadius: 6,
                                background: "rgba(30,41,59,0.04)", border: "1px solid rgba(30,41,59,0.1)",
                                fontSize: 11.5, fontWeight: 600, color: "var(--text-dim)",
                            }}>{b}</span>
                        ))}
                        <span style={{
                            padding: "4px 12px", borderRadius: 6,
                            background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)",
                            fontSize: 11.5, fontWeight: 600, color: "var(--cyan-dark)",
                        }}>CNAB 240 e 400</span>
                    </div>
                </div>

                {/* Visual — dashboard mockup SVG */}
                <div style={{ position: "relative" }} className="hp-hero-visual">
                    <DashboardMockup/>
                </div>
            </section>

            {/* ── Stats ── */}
            <section style={{
                background: "var(--text)",
                padding: "32px 0",
            }}>
                <div style={{
                    maxWidth: 1200, margin: "0 auto", padding: "0 32px",
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
                }} className="hp-stats-grid">
                    {[
                        { n: "7",      l: "Layouts bancários" },
                        { n: "4",      l: "Bancos integrados" },
                        { n: "240/400",l: "Versões CNAB" },
                        { n: "9",      l: "Tipos de alerta" },
                    ].map((s, i) => (
                        <div key={s.l} style={{
                            textAlign: "center", padding: "8px 0",
                            borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--cyan-light)", letterSpacing: "-0.03em" }}>{s.n}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginTop: 2 }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Duas soluções ── */}
            <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                        Duas soluções, uma plataforma
                    </h2>
                    <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>
                        Escolha o que você precisa — ou use as duas juntas.
                    </p>
                </div>

                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
                }} className="hp-cards-grid">
                    <SolutionCard
                        icon={<LuSheet size={22}/>}
                        iconBg="rgba(6,182,212,0.1)" iconColor="var(--cyan)"
                        title="Conversor CNAB"
                        desc="Transforme arquivos de remessa e retorno bancário em Excel estruturado ou relatório PDF analítico com alertas automáticos. Sem instalação."
                        features={["CNAB 240 e 400 — Itaú, Bradesco, BB, Caixa","Excel com abas por segmento (A, J, O, N)","PDF com KPIs, alertas e distribuição","Integração com Protheus SE2/E2"]}
                        cta="Acessar o Conversor"
                        to="/valida-cnab"
                    />
                    <SolutionCard
                        icon={<LuWalletCards size={22}/>}
                        iconBg="rgba(30,41,59,0.07)" iconColor="var(--text)"
                        title="Gestão Financeira"
                        desc="Cadastre e importe títulos a pagar, registre baixas, acompanhe vencimentos e gere relatórios — tudo integrado ao fluxo bancário."
                        features={["Contas a pagar com baixa parcial ou total","Importação via Excel compatível com Protheus","Relatórios: fluxo de caixa, aging, fornecedores","Exportação em Excel e PDF"]}
                        cta={temWhalletPlus ? "Abrir Gestão" : "Conhecer o Whallet+"}
                        to={rotaGestao}
                    />
                </div>
            </section>

            {/* ── Como funciona ── */}
            <section style={{ background: "var(--surface-2)", padding: "80px 0" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                            Como funciona o Conversor CNAB
                        </h2>
                        <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0 }}>Três passos. Menos de um minuto.</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="hp-steps-grid">
                        {[
                            { n: "01", icon: <LuBuilding2 size={20}/>, t: "Escolha o banco", d: "Selecione o banco e o layout CNAB — cobrança ou pagamento, 240 ou 400." },
                            { n: "02", icon: <LuFileText size={20}/>,  t: "Envie o arquivo",  d: "Upload da remessa ou retorno. Nenhum arquivo de configuração extra." },
                            { n: "03", icon: <LuTrendingUp size={20}/>, t: "Baixe o resultado", d: "Excel estruturado ou relatório PDF analítico gerado instantaneamente." },
                        ].map((s, i) => (
                            <div key={s.n} style={{
                                background: "#fff", border: "1px solid rgba(30,41,59,0.1)",
                                borderRadius: 16, padding: "28px 24px",
                                position: "relative",
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "var(--cyan)", marginBottom: 16,
                                }}>{s.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cyan)", letterSpacing: "0.06em", marginBottom: 8 }}>PASSO {s.n}</div>
                                <h4 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>{s.t}</h4>
                                <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
                                {i < 2 && (
                                    <div style={{
                                        position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)",
                                        width: 20, textAlign: "center", fontSize: 16, color: "rgba(30,41,59,0.2)",
                                        display: "none",
                                    }} className="hp-step-arrow">→</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Gestão Financeira ── */}
            <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
                <div style={{
                    background: "var(--text)",
                    borderRadius: 24, padding: "56px 48px",
                    display: "grid", gridTemplateColumns: "1fr auto",
                    gap: 48, alignItems: "center",
                }} className="hp-cta-grid">
                    <div>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
                            background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.25)",
                            borderRadius: 999, padding: "5px 14px",
                            fontSize: 11, fontWeight: 700, color: "var(--cyan-light)", letterSpacing: "0.06em",
                        }}>
                            <LuSparkles size={12}/> WHALLET+ — GESTÃO FINANCEIRA
                        </div>
                        <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
                            Muito além da conversão de CNAB
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.75, margin: "0 0 28px", maxWidth: 480 }}>
                            Controle completo de contas a pagar, relatórios financeiros exportáveis
                            em Excel e PDF, e geração de remessas bancárias diretamente dos seus títulos.
                        </p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <Link to={rotaGestao} style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "12px 24px", borderRadius: 10,
                                background: "var(--grad)", color: "#083344",
                                fontWeight: 700, fontSize: 14, textDecoration: "none",
                            }}>
                                {temWhalletPlus ? "Abrir Gestão Financeira" : "Conhecer o Whallet+"} <IcoArrow/>
                            </Link>
                            {!autenticado && (
                                <Link to="/cadastro" style={{
                                    display: "inline-flex", alignItems: "center",
                                    padding: "12px 24px", borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    color: "rgba(255,255,255,0.75)", fontWeight: 600, fontSize: 14, textDecoration: "none",
                                }}>Criar conta gratuita</Link>
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 230 }}>
                        {[
                            { icon: <LuCircleCheck size={16}/>, label: "Contas a pagar",        done: true },
                            { icon: <LuFileText size={16}/>,    label: "Relatórios exportáveis", done: true },
                            { icon: <LuBellRing size={16}/>,    label: "Alertas de vencimento",  done: true },
                            { icon: <LuBuilding2 size={16}/>,   label: "Remessa CNAB integrada", done: false },
                        ].map(f => (
                            <div key={f.label} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "11px 14px", borderRadius: 10,
                                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                            }}>
                                <span style={{ color: f.done ? "var(--cyan-light)" : "rgba(255,255,255,0.3)" }}>{f.icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: f.done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)", flex: 1 }}>{f.label}</span>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                    background: f.done ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.07)",
                                    color: f.done ? "var(--cyan-light)" : "rgba(255,255,255,0.3)",
                                }}>{f.done ? "Disponível" : "Em breve"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: "1px solid rgba(30,41,59,0.1)",
                padding: "28px 32px",
                display: "flex", alignItems: "center", gap: 16,
                maxWidth: 1200, margin: "0 auto",
                fontSize: 12, color: "var(--text-dim)",
            }}>
                <img src={logoWhale} alt="" style={{ width: 24, height: 24, opacity: 0.5 }}/>
                <span style={{ fontWeight: 600 }}>Whallet · Portal Financeiro</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
          <Link to="/planos" style={{ color: "var(--text-dim)", textDecoration: "none" }}>Planos</Link>
          <a href="mailto:usewhallet@gmail.com" style={{ color: "var(--text-dim)", textDecoration: "none" }}>Contato</a>
        </span>
            </footer>

            <style>{`
        @media (max-width: 900px) {
          .hp-hero-grid     { grid-template-columns: 1fr !important; }
          .hp-hero-visual   { display: none; }
          .hp-cta-grid      { grid-template-columns: 1fr !important; }
          .hp-cards-grid    { grid-template-columns: 1fr !important; }
          .hp-stats-grid    { grid-template-columns: repeat(2,1fr) !important; }
          .hp-steps-grid    { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </>
    );
}

/* ── Dashboard mockup visual ── */
function DashboardMockup() {
    const bars = [65, 82, 54, 90, 73, 61, 88];
    const months = ["Out","Nov","Dez","Jan","Fev","Mar","Abr"];

    return (
        <div style={{
            background: "#fff",
            border: "1px solid rgba(30,41,59,0.12)",
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(30,41,59,0.12), 0 4px 16px rgba(30,41,59,0.06)",
            overflow: "hidden",
            userSelect: "none",
        }}>
            {/* Header barra */}
            <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(30,41,59,0.08)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--text)",
            }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Whallet · Títulos a Pagar</span>
                <div style={{ display: "flex", gap: 6 }}>
                    {["#EF4444","#F59E0B","#22C55E"].map(c => (
                        <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }}/>
                    ))}
                </div>
            </div>

            <div style={{ padding: 20 }}>
                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                        { label: "Em aberto", value: "R$ 48.200", color: "var(--text)", bg: "rgba(30,41,59,0.04)" },
                        { label: "Pendentes", value: "12",        color: "var(--cyan)", bg: "rgba(6,182,212,0.07)" },
                        { label: "Vencidos",  value: "3",         color: "#DC2626",     bg: "rgba(220,38,38,0.07)" },
                    ].map(k => (
                        <div key={k.label} style={{
                            padding: "12px", borderRadius: 10,
                            background: k.bg, border: "1px solid rgba(30,41,59,0.08)",
                        }}>
                            <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                        </div>
                    ))}
                </div>

                {/* Gráfico de barras */}
                <div style={{
                    padding: "14px", borderRadius: 10,
                    border: "1px solid rgba(30,41,59,0.08)",
                    marginBottom: 16, background: "rgba(30,41,59,0.01)",
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>Fluxo de caixa — próximos meses</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                        {bars.map((h, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{
                                    width: "100%", height: `${h}%`,
                                    borderRadius: "4px 4px 2px 2px",
                                    background: i === 3
                                        ? "var(--cyan)"
                                        : i < 3
                                            ? "rgba(30,41,59,0.15)"
                                            : "rgba(6,182,212,0.3)",
                                    minHeight: 4,
                                    transition: "height 0.3s",
                                }}/>
                                <span style={{ fontSize: 9, color: "var(--text-dim)", fontWeight: 500 }}>{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lista de títulos */}
                {[
                    { nome: "Aluguel Comercial", venc: "15/04", valor: "R$ 8.500", status: "Pendente", statusColor: "var(--cyan)" },
                    { nome: "Fornecedor ABC",    venc: "10/04", valor: "R$ 3.200", status: "Vencido",  statusColor: "#DC2626" },
                    { nome: "Energia Elétrica",  venc: "20/04", valor: "R$ 1.840", status: "Pendente", statusColor: "var(--cyan)" },
                ].map((t, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "9px 0",
                        borderBottom: i < 2 ? "1px solid rgba(30,41,59,0.06)" : "none",
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{t.nome}</div>
                            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Vence {t.venc}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{t.valor}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: t.statusColor }}>{t.status}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Card de solução ── */
function SolutionCard({ icon, iconBg, iconColor, title, desc, features, cta, to }) {
    return (
        <div style={{
            background: "#fff", border: "1px solid rgba(30,41,59,0.1)",
            borderRadius: 18, padding: "32px 28px",
            display: "flex", flexDirection: "column",
            transition: "box-shadow 0.2s, transform 0.2s",
        }}
             onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(30,41,59,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
             onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
        >
            <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: iconBg, color: iconColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
            }}>{icon}</div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>{title}</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 20px", flex: 1 }}>{desc}</p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 8 }}>
                {features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                        <LuCircleCheck size={14} style={{ color: "var(--cyan)", flexShrink: 0 }}/> {f}
                    </li>
                ))}
            </ul>

            <Link to={to} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 20px", borderRadius: 10,
                background: "var(--text)", color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                alignSelf: "flex-start",
                transition: "opacity 0.15s",
            }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
                {cta} <IcoArrow/>
            </Link>
        </div>
    );
}
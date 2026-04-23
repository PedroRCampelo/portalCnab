import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

// Screenshots das telas — salvar em: src/assets/gestao-financeira/
// Dimensões: 1280×800px PNG
import titulosPagarImg      from "../assets/gestao-financeira/titulos-pagar.png";
import novoTituloImg        from "../assets/gestao-financeira/novo-titulo.png";
import registrarBaixaImg    from "../assets/gestao-financeira/registrar-baixa.png";
import relatoriosImg        from "../assets/gestao-financeira/relatorios-financeiros.png";

// Fotos dos bots — salvar em: src/assets/bots/
// Dimensões: 80×80px PNG, fundo transparente
import auroraImg from "../assets/bots/aurora.png";
import frankImg  from "../assets/bots/frank.png";
import anneImg   from "../assets/bots/anne.png";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function GestaoFinanceiraPage() {
    const { usuario, autenticado } = useAuth();
    const navigate = useNavigate();
    const [carregando, setCarregando] = useState(false);
    const [erro,       setErro]       = useState("");
    const [demoAtivo,  setDemoAtivo]  = useState("titulos");
    const [modalAberto,setModalAberto]= useState(false);

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = isAdmin || usuario?.planoId === PLANO_WHALLET_PLUS;

    if (autenticado && temWhalletPlus) {
        navigate("/titulos", { replace: true });
        return null;
    }

    async function handleUpgrade() {
        if (!autenticado) { navigate("/cadastro"); return; }
        setCarregando(true); setErro("");
        try {
            const { data } = await api.post("/api/stripe/checkout/whallet-plus");
            window.location.href = data.url;
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao iniciar pagamento.");
            setCarregando(false);
        }
    }

    const demos = [
        {
            id: "titulos", step: "01", titulo: "Títulos a pagar",
            badge: "Painel principal",
            resumo: "Visualize totais em aberto, pendentes e vencidos com busca e filtros rápidos.",
            desc: "A tela centraliza a operação diária com cards de resumo, filtros por status e busca para localizar títulos rapidamente.",
            bullets: ["Resumo financeiro imediato","Busca por fornecedor, número ou documento","Acesso rápido a relatórios e importação"],
            img: titulosPagarImg,
        },
        {
            id: "cadastro", step: "02", titulo: "Novo título",
            badge: "Cadastro detalhado",
            resumo: "Cadastre títulos com vencimento, juros, multa, parcelamento e categoria de gasto.",
            desc: "Formulário direto e operacional — incluindo suporte a parcelamento automático, gerando múltiplos títulos de uma vez.",
            bullets: ["Parcelamento automático com saldo proporcional","Juros e multa por atraso","Base pronta para alertas e remessa CNAB"],
            img: novoTituloImg,
        },
        {
            id: "baixa", step: "03", titulo: "Registrar baixa",
            badge: "Quitação simplificada",
            resumo: "Quite títulos parcial ou totalmente com data de pagamento e valor pago.",
            desc: "Suporte a baixa parcial — o saldo restante é atualizado automaticamente e o título permanece em aberto até quitar tudo.",
            bullets: ["Baixa parcial com saldo residual","Data e valor pago registrados","Status atualizado automaticamente"],
            img: registrarBaixaImg,
        },
        {
            id: "relatorios", step: "04", titulo: "Relatórios financeiros",
            badge: "Visão gerencial",
            resumo: "Acompanhe distribuição por categoria, fornecedores e aging em visão consolidada.",
            desc: "Exporte em Excel ou PDF com um clique. Relatórios de fluxo de caixa, aging, concentração por fornecedor e tipos de gasto.",
            bullets: ["Exportação Excel e PDF","Fluxo de caixa, aging e fornecedores","Filtros por status e período"],
            img: relatoriosImg,
        },
    ];

    const demoAtual = demos.find(d => d.id === demoAtivo) ?? demos[0];

    const bots = [
        { key: "aurora", nome: "Aurora", img: auroraImg, cor: "#DB2777", bg: "rgba(219,39,119,0.07)", borda: "rgba(219,39,119,0.2)", desc: "Descontraída e animada", frase: "\"Ei! Você tem 3 títulos vencendo essa semana — bora resolver antes que vire bagunça? 😄\"" },
        { key: "frank",  nome: "Frank",  img: frankImg,  cor: "#1A2B42", bg: "rgba(26,43,66,0.06)",   borda: "rgba(26,43,66,0.18)",   desc: "Sério e direto", frase: "\"Há concentração crítica em Moradia (47% do total em aberto). Recomenda-se priorização imediata.\"" },
        { key: "anne",   nome: "Anne",   img: anneImg,   cor: "#0891A8", bg: "rgba(8,145,178,0.07)",  borda: "rgba(8,145,178,0.2)",  desc: "Analítica e estratégica", frase: "\"Padrão identificado: 68% dos seus vencimentos se concentram nos dias 10–15. Considere redistribuição.\"" },
    ];

    const features = [
        { emoji: "📋", titulo: "Títulos a pagar",        desc: "Cadastre manualmente ou importe via Excel. Controle vencimentos, saldos e status.", badge: "Disponível", ok: true },
        { emoji: "🔀", titulo: "Parcelamento automático",desc: "Gere múltiplas parcelas a partir de um único lançamento. Saldo calculado automaticamente.", badge: "Disponível", ok: true },
        { emoji: "📊", titulo: "Relatórios e exportação",desc: "Excel e PDF com fluxo de caixa, aging, concentração por fornecedor e categoria.", badge: "Disponível", ok: true },
        { emoji: "🔔", titulo: "Alertas de vencimento",  desc: "E-mails automáticos configuráveis: dias antes do vencimento e títulos já vencidos.", badge: "Disponível", ok: true },
        { emoji: "✨", titulo: "Insights de IA",         desc: "Aurora, Frank e Anne analisam seus dados e entregam insights financeiros diários.", badge: "Disponível", ok: true },
        { emoji: "📥", titulo: "Importação via Excel",   desc: "Compatível com exportações do Protheus (SE2/E2) e planilhas customizadas.", badge: "Disponível", ok: true },
        { emoji: "🏦", titulo: "Remessa CNAB integrada", desc: "Gere remessas bancárias diretamente dos títulos cadastrados — sem redigitar dados.", badge: "Em breve",   ok: false },
        { emoji: "🔄", titulo: "Integração Protheus",    desc: "Busque títulos diretamente do ERP e faça write-back de baixas automaticamente.", badge: "Sob consulta",ok: false },
    ];

    const planos = [
        { nome: "Gratuito",    preco: "R$ 0",          cor: "var(--text-dim)", items: ["8/mês","Excel e PDF","Todos","—","—","—","—"] },
        { nome: "Pro",         preco: "R$ 18,90/mês",  cor: "var(--text-muted)",items: ["Ilimitado","Excel e PDF","Todos","—","—","—","—"] },
        { nome: "Whallet+",    preco: "R$ 39,90/mês",  cor: "var(--cyan)",     items: ["Ilimitado","Excel e PDF","Todos","✓","✓","✓","✓"] },
    ];
    const linhas = ["Conversões CNAB","Formato exportação","Bancos CNAB","Gestão financeira","Parcelamento","Alertas e-mail","Insights de IA"];

    return (
        <>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 80px" }}>

                {/* ── Hero ──────────────────────────────────────────────────────── */}
                <div style={{ textAlign: "center", marginBottom: 64 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "rgba(21,195,221,0.08)", border: "1px solid rgba(21,195,221,0.2)",
                        borderRadius: 999, padding: "6px 18px", marginBottom: 24,
                        fontSize: 11.5, fontWeight: 700, color: "var(--cyan-dark)", letterSpacing: "0.06em",
                    }}>
                        ✦ WHALLET+ — GESTÃO FINANCEIRA
                    </div>

                    <h1 style={{
                        fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900,
                        color: "var(--text)", margin: "0 0 16px",
                        letterSpacing: "-0.025em", lineHeight: 1.1,
                    }}>
                        Controle financeiro completo,
                        <br/>
                        <span style={{ color: "var(--cyan)" }}>integrado ao seu workflow bancário</span>
                    </h1>

                    <p style={{ color: "var(--text-dim)", fontSize: 17, margin: "0 auto 32px", maxWidth: 600, lineHeight: 1.7 }}>
                        Do cadastro de títulos à geração de remessa CNAB — tudo em uma única plataforma,
                        com insights de IA, alertas automáticos e relatórios exportáveis.
                    </p>

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <button onClick={handleUpgrade} disabled={carregando} style={{
                            padding: "14px 32px", borderRadius: 12,
                            background: "var(--grad)", border: "none",
                            color: "#0B1E36", fontWeight: 800, fontSize: 16, cursor: "pointer",
                            opacity: carregando ? 0.7 : 1, transition: "opacity 0.15s",
                        }}>
                            {carregando ? "Redirecionando..." : autenticado ? "Assinar Whallet+ — R$ 39,90/mês" : "Criar conta grátis e assinar"}
                        </button>
                        <Link to="/planos" style={{
                            padding: "14px 24px", borderRadius: 12,
                            border: "1px solid var(--border)", color: "var(--text-muted)",
                            fontWeight: 600, fontSize: 15, textDecoration: "none",
                            display: "flex", alignItems: "center",
                        }}>Ver todos os planos</Link>
                    </div>

                    {erro && <div style={{ marginTop: 16, fontSize: 14, color: "var(--error)" }}>{erro}</div>}

                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16,
                        background: "rgba(21,195,221,0.06)", border: "1px solid rgba(21,195,221,0.15)",
                        borderRadius: 999, padding: "4px 14px",
                        fontSize: 12, color: "var(--cyan-dark)", fontWeight: 600,
                    }}>
                        🎯 Preço beta — promocional para os primeiros usuários
                    </div>
                </div>

                {/* ── Demo interativo ───────────────────────────────────────────── */}
                <section style={{
                    marginBottom: 72,
                    background: "linear-gradient(180deg, rgba(21,195,221,0.04), rgba(21,195,221,0.01))",
                    border: "1px solid rgba(21,195,221,0.12)",
                    borderRadius: 24, padding: "28px 20px 20px", overflow: "hidden",
                }}>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "6px 12px", borderRadius: 999,
                            background: "rgba(21,195,221,0.08)", border: "1px solid rgba(21,195,221,0.15)",
                            color: "var(--cyan-dark)", fontWeight: 700, fontSize: 12, marginBottom: 14,
                        }}>✨ DEMO DA ROTINA</div>
                        <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, color: "var(--text)", margin: "0 0 8px" }}>
                            Veja a gestão financeira em ação
                        </h2>
                        <p style={{ color: "var(--text-dim)", fontSize: 15, margin: "0 auto", maxWidth: 560, lineHeight: 1.7 }}>
                            Explore as principais telas — do cadastro ao relatório gerencial.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20, WebkitOverflowScrolling: "touch" }}>
                        {demos.map(item => {
                            const active = item.id === demoAtivo;
                            return (
                                <button key={item.id} onClick={() => setDemoAtivo(item.id)} style={{
                                    flex: "0 0 auto", borderRadius: 12, padding: "11px 16px",
                                    border: active ? "1px solid rgba(21,195,221,0.4)" : "1px solid var(--border)",
                                    background: active ? "rgba(21,195,221,0.08)" : "var(--surface)",
                                    color: "var(--text)", cursor: "pointer", textAlign: "left",
                                    minWidth: 180, transition: "all 0.2s",
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: active ? "var(--cyan)" : "var(--text-dim)", letterSpacing: "0.05em", marginBottom: 5 }}>
                                        ETAPA {item.step}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 800 }}>{item.titulo}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{item.badge}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Conteúdo do demo */}
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,340px) minmax(0,1fr)", gap: 20, alignItems: "stretch" }} className="gf-demo-grid">
                        {/* Painel esquerdo */}
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 22 }}>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999,
                                padding: "5px 12px", background: "rgba(21,195,221,0.07)",
                                border: "1px solid rgba(21,195,221,0.15)", color: "var(--cyan-dark)",
                                fontWeight: 700, fontSize: 11, marginBottom: 14,
                            }}>{demoAtual.badge}</div>
                            <h3 style={{ fontSize: 26, lineHeight: 1.1, margin: "0 0 10px", color: "var(--text)", fontWeight: 900 }}>{demoAtual.titulo}</h3>
                            <p style={{ margin: "0 0 10px", color: "var(--text)", fontSize: 14, fontWeight: 700, lineHeight: 1.6 }}>{demoAtual.resumo}</p>
                            <p style={{ margin: "0 0 16px", color: "var(--text-dim)", fontSize: 13.5, lineHeight: 1.7 }}>{demoAtual.desc}</p>
                            <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
                                {demoAtual.bullets.map(b => (
                                    <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,0.6)", border: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--cyan)", fontWeight: 900, flexShrink: 0 }}>✓</span>
                                        <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{b}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button onClick={() => setModalAberto(true)} style={{
                                    padding: "10px 14px", borderRadius: 10,
                                    border: "1px solid rgba(21,195,221,0.3)", background: "rgba(21,195,221,0.08)",
                                    color: "var(--cyan-dark)", fontWeight: 700, cursor: "pointer", fontSize: 13,
                                }}>Ampliar screenshot</button>
                                <button onClick={handleUpgrade} disabled={carregando} style={{
                                    padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)",
                                    background: "var(--surface)", color: "var(--text)", fontWeight: 700,
                                    cursor: "pointer", fontSize: 13, opacity: carregando ? 0.7 : 1,
                                }}>{autenticado ? "Quero liberar" : "Criar conta"}</button>
                            </div>
                        </div>

                        {/* Screenshot */}
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 14, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px 12px" }}>
                                <div style={{ display: "flex", gap: 5 }}>
                                    {["#EF4444","#F59E0B","#22C55E"].map(c => (
                                        <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block", opacity: 0.7 }}/>
                                    ))}
                                </div>
                                <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600 }}>Preview</span>
                            </div>
                            <button onClick={() => setModalAberto(true)} style={{ width: "100%", border: "none", background: "transparent", padding: 0, cursor: "zoom-in" }}>
                                <img src={demoAtual.img} alt={demoAtual.titulo} style={{ width: "100%", display: "block", borderRadius: 14, border: "1px solid rgba(26,43,66,0.07)", boxShadow: "0 8px 32px rgba(26,43,66,0.08)" }}/>
                            </button>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 8, marginTop: 12 }}>
                                {demos.map(item => {
                                    const active = item.id === demoAtivo;
                                    return (
                                        <button key={item.id} onClick={() => setDemoAtivo(item.id)} style={{
                                            display: "flex", alignItems: "center", gap: 8, textAlign: "left",
                                            borderRadius: 12, padding: 9,
                                            border: active ? "1px solid rgba(21,195,221,0.35)" : "1px solid var(--border)",
                                            background: active ? "rgba(21,195,221,0.07)" : "var(--surface)",
                                            cursor: "pointer",
                                        }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                background: active ? "rgba(21,195,221,0.14)" : "rgba(26,43,66,0.04)",
                                                color: active ? "var(--cyan)" : "var(--text-dim)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontWeight: 900, fontSize: 11,
                                            }}>{item.step}</div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.titulo}</div>
                                                <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>{item.badge}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Features ──────────────────────────────────────────────────── */}
                <section style={{ marginBottom: 72 }}>
                    <div style={{ textAlign: "center", marginBottom: 36 }}>
                        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>O que está incluso no Whallet+</h2>
                        <p style={{ fontSize: 15, color: "var(--text-dim)", margin: 0 }}>Tudo que você precisa para sair das planilhas de vez.</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))", gap: 14 }}>
                        {features.map(f => (
                            <div key={f.titulo} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 20px" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                                    <span style={{ fontSize: 26 }}>{f.emoji}</span>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                                        padding: "3px 9px", borderRadius: 20,
                                        background: f.ok ? "rgba(21,195,221,0.08)" : "rgba(26,43,66,0.05)",
                                        border: f.ok ? "1px solid rgba(21,195,221,0.2)" : "1px solid var(--border)",
                                        color: f.ok ? "var(--cyan-dark)" : "var(--text-dim)",
                                    }}>{f.badge}</span>
                                </div>
                                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6, fontSize: 14.5 }}>{f.titulo}</div>
                                <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65 }}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Alertas de e-mail ─────────────────────────────────────────── */}
                <section style={{ marginBottom: 72 }}>
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center",
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 24, padding: "40px 36px",
                    }} className="gf-alerta-grid">
                        <div>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
                                background: "rgba(21,195,221,0.07)", border: "1px solid rgba(21,195,221,0.18)",
                                borderRadius: 999, padding: "5px 14px",
                                fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)",
                            }}>🔔 ALERTAS DE VENCIMENTO</div>
                            <h2 style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                                Nunca mais esqueça um vencimento
                            </h2>
                            <p style={{ color: "var(--text-dim)", fontSize: 14.5, lineHeight: 1.75, margin: "0 0 20px" }}>
                                Configure alertas automáticos por e-mail para títulos vencidos e a vencer.
                                Defina quantos dias antes você quer ser notificado — o sistema cuida do resto.
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {[
                                    { icon: "📬", label: "Alerta de títulos a vencer", desc: "Receba notificação X dias antes do vencimento (configurável)" },
                                    { icon: "🚨", label: "Alerta de títulos vencidos", desc: "Notificação diária dos títulos que já passaram da data" },
                                    { icon: "⚙️", label: "Totalmente configurável",    desc: "Ative, desative e ajuste a antecedência nas preferências" },
                                ].map(a => (
                                    <div key={a.label} style={{ display: "flex", gap: 12, padding: "11px 14px", borderRadius: 12, background: "rgba(21,195,221,0.04)", border: "1px solid rgba(21,195,221,0.12)" }}>
                                        <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{a.label}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{a.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Visual mockup de e-mail */}
                        <div style={{ background: "var(--surface-2)", borderRadius: 18, padding: 20, border: "1px solid var(--border)" }}>
                            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(26,43,66,0.08)" }}>
                                <div style={{ background: "var(--text)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#0B1E36" }}>W</div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Whallet · Alerta de Vencimento</span>
                                </div>
                                <div style={{ padding: "16px" }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Você tem 2 títulos vencendo em 3 dias</div>
                                    {[
                                        { nome: "Energia Elétrica", valor: "R$ 320,00", data: "15/04" },
                                        { nome: "Internet Fibra",   valor: "R$ 180,00", data: "16/04" },
                                    ].map(t => (
                                        <div key={t.nome} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(26,43,66,0.06)" }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{t.nome}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Vence {t.data}</div>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cyan)" }}>{t.valor}</div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: 14, padding: "10px", borderRadius: 8, background: "var(--grad)", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#0B1E36" }}>
                                        Ver títulos no Whallet →
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Insights de IA — os 3 bots ───────────────────────────────── */}
                <section style={{ marginBottom: 72 }}>
                    <div style={{ textAlign: "center", marginBottom: 36 }}>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
                            background: "rgba(21,195,221,0.07)", border: "1px solid rgba(21,195,221,0.18)",
                            borderRadius: 999, padding: "5px 14px",
                            fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)",
                        }}>✨ INSIGHTS DE INTELIGÊNCIA ARTIFICIAL</div>
                        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>
                            Escolha seu assistente financeiro
                        </h2>
                        <p style={{ fontSize: 15, color: "var(--text-dim)", margin: "0 auto", maxWidth: 520, lineHeight: 1.7 }}>
                            Três personalidades diferentes analisam seus dados financeiros e entregam um insight por dia — do jeito que você prefere.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="gf-bots-grid">
                        {bots.map(b => (
                            <div key={b.key} style={{
                                background: "var(--surface)", border: "1px solid var(--border)",
                                borderRadius: 20, overflow: "hidden",
                                transition: "box-shadow 0.2s, transform 0.2s",
                            }}
                                 onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${b.borda}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                 onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                            >
                                {/* Header colorido */}
                                <div style={{ height: 4, background: `linear-gradient(90deg, ${b.cor}, ${b.cor}88)` }}/>
                                <div style={{ padding: "20px 20px 18px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                                        <img src={b.img} alt={b.nome} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${b.borda}` }}/>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{b.nome}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{b.desc}</div>
                                        </div>
                                    </div>
                                    <div style={{ padding: "12px 14px", borderRadius: 10, background: b.bg, border: `1px solid ${b.borda}`, fontSize: 13, color: "var(--text)", lineHeight: 1.65, fontStyle: "italic" }}>
                                        {b.frase}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-dim)" }}>
                        1 insight por dia, por bot · cache automático · dados financeiros resumidos enviados com segurança
                    </div>
                </section>

                {/* ── Parcelamento ─────────────────────────────────────────────── */}
                <section style={{ marginBottom: 72 }}>
                    <div style={{
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: 24, padding: "36px 32px",
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center",
                    }} className="gf-parcela-grid">
                        {/* Visual mockup parcelamento */}
                        <div>
                            <div style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(26,43,66,0.06)" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                                    Aluguel comercial — 3×
                                </div>
                                {[
                                    { parc: "1/3", venc: "15/05/2026", val: "R$ 4.000,00" },
                                    { parc: "2/3", venc: "15/06/2026", val: "R$ 4.000,00" },
                                    { parc: "3/3", venc: "15/07/2026", val: "R$ 4.000,00" },
                                ].map(p => (
                                    <div key={p.parc} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(26,43,66,0.05)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "rgba(21,195,221,0.08)", color: "var(--cyan-dark)" }}>{p.parc}</span>
                                            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{p.venc}</span>
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{p.val}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(21,195,221,0.05)", display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Total parcelado</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--cyan)" }}>R$ 12.000,00</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
                                background: "rgba(21,195,221,0.07)", border: "1px solid rgba(21,195,221,0.18)",
                                borderRadius: 999, padding: "5px 14px",
                                fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)",
                            }}>🔀 PARCELAMENTO AUTOMÁTICO</div>
                            <h2 style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                                Parcele em segundos, sem planilha
                            </h2>
                            <p style={{ color: "var(--text-dim)", fontSize: 14.5, lineHeight: 1.75, margin: "0 0 16px" }}>
                                Informe o valor total e a quantidade de parcelas — o sistema gera todos os títulos automaticamente, com datas de vencimento sequenciais e saldo proporcional.
                            </p>
                            {[
                                "Vencimentos calculados automaticamente",
                                "Saldo dividido de forma proporcional",
                                "Cada parcela é um título independente",
                                "Baixa individual por parcela",
                            ].map(item => (
                                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13.5, color: "var(--text-muted)" }}>
                                    <span style={{ color: "var(--cyan)", fontWeight: 900, flexShrink: 0 }}>✓</span> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Relatórios ───────────────────────────────────────────────── */}
                <section style={{ marginBottom: 72 }}>
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>Relatórios financeiros completos</h2>
                        <p style={{ fontSize: 15, color: "var(--text-dim)", margin: 0 }}>Exporte em Excel ou PDF com um clique.</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14 }}>
                        {[
                            { emoji: "📈", titulo: "Fluxo de caixa",          desc: "Soma de saldo em aberto por mês — visualize o compromisso financeiro futuro." },
                            { emoji: "⏳", titulo: "Aging de vencidos",        desc: "Agrupa títulos vencidos por faixas: 0–30, 31–60, 61–90 e acima de 90 dias." },
                            { emoji: "🏢", titulo: "Top fornecedores",         desc: "Ranking dos fornecedores com maior saldo em aberto." },
                            { emoji: "🗂️", titulo: "Por categoria de gasto",   desc: "Concentração de despesas por tipo — identifique onde está seu dinheiro." },
                        ].map(r => (
                            <div key={r.titulo} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 18px" }}>
                                <div style={{ fontSize: 24, marginBottom: 10 }}>{r.emoji}</div>
                                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6, fontSize: 14 }}>{r.titulo}</div>
                                <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.6 }}>{r.desc}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                        {["Exportação Excel (.xlsx)","Exportação PDF","Filtros por status e período","Ordenação por vencimento"].map(tag => (
                            <span key={tag} style={{ padding: "5px 14px", borderRadius: 999, background: "rgba(21,195,221,0.07)", border: "1px solid rgba(21,195,221,0.18)", fontSize: 12, fontWeight: 600, color: "var(--cyan-dark)" }}>{tag}</span>
                        ))}
                    </div>
                </section>

                {/* ── Comparativo de planos ─────────────────────────────────────── */}
                <section style={{ marginBottom: 72 }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px 24px" }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Compare os planos</h2>
                        <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "0 0 20px" }}>← Deslize para ver todos →</p>
                        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(150px,1fr))", minWidth: 460 }}>
                                {planos.map((p, i) => (
                                    <div key={p.nome} style={{ padding: "0 16px", borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: p.cor, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.nome}</div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 16, lineHeight: 1.3 }}>{p.preco}</div>
                                        {linhas.map((label, j) => (
                                            <div key={label} style={{ padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
                                                <div style={{ color: "var(--text-dim)", marginBottom: 2 }}>{label}</div>
                                                <div style={{ fontWeight: 600, color: p.items[j] === "✓" ? "var(--cyan)" : p.items[j] === "—" ? "var(--text-dim)" : "var(--text)" }}>
                                                    {p.items[j]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA final ─────────────────────────────────────────────────── */}
                <div style={{
                    background: "linear-gradient(135deg, rgba(21,195,221,0.04), rgba(21,195,221,0.08))",
                    border: "1px solid rgba(21,195,221,0.18)",
                    borderRadius: 20, padding: "40px 32px", textAlign: "center",
                }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>Pronto para começar?</h2>
                    <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 24px" }}>
                        Cancele quando quiser. Sem fidelidade, sem taxa de cancelamento.
                    </p>
                    <button onClick={handleUpgrade} disabled={carregando} style={{
                        padding: "14px 36px", borderRadius: 12,
                        background: "var(--grad)", border: "none",
                        color: "#0B1E36", fontWeight: 800, fontSize: 16,
                        cursor: "pointer", opacity: carregando ? 0.7 : 1,
                    }}>
                        {carregando ? "Redirecionando..." : autenticado ? "Assinar agora — R$ 39,90/mês" : "Criar conta e assinar"}
                    </button>
                    {!autenticado && (
                        <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>
                            Já tem conta?{" "}
                            <Link to="/login" style={{ color: "var(--cyan-dark)" }}>Entrar</Link>
                        </p>
                    )}
                </div>
            </div>

            {/* ── Modal screenshot ──────────────────────────────────────────────── */}
            {modalAberto && (
                <div onClick={() => setModalAberto(false)} style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
                    zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 20, cursor: "zoom-out",
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: "min(1280px,96vw)", maxHeight: "92vh",
                        background: "#fff", borderRadius: 20, overflow: "hidden",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                    }}>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(26,43,66,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <div>
                                <div style={{ fontWeight: 900, color: "var(--text)", fontSize: 16, marginBottom: 2 }}>{demoAtual.titulo}</div>
                                <div style={{ color: "var(--text-dim)", fontSize: 13 }}>{demoAtual.badge}</div>
                            </div>
                            <button onClick={() => setModalAberto(false)} style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 700, color: "var(--text)", fontSize: 13 }}>Fechar</button>
                        </div>
                        <div style={{ maxHeight: "calc(92vh - 74px)", overflow: "auto", background: "var(--surface-2)" }}>
                            <img src={demoAtual.img} alt={demoAtual.titulo} style={{ width: "100%", display: "block" }}/>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            @media (max-width: 860px) {
                .gf-demo-grid    { grid-template-columns: 1fr !important; }
                .gf-alerta-grid  { grid-template-columns: 1fr !important; }
                .gf-parcela-grid { grid-template-columns: 1fr !important; }
                .gf-bots-grid    { grid-template-columns: 1fr !important; }
            }
        `}</style>
        </>
    );
}
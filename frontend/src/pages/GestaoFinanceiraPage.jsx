import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";
const PLANO_PRO          = "10000000-0000-0000-0000-000000000002";

export default function GestaFinanceiraPage() {
    const { usuario, autenticado } = useAuth();
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro]             = useState("");
    const navigate = useNavigate();

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = isAdmin || usuario?.planoId === PLANO_WHALLET_PLUS;
    const temPro         = isAdmin || usuario?.planoId === PLANO_PRO || temWhalletPlus;

    // Só redireciona se estiver logado E tiver o plano
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

    const features = [
        { icon: "📋", titulo: "Contas a pagar",        desc: "Cadastre títulos manualmente ou importe via Excel. Controle vencimentos, saldos e status em tempo real.",         badge: "Disponível",   badgeColor: "#6c5310" },
        { icon: "📊", titulo: "Relatórios financeiros", desc: "Visão consolidada por período, fornecedor e status. Exporte para Excel ou PDF com um clique.",                   badge: "Em breve",     badgeColor: "#4D4A42" },
        { icon: "🔔", titulo: "Alertas de vencimento",  desc: "Receba e-mails automáticos dias antes do vencimento. Configure a antecedência conforme sua necessidade.",       badge: "Em breve",     badgeColor: "#4D4A42" },
        { icon: "🏦", titulo: "Remessa CNAB integrada", desc: "Gere arquivos de remessa bancária diretamente dos títulos cadastrados — sem redigitar dados.",                   badge: "Em breve",     badgeColor: "#4D4A42" },
        { icon: "📥", titulo: "Importação via Excel",   desc: "Compatível com exportações do Protheus (SE2/E2) e planilhas customizadas. Importe centenas de títulos.",        badge: "Disponível",   badgeColor: "#6c5310" },
        { icon: "🔄", titulo: "Integração Protheus",    desc: "Busque títulos diretamente do ERP, gere remessas e faça write-back de baixas automaticamente.",                 badge: "Sob consulta", badgeColor: "#7B766A" },
    ];

    const planos = [
        { nome: "Gratuito", preco: "R$ 0",         cor: "var(--text-dim)", items: ["8/mês",    "Excel e PDF", "Todos", "—",  "—",  "—" ] },
        { nome: "Pro",      preco: "R$ 18,90/mês", cor: "#4D4A42",         items: ["Ilimitado","Excel e PDF", "Todos", "—",  "—",  "—" ] },
        { nome: "Whallet+", preco: "R$ 39,90/mês", cor: "#6c5310",         items: ["Ilimitado","Excel e PDF", "Todos", "✓",  "✓",  "✓" ] },
    ];
    const linhas = ["Conversões", "Formato", "Bancos", "Contas a pagar", "Alertas e-mail", "Remessa integrada"];

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 64px" }}>

            {/* ── Hero ── */}
            <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.28)",
                    borderRadius: 20, padding: "6px 18px", marginBottom: 24,
                    fontSize: 12, fontWeight: 700, color: "#6c5310", letterSpacing: "0.06em"
                }}>✦ WHALLET+ — GESTÃO FINANCEIRA</div>

                <h1 style={{
                    fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 900, color: "var(--text)",
                    margin: "0 0 16px", letterSpacing: "-0.025em", lineHeight: 1.1
                }}>
                    Controle financeiro integrado<br/>
                    <span style={{ color: "#6c5310" }}>ao seu workflow bancário</span>
                </h1>

                <p style={{ color: "var(--text-dim)", fontSize: 17, margin: "0 auto 32px", maxWidth: 540, lineHeight: 1.7 }}>
                    EM DESENVOLVIMENTO...
                </p>

                <p style={{ color: "var(--text-dim)", fontSize: 17, margin: "0 auto 32px", maxWidth: 540, lineHeight: 1.7 }}>
                    Do cadastro de títulos à geração de remessa CNAB — tudo em uma única plataforma,
                    sem planilhas paralelas ou retrabalho.
                </p>

                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={handleUpgrade} disabled={carregando} style={{
                        padding: "14px 32px", borderRadius: 12,
                        background: "var(--grad)",
                        border: "1px solid rgba(212,160,23,0.45)", color: "#1a1a1a", fontWeight: 800, fontSize: 16,
                        cursor: "pointer", opacity: carregando ? 0.7 : 1
                    }}>
                        {carregando ? "Redirecionando..." : autenticado ? "Assinar Whallet+ — R$ 39,90/mês" : "Criar conta grátis e assinar"}
                    </button>
                    <Link to="/planos" style={{
                        padding: "14px 24px", borderRadius: 12, border: "1px solid var(--border)",
                        color: "var(--text-muted)", fontWeight: 600, fontSize: 15, textDecoration: "none",
                        display: "flex", alignItems: "center"
                    }}>Ver todos os planos</Link>
                </div>

                {erro && <div style={{ marginTop: 16, fontSize: 14, color: "var(--warning)" }}>{erro}</div>}

                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16,
                    background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)",
                    borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#6c5310", fontWeight: 600
                }}>🎯 Preço beta — promocional para os primeiros usuários</div>
            </div>

            {/* ── Placeholder screenshot ── */}
            <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 20, padding: "48px 24px", marginBottom: 56, textAlign: "center"
            }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                <div style={{ fontSize: 14, color: "var(--text-dim)" }}>Screenshots das rotinas em breve</div>
            </div>

            {/* ── Features ── */}
            <div style={{ marginBottom: 56 }}>
                <h2
                    style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--text)",
                        margin: "0 0 24px",
                        textAlign: "center",
                    }}
                >
                    O que está incluso no{" "}
                    <span
                        style={{
                            background: "linear-gradient(135deg, rgb(245, 158, 11), rgb(252, 211, 77))",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            display: "inline-block",
                        }}
                    >
    Whallet+
  </span>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                    {features.map(f => (
                        <div key={f.titulo} style={{
                            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 20px"
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                <span style={{ fontSize: 28 }}>{f.icon}</span>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", padding: "3px 10px",
                                    borderRadius: 20, background: `${f.badgeColor}18`, border: `1px solid ${f.badgeColor}40`, color: f.badgeColor
                                }}>{f.badge}</span>
                            </div>
                            <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6, fontSize: 15 }}>{f.titulo}</div>
                            <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65 }}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Comparação — scroll horizontal no mobile ── */}
            <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 20, padding: "32px 24px", marginBottom: 40
            }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
                    Compare os planos
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "0 0 20px" }}>
                    ← Deslize para ver todos os planos →
                </p>
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", cursor: "grab" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(150px, 1fr))", minWidth: 460, gap: 0 }}>
                        {planos.map((p, i) => (
                            <div key={p.nome} style={{ padding: "0 16px", borderLeft: i > 0 ? "1px solid var(--border)" : "none" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: p.cor, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.nome}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 16, lineHeight: 1.3 }}>{p.preco}</div>
                                {linhas.map((label, j) => (
                                    <div key={label} style={{ padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
                                        <div style={{ color: "var(--text-dim)", marginBottom: 2 }}>{label}</div>
                                        <div style={{
                                            fontWeight: 600,
                                            color: p.items[j] === "✓" ? "#6c5310" : p.items[j] === "—" ? "var(--text-dim)" : "var(--text)"
                                        }}>{p.items[j]}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CTA final ── */}
            <div style={{
                background: "linear-gradient(135deg, rgba(17,17,17,0.03), rgba(212,160,23,0.08))",
                border: "1px solid rgba(212,160,23,0.2)", borderRadius: 20, padding: "40px 32px", textAlign: "center"
            }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>Pronto para começar?</h2>
                <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 24px" }}>
                    Cancele quando quiser. Sem fidelidade, sem taxa de cancelamento.
                </p>
                <button onClick={handleUpgrade} disabled={carregando} style={{
                    padding: "14px 36px", borderRadius: 12,
                    background: "var(--grad)",
                    border: "1px solid rgba(212,160,23,0.45)", color: "#1a1a1a", fontWeight: 800, fontSize: 16,
                    cursor: "pointer", opacity: carregando ? 0.7 : 1
                }}>
                    {carregando ? "Redirecionando..." : autenticado ? "Assinar agora — R$ 39,90/mês" : "Criar conta e assinar"}
                </button>
                {!autenticado && (
                    <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>
                        Já tem conta? <Link to="/login" style={{ color: "#6c5310" }}>Entrar</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
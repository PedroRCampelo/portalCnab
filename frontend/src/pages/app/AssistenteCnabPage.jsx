import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import elvisImg from "../../assets/bots/elvis.png";
import CnabChatPage from "./CnabChatPage.jsx";

const PLANO_PRO          = "10000000-0000-0000-0000-000000000002";
const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

const PLANOS = [
    {
        id:       "gratuito",
        emoji:    "🚀",
        nome:     "Gratuito",
        preco:    "R$ 0",
        per:      "/mês",
        items:    ["8 conversões/mês", "Excel e PDF", "Todos os bancos"],
        cta:      "Criar conta grátis",
        destaque: false,
        temElvis: false,
    },
    {
        id:       "pro",
        emoji:    "⚡",
        nome:     "Pro",
        preco:    "R$ 18,90",
        per:      "/mês",
        items:    ["Conversões ilimitadas", "Todos os bancos", "Histórico completo", "✓ Agente Elvis — IA CNAB"],
        cta:      "Assinar Pro",
        destaque: false,
        temElvis: true,
    },
    {
        id:       "whallet-plus",
        emoji:    "✨",
        nome:     "Whallet+",
        preco:    "R$ 39,90",
        per:      "/mês",
        items:    ["Tudo do Pro", "Gestão financeira", "Alertas de e-mail", "Insights de IA (Aurora, Frank, Anne)", "✓ Agente Elvis — IA CNAB"],
        cta:      "Assinar Whallet+",
        destaque: true,
        temElvis: true,
    },
];

export default function AssistenteCnabPage() {
    const { autenticado, usuario } = useAuth();
    const navigate = useNavigate();

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temPro         = usuario?.planoId === PLANO_PRO;
    const temWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS;
    const temAcesso      = isAdmin || temPro || temWhalletPlus;

    // Se tem acesso → entrega o chat diretamente
    if (autenticado && temAcesso) {
        return <CnabChatPage/>;
    }

    // Sem acesso → página de apresentação com planos
    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 80px" }}>

            {/* ── Hero ── */}
            <div style={{
                background: "var(--text)", borderRadius: 24, padding: "48px 40px",
                display: "grid", gridTemplateColumns: "1fr auto", gap: 40,
                alignItems: "center", marginBottom: 48, overflow: "hidden", position: "relative",
            }} className="elvis-hero-grid">
                {/* Orb decorativo */}
                <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(21,195,221,0.08)", top: -100, right: 200, pointerEvents: "none" }}/>

                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "rgba(21,195,221,0.15)", border: "1px solid rgba(21,195,221,0.3)", borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "#4CDDE8", letterSpacing: "0.06em" }}>
                        🤖 AGENTE DE IA · CNAB
                    </div>
                    <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        Conheça o Elvis,<br/>seu especialista em CNAB
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.8, margin: "0 0 28px", maxWidth: 440 }}>
                        Envie dúvidas sobre layouts bancários, segmentos e campos CNAB. O Elvis analisa arquivos de remessa e responde com base na documentação oficial dos bancos.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                        {[
                            "Responde perguntas sobre CNAB 240 e 400",
                            "Analisa arquivos de remessa em tempo real",
                            "Identifica erros com base no manual do banco",
                            "Suporte a Itaú, Bradesco, BB e Caixa",
                        ].map(f => (
                            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                                <span style={{ color: "#4CDDE8", fontSize: 11 }}>✓</span> {f}
                            </div>
                        ))}
                    </div>

                    {/* CTA baseado no estado */}
                    {!autenticado ? (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <Link to="/cadastro" state={{ plano: "pro" }} style={{ padding: "11px 24px", borderRadius: 10, background: "var(--grad)", color: "#0B1E36", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                                Criar conta e usar Elvis →
                            </Link>
                            <Link to="/login" style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none" }}>
                                Já tenho conta
                            </Link>
                        </div>
                    ) : (
                        <Link to="/planos" style={{ display: "inline-block", padding: "11px 24px", borderRadius: 10, background: "var(--grad)", color: "#0B1E36", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                            Fazer upgrade para acessar →
                        </Link>
                    )}
                </div>

                {/* Elvis foto */}
                <div style={{ textAlign: "center", position: "relative", zIndex: 1, flexShrink: 0 }} className="elvis-photo-wrap">
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: "rgba(21,195,221,0.15)", animation: "elvisHalo 3s ease-in-out infinite" }}/>
                        <img src={elvisImg} alt="Elvis" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(21,195,221,0.4)", position: "relative", zIndex: 1 }}/>
                    </div>
                    <div style={{ marginTop: 12, fontSize: 16, fontWeight: 800, color: "#fff" }}>Elvis</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Especialista em CNAB</div>

                    {/* Balão de exemplo */}
                    <div style={{
                        marginTop: 16, padding: "10px 14px",
                        background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "4px 12px 12px 12px",
                        fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6,
                        textAlign: "left", maxWidth: 200,
                    }}>
                        "O segmento J é obrigatório para pagamento de boletos no CNAB 240..."
                    </div>
                </div>
            </div>

            {/* ── Planos ── */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                    Escolha um plano para começar
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                    O Agente Elvis está disponível nos planos Pro e Whallet+.
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="elvis-planos-grid">
                {PLANOS.map(p => {
                    const ehAtual = (p.id === "pro" && temPro) || (p.id === "whallet-plus" && temWhalletPlus);
                    return (
                        <div key={p.id} style={{
                            background: p.destaque ? "var(--text)" : "#fff",
                            border: p.destaque ? "none" : "1px solid var(--border)",
                            borderRadius: 16, padding: "24px 20px",
                            position: "relative",
                            boxShadow: p.destaque ? "0 8px 32px rgba(26,43,66,0.15)" : "none",
                        }}>
                            {p.destaque && (
                                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "var(--grad)", color: "#0B1E36", fontSize: 10, fontWeight: 800, padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                                    MAIS COMPLETO
                                </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 20 }}>{p.emoji}</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: p.destaque ? "#fff" : "var(--text)" }}>{p.nome}</span>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 26, fontWeight: 900, color: p.destaque ? "#fff" : "var(--text)", letterSpacing: "-0.02em" }}>{p.preco}</span>
                                <span style={{ fontSize: 12, color: p.destaque ? "rgba(255,255,255,0.4)" : "var(--text-dim)", marginLeft: 4 }}>{p.per}</span>
                            </div>

                            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7 }}>
                                {p.items.map(item => (
                                    <li key={item} style={{
                                        fontSize: 12.5,
                                        color: p.destaque ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
                                        display: "flex", alignItems: "flex-start", gap: 7,
                                        fontWeight: item.startsWith("✓") ? 700 : 400,
                                    }}>
                                        {item.startsWith("✓") ? (
                                            <>
                                                <span style={{ color: "#4CDDE8", flexShrink: 0 }}>✓</span>
                                                <span style={{ color: p.destaque ? "#4CDDE8" : "var(--cyan-dark)" }}>
                                                    {item.replace("✓ ", "")}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ color: p.destaque ? "rgba(255,255,255,0.3)" : "rgba(26,43,66,0.3)", flexShrink: 0, fontSize: 10, marginTop: 3 }}>●</span>
                                                {item}
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {ehAtual ? (
                                <div style={{ padding: "10px", borderRadius: 8, background: "rgba(21,195,221,0.1)", border: "1px solid rgba(21,195,221,0.2)", textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--cyan-dark)" }}>
                                    ✓ Seu plano atual
                                </div>
                            ) : p.id === "gratuito" ? (
                                <Link to={autenticado ? "/" : "/cadastro"} style={{
                                    display: "block", padding: "10px", borderRadius: 8,
                                    border: "1px solid var(--border)", textAlign: "center",
                                    fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none",
                                }}>
                                    {autenticado ? "Plano atual" : "Começar grátis"}
                                </Link>
                            ) : (
                                <button onClick={() => {
                                    if (!autenticado) {
                                        navigate("/cadastro", { state: { plano: p.id } });
                                    } else {
                                        navigate("/upgrade");
                                    }
                                }} style={{
                                    width: "100%", padding: "10px", borderRadius: 8, border: "none",
                                    background: p.destaque ? "var(--grad)" : "var(--text)",
                                    color: p.destaque ? "#0B1E36" : "#fff",
                                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                                    transition: "opacity 0.15s",
                                }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                    {autenticado ? "Fazer upgrade" : p.cta}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes elvisHalo { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }
                @media (max-width: 768px) {
                    .elvis-hero-grid   { grid-template-columns: 1fr !important; }
                    .elvis-photo-wrap  { display: none !important; }
                    .elvis-planos-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 540px) {
                    .elvis-planos-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
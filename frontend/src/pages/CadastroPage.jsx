import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api.js";

function aplicarMascaraTelefone(valor) {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length === 0) return "";
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 6) return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
}

const PLANOS = [
    {
        id: "gratuito", emoji: "🚀", nome: "Gratuito", preco: "R$ 0", per: "/mês",
        items: ["8 conversões/mês", "Excel e PDF", "Todos os bancos"],
        cta: "Criar conta gratuita", destaque: false,
    },
    {
        id: "pro", emoji: "⚡", nome: "Pro", preco: "R$ 18,90", per: "/mês",
        items: ["Conversões ilimitadas", "Excel e PDF", "Todos os bancos", "Agente Elvis (IA CNAB)"],
        cta: "Criar conta Pro", destaque: false,
    },
    {
        id: "whallet-plus", emoji: "✨", nome: "Whallet+", preco: "R$ 39,90", per: "/mês",
        items: ["Tudo do Pro", "Gestão financeira", "Alertas e-mail", "Insights de IA"],
        cta: "Criar conta Whallet+", destaque: true,
    },
];

export default function CadastroPage() {
    const location     = useLocation();
    const planoInicial = location.state?.plano ?? "gratuito";

    const [plano,      setPlano]      = useState(planoInicial);
    const [form,       setForm]       = useState({ nome: "", email: "", telefone: "", senha: "", confirmarSenha: "" });
    const [erro,       setErro]       = useState("");
    const [carregando, setCarregando] = useState(false);
    const [ok,         setOk]         = useState("");

    const atualizar = (c, v) => setForm(p => ({ ...p, [c]: v }));
    const planoAtual  = PLANOS.find(p => p.id === plano);
    const precisaPagar = plano !== "gratuito";

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (form.senha !== form.confirmarSenha) { setErro("As senhas não coincidem"); return; }
        if (form.senha.length < 8) { setErro("Mínimo 8 caracteres na senha"); return; }
        setCarregando(true);
        try {
            await api.post("/api/auth/cadastro", { nome: form.nome, email: form.email, senha: form.senha, telefone: form.telefone || null });
            setOk(form.email);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar conta.");
            setCarregando(false);
        }
    }

    // ── Sucesso ───────────────────────────────────────────────────────────────
    if (ok) return (
        <div className="cad-fullheight" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflow: "hidden" }}>
            <div style={{ width: "100%", maxWidth: 440, background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(30,41,59,0.07)" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>✉️</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>Verifique seu e-mail</h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.7 }}>
                    Enviamos um link para <strong>{ok}</strong>. Clique para ativar sua conta.
                </p>
                {precisaPagar && (
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.2)", fontSize: 13, color: "var(--text-muted)", marginBottom: 20, textAlign: "left" }}>
                        <strong style={{ color: "var(--text)" }}>Plano {planoAtual?.nome}</strong> — após confirmar o e-mail e fazer login, você será direcionado ao pagamento.
                    </div>
                )}
                <Link to="/login" state={precisaPagar ? { planoAposLogin: plano } : undefined} className="auth-box-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                    Ir para o login →
                </Link>
                <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 14 }}>
                    Não recebeu?{" "}
                    <button onClick={async () => { await api.post("/api/auth/reenviar-verificacao", { email: ok }); alert("Reenviado!"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0, color: "var(--cyan-dark)", fontWeight: 600 }}>
                        Reenviar
                    </button>
                </p>
            </div>
        </div>
    );

    // ── Layout 2 colunas ─────────────────────────────────────────────────────
    return (
        <div className="cad-fullheight" style={{ display: "flex", overflow: "hidden" }}>

            {/* Coluna esquerda — planos */}
            <div className="cad-col-left" style={{
                width: 380, flexShrink: 0,
                background: "var(--text)",
                display: "flex", flexDirection: "column",
                padding: "32px 28px",
                overflowY: "auto",
            }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Escolha seu plano</h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Cancele quando quiser.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {PLANOS.map(p => {
                        const ativo = plano === p.id;
                        return (
                            <button key={p.id} type="button" onClick={() => setPlano(p.id)} style={{
                                padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                                border: ativo ? "2px solid var(--cyan)" : "1.5px solid rgba(255,255,255,0.08)",
                                background: ativo ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)",
                                transition: "all 0.15s", position: "relative",
                            }}>
                                {p.destaque && (
                                    <span style={{ position: "absolute", top: -9, right: 12, background: "var(--grad)", color: "#083344", fontSize: 9, fontWeight: 800, padding: "2px 10px", borderRadius: 20 }}>MAIS COMPLETO</span>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: ativo ? "#22D3EE" : "rgba(255,255,255,0.7)" }}>
                                        {p.emoji} {p.nome}
                                    </span>
                                    <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{p.preco}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>{p.per}</span></span>
                                </div>
                                {p.items.map(i => (
                                    <div key={i} style={{ fontSize: 11, color: ativo ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)", display: "flex", gap: 6, marginBottom: 3 }}>
                                        <span style={{ color: ativo ? "#22D3EE" : "rgba(255,255,255,0.2)", flexShrink: 0 }}>✓</span>{i}
                                    </div>
                                ))}
                                {ativo && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(6,182,212,0.25)", fontSize: 10, color: "#22D3EE", fontWeight: 700 }}>● Selecionado</div>}
                            </button>
                        );
                    })}
                </div>

                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 16 }}>Cobrado mensalmente. Cancele sem multa.</p>
            </div>

            {/* Coluna direita — formulário */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 32px", overflowY: "auto", background: "var(--bg)" }}>
                <div style={{ width: "100%", maxWidth: 400 }}>
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 700, color: "var(--cyan-dark)" }}>
                            {planoAtual?.emoji} Plano {planoAtual?.nome}
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.03em" }}>Crie sua conta</h1>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                            {precisaPagar ? `${planoAtual?.preco}/mês após confirmação` : "Gratuito, sem cartão"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Nome completo</label>
                            <input type="text" placeholder="Seu nome" value={form.nome} onChange={e => atualizar("nome", e.target.value)} required disabled={carregando}/>
                        </div>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>E-mail</label>
                            <input type="email" placeholder="seu@email.com" value={form.email} onChange={e => atualizar("email", e.target.value)} autoComplete="email" required disabled={carregando}/>
                        </div>
                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Telefone <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 11 }}>(opcional)</span></label>
                            <input type="tel" placeholder="(11) 91234-5678" value={form.telefone} onChange={e => atualizar("telefone", aplicarMascaraTelefone(e.target.value))} disabled={carregando} maxLength={16}/>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="cad-senha-row">
                            <div className="field-group" style={{ margin: 0 }}>
                                <label>Senha</label>
                                <input type="password" placeholder="Mín. 8 caracteres" value={form.senha} onChange={e => atualizar("senha", e.target.value)} autoComplete="new-password" required disabled={carregando}/>
                            </div>
                            <div className="field-group" style={{ margin: 0 }}>
                                <label>Confirmar</label>
                                <input type="password" placeholder="Repita" value={form.confirmarSenha} onChange={e => atualizar("confirmarSenha", e.target.value)} autoComplete="new-password" required disabled={carregando}/>
                            </div>
                        </div>

                        {erro && <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--error)", fontSize: 13 }}>⚠️ {erro}</div>}

                        <button type="submit" className="auth-box-btn" disabled={carregando || !form.nome || !form.email || !form.senha || !form.confirmarSenha} style={{ marginTop: 4 }}>
                            {carregando ? "Criando..." : planoAtual?.cta}
                        </button>
                    </form>

                    <p style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--text-dim)" }}>
                        Já tem conta?{" "}
                        <Link to="/login" style={{ color: "var(--cyan-dark)", fontWeight: 600, textDecoration: "none" }}>Fazer login</Link>
                    </p>

                    <style>{`
                        @media (max-width: 820px) { .cad-col-left { display: none !important; } }
                        @media (max-width: 480px) { .cad-senha-row { grid-template-columns: 1fr !important; } }
                    `}</style>
                </div>
            </div>
        </div>
    );
}
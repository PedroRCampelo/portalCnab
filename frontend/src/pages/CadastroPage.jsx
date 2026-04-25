import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import GoogleLoginButton from "../components/GoogleLoginButton.jsx";

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
        id: "gratuito", nome: "Gratuito", preco: "R$ 0", per: "/mês",
        tag: null,
        items: ["8 conversões/mês", "Excel e PDF", "Todos os bancos"],
        cta: "Criar conta gratuita",
    },
    {
        id: "pro", nome: "Pro", preco: "R$ 18,90", per: "/mês",
        tag: null,
        items: ["Conversões ilimitadas", "Excel e PDF", "Todos os bancos", "Agente Elvis IA"],
        cta: "Criar conta Pro",
    },
    {
        id: "whallet-plus", nome: "Whallet+", preco: "R$ 39,90", per: "/mês",
        tag: "MAIS COMPLETO",
        items: ["Tudo do Pro", "Gestão financeira", "Alertas e-mail", "Insights de IA"],
        cta: "Criar conta Whallet+",
    },
];

export default function CadastroPage() {
    const location     = useLocation();
    const navigate     = useNavigate();
    const { login }    = useAuth();
    const planoInicial = location.state?.plano ?? "gratuito";

    const [plano,      setPlano]      = useState(planoInicial);
    const [form,       setForm]       = useState({ nome: "", email: "", telefone: "", senha: "", confirmarSenha: "" });
    const [erro,       setErro]       = useState("");
    const [carregando, setCarregando] = useState(false);
    const [ok,         setOk]         = useState("");
    const [showPass,   setShowPass]   = useState(false);

    const atualizar    = (c, v) => setForm(p => ({ ...p, [c]: v }));
    const planoAtual   = PLANOS.find(p => p.id === plano);
    const precisaPagar = plano !== "gratuito";

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (form.senha !== form.confirmarSenha) { setErro("As senhas não coincidem."); return; }
        if (form.senha.length < 8) { setErro("Mínimo 8 caracteres na senha."); return; }
        setCarregando(true);
        try {
            await api.post("/api/auth/cadastro", {
                nome: form.nome, email: form.email,
                senha: form.senha, telefone: form.telefone || null,
            });
            setOk(form.email);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar conta.");
            setCarregando(false);
        }
    }

    // Cadastro via Google: o backend já cria o usuário se não existir.
    // Diferente do email/senha, não passa pela tela de "verifique seu email"
    // porque o Google já verificou. Vai direto pro app (ou checkout, se plano pago).
    async function handleGoogleSuccess(idToken) {
        setErro("");
        setCarregando(true);
        try {
            const { data } = await api.post("/api/auth/google", { idToken });
            login(data);

            if (precisaPagar) {
                const endpoint = plano === "pro"
                    ? "/api/stripe/checkout/pro"
                    : "/api/stripe/checkout/whallet-plus";
                try {
                    const { data: stripe } = await api.post(endpoint);
                    window.location.href = stripe.url;
                    return;
                } catch {
                    navigate("/planos", { replace: true });
                    return;
                }
            }
            navigate("/", { replace: true });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao cadastrar com Google.");
            setCarregando(false);
        }
    }

    /* ── Sucesso ─────────────────────────────────────────────────────────── */
    if (ok) return (
        <div className="auth-wrap">
            <div className="auth-box" style={{ textAlign: "center" }}>
                <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(21,195,221,0.1)",
                    border: "1px solid rgba(21,195,221,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, margin: "0 auto 20px",
                }}>✉️</div>

                <h2 className="auth-box-title">Verifique seu e-mail</h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 6px", lineHeight: 1.7 }}>
                    Enviamos um link de ativação para
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 20px" }}>{ok}</p>

                {precisaPagar && (
                    <div style={{
                        padding: "12px 14px", borderRadius: 10, marginBottom: 20, textAlign: "left",
                        background: "rgba(21,195,221,0.05)", border: "1px solid rgba(21,195,221,0.2)",
                        fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6,
                    }}>
                        <strong style={{ color: "var(--text)" }}>Plano {planoAtual?.nome}</strong> — após confirmar o e-mail e fazer login, você será direcionado ao pagamento.
                    </div>
                )}

                <Link
                    to="/login"
                    state={precisaPagar ? { planoAposLogin: plano } : undefined}
                    className="auth-box-btn"
                    style={{ display: "block", textDecoration: "none" }}
                >
                    Ir para o login →
                </Link>

                <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 14 }}>
                    Não recebeu?{" "}
                    <button
                        onClick={async () => {
                            await api.post("/api/auth/reenviar-verificacao", { email: ok });
                            alert("Reenviado!");
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0, color: "var(--cyan-dark)", fontWeight: 600 }}
                    >
                        Reenviar
                    </button>
                </p>
            </div>
        </div>
    );

    /* ── Layout principal ────────────────────────────────────────────────── */
    return (
        <div className="cad-fullheight" style={{ display: "flex", overflow: "hidden", height: "100vh" }}>

            {/* ── Coluna esquerda: seletor de planos (desktop only) ─────────
                Estrutura nova:
                - Container com altura fixa da viewport, sem scroll
                - Conteúdo interno: header + cards + spacer flex + footer
                - O spacer (flex:1) ocupa o espaço vazio entre cards e footer
                  empurrando o "Cobrado mensalmente..." pra baixo elegantemente */}
            <div className="cad-col-planos" style={{
                width: 340, flexShrink: 0,
                background: "var(--navy-deep)",
                display: "flex", flexDirection: "column",
                padding: "36px 24px",
                position: "relative",
                height: "100%",
                overflow: "hidden",
            }}>
                {/* Grade decorativa */}
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    backgroundImage: `
                        linear-gradient(rgba(21,195,221,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(21,195,221,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: "36px 36px",
                }}/>
                <div style={{
                    position: "absolute", bottom: -60, left: -60,
                    width: 260, height: 260, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(21,195,221,0.1), transparent 65%)",
                    pointerEvents: "none",
                }}/>

                <div style={{
                    position: "relative", zIndex: 1,
                    display: "flex", flexDirection: "column",
                    height: "100%", minHeight: 0,
                }}>
                    {/* Logo */}
                    <div style={{ marginBottom: 32, flexShrink: 0 }}>
                        <span className="brand-wordmark" style={{ color: "#fff", fontSize: 20 }}>Whallet</span>
                    </div>

                    {/* Eyebrow + descrição */}
                    <div style={{ marginBottom: 20, flexShrink: 0 }}>
                        <div style={{
                            fontSize: 10, fontWeight: 600, color: "var(--cyan)",
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            marginBottom: 8, display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <span style={{ width: 18, height: 1, background: "var(--cyan)", display: "block" }}/>
                            Escolha seu plano
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
                            Cancele quando quiser, sem multa.
                        </p>
                    </div>

                    {/* Cards de plano — flexShrink: 0 garante tamanho natural */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                        {PLANOS.map(p => {
                            const ativo = plano === p.id;
                            return (
                                <button
                                    key={p.id} type="button"
                                    onClick={() => setPlano(p.id)}
                                    style={{
                                        padding: "13px 14px", borderRadius: 10,
                                        cursor: "pointer", textAlign: "left", width: "100%",
                                        border: ativo ? "1.5px solid rgba(21,195,221,0.5)" : "1.5px solid rgba(255,255,255,0.07)",
                                        background: ativo ? "rgba(21,195,221,0.08)" : "rgba(255,255,255,0.02)",
                                        transition: "all 0.15s", position: "relative",
                                    }}
                                >
                                    {p.tag && (
                                        <span style={{
                                            position: "absolute", top: -8, right: 10,
                                            background: "var(--cyan)", color: "var(--navy-deep)",
                                            fontSize: 8, fontWeight: 700, padding: "2px 8px",
                                            borderRadius: 20, letterSpacing: "0.06em",
                                        }}>{p.tag}</span>
                                    )}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: ativo ? "#fff" : "rgba(255,255,255,0.5)", marginBottom: 2 }}>
                                                {p.nome}
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: ativo ? "#fff" : "rgba(255,255,255,0.5)", letterSpacing: "-0.02em" }}>
                                                {p.preco}
                                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 2 }}>{p.per}</span>
                                            </div>
                                        </div>
                                        {ativo && (
                                            <div style={{
                                                width: 16, height: 16, borderRadius: "50%",
                                                background: "var(--cyan)", display: "flex",
                                                alignItems: "center", justifyContent: "center",
                                                fontSize: 9, color: "var(--navy-deep)", flexShrink: 0,
                                            }}>✓</div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        {p.items.map(item => (
                                            <div key={item} style={{
                                                fontSize: 11, display: "flex", gap: 5, alignItems: "center",
                                                color: ativo ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)",
                                            }}>
                                                <span style={{ color: ativo ? "var(--cyan-light)" : "rgba(255,255,255,0.18)", fontSize: 9 }}>✓</span>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Spacer: empurra o footer pra baixo SEM gerar scroll */}
                    <div style={{ flex: 1, minHeight: 14 }} />

                    {/* Footer */}
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0, flexShrink: 0 }}>
                        Cobrado mensalmente. Cancele a qualquer momento.
                    </p>
                </div>
            </div>

            {/* ── Coluna direita: formulário ───────────────────────────────── */}
            <div style={{
                flex: 1, display: "flex", alignItems: "flex-start",
                justifyContent: "center", overflowY: "auto",
                background: "var(--bg)", padding: "32px 24px",
                height: "100%",
            }}>
                <div style={{ width: "100%", maxWidth: 400, paddingTop: 8 }}>

                    {/* Header */}
                    <div style={{ marginBottom: 24 }}>
                        {/* Plano selecionado — badge visível em mobile */}
                        <div className="cad-plano-mobile" style={{
                            display: "none", marginBottom: 16,
                        }}>
                            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>Escolha o plano:</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {PLANOS.map(p => (
                                    <button
                                        key={p.id} type="button"
                                        onClick={() => setPlano(p.id)}
                                        style={{
                                            padding: "5px 12px", borderRadius: 999, fontSize: 12,
                                            fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                                            borderColor: plano === p.id ? "var(--cyan)" : "var(--border)",
                                            background: plano === p.id ? "rgba(21,195,221,0.08)" : "transparent",
                                            color: plano === p.id ? "var(--cyan-dark)" : "var(--text-muted)",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {p.nome} · {p.preco}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                            textTransform: "uppercase", color: "var(--cyan-dark)",
                            marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <span style={{ width: 18, height: 1, background: "var(--cyan-dark)", display: "block" }}/>
                            Nova conta
                        </div>
                        <h1 className="auth-box-title" style={{ fontSize: 24, margin: "0 0 6px" }}>
                            Crie sua conta
                        </h1>

                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <span style={{
                                padding: "3px 10px", borderRadius: 999, fontSize: 12,
                                fontWeight: 600, color: "var(--text)",
                                background: "rgba(30,41,59,0.06)",
                                border: "1px solid var(--border)",
                            }}>
                                {planoAtual?.nome}
                                <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>
                                    {" "}· {precisaPagar ? `${planoAtual?.preco}/mês` : "Gratuito"}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Botão Google */}
                    <GoogleLoginButton
                        onSuccess={handleGoogleSuccess}
                        onError={(msg) => setErro(msg)}
                        disabled={carregando}
                        texto="signup_with"
                    />

                    {/* Separador */}
                    <div className="auth-divisor">
                        <span>ou cadastre com e-mail</span>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        <div className="field-group" style={{ margin: 0 }}>
                            <label>Nome completo</label>
                            <input
                                type="text" placeholder="Seu nome"
                                value={form.nome} onChange={e => atualizar("nome", e.target.value)}
                                required disabled={carregando}
                            />
                        </div>

                        <div className="field-group" style={{ margin: 0 }}>
                            <label>E-mail</label>
                            <input
                                type="email" placeholder="seu@email.com"
                                value={form.email} onChange={e => atualizar("email", e.target.value)}
                                autoComplete="email" required disabled={carregando}
                            />
                        </div>

                        <div className="field-group" style={{ margin: 0 }}>
                            <label>
                                Telefone{" "}
                                <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 11 }}>(opcional)</span>
                            </label>
                            <input
                                type="tel" placeholder="(11) 91234-5678"
                                value={form.telefone}
                                onChange={e => atualizar("telefone", aplicarMascaraTelefone(e.target.value))}
                                disabled={carregando} maxLength={16}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="cad-senha-row">
                            <div className="field-group" style={{ margin: 0 }}>
                                <label>Senha</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="Mín. 8 chars"
                                        value={form.senha}
                                        onChange={e => atualizar("senha", e.target.value)}
                                        autoComplete="new-password" required disabled={carregando}
                                        style={{ paddingRight: 38 }}
                                    />
                                    <button
                                        type="button" onClick={() => setShowPass(s => !s)}
                                        style={{
                                            position: "absolute", right: 10, top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "var(--text-dim)", fontSize: 13, padding: 2, lineHeight: 1,
                                        }}
                                    >{showPass ? "🙈" : "👁️"}</button>
                                </div>
                            </div>
                            <div className="field-group" style={{ margin: 0 }}>
                                <label>Confirmar</label>
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="Repita"
                                    value={form.confirmarSenha}
                                    onChange={e => atualizar("confirmarSenha", e.target.value)}
                                    autoComplete="new-password" required disabled={carregando}
                                />
                            </div>
                        </div>

                        {form.senha.length > 0 && (
                            <div>
                                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                                    {[1,2,3,4].map(n => {
                                        const nivel = Math.min(Math.floor(form.senha.length / 2), 4);
                                        const cor = n <= nivel
                                            ? n <= 1 ? "#EF4444" : n <= 2 ? "#F59E0B" : n === 3 ? "#06B6D4" : "var(--cyan)"
                                            : "var(--border)";
                                        return <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: cor, transition: "background 0.3s" }}/>;
                                    })}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
                                    {form.senha.length < 4 ? "Fraca" : form.senha.length < 6 ? "Regular" : form.senha.length < 8 ? "Boa" : "Forte"}
                                </div>
                            </div>
                        )}

                        {erro && (
                            <div style={{
                                padding: "10px 14px", borderRadius: 8,
                                background: "rgba(220,38,38,0.05)",
                                border: "1px solid rgba(220,38,38,0.15)",
                                color: "var(--error)", fontSize: 13,
                            }}>{erro}</div>
                        )}

                        <button
                            type="submit"
                            className="auth-box-btn"
                            disabled={carregando || !form.nome || !form.email || !form.senha || !form.confirmarSenha}
                            style={{ marginTop: 4 }}
                        >
                            {carregando ? "Criando conta..." : planoAtual?.cta}
                        </button>
                    </form>

                    <p style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--text-dim)" }}>
                        Já tem conta?{" "}
                        <Link to="/login" style={{ color: "var(--cyan-dark)", fontWeight: 600, textDecoration: "none" }}>
                            Fazer login
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
                @media (max-width: 820px) {
                    .cad-col-planos { display: none !important; }
                    .cad-plano-mobile { display: block !important; }
                }
                @media (max-width: 480px) {
                    .cad-senha-row { grid-template-columns: 1fr !important; }
                }
                .auth-divisor {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    margin: 1.25rem 0;
                    color: var(--text-dim);
                    font-size: 0.8125rem;
                }
                .auth-divisor::before,
                .auth-divisor::after {
                    content: "";
                    flex: 1;
                    border-bottom: 1px solid var(--border);
                }
                .auth-divisor span {
                    padding: 0 0.875rem;
                }
            `}</style>
        </div>
    );
}
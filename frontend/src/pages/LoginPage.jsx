import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function LoginPage() {
    const [email,      setEmail]      = useState("");
    const [senha,      setSenha]      = useState("");
    const [erro,       setErro]       = useState("");
    const [carregando, setCarregando] = useState(false);

    const { login } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();

    const planoAposLogin = location.state?.planoAposLogin ?? null;
    const destino        = location.state?.from?.pathname ?? "/";

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);
        try {
            const { data } = await api.post("/api/auth/login", { email, senha });
            login(data);

            if (planoAposLogin === "pro" || planoAposLogin === "whallet-plus") {
                const endpoint = planoAposLogin === "pro"
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

            navigate(destino === "/login" ? "/" : destino, { replace: true });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao conectar com o servidor");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div style={{
            /* height via .auth-wrap CSS */
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, overflow: "hidden",
        }}>
            <div className="auth-box">
                <div className="auth-box-brand">
                    <span className="brand-wordmark">Whallet</span>
                </div>

                <h1 className="auth-box-title">Bem-vindo de volta</h1>
                <p className="auth-box-sub">Entre com sua conta para continuar</p>

                {planoAposLogin && (
                    <div style={{ marginBottom: 20, padding: "11px 14px", borderRadius: 10, background: "rgba(21,195,221,0.06)", border: "1px solid rgba(21,195,221,0.2)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                        <strong style={{ color: "var(--text)" }}>
                            {planoAposLogin === "pro" ? "⚡ Plano Pro" : "✨ Plano Whallet+"}
                        </strong><br/>
                        Após entrar, você será direcionado ao pagamento.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-box-form" noValidate>
                    <div className="field-group">
                        <label htmlFor="email">E-mail</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                               placeholder="seu@email.com" autoComplete="email" required disabled={carregando}/>
                    </div>
                    <div className="field-group">
                        <label htmlFor="senha">Senha</label>
                        <input id="senha" type="password" value={senha} onChange={e => setSenha(e.target.value)}
                               placeholder="••••••••" autoComplete="current-password" required disabled={carregando}/>
                        <div style={{ textAlign: "right", marginTop: 4 }}>
                            <Link to="/esqueci-senha" style={{ fontSize: 12, color: "var(--cyan-dark)", fontWeight: 600, textDecoration: "none" }}>
                                Esqueci minha senha
                            </Link>
                        </div>
                    </div>

                    {erro && <div className="auth-box-erro">{erro}</div>}

                    <button type="submit" className="auth-box-btn" disabled={carregando || !email || !senha}>
                        {carregando
                            ? (planoAposLogin ? "Entrando..." : "Entrando...")
                            : "Entrar"}
                    </button>
                </form>

                <p className="auth-box-footer">
                    Não tem conta?{" "}
                    <Link to="/cadastro" className="auth-box-link">Criar conta gratuita</Link>
                </p>

                <div className="auth-box-features">
                    <span>Itaú</span><span>Bradesco</span><span>BB</span><span>Caixa</span>
                </div>
            </div>
        </div>
    );
}
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
    const destino   = location.state?.from?.pathname ?? "/excel";

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);
        try {
            const { data } = await api.post("/api/auth/login", { email, senha });
            login(data);
            navigate(destino, { replace: true });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao conectar com o servidor");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-box">
                <div className="auth-box-brand">
                    <span className="brand-wordmark">Whallet</span>
                </div>

                <h1 className="auth-box-title">Bem-vindo de volta</h1>
                <p className="auth-box-sub">Entre com sua conta para continuar</p>

                <form onSubmit={handleSubmit} className="auth-box-form" noValidate>
                    <div className="field-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email"
                               value={email} onChange={(e) => setEmail(e.target.value)}
                               placeholder="seu@email.com"
                               autoComplete="email" required disabled={carregando}/>
                    </div>

                    <div className="field-group">
                        <label htmlFor="senha">Senha</label>
                        <input id="senha" type="password"
                               value={senha} onChange={(e) => setSenha(e.target.value)}
                               placeholder="••••••••"
                               autoComplete="current-password" required disabled={carregando}/>
                    </div>

                    {erro && <div className="auth-box-erro">{erro}</div>}

                    <button type="submit" className="auth-box-btn"
                            disabled={carregando || !email || !senha}>
                        {carregando ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <p className="auth-box-footer">
                    Nao tem conta?{" "}
                    <Link to="/cadastro" className="auth-box-link">Criar conta gratuita</Link>
                </p>

                <div className="auth-box-features">
                    <span>Itau</span>
                    <span>Bradesco</span>
                    <span>BB</span>
                    <span>Caixa</span>
                </div>
            </div>
        </div>
    );
}
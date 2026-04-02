import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function LoginPage() {
    const [email, setEmail]       = useState("");
    const [senha, setSenha]       = useState("");
    const [erro, setErro]         = useState("");
    const [carregando, setCarregando] = useState(false);

    const { login }  = useAuth();
    const navigate   = useNavigate();
    const location   = useLocation();

    // Redireciona para onde o usuario tentou acessar, ou para /excel
    const destino = location.state?.from?.pathname ?? "/excel";

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);

        try {
            const { data } = await api.post("/api/auth/login", { email, senha });
            login(data);
            navigate(destino, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.mensagem ?? "Erro ao conectar com o servidor";
            setErro(msg);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <span className="brand-wordmark">Whallet</span>
                    <p className="login-subtitle">Acesse sua conta</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className="field-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            autoComplete="email"
                            required
                            disabled={carregando}
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="senha">Senha</label>
                        <input
                            id="senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                            disabled={carregando}
                        />
                    </div>

                    {erro && (
                        <div className="login-erro" role="alert">
                            {erro}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary login-btn"
                        disabled={carregando || !email || !senha}
                    >
                        {carregando ? "Entrando..." : "Entrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
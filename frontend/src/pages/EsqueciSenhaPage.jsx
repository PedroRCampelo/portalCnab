import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function EsqueciSenhaPage() {
    const [email,      setEmail]      = useState("");
    const [enviado,    setEnviado]    = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [erro,       setErro]       = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);
        try {
            await api.post("/api/auth/esqueci-senha", { email });
            setEnviado(true);
        } catch {
            // Nunca mostra erro real — evita enumeração de emails
            setEnviado(true);
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

                {enviado ? (
                    <>
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(22,163,74,0.08)",
                            border: "1px solid rgba(22,163,74,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 26, margin: "0 0 20px"
                        }}>✉️</div>
                        <h1 className="auth-box-title">Email enviado</h1>
                        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 28px" }}>
                            Se o endereço <strong style={{ color: "var(--text)" }}>{email}</strong> estiver
                            cadastrado, você receberá um link para criar uma nova senha em instantes.
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 24 }}>
                            Não recebeu? Verifique a pasta de spam ou{" "}
                            <button
                                onClick={() => setEnviado(false)}
                                style={{ background: "none", border: "none", color: "var(--gold)", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>
                                tente novamente
                            </button>.
                        </p>
                        <Link to="/login" className="auth-box-link" style={{ display: "block", textAlign: "center" }}>
                            ← Voltar para o login
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="auth-box-title">Esqueci minha senha</h1>
                        <p className="auth-box-sub">
                            Informe seu email e enviaremos um link para criar uma nova senha.
                        </p>

                        <form onSubmit={handleSubmit} className="auth-box-form" noValidate>
                            <div className="field-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email" type="email"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    autoComplete="email" required disabled={carregando}/>
                            </div>

                            {erro && <div className="auth-box-erro">{erro}</div>}

                            <button
                                type="submit"
                                className="auth-box-btn"
                                disabled={carregando || !email}>
                                {carregando ? "Enviando..." : "Enviar link de redefinição"}
                            </button>
                        </form>

                        <p className="auth-box-footer">
                            Lembrou a senha?{" "}
                            <Link to="/login" className="auth-box-link">Fazer login</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { LuCircleCheckBig, LuArrowLeft } from "react-icons/lu";

export default function RedefinirSenhaPage() {
    const [searchParams]    = useSearchParams();
    const navigate          = useNavigate();
    const token             = searchParams.get("token") ?? "";

    const [novaSenha,       setNovaSenha]       = useState("");
    const [confirmarSenha,  setConfirmarSenha]  = useState("");
    const [carregando,      setCarregando]      = useState(false);
    const [sucesso,         setSucesso]         = useState(false);
    const [erro,            setErro]            = useState("");

    useEffect(() => {
        if (!token) setErro("Link inválido. Solicite um novo.");
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        if (novaSenha.length < 6) {
            setErro("A senha deve ter pelo menos 6 caracteres.");
            return;
        }
        if (novaSenha !== confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        setCarregando(true);
        try {
            await api.post("/api/auth/redefinir-senha", { token, novaSenha });
            setSucesso(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao redefinir senha. O link pode ter expirado.");
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

                {sucesso ? (
                    <>
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(22,163,74,0.08)",
                            border: "1px solid rgba(22,163,74,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 26, margin: "0 0 20px"
                        }}><LuCircleCheckBig size={24} color="var(--success)"/></div>
                        <h1 className="auth-box-title">Senha redefinida!</h1>
                        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 24px" }}>
                            Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.
                        </p>
                        <Link to="/login" className="auth-box-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                            Ir para o login
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="auth-box-title">Criar nova senha</h1>
                        <p className="auth-box-sub">
                            Escolha uma senha segura para sua conta.
                        </p>

                        <form onSubmit={handleSubmit} className="auth-box-form" noValidate>
                            <div className="field-group">
                                <label htmlFor="novaSenha">Nova senha</label>
                                <input
                                    id="novaSenha" type="password"
                                    value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    autoComplete="new-password" required disabled={carregando || !token}/>
                            </div>

                            <div className="field-group">
                                <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                                <input
                                    id="confirmarSenha" type="password"
                                    value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                                    placeholder="Repita a senha"
                                    autoComplete="new-password" required disabled={carregando || !token}/>
                            </div>

                            {erro && <div className="auth-box-erro">{erro}</div>}

                            <button
                                type="submit"
                                className="auth-box-btn"
                                disabled={carregando || !novaSenha || !confirmarSenha || !token}>
                                {carregando ? "Salvando..." : "Salvar nova senha"}
                            </button>
                        </form>

                        <p className="auth-box-footer">
                            <Link to="/login" className="auth-box-link"><span style={{display:"inline-flex",alignItems:"center",gap:6}}><LuArrowLeft size={14}/> Voltar para o login</span></Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
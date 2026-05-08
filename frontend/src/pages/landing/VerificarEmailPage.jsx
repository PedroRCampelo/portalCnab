import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * VerificarEmailPage — Confirmação de e-mail via token
 * Sprint A3 · Refatoração após remoção do plano Pro
 *
 * Comportamento:
 *  - Recebe token na URL (?token=...)
 *  - Chama GET /api/auth/verificar?token=...
 *  - Se backend retorna AuthResponse com JWT:
 *    → Loga automaticamente
 *    → Redireciona conforme plano:
 *      - Whallet+ ou Admin → /titulos (entrada do app pago)
 *      - Free → / (homepage, vai descobrir o app)
 *  - Se backend retorna ErroResponse (sem token):
 *    → Mostra mensagem e link pra /login
 *  - Se token inválido:
 *    → Mostra erro e link pra criar conta
 */

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function VerificarEmailPage() {
    const [searchParams]  = useSearchParams();
    const [status,   setStatus]   = useState("verificando");
    const [mensagem, setMensagem] = useState("");
    const chamadoRef = useRef(false);
    const { login }  = useAuth();
    const navigate   = useNavigate();

    useEffect(() => {
        if (chamadoRef.current) return;
        chamadoRef.current = true;

        const token = searchParams.get("token");
        if (!token) {
            setStatus("erro");
            setMensagem("Link inválido.");
            return;
        }

        api.get(`/api/auth/verificar?token=${token}`)
            .then(({ data }) => {
                // Backend agora retorna AuthResponse com JWT
                if (data.token) {
                    login(data); // salva no contexto + localStorage

                    // Redireciona com base no plano
                    const temWhalletPlus = data.planoId === PLANO_WHALLET_PLUS;
                    const isAdmin        = data.perfil === "ADMIN";

                    setStatus("ok");
                    setMensagem(data.nome ?? "");

                    // Auto-redirect após 2s
                    setTimeout(() => {
                        if (temWhalletPlus || isAdmin) {
                            navigate("/titulos", { replace: true });
                        } else {
                            navigate("/", { replace: true });
                        }
                    }, 2000);
                } else {
                    // Fallback: backend retornou ErroResponse (mensagem de texto)
                    setStatus("ok_sem_login");
                    setMensagem(data.mensagem ?? "Email confirmado!");
                }
            })
            .catch((err) => {
                setStatus("erro");
                setMensagem(err.response?.data?.mensagem ?? "Erro ao verificar o e-mail.");
            });
    }, []);

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", padding: "24px", background: "var(--bg)",
        }}>
            <div style={{
                background: "#fff", border: "1px solid var(--border)",
                borderRadius: 20, padding: "48px 40px", width: "100%",
                maxWidth: 440, textAlign: "center",
                boxShadow: "0 4px 24px rgba(26,43,66,0.07)",
            }}>
                {status === "verificando" && (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>
                            Verificando e-mail...
                        </h2>
                        <p style={{ color: "var(--text-dim)", fontSize: 14, margin: 0 }}>
                            Aguarde um instante.
                        </p>
                    </>
                )}

                {status === "ok" && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>
                            E-mail confirmado!
                        </h2>
                        <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 8px", lineHeight: 1.7 }}>
                            Olá, <strong>{mensagem}</strong>! Sua conta foi ativada com sucesso.
                        </p>
                        <p style={{ color: "var(--text-dim)", fontSize: 13, margin: 0 }}>
                            Redirecionando automaticamente...
                        </p>
                        <div style={{ marginTop: 20, height: 4, background: "rgba(26,43,66,0.07)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: "var(--grad)", borderRadius: 4, animation: "verifyProgress 2s linear forwards" }}/>
                        </div>
                        <style>{`@keyframes verifyProgress { from { width: 0%; } to { width: 100%; } }`}</style>
                    </>
                )}

                {status === "ok_sem_login" && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>
                            E-mail confirmado!
                        </h2>
                        <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 24px" }}>
                            {mensagem}
                        </p>
                        <a href="/login" className="auth-box-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                            Fazer login →
                        </a>
                    </>
                )}

                {status === "erro" && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 10px" }}>
                            Link inválido
                        </h2>
                        <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 24px" }}>
                            {mensagem}
                        </p>
                        <a href="/cadastro" className="auth-box-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                            Criar nova conta
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}
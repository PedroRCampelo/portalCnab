import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api.js";

export default function VerificarEmailPage() {
    const [searchParams] = useSearchParams();
    const [status,   setStatus]   = useState("verificando");
    const [mensagem, setMensagem] = useState("");
    const chamadoRef = useRef(false); // evita dupla chamada do StrictMode

    useEffect(() => {
        if (chamadoRef.current) return;
        chamadoRef.current = true;

        const token = searchParams.get("token");
        if (!token) {
            setStatus("erro");
            setMensagem("Link invalido.");
            return;
        }

        api.get(`/api/auth/verificar?token=${token}`)
            .then(({ data }) => {
                setStatus("ok");
                setMensagem(data.mensagem);
            })
            .catch((err) => {
                setStatus("erro");
                setMensagem(err.response?.data?.mensagem ?? "Erro ao verificar o email.");
            });
    }, []);

    return (
        <div className="login-page">
            <div className="login-card" style={{ textAlign: "center" }}>
                {status === "verificando" && (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                        <p style={{ color: "var(--text-dim)" }}>Verificando seu email...</p>
                    </>
                )}

                {status === "ok" && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                        <h2 style={{ color: "var(--text)", marginBottom: 8 }}>Email confirmado!</h2>
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>{mensagem}</p>
                        <Link to="/login" className="btn-primary login-btn"
                              style={{ display: "block", marginTop: 24, textAlign: "center" }}>
                            Fazer login
                        </Link>
                    </>
                )}

                {status === "erro" && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                        <h2 style={{ color: "var(--text)", marginBottom: 8 }}>Link invalido</h2>
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>{mensagem}</p>
                        <Link to="/cadastro"
                              style={{ color: "var(--purple)", fontWeight: 600, fontSize: 14, display: "block", marginTop: 16 }}>
                            Criar nova conta
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function UpgradePage() {
    const [carregando, setCarregando] = useState(false);
    const [erro,       setErro]       = useState("");
    const navigate = useNavigate();

    async function handleUpgrade() {
        setErro("");
        setCarregando(true);
        try {
            const { data } = await api.post("/api/stripe/checkout/pro");
            // Redireciona para o checkout do Stripe
            window.location.href = data.url;
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao iniciar pagamento. Tente novamente.");
            setCarregando(false);
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-box" style={{ maxWidth: 480 }}>
                <div className="auth-logo">
                    <span className="brand-wordmark">Whallet</span>
                </div>

                <h1 className="auth-box-title">Upgrade para Pro</h1>
                <p className="auth-box-sub">Acesso ilimitado ao Excel e PDF por R$ 18,90/mes</p>

                <div style={{ background: "rgba(17,17,17,0.05)", border: "1px solid rgba(17,17,17,0.16)", borderRadius: 12, padding: "20px 24px", margin: "20px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                        Plano Pro
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 16 }}>
                        R$ 18,90 <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-dim)" }}>/mes</span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                        {[
                            "Arquivos Excel e PDF ilimitados",
                            "Todos os bancos e layouts",
                            "Histórico completo de remessas",
                            "Cancele quando quiser",
                        ].map((item) => (
                            <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-muted)" }}>
                                <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {erro && <div className="auth-box-erro" style={{ marginBottom: 12 }}>{erro}</div>}

                <button className="auth-box-btn" onClick={handleUpgrade} disabled={carregando}>
                    {carregando ? "Redirecionando..." : "Assinar agora — R$ 18,90/mês"}
                </button>

                <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>
                    Pagamento seguro via Stripe. Cancele a qualquer momento.
                </p>
            </div>
        </div>
    );
}
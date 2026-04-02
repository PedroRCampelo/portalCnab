import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

export default function PlanosPage() {
    const { autenticado, usuario } = useAuth();
    const [cota,       setCota]       = useState(null);
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();

    const isPro = usuario?.perfil === "ADMIN" ||
        cota?.plano === "pro" ||
        cota?.ilimitado;

    useEffect(() => {
        if (autenticado) {
            api.get("/api/usuario/cota")
                .then(({ data }) => setCota(data))
                .catch(() => {});
        }
    }, [autenticado]);

    async function handleUpgrade() {
        if (!autenticado) { navigate("/cadastro"); return; }
        setCarregando(true);
        try {
            const { data } = await api.post("/api/stripe/checkout/pro");
            window.location.href = data.url;
        } catch {
            setCarregando(false);
        }
    }

    return (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                    Planos simples e transparentes
                </h1>
                <p style={{ color: "var(--text-dim)", fontSize: 15 }}>
                    Comece gratuitamente. Faca upgrade quando precisar de mais.
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Plano Gratuito */}
                <div style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 16, padding: "28px 28px 32px"
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: 12 }}>
                        Gratuito
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.02em" }}>
                        R$ 0
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 24 }}>por mes, para sempre</div>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            "8 arquivos por mes",
                            "Excel e PDF",
                            "Todos os bancos suportados",
                            "Historico de remessas",
                        ].map((item) => (
                            <li key={item} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-muted)" }}>
                                <span style={{ color: "var(--success)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                                {item}
                            </li>
                        ))}
                        <li style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-dim)" }}>
                            <span style={{ flexShrink: 0 }}>✗</span>
                            Integracao com Protheus
                        </li>
                    </ul>

                    {autenticado && !isPro ? (
                        <div style={{
                            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                            borderRadius: 10, padding: "10px 16px", textAlign: "center",
                            fontSize: 13, fontWeight: 600, color: "var(--success)"
                        }}>
                            Seu plano atual
                            {cota && ` — ${cota.usados}/${cota.limite} arquivos usados`}
                        </div>
                    ) : !autenticado ? (
                        <Link to="/cadastro" style={{
                            display: "block", textAlign: "center", padding: "12px",
                            borderRadius: 10, border: "1px solid var(--border)",
                            color: "var(--text-muted)", fontWeight: 600, fontSize: 14,
                            textDecoration: "none"
                        }}>
                            Criar conta gratuita
                        </Link>
                    ) : null}
                </div>

                {/* Plano Pro */}
                <div style={{
                    background: "var(--surface)",
                    border: "2px solid rgba(124,58,237,0.5)",
                    borderRadius: 16, padding: "28px 28px 32px",
                    position: "relative"
                }}>
                    <div style={{
                        position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                        background: "var(--purple)", borderRadius: 20, padding: "4px 16px",
                        fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "0.06em"
                    }}>
                        RECOMENDADO
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A78BFA", marginBottom: 12 }}>
                        Pro
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.02em" }}>
                        R$ 18,90
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 24 }}>por mes, cancele quando quiser</div>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            "Arquivos ilimitados",
                            "Excel e PDF",
                            "Todos os bancos suportados",
                            "Historico de remessas",
                            "Suporte prioritario",
                        ].map((item) => (
                            <li key={item} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-muted)" }}>
                                <span style={{ color: "var(--purple)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                                {item}
                            </li>
                        ))}
                        <li style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-dim)" }}>
                            <span style={{ flexShrink: 0 }}>✗</span>
                            Integracao com Protheus
                        </li>
                    </ul>

                    {isPro ? (
                        <div style={{
                            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                            borderRadius: 10, padding: "10px 16px", textAlign: "center",
                            fontSize: 13, fontWeight: 600, color: "#A78BFA"
                        }}>
                            Seu plano atual — uso ilimitado ✓
                        </div>
                    ) : (
                        <button onClick={handleUpgrade} disabled={carregando} style={{
                            width: "100%", padding: "13px", fontSize: 15, fontWeight: 700,
                            borderRadius: 10, background: "var(--purple)", border: "none",
                            color: "white", cursor: "pointer", opacity: carregando ? 0.6 : 1
                        }}>
                            {carregando ? "Redirecionando..." : autenticado ? "Assinar Pro" : "Comecar agora"}
                        </button>
                    )}
                </div>
            </div>

            {/* Protheus — em breve */}
            <div style={{
                marginTop: 20, background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 16
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                        Integracao com Protheus
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                        Busca de titulos, geracao de remessa e write-back direto no ERP. Valor sob consulta.
                    </div>
                </div>
                <a href="mailto:usewhallet@gmail.com" style={{
                    padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)",
                    color: "var(--text-muted)", fontWeight: 600, fontSize: 13,
                    textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0
                }}>
                    Falar com vendas
                </a>
            </div>
        </div>
    );
}
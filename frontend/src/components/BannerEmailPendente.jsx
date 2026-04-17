import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation } from "react-router-dom";
import api from "../services/api.js";

// Rotas onde o banner não aparece
const ROTAS_SEM_BANNER = ["/login", "/cadastro", "/verificar-email", "/esqueci-senha", "/redefinir-senha"];

export default function BannerEmailPendente() {
    const { autenticado, usuario } = useAuth();
    const { pathname } = useLocation();
    const [reenviando, setReenviando] = useState(false);
    const [reenviado,  setReenviado]  = useState(false);
    const [fechado,    setFechado]    = useState(false);

    // Não exibe se: não autenticado, email já verificado, rota de auth, ou fechado manualmente
    if (!autenticado) return null;
    if (usuario?.emailVerificado) return null;
    if (ROTAS_SEM_BANNER.some(r => pathname.startsWith(r))) return null;
    if (fechado) return null;

    async function reenviar() {
        if (reenviando || reenviado) return;
        setReenviando(true);
        try {
            await api.post("/api/auth/reenviar-verificacao", { email: usuario?.email });
            setReenviado(true);
        } catch {
            // silencioso
        } finally {
            setReenviando(false);
        }
    }

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
            background: "linear-gradient(135deg, #0891B2, #06B6D4)",
            padding: "10px 24px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 2px 12px rgba(6,182,212,0.3)",
        }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>✉️</span>

            <p style={{ fontSize: 13, color: "#fff", margin: 0, flex: 1, lineHeight: 1.5 }}>
                <strong>Confirme seu e-mail</strong> para garantir acesso completo à sua conta.
                Enviamos o link para <strong>{usuario?.email}</strong>.
            </p>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                {reenviado ? (
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                        ✓ E-mail reenviado!
                    </span>
                ) : (
                    <button onClick={reenviar} disabled={reenviando} style={{
                        padding: "5px 14px", borderRadius: 8,
                        background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                        color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "background 0.15s",
                    }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}>
                        {reenviando ? "Enviando..." : "Reenviar e-mail"}
                    </button>
                )}

                <button onClick={() => setFechado(true)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.7)", fontSize: 18, lineHeight: 1,
                    padding: "2px 4px",
                }} title="Fechar">
                    ×
                </button>
            </div>
        </div>
    );
}
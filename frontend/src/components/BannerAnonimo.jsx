import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { LuLock, LuCircleCheck, LuTriangleAlert } from "react-icons/lu";

export default function BannerAnonimo({ onLimiteBloqueado }) {
    const { autenticado } = useAuth();
    const [usos, setUsos] = useState(null);

    useEffect(() => {
        if (!autenticado) {
            api.get("/api/cnab/anonimo/usos")
                .then(({ data }) => {
                    setUsos(data);
                    if (data.restantes === 0) onLimiteBloqueado?.();
                })
                .catch(() => {});
        }
    }, [autenticado]);

    // Não mostra nada para usuários logados
    if (autenticado || usos === null) return null;

    // Limite atingido
    if (usos.restantes === 0) {
        return (
            <div style={{
                background: "rgba(17,17,17,0.04)", border: "1px solid rgba(17,17,17,0.18)",
                borderRadius: 14, padding: "20px 24px", marginBottom: 24,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 16, flexWrap: "wrap"
            }}>
                <div>
                    <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4, fontSize: 15 }}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:8}}><LuLock size={16}/> Você usou suas 2 conversões gratuitas</span>
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
                        Crie uma conta gratuita e tenha 8 conversões por mês — sem cartão de crédito.
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <Link to="/login" style={{
                        padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border)",
                        color: "var(--text-muted)", fontWeight: 600, fontSize: 13, textDecoration: "none"
                    }}>
                        Entrar
                    </Link>
                    <Link to="/cadastro" style={{
                        padding: "10px 18px", borderRadius: 10, background: "var(--grad)",
                        border: "1px solid rgba(212,160,23,0.4)", color: "#1a1a1a", fontWeight: 700, fontSize: 13, textDecoration: "none"
                    }}>
                        Criar conta grátis
                    </Link>
                </div>
            </div>
        );
    }

    // Primeiro uso — mostra banner sutil de incentivo
    if (usos.usados === 0) {
        return (
            <div style={{
                background: "rgba(17,17,17,0.03)", border: "1px solid rgba(17,17,17,0.12)",
                borderRadius: 14, padding: "14px 20px", marginBottom: 24,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap"
            }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:8}}><LuCircleCheck size={16}/><strong style={{ color: "var(--text)" }}>2 conversões gratuitas</strong> disponíveis sem login.</span>{" "}
                    <Link to="/cadastro" style={{ color: "#4CDDE8", fontWeight: 600 }}>
                        Crie uma conta
                    </Link>{" "}
                    para 8/mês.
                </div>
            </div>
        );
    }

    // Último uso — aviso antes de bloquear
    if (usos.restantes === 1) {
        return (
            <div style={{
                background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                borderRadius: 14, padding: "14px 20px", marginBottom: 24,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap"
            }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:8}}><LuTriangleAlert size={16}/> Esta é sua <strong style={{ color: "var(--warning)" }}>última conversão gratuita</strong>.</span>{" "}
                    <Link to="/cadastro" style={{ color: "var(--warning)", fontWeight: 600 }}>
                        Crie uma conta grátis
                    </Link>{" "}
                    para continuar.
                </div>
            </div>
        );
    }

    return null;
}
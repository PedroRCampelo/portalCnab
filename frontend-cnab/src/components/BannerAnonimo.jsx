import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { LuLock, LuTriangleAlert } from "react-icons/lu";

const CADASTRO_URL = "https://whallet.com.br/cadastro";

const TEAL    = "#00C9A7";
const TEAL_DIM = "rgba(0,201,167,0.12)";
const TEAL_RNG = "rgba(0,201,167,0.3)";
const WARN    = "#F59E0B";
const WARN_DIM = "rgba(245,158,11,0.08)";
const WARN_BRD = "rgba(245,158,11,0.25)";
const ERR_DIM  = "rgba(239,68,68,0.08)";
const ERR_BRD  = "rgba(239,68,68,0.25)";
const ERR      = "#EF4444";
const BORDER   = "rgba(240,244,248,0.07)";
const SURFACE  = "#112240";
const TEXT     = "#F0F4F8";
const MUTED    = "#7A8599";
const DIM      = "#4B5568";

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

    if (autenticado || usos === null) return null;

    /* ── Limite atingido ─────────────────────────────────────────────── */
    if (usos.restantes === 0) {
        return (
            <div style={{
                background: ERR_DIM, border: `1px solid ${ERR_BRD}`,
                borderRadius: 14, padding: "20px 24px", marginBottom: 24,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 16, flexWrap: "wrap"
            }}>
                <div>
                    <div style={{ fontWeight: 700, color: ERR, marginBottom: 4, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                        <LuLock size={15}/> Você usou suas 2 conversões gratuitas
                    </div>
                    <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.55 }}>
                        Crie uma conta Whallet gratuita e converta arquivos CNAB <strong style={{ color: TEXT }}>de forma ilimitada</strong>.
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
                    <Link to="/login" style={{
                        padding: "9px 18px", borderRadius: 9, border: `1px solid ${BORDER}`,
                        background: SURFACE, color: MUTED, fontWeight: 600, fontSize: 13, textDecoration: "none"
                    }}>
                        Já tenho conta
                    </Link>
                    <a href={CADASTRO_URL} style={{
                        padding: "9px 18px", borderRadius: 9, background: TEAL,
                        color: "#0A1628", fontWeight: 700, fontSize: 13, textDecoration: "none"
                    }}>
                        Criar conta grátis →
                    </a>
                </div>
            </div>
        );
    }

    /* ── Primeiro uso — incentivo sutil ──────────────────────────────── */
    if (usos.usados === 0) {
        return (
            <div style={{
                background: TEAL_DIM, border: `1px solid ${TEAL_RNG}`,
                borderRadius: 12, padding: "13px 18px", marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap"
            }}>
                <div style={{ fontSize: 13, color: MUTED }}>
                    <strong style={{ color: TEXT }}>2 conversões gratuitas</strong> disponíveis sem login.{" "}
                    <a href={CADASTRO_URL} style={{ color: TEAL, fontWeight: 600, textDecoration: "none" }}>
                        Crie uma conta
                    </a>{" "}
                    para acesso ilimitado.
                </div>
            </div>
        );
    }

    /* ── Última conversão — aviso antes de bloquear ──────────────────── */
    if (usos.restantes === 1) {
        return (
            <div style={{
                background: WARN_DIM, border: `1px solid ${WARN_BRD}`,
                borderRadius: 12, padding: "13px 18px", marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap"
            }}>
                <div style={{ fontSize: 13, color: MUTED, display: "flex", alignItems: "center", gap: 8 }}>
                    <LuTriangleAlert size={15} color={WARN}/>
                    Esta é sua <strong style={{ color: WARN }}>última conversão gratuita</strong>.{" "}
                    <a href={CADASTRO_URL} style={{ color: WARN, fontWeight: 600, textDecoration: "none" }}>
                        Crie uma conta grátis
                    </a>{" "}
                    para continuar convertendo.
                </div>
            </div>
        );
    }

    return null;
}

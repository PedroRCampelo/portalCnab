import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuEye, LuEyeOff } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const CADASTRO_URL = "https://whallet.com.br/cadastro";

const BG      = "#0A1628";
const SURFACE = "#112240";
const BORDER  = "rgba(240,244,248,0.07)";
const TEXT     = "#F0F4F8";
const MUTED    = "#7A8599";
const TEAL     = "#00C9A7";
const TEAL_DIM = "rgba(0,201,167,0.12)";
const TEAL_RNG = "rgba(0,201,167,0.3)";
const ERR      = "#EF4444";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail]   = useState("");
    const [senha, setSenha]   = useState("");
    const [verSenha, setVer]  = useState(false);
    const [loading, setLoad]  = useState(false);
    const [erro, setErro]     = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
        try {
            setLoad(true); setErro("");
            const { data } = await api.post("/api/auth/login", { email, senha });
            login(data);
            navigate("/valida-cnab", { replace: true });
        } catch (err) {
            const msg = err.response?.data?.mensagem;
            setErro(msg || "E-mail ou senha incorretos.");
        } finally {
            setLoad(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>

            {/* Voltar */}
            <div style={{ position: "absolute", top: 24, left: 24 }}>
                <Link to="/valida-cnab" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                    <LuArrowLeft size={14}/> Voltar ao conversor
                </Link>
            </div>

            {/* Logo */}
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 36 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${TEAL},#3B82F6)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="1" width="12" height="12" rx="2" stroke="rgba(10,22,40,0.9)" strokeWidth="1.5"/>
                        <line x1="1" y1="5" x2="13" y2="5" stroke="rgba(10,22,40,0.9)" strokeWidth="1.2"/>
                        <line x1="1" y1="8" x2="13" y2="8" stroke="rgba(10,22,40,0.9)" strokeWidth="1.2"/>
                    </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>CNAB Portal</span>
            </Link>

            {/* Card */}
            <div style={{ width: "100%", maxWidth: 400, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "36px 32px" }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Entrar</h1>
                <p style={{ fontSize: 14, color: MUTED, margin: "0 0 28px", lineHeight: 1.5 }}>
                    Acesse sua conta Whallet para conversões ilimitadas.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* E-mail */}
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 7 }}>E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            autoComplete="email"
                            style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                            onFocus={e => e.target.style.borderColor = TEAL}
                            onBlur={e  => e.target.style.borderColor = BORDER}
                        />
                    </div>

                    {/* Senha */}
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 7 }}>Senha</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={verSenha ? "text" : "password"}
                                value={senha}
                                onChange={e => setSenha(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                style={{ width: "100%", boxSizing: "border-box", padding: "11px 44px 11px 14px", background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                                onFocus={e => e.target.style.borderColor = TEAL}
                                onBlur={e  => e.target.style.borderColor = BORDER}
                            />
                            <button
                                type="button"
                                onClick={() => setVer(v => !v)}
                                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 2, display: "flex" }}
                            >
                                {verSenha ? <LuEyeOff size={16}/> : <LuEye size={16}/>}
                            </button>
                        </div>
                        <div style={{ textAlign: "right", marginTop: 6 }}>
                            <a href="https://whallet.com.br/esqueci-senha" style={{ fontSize: 12, color: TEAL, textDecoration: "none" }}>Esqueci minha senha</a>
                        </div>
                    </div>

                    {/* Erro */}
                    {erro && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: ERR }}>
                            {erro}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ background: TEAL, color: BG, border: "none", padding: "13px 0", borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: `0 6px 20px ${TEAL_RNG}`, marginTop: 4 }}
                    >
                        {loading ? "Entrando…" : "Entrar"}
                    </button>
                </form>

                {/* Divisor */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
                    <div style={{ flex: 1, height: 1, background: BORDER }}/>
                    <span style={{ fontSize: 12, color: MUTED }}>não tem conta?</span>
                    <div style={{ flex: 1, height: 1, background: BORDER }}/>
                </div>

                {/* Criar conta */}
                <a
                    href={CADASTRO_URL}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0", borderRadius: 10, border: `1px solid ${TEAL_RNG}`, background: TEAL_DIM, color: TEAL, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
                >
                    Criar conta grátis na Whallet →
                </a>

                <p style={{ textAlign: "center", fontSize: 12, color: MUTED, margin: "16px 0 0", lineHeight: 1.5 }}>
                    Ao criar uma conta, você conhece o Whallet ERP —<br/>gestão financeira completa para PMEs.
                </p>
            </div>
        </div>
    );
}

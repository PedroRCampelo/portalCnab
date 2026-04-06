import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const PLANO_PRO          = "10000000-0000-0000-0000-000000000002";
const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function PlanosPage() {
    const { autenticado, usuario } = useAuth();
    const [carregando,      setCarregando]      = useState(false);
    const [carregandoPlus,  setCarregandoPlus]  = useState(false);
    const [cancelando,      setCancelando]      = useState(false);
    const [msgCancelamento, setMsgCancelamento] = useState("");
    const [modalAberto,     setModalAberto]     = useState(false);
    const navigate = useNavigate();

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = isAdmin || usuario?.planoId === PLANO_WHALLET_PLUS;
    const temPro         = isAdmin || usuario?.planoId === PLANO_PRO || temWhalletPlus;

    async function handleUpgradePro() {
        if (!autenticado) { navigate("/cadastro"); return; }
        setCarregando(true);
        try {
            const { data } = await api.post("/api/stripe/checkout/pro");
            window.location.href = data.url;
        } catch { setCarregando(false); }
    }

    async function handleUpgradePlus() {
        if (!autenticado) { navigate("/cadastro"); return; }
        setCarregandoPlus(true);
        try {
            const { data } = await api.post("/api/stripe/checkout/whallet-plus");
            window.location.href = data.url;
        } catch { setCarregandoPlus(false); }
    }

    async function confirmarCancelamento() {
        setModalAberto(false);
        setCancelando(true);
        setMsgCancelamento("");
        try {
            const { data } = await api.post("/api/stripe/cancelar");
            setMsgCancelamento(data.mensagem);
        } catch (err) {
            setMsgCancelamento(err.response?.data?.mensagem ?? "Erro ao cancelar. Entre em contato.");
        } finally { setCancelando(false); }
    }

    const tagBeta = (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 20, padding: "3px 10px", marginBottom: 12,
            fontSize: 11, fontWeight: 700, color: "#FCD34D"
        }}>
            🎯 Preço beta
        </div>
    );

    return (
        <>
            {/* Modal cancelamento */}
            {modalAberto && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"
                }}>
                    <div style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 20, padding: "36px 32px", maxWidth: 440, width: "100%",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 0 20px", fontSize: 26
                        }}>⚠️</div>
                        <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>
                            Cancelar assinatura?
                        </h2>
                        <div style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
                            <p style={{ margin: "0 0 12px" }}>Ao cancelar:</p>
                            <ul style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                                <li>✅ Você <strong style={{ color: "var(--text)" }}>mantém o acesso</strong> até o fim do período pago</li>
                                <li>❌ Não haverá <strong style={{ color: "var(--text)" }}>novas cobranças</strong></li>
                                <li>🔒 Ao expirar, sua conta volta para o <strong style={{ color: "var(--text)" }}>plano Gratuito</strong></li>
                            </ul>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => setModalAberto(false)} style={{
                                flex: 1, padding: "12px", borderRadius: 10,
                                background: "transparent", border: "1px solid var(--border)",
                                color: "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer"
                            }}>Manter assinatura</button>
                            <button onClick={confirmarCancelamento} disabled={cancelando} style={{
                                flex: 1, padding: "12px", borderRadius: 10,
                                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                color: "#F87171", fontWeight: 600, fontSize: 14, cursor: "pointer",
                                opacity: cancelando ? 0.6 : 1
                            }}>{cancelando ? "Cancelando..." : "Confirmar cancelamento"}</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                        Planos simples e transparentes
                    </h1>
                    <p style={{ color: "var(--text-dim)", fontSize: 15 }}>
                        Comece gratuitamente. Faça upgrade quando precisar de mais.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="planos-grid">

                    {/* Gratuito */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px 32px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: 12 }}>Gratuito</div>
                        <div style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", marginBottom: 4, whiteSpace: "nowrap" }}>R$ 0</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 24 }}>para sempre</div>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {["8 arquivos por mês", "Excel e PDF", "Todos os bancos suportados", "Histórico de remessas"].map(i => (
                                <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
                                    <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        {autenticado && !temPro ? (
                            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--success)" }}>
                                Seu plano atual
                            </div>
                        ) : !autenticado ? (
                            <Link to="/cadastro" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                                Criar conta gratuita
                            </Link>
                        ) : null}
                    </div>

                    {/* Pro */}
                    <div style={{ background: "var(--surface)", border: "2px solid rgb(0 0 0 / 46%)", borderRadius: 16, padding: "28px 24px 32px", position: "relative" }}>
                        <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--purple)", borderRadius: 20, padding: "4px 16px", fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                            RECOMENDADO
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "2px solid rgba(0, 0, 0, 0.46)", marginBottom: 12 }}>Pro</div>
                        {tagBeta}
                        <div style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", marginBottom: 4, whiteSpace: "nowrap" }}>R$ 18,90</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 4 }}>por mês, cancele quando quiser</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 20, fontStyle: "italic" }}>
                            Preço promocional para os primeiros usuários
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {["Arquivos Excel e PDF ilimitados", "Todos os bancos e layouts", "Histórico completo de remessas", "Suporte prioritário"].map(i => (
                                <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
                                    <span style={{ color: "var(--purple)", fontWeight: 700 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        {temPro && !temWhalletPlus ? (
                            <div>
                                <div style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#A78BFA", marginBottom: 10 }}>
                                    Seu plano atual ✓
                                </div>
                                {msgCancelamento ? (
                                    <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>{msgCancelamento}</div>
                                ) : (
                                    <button onClick={() => setModalAberto(true)} disabled={cancelando} style={{ width: "100%", padding: "9px", borderRadius: 10, background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                                        Cancelar assinatura
                                    </button>
                                )}
                            </div>
                        ) : !temPro ? (
                            <button onClick={handleUpgradePro} disabled={carregando} style={{ width: "100%", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: 10, background: "var(--purple)", border: "none", color: "white", cursor: "pointer", opacity: carregando ? 0.6 : 1 }}>
                                {carregando ? "Redirecionando..." : autenticado ? "Assinar Pro" : "Começar agora"}
                            </button>
                        ) : null}
                    </div>

                    {/* Whallet+ */}
                    <div style={{ background: "var(--surface)", border: "2px solid rgba(251,191,36,0.4)", borderRadius: 16, padding: "28px 24px 32px", position: "relative" }}>
                        <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#F59E0B,#FCD34D)", borderRadius: 20, padding: "4px 16px", fontSize: 11, fontWeight: 700, color: "#1a1a1a", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                            WHALLET+
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FCD34D", marginBottom: 12 }}>Gestão Financeira</div>
                        {tagBeta}
                        <div style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", marginBottom: 4, whiteSpace: "nowrap" }}>R$ 39,90</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 4 }}>por mês, cancele quando quiser</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 20, fontStyle: "italic" }}>
                            Preço promocional para os primeiros usuários
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                                "Tudo do plano Pro",
                                "Títulos a pagar (Contas a pagar)",
                                "Importação via Excel",
                                "Relatórios financeiros",
                                "Alertas de vencimento por e-mail",
                                "Geração CNAB pelos títulos",
                            ].map(i => (
                                <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
                                    <span style={{ color: "#FCD34D", fontWeight: 700 }}>✓</span>{i}
                                </li>
                            ))}
                        </ul>
                        {temWhalletPlus ? (
                            <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#FCD34D" }}>
                                Seu plano atual ✓
                            </div>
                        ) : (
                            <button onClick={handleUpgradePlus} disabled={carregandoPlus} style={{ width: "100%", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: 10, background: "linear-gradient(135deg,#F59E0B,#FCD34D)", border: "none", color: "#1a1a1a", cursor: "pointer", opacity: carregandoPlus ? 0.6 : 1 }}>
                                {carregandoPlus ? "Redirecionando..." : autenticado ? "Assinar Whallet+" : "Começar agora"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Protheus */}
                <div style={{ marginTop: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Integração com Protheus</div>
                        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Busca de títulos, geração de remessa e write-back direto no ERP. Valor sob consulta.</div>
                    </div>
                    <a href="mailto:usewhallet@gmail.com" style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                        Falar com vendas
                    </a>
                </div>

                {/* Contato */}
                <div style={{ marginTop: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 28px", textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Precisa de ajuda?</div>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 14 }}>Dúvidas sobre planos, pagamentos ou suporte técnico — fale com a gente.</p>
                    <a href="mailto:usewhallet@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 10, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#A78BFA", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                        ✉️ usewhallet@gmail.com
                    </a>
                </div>
            </div>
        </>
    );
}
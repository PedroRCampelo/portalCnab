import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function PreferenciasAlertaPage() {
    const [form,      setForm]      = useState({ alertaVencidos: false, alertaAVencer: false, alertaDiasAntes: 3 });
    const [salvando,  setSalvando]  = useState(false);
    const [carregando,setCarregando]= useState(true);
    const [msg,       setMsg]       = useState({ texto: "", tipo: "" }); // tipo: "ok" | "erro"

    useEffect(() => {
        api.get("/api/usuario/preferencias-alerta")
            .then(({ data }) => setForm({
                alertaVencidos:  data.alertaVencidos  ?? false,
                alertaAVencer:   data.alertaAVencer   ?? false,
                alertaDiasAntes: data.alertaDiasAntes ?? 3,
            }))
            .catch(() => setMsg({ texto: "Não foi possível carregar as preferências.", tipo: "erro" }))
            .finally(() => setCarregando(false));
    }, []);

    async function salvar(e) {
        e.preventDefault();
        setSalvando(true);
        setMsg({ texto: "", tipo: "" });
        try {
            await api.put("/api/usuario/preferencias-alerta", {
                alertaVencidos:  form.alertaVencidos,
                alertaAVencer:   form.alertaAVencer,
                alertaDiasAntes: Number(form.alertaDiasAntes),
            });
            setMsg({ texto: "✅ Preferências salvas com sucesso!", tipo: "ok" });
        } catch (err) {
            setMsg({ texto: err.response?.data?.mensagem ?? "Erro ao salvar.", tipo: "erro" });
        } finally {
            setSalvando(false);
        }
    }

    const OPCOES_DIAS = [1, 2, 3, 5, 7, 10, 14, 15, 20, 30];

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>

            {/* Cabeçalho */}
            <div style={{ marginBottom: 32 }}>
                <Link to="/titulos" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 13, color: "var(--text-dim)", textDecoration: "none", marginBottom: 16,
                }}>← Voltar para Títulos</Link>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>
                    🔔 Alertas de e-mail
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                    Configure quando e como receber notificações sobre seus títulos.
                    Os e-mails são enviados uma vez por dia, às 08:00.
                </p>
            </div>

            {carregando ? (
                <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Carregando...</p>
            ) : (
                <form onSubmit={salvar}>

                    {/* Card: Títulos vencidos */}
                    <div style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 14, padding: "24px", marginBottom: 16,
                        borderLeft: form.alertaVencidos ? "3px solid #DC2626" : "3px solid var(--border)",
                        transition: "border-color 0.2s",
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 20 }}>⚠️</span>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                                        Títulos vencidos em aberto
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                                    Receba uma lista diária de todos os títulos que já passaram do
                                    vencimento e ainda não foram pagos.
                                </p>
                            </div>
                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, alertaVencidos: !f.alertaVencidos }))}
                                style={{
                                    width: 48, height: 26, borderRadius: 13, border: "none",
                                    background: form.alertaVencidos ? "#DC2626" : "var(--border)",
                                    position: "relative", cursor: "pointer", flexShrink: 0,
                                    transition: "background 0.2s",
                                }}>
                                <span style={{
                                    position: "absolute", top: 3,
                                    left: form.alertaVencidos ? 25 : 3,
                                    width: 20, height: 20, borderRadius: "50%",
                                    background: "white",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    transition: "left 0.2s",
                                }}/>
                            </button>
                        </div>

                        {form.alertaVencidos && (
                            <div style={{
                                marginTop: 14, padding: "10px 14px", borderRadius: 8,
                                background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)",
                                fontSize: 12, color: "#DC2626", fontWeight: 600,
                            }}>
                                ✓ Ativo — você receberá um e-mail diário enquanto houver títulos vencidos.
                            </div>
                        )}
                    </div>

                    {/* Card: Títulos a vencer */}
                    <div style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: 14, padding: "24px", marginBottom: 16,
                        borderLeft: form.alertaAVencer ? "3px solid #F59E0B" : "3px solid var(--border)",
                        transition: "border-color 0.2s",
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 20 }}>📅</span>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                                        Títulos a vencer
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                                    Receba antecipadamente a lista de títulos que vencerão em breve,
                                    com prazo configurável.
                                </p>
                            </div>
                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, alertaAVencer: !f.alertaAVencer }))}
                                style={{
                                    width: 48, height: 26, borderRadius: 13, border: "none",
                                    background: form.alertaAVencer ? "#F59E0B" : "var(--border)",
                                    position: "relative", cursor: "pointer", flexShrink: 0,
                                    transition: "background 0.2s",
                                }}>
                                <span style={{
                                    position: "absolute", top: 3,
                                    left: form.alertaAVencer ? 25 : 3,
                                    width: 20, height: 20, borderRadius: "50%",
                                    background: "white",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    transition: "left 0.2s",
                                }}/>
                            </button>
                        </div>

                        {/* Seletor de dias — só aparece quando ativo */}
                        {form.alertaAVencer && (
                            <div style={{ marginTop: 18 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                    Alertar quantos dias antes do vencimento?
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {OPCOES_DIAS.map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, alertaDiasAntes: d }))}
                                            style={{
                                                padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                                                fontSize: 13, fontWeight: 600,
                                                background: form.alertaDiasAntes === d ? "#F59E0B" : "var(--bg)",
                                                border: form.alertaDiasAntes === d ? "1px solid #F59E0B" : "1px solid var(--border)",
                                                color: form.alertaDiasAntes === d ? "#1a1a1a" : "var(--text-muted)",
                                                transition: "all 0.15s",
                                            }}>
                                            {d === 1 ? "1 dia" : `${d} dias`}
                                        </button>
                                    ))}
                                </div>
                                <div style={{
                                    marginTop: 12, padding: "10px 14px", borderRadius: 8,
                                    background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                                    fontSize: 12, color: "#92400E", fontWeight: 600,
                                }}>
                                    ✓ Ativo — você receberá alertas de títulos que vencem em até{" "}
                                    <strong>{form.alertaDiasAntes} {form.alertaDiasAntes === 1 ? "dia" : "dias"}</strong>.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info horário */}
                    <div style={{
                        padding: "12px 16px", borderRadius: 10, marginBottom: 24,
                        background: "var(--surface)", border: "1px solid var(--border)",
                        fontSize: 12, color: "var(--text-dim)", display: "flex", gap: 8, alignItems: "flex-start",
                    }}>
                        <span>ℹ️</span>
                        <span style={{ lineHeight: 1.6 }}>
                            Os alertas são processados uma vez por dia às <strong style={{ color: "var(--text)" }}>08:00</strong>.
                            Você receberá no máximo um e-mail por dia, somente quando houver títulos relevantes.
                            O e-mail é enviado para <strong style={{ color: "var(--text)" }}>sua conta cadastrada no Whallet</strong>.
                        </span>
                    </div>

                    {/* Mensagem de feedback */}
                    {msg.texto && (
                        <div style={{
                            padding: "12px 16px", borderRadius: 10, marginBottom: 16,
                            background: msg.tipo === "ok" ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)",
                            border: `1px solid ${msg.tipo === "ok" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                            color: msg.tipo === "ok" ? "#166534" : "#DC2626",
                            fontSize: 13, fontWeight: 600,
                        }}>{msg.texto}</div>
                    )}

                    {/* Botão salvar */}
                    <button type="submit" disabled={salvando} style={{
                        width: "100%", padding: "14px", borderRadius: 12,
                        background: "var(--grad)", border: "none",
                        color: "#1a1a1a", fontSize: 15, fontWeight: 800,
                        cursor: salvando ? "not-allowed" : "pointer",
                        opacity: salvando ? 0.7 : 1,
                    }}>
                        {salvando ? "Salvando..." : "Salvar preferências"}
                    </button>
                </form>
            )}
        </div>
    );
}
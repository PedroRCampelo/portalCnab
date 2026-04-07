import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IcoBack } from "../components/icons.jsx";
import api from "../services/api.js";

export default function TiposGastoPage() {
    const [tipos,     setTipos]     = useState([]);
    const [novoNome,  setNovoNome]  = useState("");
    const [editId,    setEditId]    = useState(null);
    const [editNome,  setEditNome]  = useState("");
    const [salvando,  setSalvando]  = useState(false);
    const [excluindo, setExcluindo] = useState(null);
    const [erro,      setErro]      = useState("");

    useEffect(() => { carregar(); }, []);

    async function carregar() {
        try { const { data } = await api.get("/api/tipos-gasto"); setTipos(data); } catch {}
    }

    async function criar() {
        if (!novoNome.trim()) return;
        setSalvando(true); setErro("");
        try {
            await api.post("/api/tipos-gasto", { nome: novoNome.trim() });
            setNovoNome(""); carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar tipo de gasto.");
        } finally { setSalvando(false); }
    }

    async function salvarEdicao(id) {
        if (!editNome.trim()) return;
        setSalvando(true); setErro("");
        try {
            await api.put(`/api/tipos-gasto/${id}`, { nome: editNome.trim() });
            setEditId(null); carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar.");
        } finally { setSalvando(false); }
    }

    async function excluir(id) {
        setExcluindo(id);
        try {
            await api.delete(`/api/tipos-gasto/${id}`);
            carregar();
        } catch {}
        finally { setExcluindo(null); }
    }

    const inputStyle = {
        padding: "9px 12px", borderRadius: 8, background: "var(--bg)",
        border: "1px solid var(--border)", color: "var(--text)", fontSize: 14,
        boxSizing: "border-box"
    };

    const btnStyle = (variant = "primary") => ({
        padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13,
        cursor: "pointer", border: "none",
        ...(variant === "primary"  && { background: "var(--purple)", color: "white" }),
        ...(variant === "ghost"    && { background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }),
        ...(variant === "danger"   && { background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", color: "var(--warning)" }),
    });

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>

            {/* Cabeçalho */}
            <Link to="/titulos" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 999, border: "1px solid var(--border)",
                color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
                textDecoration: "none", marginBottom: 24
            }}>
                <IcoBack/> Voltar para Títulos
            </Link>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>
                Tipos de Gasto
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-dim)", margin: "0 0 28px" }}>
                Categorize seus títulos para facilitar análises e relatórios. Cada conta terá sua própria lista.
            </p>

            {/* Formulário de novo */}
            <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px", marginBottom: 20
            }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Novo tipo de gasto
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        value={novoNome}
                        onChange={e => setNovoNome(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && criar()}
                        placeholder="Ex: Fornecedores, Aluguel, Impostos..."
                        maxLength={100}
                        style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={criar} disabled={salvando || !novoNome.trim()} style={{ ...btnStyle("primary"), opacity: (!novoNome.trim() || salvando) ? 0.5 : 1 }}>
                        {salvando ? "Criando..." : "+ Criar"}
                    </button>
                </div>
                {erro && (
                    <div style={{ marginTop: 10, fontSize: 13, color: "var(--warning)" }}>{erro}</div>
                )}
            </div>

            {/* Lista */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                {tipos.length === 0 ? (
                    <div style={{ padding: "40px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🏷️</div>
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
                            Nenhum tipo de gasto cadastrado ainda.<br/>Crie o primeiro acima.
                        </p>
                    </div>
                ) : (
                    tipos.map((t, i) => (
                        <div key={t.id} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "14px 20px",
                            borderTop: i > 0 ? "1px solid var(--border)" : "none"
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                background: "rgba(17,17,17,0.08)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, color: "var(--text-muted)", fontWeight: 700
                            }}>
                                {t.nome.charAt(0).toUpperCase()}
                            </div>

                            {editId === t.id ? (
                                // Modo edição inline
                                <div style={{ flex: 1, display: "flex", gap: 8 }}>
                                    <input
                                        value={editNome}
                                        onChange={e => setEditNome(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") salvarEdicao(t.id); if (e.key === "Escape") setEditId(null); }}
                                        maxLength={100}
                                        autoFocus
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <button onClick={() => salvarEdicao(t.id)} disabled={salvando} style={btnStyle("primary")}>Salvar</button>
                                    <button onClick={() => setEditId(null)} style={btnStyle("ghost")}>Cancelar</button>
                                </div>
                            ) : (
                                <>
                                    <span style={{ flex: 1, fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{t.nome}</span>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => { setEditId(t.id); setEditNome(t.nome); setErro(""); }}
                                                style={{ ...btnStyle("ghost"), padding: "6px 12px" }}>✏️</button>
                                        <button onClick={() => excluir(t.id)} disabled={excluindo === t.id}
                                                style={{ ...btnStyle("danger"), padding: "6px 12px" }}>
                                            {excluindo === t.id ? "..." : "🗑️"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {tipos.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12, textAlign: "center" }}>
                    {tipos.length} tipo{tipos.length > 1 ? "s" : ""} cadastrado{tipos.length > 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
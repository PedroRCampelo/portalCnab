import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LuUpload, LuFileText, LuDatabase, LuChevronDown, LuCheck, LuAperture, LuRefreshCw, LuArrowLeft } from "react-icons/lu";
import api from "../services/api.js";

const BANCOS = ["itau", "bradesco", "bb", "caixa"];
const TIPOS  = ["cnab240", "cnab400"];

export default function CnabKnowledgePage() {
    const [documentos,     setDocumentos]     = useState([]);
    const [carregandoList, setCarregandoList] = useState(true);

    const [descricao,  setDescricao]  = useState("");
    const [sourceType, setSourceType] = useState("manual_tecnico");
    const [arquivo,    setArquivo]    = useState(null);

    const [enviando,   setEnviando]   = useState(false);
    const [progresso,  setProgresso]  = useState(null);
    const [mensagem,   setMensagem]   = useState("");

    const inputRef = useRef(null);

    useEffect(() => { carregarDocumentos(); }, []);

    async function carregarDocumentos() {
        setCarregandoList(true);
        try {
            const { data } = await api.get("/api/cnab/knowledge/documents");
            setDocumentos(data);
        } catch {
            setDocumentos([]);
        } finally {
            setCarregandoList(false);
        }
    }

    async function handleIngest(e) {
        e.preventDefault();
        if (!arquivo || !descricao.trim()) {
            setMensagem("Informe uma descrição e selecione um arquivo PDF.");
            setProgresso("error");
            return;
        }

        setEnviando(true);
        setProgresso("uploading");
        setMensagem("Enviando arquivo...");

        const form = new FormData();
        form.append("arquivo", arquivo);
        form.append("descricao", descricao.trim());
        form.append("sourceType", sourceType);

        // Garante que o estado "uploading" é renderizado antes de continuar
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            await api.post("/api/cnab/knowledge/ingest", form, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 300_000,
                onUploadProgress: (e) => {
                    if (e.total && e.loaded < e.total) {
                        setMensagem(`Enviando arquivo... ${Math.round((e.loaded / e.total) * 100)}%`);
                    } else {
                        setProgresso("processing");
                        setMensagem("Arquivo recebido — ingestão iniciada em segundo plano...");
                    }
                },
            });

            setProgresso("done");
            setMensagem(`Ingestão de "${arquivo.name}" iniciada! O processamento ocorre em segundo plano — aguarde alguns minutos e atualize a lista para confirmar.`);
            setArquivo(null);
            if (inputRef.current) inputRef.current.value = "";
            setTimeout(carregarDocumentos, 5000);
        } catch (err) {
            // Timeout do cliente NÃO significa falha — o backend pode ter concluído
            const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
            if (isTimeout) {
                setProgresso("done");
                setMensagem("O processamento continua em segundo plano. Atualize a lista em instantes para confirmar que o documento foi ingerido.");
                setTimeout(carregarDocumentos, 4000);
            } else {
                setProgresso("error");
                setMensagem(err.response?.data?.mensagem ?? "Erro ao ingerir o documento.");
            }
        } finally {
            setEnviando(false);
        }
    }

    const totalChunks = documentos.reduce((sum, d) => sum + (d.totalChunks ?? 0), 0);

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>

            {/* Header */}
            <div style={{ marginBottom: 36 }}>
                <Link to="/admin/usuarios" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-dim)", textDecoration: "none", marginBottom: 16 }}>
                    <LuArrowLeft size={14}/> Admin
                </Link>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                            Base de conhecimento CNAB
                        </h1>
                        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                            Ingira layouts oficiais em PDF para alimentar o agente de IA.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <Stat label="Documentos" value={documentos.length} icon={<LuFileText size={14}/>}/>
                        <Stat label="Chunks" value={totalChunks.toLocaleString("pt-BR")} icon={<LuDatabase size={14}/>}/>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }} className="ck-grid">

                {/* ── Formulário de ingestão ── */}
                <div style={{ background: "#fff", border: "1px solid rgba(30,41,59,0.1)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(30,41,59,0.07)", background: "rgba(30,41,59,0.02)" }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Ingerir novo documento</h2>
                        <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "4px 0 0" }}>PDF com layout bancário oficial</p>
                    </div>
                    <form onSubmit={handleIngest} style={{ padding: "22px" }}>

                        <Field label="Descrição do documento">
                            <input
                                type="text"
                                placeholder="Ex: Sicredi 240 pagamento, Bradesco retorno 400, Itaú CNAB 240..."
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                disabled={enviando}
                                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(30,41,59,0.12)", background: "#fff", color: "var(--text)", fontSize: 13, boxSizing: "border-box", outline: "none" }}
                            />
                            <p style={{ fontSize: 11, color: "var(--text-dim)", margin: "4px 0 0", lineHeight: 1.5 }}>
                                Descreva livremente o banco e layout. Banco e tipo CNAB são inferidos automaticamente.
                            </p>
                        </Field>

                        <Field label="Tipo de documento">
                            <Select value={sourceType} onChange={e => setSourceType(e.target.value)}>
                                <option value="manual_tecnico">Manual técnico</option>
                                <option value="layout_febraban">Layout FEBRABAN</option>
                                <option value="documentacao_banco">Documentação do banco</option>
                                <option value="exemplo_arquivo">Exemplo de arquivo</option>
                            </Select>
                        </Field>

                        <Field label="Arquivo PDF">
                            <div
                                onClick={() => inputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${arquivo ? "rgba(6,182,212,0.5)" : "rgba(30,41,59,0.15)"}`,
                                    borderRadius: 10, padding: "20px 16px", textAlign: "center",
                                    cursor: "pointer", transition: "all 0.15s",
                                    background: arquivo ? "rgba(6,182,212,0.04)" : "rgba(30,41,59,0.02)",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = arquivo ? "rgba(6,182,212,0.5)" : "rgba(30,41,59,0.15)"; }}
                            >
                                <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
                                       onChange={e => { setArquivo(e.target.files[0] || null); setProgresso(null); setMensagem(""); }}/>
                                {arquivo ? (
                                    <>
                                        <LuFileText size={20} style={{ color: "var(--cyan)", marginBottom: 6 }}/>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{arquivo.name}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                                            {(arquivo.size / 1024 / 1024).toFixed(1)} MB · clique para trocar
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <LuUpload size={20} style={{ color: "var(--text-dim)", marginBottom: 6 }}/>
                                        <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Clique para selecionar</div>
                                        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Somente PDF</div>
                                    </>
                                )}
                            </div>
                        </Field>

                        {/* Feedback */}
                        {progresso && (
                            <div style={{
                                marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 13,
                                background: progresso === "error" ? "rgba(220,38,38,0.06)" : progresso === "done" ? "rgba(6,182,212,0.07)" : "rgba(30,41,59,0.05)",
                                border: `1px solid ${progresso === "error" ? "rgba(220,38,38,0.2)" : progresso === "done" ? "rgba(6,182,212,0.2)" : "rgba(30,41,59,0.1)"}`,
                                color: progresso === "error" ? "var(--error)" : "var(--text)",
                                display: "flex", alignItems: "flex-start", gap: 8,
                            }}>
                                {progresso === "processing" && <LuRefreshCw size={14} style={{ flexShrink: 0, marginTop: 1, animation: "ckSpin 1s linear infinite" }}/>}
                                {progresso === "done" && <LuCheck size={14} style={{ flexShrink: 0, marginTop: 1, color: "var(--cyan)" }}/>}
                                {progresso === "error" && <LuAperture size={14} style={{ flexShrink: 0, marginTop: 1 }}/>}
                                <span>{mensagem}</span>
                            </div>
                        )}

                        <button type="submit" disabled={enviando || !arquivo || !descricao.trim()} style={{
                            width: "100%", padding: "11px", borderRadius: 10, border: "none",
                            background: enviando || !arquivo || !descricao.trim() ? "rgba(30,41,59,0.08)" : "var(--grad)",
                            color: enviando || !arquivo || !descricao.trim() ? "var(--text-dim)" : "#083344",
                            fontWeight: 700, fontSize: 14, cursor: enviando || !arquivo || !descricao.trim() ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                        }}>
                            {enviando ? "Processando..." : "Ingerir documento"}
                        </button>

                        {enviando && (
                            <p style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
                                PDFs grandes podem levar 1–3 minutos. Não feche esta janela.
                            </p>
                        )}
                    </form>
                </div>

                {/* ── Lista de documentos ── */}
                <div style={{ background: "#fff", border: "1px solid rgba(30,41,59,0.1)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(30,41,59,0.07)", background: "rgba(30,41,59,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Documentos ingeridos</h2>
                            <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "4px 0 0" }}>{documentos.length} documento{documentos.length !== 1 ? "s" : ""}</p>
                        </div>
                        <button onClick={carregarDocumentos} title="Atualizar lista" style={{ background: "transparent", border: "1px solid rgba(30,41,59,0.1)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "var(--text-dim)", display: "flex", alignItems: "center" }}>
                            <LuRefreshCw size={14} style={{ animation: carregandoList ? "ckSpin 0.8s linear infinite" : "none" }}/>
                        </button>
                    </div>
                    <div style={{ maxHeight: 520, overflowY: "auto" }}>
                        {carregandoList ? (
                            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>Carregando...</div>
                        ) : documentos.length === 0 ? (
                            <div style={{ padding: "40px 24px", textAlign: "center" }}>
                                <LuDatabase size={28} style={{ color: "var(--text-dim)", marginBottom: 10 }}/>
                                <p style={{ fontSize: 13, color: "var(--text-dim)", margin: 0 }}>Nenhum documento ingerido ainda</p>
                            </div>
                        ) : documentos.map((doc, i) => (
                            <div key={i} style={{ padding: "14px 22px", borderBottom: i < documentos.length - 1 ? "1px solid rgba(30,41,59,0.06)" : "none" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.sourceName}</div>
                                        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                                            {doc.bankCode && <Tag>{doc.bankCode.toUpperCase()}</Tag>}
                                            {doc.cnabType && <Tag>{doc.cnabType.toUpperCase()}</Tag>}
                                            {doc.sourceType && <Tag muted>{doc.sourceType.replace(/_/g, " ")}</Tag>}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cyan)" }}>{doc.totalChunks?.toLocaleString("pt-BR")}</div>
                                        <div style={{ fontSize: 10, color: "var(--text-dim)" }}>chunks</div>
                                    </div>
                                </div>
                                {doc.lastIngestionAt && (
                                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>
                                        {new Date(doc.lastIngestionAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes ckSpin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) { .ck-grid { grid-template-columns: 1fr !important; } }
            `}</style>
        </div>
    );
}

function Stat({ label, value, icon }) {
    return (
        <div style={{ background: "#fff", border: "1px solid rgba(30,41,59,0.1)", borderRadius: 12, padding: "12px 16px", textAlign: "center", minWidth: 90 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{value}</div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
            {children}
        </div>
    );
}

function ToggleBtn({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick} style={{
            padding: "8px 12px", borderRadius: 8, cursor: "pointer",
            border: active ? "1.5px solid var(--cyan)" : "1px solid rgba(30,41,59,0.12)",
            background: active ? "rgba(6,182,212,0.08)" : "transparent",
            color: active ? "var(--cyan-dark)" : "var(--text-muted)",
            fontSize: 12, fontWeight: 700, transition: "all 0.12s",
        }}>{children}</button>
    );
}

function Select({ children, ...props }) {
    return (
        <select {...props} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(30,41,59,0.12)", background: "#fff", color: "var(--text)", fontSize: 13, cursor: "pointer" }}>
            {children}
        </select>
    );
}

function Tag({ children, muted }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
            background: muted ? "rgba(30,41,59,0.05)" : "rgba(6,182,212,0.08)",
            border: muted ? "1px solid rgba(30,41,59,0.1)" : "1px solid rgba(6,182,212,0.18)",
            color: muted ? "var(--text-dim)" : "var(--cyan-dark)",
        }}>{children}</span>
    );
}
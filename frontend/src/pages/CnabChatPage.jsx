import { useState, useRef, useEffect } from "react";
import { LuSend, LuPaperclip, LuX, LuChevronDown, LuBot, LuUser, LuFileText, LuSparkles } from "react-icons/lu";
import api from "../services/api.js";

import elvisImg from "../assets/bots/elvis.png";

const BOT = {
    nome:   "Elvis",
    slogan: "Especialista em CNAB · Seu assistente bancário",
    cor:    "#0891B2",
    grad:   "linear-gradient(135deg, #06B6D4, #0891B2)",
};

const BANCOS   = ["", "itau", "bradesco", "bb", "caixa"];
const TIPOS    = ["", "cnab240", "cnab400"];
const LABEL_BANCO = { "": "Todos os bancos", itau: "Itaú", bradesco: "Bradesco", bb: "Banco do Brasil", caixa: "Caixa" };
const LABEL_TIPO  = { "": "CNAB 240 e 400", cnab240: "CNAB 240", cnab400: "CNAB 400" };

const SUGESTOES = [
    "O que é o segmento A no CNAB 240?",
    "Como funciona o header de arquivo no Bradesco 240?",
    "Qual a diferença entre CNAB 240 e CNAB 400?",
    "Quais campos são obrigatórios no registro de detalhe?",
];

export default function CnabChatPage() {
    const [mensagens,    setMensagens]    = useState([]);
    const [input,        setInput]        = useState("");
    const [banco,        setBanco]        = useState("");
    const [tipo,         setTipo]         = useState("");
    const [arquivo,      setArquivo]      = useState(null);
    const [usarArquivo,  setUsarArquivo]  = useState(false);
    const [enviando,     setEnviando]     = useState(false);
    const [configAberta, setConfigAberta] = useState(false);

    const inputRef   = useRef(null);
    const fileRef    = useRef(null);
    const bottomRef  = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens, enviando]);

    async function enviar(pergunta) {
        const texto = (pergunta ?? input).trim();
        if (!texto || enviando) return;

        const novaMensagem = { role: "user", content: texto };
        setMensagens(prev => [...prev, novaMensagem]);
        setInput("");
        setEnviando(true);

        try {
            const form = new FormData();
            form.append("pergunta", texto);
            if (banco)  form.append("banco", banco);
            if (tipo)   form.append("tipo", tipo);
            form.append("usarArquivoAtualComoContexto", usarArquivo && arquivo ? "true" : "false");
            if (usarArquivo && arquivo) form.append("arquivoCnab", arquivo);

            const { data } = await api.post("/api/cnab/chat", form, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 60_000,
            });

            setMensagens(prev => [...prev, {
                role: "assistant",
                content: data.resposta,
                fontes: data.fontes,
            }]);
        } catch (err) {
            setMensagens(prev => [...prev, {
                role: "error",
                content: err.message?.includes("timeout")
                    ? "A resposta está demorando mais que o esperado. Tente uma pergunta mais específica."
                    : err.response?.data?.mensagem ?? "Erro ao obter resposta. Tente novamente.",
            }]);
        } finally {
            setEnviando(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    }

    function removerArquivo() {
        setArquivo(null);
        setUsarArquivo(false);
        if (fileRef.current) fileRef.current.value = "";
    }

    const temFiltro = banco || tipo;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>

            {/* ── Header ── */}
            <div style={{ padding: "20px 0 0", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <img src={elvisImg} alt="Elvis" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(6,182,212,0.25)", flexShrink: 0 }}/>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>{BOT.nome}</h1>
                        <p style={{ fontSize: 12, color: "var(--text-dim)", margin: 0 }}>{BOT.slogan}</p>
                    </div>

                    {/* Filtros */}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                        <FiltroSelect
                            value={banco}
                            onChange={e => setBanco(e.target.value)}
                            options={BANCOS.map(b => ({ value: b, label: LABEL_BANCO[b] }))}
                            placeholder="Banco"
                        />
                        <FiltroSelect
                            value={tipo}
                            onChange={e => setTipo(e.target.value)}
                            options={TIPOS.map(t => ({ value: t, label: LABEL_TIPO[t] }))}
                            placeholder="Versão"
                        />
                    </div>
                </div>

                {/* Aviso de filtro ativo */}
                {temFiltro && (
                    <div style={{ marginBottom: 12, padding: "6px 12px", borderRadius: 8, background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)", fontSize: 12, color: "var(--cyan-dark)", display: "flex", alignItems: "center", gap: 6 }}>
                        <LuSparkles size={12}/>
                        Buscando em: {[banco && LABEL_BANCO[banco], tipo && LABEL_TIPO[tipo]].filter(Boolean).join(" · ")}
                        <button onClick={() => { setBanco(""); setTipo(""); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--cyan-dark)", fontSize: 11, fontWeight: 600 }}>Limpar</button>
                    </div>
                )}
            </div>

            {/* ── Área de mensagens ── */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
                {mensagens.length === 0 ? (
                    <div style={{ padding: "32px 0" }}>
                        <div style={{ textAlign: "center", marginBottom: 32 }}>
                            <img src={elvisImg} alt="Elvis" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", margin: "0 auto 14px", display: "block", border: "2px solid rgba(6,182,212,0.25)" }}/>
                            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
                                Olá! Sou o <strong>Elvis</strong>, especialista em layouts CNAB. Faça uma pergunta sobre CNAB 240 ou 400, segmentos, campos ou regras bancárias.
                            </p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="chat-suggestions">
                            {SUGESTOES.map(s => (
                                <button key={s} onClick={() => enviar(s)} style={{
                                    padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                                    border: "1px solid rgba(30,41,59,0.1)", background: "#fff",
                                    color: "var(--text-muted)", fontSize: 13, textAlign: "left", lineHeight: 1.5,
                                    transition: "all 0.15s",
                                }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)"; e.currentTarget.style.color = "var(--text)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(30,41,59,0.1)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                >{s}</button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
                        {mensagens.map((msg, i) => (
                            <Mensagem key={i} msg={msg}/>
                        ))}
                        {enviando && <TypingIndicator/>}
                        <div ref={bottomRef}/>
                    </div>
                )}
            </div>

            {/* ── Input area ── */}
            <div style={{ flexShrink: 0, paddingBottom: 20 }}>
                {/* Arquivo selecionado */}
                {arquivo && (
                    <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}>
                        <LuFileText size={13} style={{ color: "var(--cyan)", flexShrink: 0 }}/>
                        <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{arquivo.name}</span>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--cyan-dark)" }}>
                            <input type="checkbox" checked={usarArquivo} onChange={e => setUsarArquivo(e.target.checked)} style={{ width: 13, height: 13 }}/>
                            Usar como contexto
                        </label>
                        <button onClick={removerArquivo} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", display: "flex", padding: 2 }}>
                            <LuX size={13}/>
                        </button>
                    </div>
                )}

                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "#fff", border: "1.5px solid rgba(30,41,59,0.12)", borderRadius: 14, padding: "10px 10px 10px 14px", boxShadow: "0 2px 12px rgba(30,41,59,0.06)" }}>
                    {/* Botão anexar */}
                    <button onClick={() => fileRef.current?.click()} title="Anexar arquivo CNAB" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: "4px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <LuPaperclip size={18}/>
                    </button>
                    <input ref={fileRef} type="file" style={{ display: "none" }}
                           accept=".txt,.rem,.ret,.cnab"
                           onChange={e => {
                               const f = e.target.files[0];
                               if (!f) return;
                               // Só arquivos de remessa/retorno CNAB
                               const ext = f.name.split(".").pop().toLowerCase();
                               if (!["txt","rem","ret","cnab"].includes(ext)) {
                                   alert("Apenas arquivos de remessa CNAB são permitidos (.txt, .rem, .ret, .cnab)");
                                   e.target.value = "";
                                   return;
                               }
                               // Limite de 500KB — arquivos CNAB reais são pequenos
                               if (f.size > 500 * 1024) {
                                   alert("Arquivo muito grande. O limite é 500KB para arquivos de remessa.");
                                   e.target.value = "";
                                   return;
                               }
                               setArquivo(f);
                               setUsarArquivo(true);
                           }}/>

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Pergunte sobre CNAB 240, segmentos, campos, bancos..."
                        rows={1}
                        style={{
                            flex: 1, resize: "none", border: "none", outline: "none",
                            fontSize: 14, color: "var(--text)", background: "transparent",
                            lineHeight: 1.6, maxHeight: 120, overflowY: "auto",
                            fontFamily: "inherit",
                        }}
                        onInput={e => {
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                    />

                    <button
                        onClick={() => enviar()}
                        disabled={!input.trim() || enviando}
                        style={{
                            width: 36, height: 36, borderRadius: 10, border: "none", flexShrink: 0,
                            background: input.trim() && !enviando ? "var(--grad)" : "rgba(30,41,59,0.08)",
                            color: input.trim() && !enviando ? "#083344" : "var(--text-dim)",
                            cursor: input.trim() && !enviando ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                        }}
                    >
                        <LuSend size={15}/>
                    </button>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", marginTop: 8 }}>
                    Respostas baseadas em documentação CNAB ingerida · Não substitui consulta aos manuais oficiais
                </p>
            </div>

            <style>{`
                @media (max-width: 600px) { .chat-suggestions { grid-template-columns: 1fr !important; } }
            `}</style>
        </div>
    );
}

function Mensagem({ msg }) {
    const [fonteAberta, setFonteAberta] = useState(false);
    const isUser  = msg.role === "user";
    const isError = msg.role === "error";

    return (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: isUser ? "row-reverse" : "row" }}>
            {/* Avatar */}
            <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isUser ? "var(--text)" : isError ? "rgba(220,38,38,0.1)" : "rgba(6,182,212,0.1)",
            }}>
                {isUser
                    ? <LuUser size={14} style={{ color: "#fff" }}/>
                    : isError
                        ? <LuBot size={14} style={{ color: "var(--error)" }}/>
                        : <img src={elvisImg} alt="Elvis" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }}/>
                }
            </div>

            <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{
                    padding: "12px 16px",
                    borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                    background: isUser ? "var(--text)" : isError ? "rgba(220,38,38,0.06)" : "#fff",
                    border: isUser ? "none" : `1px solid ${isError ? "rgba(220,38,38,0.15)" : "rgba(30,41,59,0.1)"}`,
                    color: isUser ? "#fff" : isError ? "var(--error)" : "var(--text)",
                }}>
                    {isUser || isError
                        ? <span style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{msg.content}</span>
                        : <MarkdownRenderer content={msg.content}/>
                    }
                </div>

                {/* Fontes */}
                {msg.fontes && msg.fontes.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                        <button onClick={() => setFonteAberta(o => !o)} style={{
                            display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                            cursor: "pointer", fontSize: 11, color: "var(--text-dim)", padding: 0, fontWeight: 600,
                        }}>
                            <LuFileText size={11}/>
                            {msg.fontes.length} fonte{msg.fontes.length > 1 ? "s" : ""} consultada{msg.fontes.length > 1 ? "s" : ""}
                            <LuChevronDown size={11} style={{ transform: fonteAberta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}/>
                        </button>
                        {fonteAberta && (
                            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                                {msg.fontes.map((f, i) => (
                                    <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(30,41,59,0.03)", border: "1px solid rgba(30,41,59,0.08)", fontSize: 11 }}>
                                        <div style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
                                            <span style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{f.sourceName}</span>
                                            {f.bankCode  && <Tag>{f.bankCode.toUpperCase()}</Tag>}
                                            {f.cnabType  && <Tag>{f.cnabType.toUpperCase()}</Tag>}
                                            {f.similarity && <Tag muted>{(f.similarity * 100).toFixed(0)}% similar</Tag>}
                                        </div>
                                        <p style={{ color: "var(--text-dim)", margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                            {f.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Renderizador de Markdown simples (sem dependência externa) ─────────────────
function MarkdownRenderer({ content }) {
    const lines = content.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Bloco de código
        if (line.startsWith("```")) {
            const lang = line.slice(3).trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre key={i} style={{ background: "rgba(30,41,59,0.05)", border: "1px solid rgba(30,41,59,0.1)", borderRadius: 8, padding: "10px 12px", overflowX: "auto", fontSize: 12, lineHeight: 1.6, margin: "8px 0" }}>
                    <code style={{ color: "var(--text)", fontFamily: "monospace" }}>{codeLines.join("\n")}</code>
                </pre>
            );
            i++; continue;
        }

        // Headings
        if (line.startsWith("### ")) { elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "12px 0 4px" }}>{renderInline(line.slice(4))}</h3>); i++; continue; }
        if (line.startsWith("## "))  { elements.push(<h2 key={i} style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "14px 0 6px" }}>{renderInline(line.slice(3))}</h2>); i++; continue; }
        if (line.startsWith("# "))   { elements.push(<h1 key={i} style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "14px 0 6px" }}>{renderInline(line.slice(2))}</h1>); i++; continue; }

        // Linha horizontal
        if (line.trim() === "---" || line.trim() === "***") {
            elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid rgba(30,41,59,0.1)", margin: "10px 0" }}/>);
            i++; continue;
        }

        // Lista não-ordenada (com suporte a sub-itens indentados)
        if (line.match(/^(\s*)[-*] /)) {
            const listItems = [];
            const startKey = i;
            while (i < lines.length && lines[i].match(/^(\s*)[-*] /)) {
                const indent = lines[i].match(/^(\s*)/)[1].length;
                const text = lines[i].replace(/^\s*[-*] /, "");
                listItems.push(
                    <li key={i} style={{ marginBottom: 3, marginLeft: indent > 0 ? 16 : 0 }}>
                        {renderInline(text)}
                    </li>
                );
                i++;
            }
            elements.push(<ul key={`ul-${startKey}`} style={{ margin: "4px 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}>{listItems}</ul>);
            continue;
        }

        // Lista ordenada (suporte a numeração real e reinício)
        if (line.match(/^\d+\. /)) {
            const items = [];
            const startKey = i;
            let counter = 1;
            while (i < lines.length && (lines[i].match(/^\d+\. /) || lines[i].match(/^   [-*] /))) {
                if (lines[i].match(/^\d+\. /)) {
                    const text = lines[i].replace(/^\d+\. /, "");
                    items.push(<li key={i} style={{ marginBottom: 4 }}>{renderInline(text)}</li>);
                } else {
                    // Sub-item dentro de lista ordenada
                    const text = lines[i].replace(/^\s*[-*] /, "");
                    items.push(<li key={i} style={{ marginBottom: 3, listStyle: "disc", marginLeft: 16 }}>{renderInline(text)}</li>);
                }
                i++;
            }
            elements.push(<ol key={`ol-${startKey}`} style={{ margin: "4px 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}>{items}</ol>);
            continue;
        }

        // Linha em branco
        if (line.trim() === "") { elements.push(<div key={i} style={{ height: 6 }}/>); i++; continue; }

        // "Fonte real usada:" — destaque especial
        if (line.startsWith("Fonte real usada:") || line.startsWith("Fonte utilizada:")) {
            elements.push(
                <div key={i} style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)", fontSize: 12, color: "var(--text-muted)" }}>
                    {renderInline(line)}
                </div>
            );
            i++; continue;
        }

        // "Limitações:" — destaque em cinza
        if (line.startsWith("Limitações:")) {
            elements.push(
                <div key={i} style={{ marginTop: 6, fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>
                    {renderInline(line)}
                </div>
            );
            i++; continue;
        }

        // Parágrafo normal
        elements.push(<p key={i} style={{ fontSize: 14, lineHeight: 1.75, margin: "4px 0", color: "var(--text)" }}>{renderInline(line)}</p>);
        i++;
    }

    return <div style={{ minWidth: 0 }}>{elements}</div>;
}

function renderInline(text) {
    // Bold + italic + código inline
    const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("***") && part.endsWith("***"))
            return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
        if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
            return <em key={i}>{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`"))
            return <code key={i} style={{ background: "rgba(30,41,59,0.08)", borderRadius: 4, padding: "1px 5px", fontSize: 12, fontFamily: "monospace", color: "var(--cyan-dark)" }}>{part.slice(1, -1)}</code>;
        return part;
    });
}

function TypingIndicator() {
    return (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <img src={elvisImg} alt="Elvis" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}/>
            <div style={{ padding: "12px 16px", borderRadius: "4px 14px 14px 14px", background: "#fff", border: "1px solid rgba(30,41,59,0.1)", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-dim)", animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite` }}/>
                ))}
            </div>
            <style>{`@keyframes chatDot { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }`}</style>
        </div>
    );
}

function FiltroSelect({ value, onChange, options }) {
    return (
        <select value={value} onChange={onChange} style={{
            padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: value ? "1.5px solid rgba(6,182,212,0.4)" : "1px solid rgba(30,41,59,0.12)",
            background: value ? "rgba(6,182,212,0.06)" : "#fff",
            color: value ? "var(--cyan-dark)" : "var(--text-muted)", cursor: "pointer",
        }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

function Tag({ children, muted }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 20,
            background: muted ? "rgba(30,41,59,0.05)" : "rgba(6,182,212,0.08)",
            border: muted ? "1px solid rgba(30,41,59,0.1)" : "1px solid rgba(6,182,212,0.18)",
            color: muted ? "var(--text-dim)" : "var(--cyan-dark)",
        }}>{children}</span>
    );
}
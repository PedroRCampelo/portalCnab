import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    LuSend, LuPaperclip, LuX, LuChevronDown, LuBot, LuUser,
    LuFileText, LuSparkles, LuLock, LuArrowRight, LuCircleX,
} from "react-icons/lu";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
    getElvisQuota,
    isQuotaExcedidaError,
    getQuotaErrorInfo,
} from "../../services/elvisQuotaService.js";
import elvisImg from "../../assets/bots/elvis.png";

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const BOT = {
    nome:   "Elvis (BETA)",
    slogan: "Especialista em CNAB · Seu assistente bancário",
};

const BANCOS = ["", "itau", "bradesco", "bb", "caixa"];
const TIPOS  = ["", "cnab240", "cnab400"];

const LABEL_BANCO = {
    "":         "Todos os bancos",
    itau:       "Itaú",
    bradesco:   "Bradesco",
    bb:         "Banco do Brasil",
    caixa:      "Caixa",
};

const LABEL_TIPO = {
    "":       "CNAB 240 e 400",
    cnab240:  "CNAB 240",
    cnab400:  "CNAB 400",
};

const SUGESTOES = [
    "O que é o segmento A no CNAB 240?",
    "Como funciona o header de arquivo no Bradesco 240?",
    "Qual a diferença entre CNAB 240 e CNAB 400?",
    "Quais campos são obrigatórios no registro de detalhe?",
];

const EXTS_PERMITIDAS = ["txt", "rem", "ret", "cnab"];
const TAMANHO_MAX_KB  = 500;

/**
 * CnabChatPage — Chat com o Elvis (especialista em CNAB)
 * Sprint A3.6.13 (refatoração) + A3.9 (gate quota) + A3.9.4 (fair use)
 *
 * Funcionalidades:
 *  - Chat em tempo real com IA
 *  - Filtros de banco e versão CNAB
 *  - Anexar arquivo de remessa como contexto
 *  - Markdown rendering nas respostas
 *  - Fontes expansíveis (RAG)
 *  - Sugestões de perguntas iniciais
 *  - Badge de quota mensal (silencioso pra Plus, sempre pra Free)
 *  - Modal de limite atingido (vende upgrade pra Free, fala com a gente pra Plus)
 *
 * Endpoint:
 *  - POST /api/cnab/chat (multipart com pergunta + filtros + arquivo opcional)
 *  - GET  /api/elvis/uso-mensal (status da quota)
 *
 * Quotas:
 *  - Free      → 5 perguntas/mês (badge sempre visível)
 *  - Whallet+  → 100 perguntas/mês (badge silencioso, só >= 80%)
 *  - Admin     → ilimitado (sem badge)
 */
export default function CnabChatPage() {
    const { usuario } = useAuth();
    const [mensagens,    setMensagens]    = useState([]);
    const [input,        setInput]        = useState("");
    const [banco,        setBanco]        = useState("");
    const [tipo,         setTipo]         = useState("");
    const [arquivo,      setArquivo]      = useState(null);
    const [usarArquivo,  setUsarArquivo]  = useState(false);
    const [enviando,     setEnviando]     = useState(false);
    const [quota,        setQuota]        = useState(null);
    const [modalLimite,  setModalLimite]  = useState(false);

    const inputRef  = useRef(null);
    const fileRef   = useRef(null);
    const bottomRef = useRef(null);

    // Auto-scroll quando chega resposta
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens, enviando]);

    // Sprint A3.9: busca quota mensal do Elvis
    useEffect(() => {
        if (!usuario) return;
        recarregarQuota();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario]);

    function recarregarQuota() {
        getElvisQuota()
            .then(setQuota)
            .catch(() => {});  // silencioso — não quebra o chat
    }

    async function enviar(pergunta) {
        const texto = (pergunta ?? input).trim();
        if (!texto || enviando) return;

        setMensagens(prev => [...prev, { role: "user", content: texto }]);
        setInput("");
        setEnviando(true);

        try {
            const form = new FormData();
            form.append("pergunta", texto);
            if (banco) form.append("banco", banco);
            if (tipo)  form.append("tipo", tipo);
            form.append("usarArquivoAtualComoContexto", usarArquivo && arquivo ? "true" : "false");
            if (usarArquivo && arquivo) form.append("arquivoCnab", arquivo);

            const { data } = await api.post("/api/cnab/chat", form, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 60_000,
            });

            setMensagens(prev => [...prev, {
                role:    "assistant",
                content: data.resposta,
                fontes:  data.fontes,
            }]);

            // Sprint A3.9: recarrega quota após sucesso (atualiza badge)
            recarregarQuota();
        } catch (err) {
            // Sprint A3.9: trata HTTP 429 (quota excedida) com modal especial
            if (isQuotaExcedidaError(err)) {
                const info = getQuotaErrorInfo(err);
                setQuota({
                    ilimitado:     false,
                    usadas:        info.usadas,
                    limite:        info.limite,
                    restantes:     0,
                    anoMes:        info.anoMes,
                    podePerguntar: false,
                });
                setModalLimite(true);
                // Remove a mensagem que falhou (não conta como pergunta)
                setMensagens(prev => prev.slice(0, -1));
            } else {
                setMensagens(prev => [...prev, {
                    role: "error",
                    content: err.message?.includes("timeout")
                        ? "A resposta está demorando mais que o esperado. Tente uma pergunta mais específica."
                        : err.response?.data?.mensagem ?? "Erro ao obter resposta. Tente novamente.",
                }]);
            }
        } finally {
            setEnviando(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviar();
        }
    }

    function handleFileChange(e) {
        const f = e.target.files[0];
        if (!f) return;

        const ext = f.name.split(".").pop().toLowerCase();
        if (!EXTS_PERMITIDAS.includes(ext)) {
            alert("Apenas arquivos de remessa CNAB são permitidos (.txt, .rem, .ret, .cnab)");
            e.target.value = "";
            return;
        }
        if (f.size > TAMANHO_MAX_KB * 1024) {
            alert(`Arquivo muito grande. O limite é ${TAMANHO_MAX_KB}KB para arquivos de remessa.`);
            e.target.value = "";
            return;
        }
        setArquivo(f);
        setUsarArquivo(true);
    }

    function removerArquivo() {
        setArquivo(null);
        setUsarArquivo(false);
        if (fileRef.current) fileRef.current.value = "";
    }

    const temFiltro = banco || tipo;

    /* ─── Lógica do badge de quota ──────────────────────────────────── */
    // Free (limite 5):    sempre visível
    // Plus (limite 100):  só mostra quando uso >= 80% (silencioso pra UX limpa)
    // Admin (ilimitado):  nunca mostra
    function renderBadgeQuota() {
        if (!quota || quota.ilimitado) return null;

        const pct      = quota.limite ? (quota.usadas / quota.limite) * 100 : 0;
        const ehPlus   = quota.limite >= 50;  // Plus tem 100, Free tem 5
        const altoUso  = pct >= 80 && pct < 100;
        const esgotado = !quota.podePerguntar;

        // Plus em uso normal (0-79%): não mostra badge
        if (ehPlus && !altoUso && !esgotado) return null;

        // Cor do badge
        const classe = esgotado ? "cc-quota-badge cc-quota-badge--esgotado"
            : altoUso  ? "cc-quota-badge cc-quota-badge--alerta"
                :            "cc-quota-badge cc-quota-badge--ok";

        return (
            <div className={classe}>
                {quota.usadas}/{quota.limite} perguntas
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="cc-container">

            {/* ── Header com Elvis + filtros ── */}
            <div className="cc-header">
                <div className="cc-header-row">
                    <img src={elvisImg} alt="Elvis" className="cc-header-avatar"/>
                    <div className="cc-header-text">
                        <h1 className="cc-header-name">{BOT.nome}</h1>
                        <p className="cc-header-slogan">{BOT.slogan}</p>
                    </div>

                    {renderBadgeQuota()}

                    <div className="cc-filtros">
                        <FiltroSelect
                            value={banco}
                            onChange={e => setBanco(e.target.value)}
                            options={BANCOS.map(b => ({ value: b, label: LABEL_BANCO[b] }))}
                        />
                        <FiltroSelect
                            value={tipo}
                            onChange={e => setTipo(e.target.value)}
                            options={TIPOS.map(t => ({ value: t, label: LABEL_TIPO[t] }))}
                        />
                    </div>
                </div>

                {/* Banner de filtros ativos */}
                {temFiltro && (
                    <div className="cc-filtro-ativo">
                        <LuSparkles size={12}/>
                        <span>
                            Buscando em: {[banco && LABEL_BANCO[banco], tipo && LABEL_TIPO[tipo]].filter(Boolean).join(" · ")}
                        </span>
                        <button
                            className="cc-filtro-limpar"
                            onClick={() => { setBanco(""); setTipo(""); }}
                        >
                            Limpar
                        </button>
                    </div>
                )}
            </div>

            {/* ── Área de mensagens (scrollável) ── */}
            <div className="cc-mensagens">
                {mensagens.length === 0 ? (
                    <div className="cc-empty">
                        <div className="cc-empty-hero">
                            <img src={elvisImg} alt="Elvis" className="cc-empty-avatar"/>
                            <p className="cc-empty-text">
                                Olá! Sou o <strong>Elvis</strong>, especialista em layouts CNAB.
                                Faça uma pergunta sobre CNAB 240 ou 400, segmentos, campos ou
                                regras bancárias.
                            </p>
                        </div>

                        <div className="cc-sugestoes">
                            {SUGESTOES.map(s => (
                                <button
                                    key={s}
                                    className="cc-sugestao"
                                    onClick={() => enviar(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="cc-mensagens-lista">
                        {mensagens.map((msg, i) => (
                            <Mensagem key={i} msg={msg}/>
                        ))}
                        {enviando && <TypingIndicator/>}
                        <div ref={bottomRef}/>
                    </div>
                )}
            </div>

            {/* ── Input area ── */}
            <div className="cc-input-area">
                {/* Arquivo anexado */}
                {arquivo && (
                    <div className="cc-arquivo">
                        <LuFileText size={13} className="cc-arquivo-icon"/>
                        <span className="cc-arquivo-nome">{arquivo.name}</span>
                        <label className="cc-arquivo-toggle">
                            <input
                                type="checkbox"
                                checked={usarArquivo}
                                onChange={e => setUsarArquivo(e.target.checked)}
                            />
                            <span>Usar como contexto</span>
                        </label>
                        <button
                            className="cc-arquivo-remover"
                            onClick={removerArquivo}
                            title="Remover anexo"
                        >
                            <LuX size={13}/>
                        </button>
                    </div>
                )}

                {/* Input principal */}
                <div className="cc-input-box">
                    <button
                        className="cc-anexar"
                        onClick={() => fileRef.current?.click()}
                        title="Anexar arquivo CNAB"
                    >
                        <LuPaperclip size={18}/>
                    </button>

                    <input
                        ref={fileRef}
                        type="file"
                        style={{ display: "none" }}
                        accept=".txt,.rem,.ret,.cnab"
                        onChange={handleFileChange}
                    />

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Pergunte sobre CNAB 240, segmentos, campos, bancos..."
                        rows={1}
                        className="cc-textarea"
                        onInput={e => {
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                    />

                    <button
                        className="cc-enviar"
                        onClick={() => enviar()}
                        disabled={!input.trim() || enviando}
                    >
                        <LuSend size={15}/>
                    </button>
                </div>

                <p className="cc-disclaimer">
                    Respostas baseadas em documentação CNAB ingerida · Não substitui consulta aos manuais oficiais
                </p>
            </div>

            {/* ── Modal de limite atingido (Sprint A3.9 + A3.9.4) ── */}
            {modalLimite && quota && (
                <ModalLimite
                    quota={quota}
                    onFechar={() => setModalLimite(false)}
                />
            )}

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ModalLimite — diferenciado por plano (Free vende upgrade, Plus fala com a gente)
   Sprint A3.9.4 · Fair use
   ═════════════════════════════════════════════════════════════════════════════ */

function ModalLimite({ quota, onFechar }) {
    const ehPlus = quota.limite >= 50;  // 100 = Plus, 5 = Free

    return (
        <div className="cc-modal-overlay" onClick={onFechar}>
            <div className="cc-modal" onClick={e => e.stopPropagation()}>

                <button className="cc-modal-fechar" onClick={onFechar}>
                    <LuCircleX size={18}/>
                </button>

                <div className={`cc-modal-icon ${ehPlus ? "cc-modal-icon--warning" : "cc-modal-icon--error"}`}>
                    <LuLock size={26}/>
                </div>

                <h2 className="cc-modal-titulo">
                    {ehPlus
                        ? "Limite mensal atingido"
                        : "Você usou todas suas perguntas"}
                </h2>

                <p className="cc-modal-desc">
                    {ehPlus ? (
                        <>
                            Você usou <strong>{quota.usadas} de {quota.limite} perguntas</strong> deste mês.
                            O limite faz parte do uso justo do Whallet+ pra evitar abusos.
                            Reseta dia 1 do próximo mês.
                        </>
                    ) : (
                        <>
                            Limite de <strong>{quota.limite} perguntas mensais</strong> atingido.
                            Reseta dia 1 do próximo mês ou faça upgrade pra
                            <strong> perguntas ilimitadas</strong>.
                        </>
                    )}
                </p>

                {/* Card só pra Free (vende upgrade) */}
                {!ehPlus && (
                    <div className="cc-modal-card">
                        <div className="cc-modal-card-tag">Whallet+ — R$ 39,90/mês</div>
                        <ul className="cc-modal-card-list">
                            <li>✓ 100 perguntas/mês ao Elvis</li>
                            <li>✓ Conversões CNAB ilimitadas</li>
                            <li>✓ Gestão financeira completa</li>
                        </ul>
                    </div>
                )}

                <div className="cc-modal-actions">
                    {ehPlus ? (
                        <>
                            <Link
                                to="/contato"
                                onClick={onFechar}
                                className="cc-modal-btn cc-modal-btn--secondary"
                            >
                                Falar com a gente
                                <LuArrowRight size={14}/>
                            </Link>
                            <button onClick={onFechar} className="cc-modal-btn cc-modal-btn--primary">
                                Entendi
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/planos"
                                onClick={onFechar}
                                className="cc-modal-btn cc-modal-btn--primary"
                            >
                                Liberar Elvis ilimitado
                                <LuArrowRight size={14}/>
                            </Link>
                            <button onClick={onFechar} className="cc-modal-btn cc-modal-btn--ghost">
                                Talvez mais tarde
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Mensagem — bubble individual de cada mensagem
   ═════════════════════════════════════════════════════════════════════════════ */

function Mensagem({ msg }) {
    const [fonteAberta, setFonteAberta] = useState(false);
    const isUser  = msg.role === "user";
    const isError = msg.role === "error";

    return (
        <div className={`cc-msg ${isUser ? "cc-msg--user" : ""}`}>
            <div className={`cc-msg-avatar ${isUser ? "cc-msg-avatar--user" : isError ? "cc-msg-avatar--error" : "cc-msg-avatar--elvis"}`}>
                {isUser ? (
                    <LuUser size={14}/>
                ) : isError ? (
                    <LuBot size={14}/>
                ) : (
                    <img src={elvisImg} alt="Elvis"/>
                )}
            </div>

            <div className="cc-msg-body">
                <div className={`cc-msg-bubble ${isUser ? "cc-msg-bubble--user" : isError ? "cc-msg-bubble--error" : "cc-msg-bubble--elvis"}`}>
                    {isUser || isError ? (
                        <span className="cc-msg-text">{msg.content}</span>
                    ) : (
                        <MarkdownRenderer content={msg.content}/>
                    )}
                </div>

                {/* Fontes expansíveis */}
                {msg.fontes && msg.fontes.length > 0 && (
                    <div className="cc-fontes">
                        <button
                            className="cc-fontes-toggle"
                            onClick={() => setFonteAberta(o => !o)}
                        >
                            <LuFileText size={11}/>
                            {msg.fontes.length} {msg.fontes.length > 1 ? "fontes consultadas" : "fonte consultada"}
                            <LuChevronDown
                                size={11}
                                className="cc-fontes-arrow"
                                style={{ transform: fonteAberta ? "rotate(180deg)" : "none" }}
                            />
                        </button>

                        {fonteAberta && (
                            <div className="cc-fontes-lista">
                                {msg.fontes.map((f, i) => (
                                    <div key={i} className="cc-fonte">
                                        <div className="cc-fonte-head">
                                            <span className="cc-fonte-nome">{f.sourceName}</span>
                                            {f.bankCode  && <Tag>{f.bankCode.toUpperCase()}</Tag>}
                                            {f.cnabType  && <Tag>{f.cnabType.toUpperCase()}</Tag>}
                                            {f.similarity && <Tag muted>{(f.similarity * 100).toFixed(0)}% similar</Tag>}
                                        </div>
                                        <p className="cc-fonte-texto">{f.content}</p>
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

/* ═════════════════════════════════════════════════════════════════════════════
   TypingIndicator — 3 bolinhas pulsando
   ═════════════════════════════════════════════════════════════════════════════ */

function TypingIndicator() {
    return (
        <div className="cc-typing">
            <img src={elvisImg} alt="Elvis" className="cc-typing-avatar"/>
            <div className="cc-typing-bubble">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="cc-typing-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                ))}
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   FiltroSelect — dropdown de filtro de banco/versão
   ═════════════════════════════════════════════════════════════════════════════ */

function FiltroSelect({ value, onChange, options }) {
    return (
        <select
            value={value}
            onChange={onChange}
            className={`cc-filtro-select ${value ? "active" : ""}`}
        >
            {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Tag — pequeno badge usado nas fontes
   ═════════════════════════════════════════════════════════════════════════════ */

function Tag({ children, muted }) {
    return (
        <span className={`cc-tag ${muted ? "cc-tag--muted" : ""}`}>
            {children}
        </span>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   MarkdownRenderer — renderização de markdown sem dependência externa
   ═════════════════════════════════════════════════════════════════════════════ */

function MarkdownRenderer({ content }) {
    const lines = content.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Bloco de código
        if (line.startsWith("```")) {
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre key={i} className="cc-md-code">
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
            i++;
            continue;
        }

        // Headings
        if (line.startsWith("### ")) {
            elements.push(<h3 key={i} className="cc-md-h3">{renderInline(line.slice(4))}</h3>);
            i++; continue;
        }
        if (line.startsWith("## ")) {
            elements.push(<h2 key={i} className="cc-md-h2">{renderInline(line.slice(3))}</h2>);
            i++; continue;
        }
        if (line.startsWith("# ")) {
            elements.push(<h1 key={i} className="cc-md-h1">{renderInline(line.slice(2))}</h1>);
            i++; continue;
        }

        // Linha horizontal
        if (line.trim() === "---" || line.trim() === "***") {
            elements.push(<hr key={i} className="cc-md-hr"/>);
            i++; continue;
        }

        // Lista não-ordenada
        if (line.match(/^(\s*)[-*] /)) {
            const listItems = [];
            const startKey = i;
            while (i < lines.length && lines[i].match(/^(\s*)[-*] /)) {
                const indent = lines[i].match(/^(\s*)/)[1].length;
                const text = lines[i].replace(/^\s*[-*] /, "");
                listItems.push(
                    <li key={i} style={{ marginLeft: indent > 0 ? 16 : 0 }}>
                        {renderInline(text)}
                    </li>
                );
                i++;
            }
            elements.push(<ul key={`ul-${startKey}`} className="cc-md-ul">{listItems}</ul>);
            continue;
        }

        // Lista ordenada
        if (line.match(/^\d+\. /)) {
            const items = [];
            const startKey = i;
            while (i < lines.length && (lines[i].match(/^\d+\. /) || lines[i].match(/^   [-*] /))) {
                if (lines[i].match(/^\d+\. /)) {
                    const text = lines[i].replace(/^\d+\. /, "");
                    items.push(<li key={i}>{renderInline(text)}</li>);
                } else {
                    const text = lines[i].replace(/^\s*[-*] /, "");
                    items.push(<li key={i} style={{ listStyle: "disc", marginLeft: 16 }}>{renderInline(text)}</li>);
                }
                i++;
            }
            elements.push(<ol key={`ol-${startKey}`} className="cc-md-ol">{items}</ol>);
            continue;
        }

        // Linha em branco
        if (line.trim() === "") {
            elements.push(<div key={i} style={{ height: 6 }}/>);
            i++; continue;
        }

        // "Fonte real usada:" — destaque cyan
        if (line.startsWith("Fonte real usada:") || line.startsWith("Fonte utilizada:")) {
            elements.push(
                <div key={i} className="cc-md-fonte">{renderInline(line)}</div>
            );
            i++; continue;
        }

        // "Limitações:" — italic cinza
        if (line.startsWith("Limitações:")) {
            elements.push(
                <div key={i} className="cc-md-limit">{renderInline(line)}</div>
            );
            i++; continue;
        }

        // Parágrafo normal
        elements.push(<p key={i} className="cc-md-p">{renderInline(line)}</p>);
        i++;
    }

    return <div style={{ minWidth: 0 }}>{elements}</div>;
}

function renderInline(text) {
    const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("***") && part.endsWith("***"))
            return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
        if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
            return <em key={i}>{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`"))
            return <code key={i} className="cc-md-inline-code">{part.slice(1, -1)}</code>;
        return part;
    });
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS — escopo .cc-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
/* ── Container principal: fica dentro do AppLayout (que já tem padding) ─ */

.cc-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px);
    max-width: 860px;
    margin: 0 auto;
    margin-top: -20px;
    margin-bottom: -20px;
    padding: 0 16px;
}

/* ── Header ──────────────────────────────────────────────────────────── */

.cc-header { flex-shrink: 0; padding-top: 20px; }
.cc-header-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.cc-header-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(21,195,221,0.25); flex-shrink: 0; }
.cc-header-text { flex: 1; min-width: 0; }
.cc-header-name { margin: 0; font-size: 18px; font-weight: 700; color: var(--navy-deep); letter-spacing: -0.02em; }
.cc-header-slogan { margin: 0; font-size: 12px; color: var(--text-dim); letter-spacing: -0.005em; }

/* Badge de quota mensal — Sprint A3.9 */
.cc-quota-badge {
    padding: 4px 10px;
    border-radius: 100px;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    flex-shrink: 0;
}
.cc-quota-badge--ok {
    background: rgba(76, 221, 232, 0.12);
    border: 1px solid rgba(76, 221, 232, 0.25);
    color: var(--cyan-dark);
}
.cc-quota-badge--alerta {
    background: rgba(230, 162, 60, 0.15);
    border: 1px solid rgba(230, 162, 60, 0.3);
    color: #B07D2C;
}
.cc-quota-badge--esgotado {
    background: rgba(229, 72, 77, 0.12);
    border: 1px solid rgba(229, 72, 77, 0.3);
    color: var(--error);
}

.cc-filtros { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.cc-filtro-select { padding: 6px 10px; border-radius: 8px; font-family: var(--ff-sans); font-size: 12px; font-weight: 500; border: 1px solid var(--hair); background: var(--surface); color: var(--text-muted); cursor: pointer; letter-spacing: -0.005em; }
.cc-filtro-select.active { border: 1.5px solid var(--cyan); background: var(--cyan-soft); color: var(--cyan-dark); }
.cc-filtro-ativo { margin-bottom: 12px; padding: 6px 12px; border-radius: 8px; background: var(--cyan-soft); border: 1px solid rgba(21,195,221,0.18); font-size: 12px; color: var(--cyan-dark); display: flex; align-items: center; gap: 6px; letter-spacing: -0.005em; }
.cc-filtro-limpar { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--cyan-dark); font-family: var(--ff-sans); font-size: 11px; font-weight: 600; }
.cc-filtro-limpar:hover { text-decoration: underline; }

/* ── Área de mensagens ───────────────────────────────────────────────── */

.cc-mensagens { flex: 1; overflow-y: auto; padding-bottom: 8px; }
.cc-empty { padding: 32px 0; }
.cc-empty-hero { text-align: center; margin-bottom: 32px; }
.cc-empty-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; margin: 0 auto 14px; display: block; border: 2px solid rgba(21,195,221,0.25); }
.cc-empty-text { font-size: 14px; color: var(--text-muted); max-width: 380px; margin: 0 auto; line-height: 1.7; letter-spacing: -0.005em; }
.cc-empty-text strong { color: var(--navy-deep); font-weight: 700; }
.cc-sugestoes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cc-sugestao { padding: 12px 14px; border-radius: 12px; cursor: pointer; border: 1px solid var(--hair); background: var(--surface); color: var(--text-muted); font-family: var(--ff-sans); font-size: 13px; text-align: left; line-height: 1.5; letter-spacing: -0.005em; transition: all 0.15s; }
.cc-sugestao:hover { border-color: rgba(21,195,221,0.35); color: var(--navy-deep); background: var(--bg); }
.cc-mensagens-lista { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }

/* ── Mensagem individual ─────────────────────────────────────────────── */

.cc-msg { display: flex; gap: 10px; align-items: flex-start; }
.cc-msg--user { flex-direction: row-reverse; }
.cc-msg-avatar { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cc-msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
.cc-msg-avatar--user { background: var(--navy-deep); color: white; }
.cc-msg-avatar--elvis { background: var(--cyan-soft); }
.cc-msg-avatar--error { background: var(--error-bg); color: var(--error); }
.cc-msg-body { max-width: 80%; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cc-msg-bubble { padding: 12px 16px; font-size: 14px; line-height: 1.75; letter-spacing: -0.005em; }
.cc-msg-bubble--user { border-radius: 14px 4px 14px 14px; background: var(--navy-deep); color: white; }
.cc-msg-bubble--elvis { border-radius: 4px 14px 14px 14px; background: var(--surface); border: 1px solid var(--hair); color: var(--text); }
.cc-msg-bubble--error { border-radius: 4px 14px 14px 14px; background: var(--error-bg); border: 1px solid rgba(229,72,77,0.2); color: var(--error); }
.cc-msg-text { white-space: pre-wrap; }

/* Markdown styles */
.cc-md-h1 { font-size: 16px; font-weight: 800; color: var(--navy-deep); margin: 14px 0 6px; }
.cc-md-h2 { font-size: 15px; font-weight: 700; color: var(--navy-deep); margin: 14px 0 6px; }
.cc-md-h3 { font-size: 14px; font-weight: 700; color: var(--navy-deep); margin: 12px 0 4px; }
.cc-md-hr { border: none; border-top: 1px solid var(--hair); margin: 10px 0; }
.cc-md-ul, .cc-md-ol { margin: 4px 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: var(--text); }
.cc-md-ul li, .cc-md-ol li { margin-bottom: 4px; }
.cc-md-code { background: var(--bg); border: 1px solid var(--hair); border-radius: 8px; padding: 10px 12px; overflow-x: auto; font-size: 12px; line-height: 1.6; margin: 8px 0; }
.cc-md-code code { color: var(--navy-deep); font-family: var(--ff-mono); }
.cc-md-inline-code { background: rgba(21,195,221,0.1); border-radius: 4px; padding: 1px 5px; font-size: 12px; font-family: var(--ff-mono); color: var(--cyan-dark); }
.cc-md-fonte { margin-top: 12px; padding: 8px 12px; border-radius: 8px; background: var(--cyan-soft); border: 1px solid rgba(21,195,221,0.15); font-size: 12px; color: var(--text-muted); }
.cc-md-limit { margin-top: 6px; font-size: 12px; color: var(--text-dim); font-style: italic; }
.cc-md-p { font-size: 14px; line-height: 1.75; margin: 4px 0; color: var(--text); }

/* ── Fontes (acordeon) ───────────────────────────────────────────────── */

.cc-fontes { margin-top: 4px; }
.cc-fontes-toggle { display: flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; font-family: var(--ff-sans); font-size: 11px; color: var(--text-dim); padding: 4px 0; font-weight: 600; letter-spacing: -0.005em; }
.cc-fontes-toggle:hover { color: var(--navy-deep); }
.cc-fontes-arrow { transition: transform 0.15s; }
.cc-fontes-lista { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
.cc-fonte { padding: 8px 12px; border-radius: 8px; background: var(--bg); border: 1px solid var(--hair); font-size: 11px; }
.cc-fonte-head { display: flex; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; align-items: center; }
.cc-fonte-nome { font-weight: 600; color: var(--navy-deep); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
.cc-fonte-texto { color: var(--text-muted); margin: 0; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

/* ── Tag ─────────────────────────────────────────────────────────────── */

.cc-tag { font-family: var(--ff-mono); font-size: 9px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 7px; border-radius: 100px; background: var(--cyan-soft); border: 1px solid rgba(21,195,221,0.18); color: var(--cyan-dark); text-transform: uppercase; }
.cc-tag--muted { background: var(--bg); border-color: var(--hair); color: var(--text-dim); }

/* ── Typing Indicator ────────────────────────────────────────────────── */

.cc-typing { display: flex; gap: 10px; align-items: flex-start; }
.cc-typing-avatar { width: 30px; height: 30px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.cc-typing-bubble { padding: 12px 16px; border-radius: 4px 14px 14px 14px; background: var(--surface); border: 1px solid var(--hair); display: flex; gap: 5px; align-items: center; }
.cc-typing-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-dim); animation: cc-typing-anim 1.2s ease-in-out infinite; }
@keyframes cc-typing-anim {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30%           { transform: translateY(-5px); opacity: 1; }
}

/* ── Input area ──────────────────────────────────────────────────────── */

.cc-input-area { flex-shrink: 0; padding-bottom: 20px; }
.cc-arquivo { margin-bottom: 8px; display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 8px; background: var(--cyan-soft); border: 1px solid rgba(21,195,221,0.2); }
.cc-arquivo-icon { color: var(--cyan-dark); flex-shrink: 0; }
.cc-arquivo-nome { font-size: 12px; color: var(--text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.005em; }
.cc-arquivo-toggle { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; cursor: pointer; color: var(--cyan-dark); letter-spacing: -0.005em; }
.cc-arquivo-toggle input { width: 13px; height: 13px; cursor: pointer; accent-color: var(--cyan); }
.cc-arquivo-remover { background: none; border: none; cursor: pointer; color: var(--text-dim); display: flex; padding: 2px; border-radius: 4px; transition: color 0.15s, background 0.15s; }
.cc-arquivo-remover:hover { color: var(--error); background: var(--error-bg); }
.cc-input-box { display: flex; gap: 8px; align-items: flex-end; background: var(--surface); border: 1.5px solid var(--hair); border-radius: 14px; padding: 10px 10px 10px 14px; box-shadow: 0 2px 12px rgba(11,30,54,0.06); transition: border-color 0.15s, box-shadow 0.15s; }
.cc-input-box:focus-within { border-color: var(--cyan); box-shadow: 0 2px 12px rgba(21,195,221,0.15); }
.cc-anexar { background: none; border: none; cursor: pointer; color: var(--text-dim); padding: 4px; display: flex; align-items: center; flex-shrink: 0; border-radius: 6px; transition: color 0.15s, background 0.15s; }
.cc-anexar:hover { color: var(--cyan-dark); background: var(--cyan-soft); }
.cc-textarea { flex: 1; resize: none; border: none; outline: none; font-size: 14px; color: var(--text); background: transparent; line-height: 1.6; max-height: 120px; overflow-y: auto; font-family: var(--ff-sans); letter-spacing: -0.005em; }
.cc-textarea::placeholder { color: var(--text-dim); }
.cc-enviar { width: 36px; height: 36px; border-radius: 10px; border: none; flex-shrink: 0; background: linear-gradient(135deg, #15C3DD, #0891A8); color: #0B1E36; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.15s, opacity 0.15s; }
.cc-enviar:hover:not(:disabled) { transform: translateY(-1px); }
.cc-enviar:disabled { background: var(--bg); color: var(--text-dim); cursor: not-allowed; }
.cc-disclaimer { font-size: 11px; color: var(--text-dim); text-align: center; margin: 8px 0 0; letter-spacing: -0.005em; }

/* ── Modal de limite (Sprint A3.9 + A3.9.4) ──────────────────────────── */

.cc-modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(11, 30, 54, 0.5);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
}
.cc-modal {
    background: var(--surface);
    border-radius: 16px;
    padding: 32px 28px;
    max-width: 440px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(11, 30, 54, 0.25);
    border: 1px solid var(--hair);
    position: relative;
    text-align: center;
}
.cc-modal-fechar {
    position: absolute; top: 12px; right: 12px;
    width: 28px; height: 28px; border-radius: 8px;
    border: none; background: transparent;
    color: var(--text-dim); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
}
.cc-modal-fechar:hover { color: var(--navy-deep); background: var(--bg); }
.cc-modal-icon {
    width: 56px; height: 56px; border-radius: 14px;
    margin: 0 auto 18px;
    display: flex; align-items: center; justify-content: center;
}
.cc-modal-icon--error { background: var(--error-bg); color: var(--error); }
.cc-modal-icon--warning { background: var(--warning-bg); color: var(--warning); }
.cc-modal-titulo {
    margin: 0 0 8px;
    font-size: 20px; font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.02em;
}
.cc-modal-desc {
    margin: 0 0 20px;
    font-size: 14px; line-height: 1.6;
    color: var(--text-muted);
}
.cc-modal-desc strong { color: var(--navy-deep); font-weight: 600; }
.cc-modal-card {
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.18);
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 20px;
    text-align: left;
}
.cc-modal-card-tag {
    font-family: var(--ff-mono);
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--cyan-dark);
    margin-bottom: 6px;
}
.cc-modal-card-list {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 4px;
}
.cc-modal-card-list li { font-size: 12px; color: var(--ink-2); }
.cc-modal-actions { display: flex; gap: 8px; flex-direction: column; }
.cc-modal-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 12px 18px; border-radius: 10px;
    font-family: var(--ff-sans);
    font-size: 14px; font-weight: 700;
    letter-spacing: -0.005em;
    text-decoration: none; cursor: pointer;
    transition: all 0.15s;
}
.cc-modal-btn--primary {
    background: linear-gradient(135deg, #15C3DD, #0891A8);
    color: #0B1E36;
    border: none;
    box-shadow: 0 2px 12px rgba(21, 195, 221, 0.25);
}
.cc-modal-btn--primary:hover { transform: translateY(-1px); }
.cc-modal-btn--secondary {
    background: var(--surface);
    border: 1px solid var(--hair);
    color: var(--navy-deep);
}
.cc-modal-btn--secondary:hover { border-color: var(--text-dim); background: var(--bg); }
.cc-modal-btn--ghost {
    padding: 10px 18px;
    border: 1px solid var(--hair);
    background: transparent;
    color: var(--text-muted);
    font-size: 13px; font-weight: 600;
}
.cc-modal-btn--ghost:hover { color: var(--navy-deep); background: var(--bg); }

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 700px) {
    .cc-header-row { flex-wrap: wrap; }
    .cc-quota-badge { order: 3; }
    .cc-filtros { width: 100%; margin-top: 8px; }
    .cc-filtro-select { flex: 1; }
    .cc-sugestoes { grid-template-columns: 1fr; }
    .cc-msg-body { max-width: 88%; }
    .cc-modal { padding: 24px 20px; }
    .cc-modal-titulo { font-size: 18px; }
}
`;
import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import {
    LuX, LuMessageCircle, LuSend, LuCircleAlert, LuClock,
    LuPhone, LuLoader, LuRefreshCw, LuPencil, LuCheck,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de mensagem — texto pro UI vem aqui, mensagem real vem do backend
// (manter sincronizado com CobrancaService.java do backend)
// ─────────────────────────────────────────────────────────────────────────────
const TIPOS_MENSAGEM = [
    {
        value: "LEMBRETE",
        label: "Lembrete",
        descricao: "Tom suave, antes de vencer",
        emoji: "💚",
        cor: "#10B981",
        bg: "rgba(16,185,129,0.10)",
        border: "rgba(16,185,129,0.30)",
    },
    {
        value: "COBRANCA_AMIGAVEL",
        label: "Amigável",
        descricao: "Atrasou poucos dias",
        emoji: "🤝",
        cor: "#0EA5E9",
        bg: "rgba(14,165,233,0.10)",
        border: "rgba(14,165,233,0.30)",
    },
    {
        value: "COBRANCA_FORMAL",
        label: "Formal",
        descricao: "Atraso médio (cobrança direta)",
        emoji: "📢",
        cor: "#D4A017",
        bg: "rgba(212,160,23,0.12)",
        border: "rgba(212,160,23,0.30)",
    },
    {
        value: "COBRANCA_FIRME",
        label: "Firme",
        descricao: "Última tentativa antes de medidas",
        emoji: "🚨",
        cor: "#DC2626",
        bg: "rgba(220,38,38,0.08)",
        border: "rgba(220,38,38,0.30)",
    },
];

// Sugere tom inicial baseado em status + dias de atraso
function sugerirTomInicial(recebimento) {
    if (recebimento.status === "PENDENTE") return "LEMBRETE";

    if (recebimento.status === "ATRASADO") {
        const venc = new Date(recebimento.dataVencimento + "T00:00:00");
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const diasAtraso = Math.round((hoje - venc) / (1000 * 60 * 60 * 24));

        if (diasAtraso <= 3)  return "COBRANCA_AMIGAVEL";
        if (diasAtraso <= 15) return "COBRANCA_FORMAL";
        return "COBRANCA_FIRME";
    }
    if (recebimento.status === "PARCIAL") return "COBRANCA_AMIGAVEL";
    return "LEMBRETE";
}

function fmtDataHora(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: timeline de cobranças anteriores
// ─────────────────────────────────────────────────────────────────────────────
function HistoricoCobrancas({ historico }) {
    if (historico.length === 0) {
        return (
            <div style={{
                padding: 12, fontSize: 12, color: "var(--text-dim)",
                textAlign: "center", fontStyle: "italic",
            }}>
                Nenhuma cobrança enviada ainda.
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historico.map(h => {
                const tipo = TIPOS_MENSAGEM.find(t => t.value === h.tipoMensagem);
                return (
                    <div key={h.id} style={{
                        padding: "8px 12px", borderRadius: 8,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        fontSize: 12,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontWeight: 600, color: tipo?.cor ?? "var(--text)",
                            }}>
                                {tipo?.emoji} {tipo?.label ?? h.tipoMensagem}
                            </span>
                            <span style={{ color: "var(--text-dim)" }}>{fmtDataHora(h.enviadoEm)}</span>
                        </div>
                        {h.mensagemTexto && (
                            <div style={{
                                color: "var(--text-muted)", fontSize: 11,
                                whiteSpace: "pre-wrap", lineHeight: 1.5,
                                maxHeight: 60, overflow: "hidden",
                                textOverflow: "ellipsis", display: "-webkit-box",
                                WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                            }}>
                                {h.mensagemTexto}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────────────────────────────────────
export default function CobrancaWhatsappModal({ recebimento, onFechar, onSucesso }) {
    const [tom, setTom]                       = useState(() => sugerirTomInicial(recebimento));
    const [mensagem, setMensagem]             = useState("");
    const [linkWhatsapp, setLinkWhatsapp]     = useState("");
    const [telefoneCliente, setTelefoneCli]   = useState("");
    const [prontoParaEnvio, setProntoEnvio]   = useState(false);
    const [avisoSpam, setAvisoSpam]           = useState(null);
    const [editandoMsg, setEditandoMsg]       = useState(false);
    const [carregandoPreview, setCarPreview]  = useState(true);
    const [historico, setHistorico]           = useState([]);
    const [historicoVisivel, setHistVisivel]  = useState(false);
    const [erro, setErro]                     = useState("");
    const [enviado, setEnviado]               = useState(false);

    // Carrega preview sempre que muda o tom
    const carregarPreview = useCallback(async (tipoMensagem) => {
        setCarPreview(true);
        setErro("");
        setEditandoMsg(false);
        try {
            const { data } = await api.post(
                `/api/recebimentos/${recebimento.id}/cobranca/preview`,
                { tipoMensagem, mensagemCustomizada: null }
            );
            setMensagem(data.mensagem ?? "");
            setLinkWhatsapp(data.linkWhatsapp ?? "");
            setTelefoneCli(data.telefoneCliente ?? "");
            setProntoEnvio(!!data.prontoParaEnvio);
            setAvisoSpam(data.avisoSpam);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao gerar mensagem");
        } finally {
            setCarPreview(false);
        }
    }, [recebimento.id]);

    // Carrega histórico (uma vez ao abrir)
    const carregarHistorico = useCallback(async () => {
        try {
            const { data } = await api.get(`/api/recebimentos/${recebimento.id}/cobranca/historico`);
            setHistorico(data);
        } catch {
            // silencioso — histórico é nice-to-have, não crítico
        }
    }, [recebimento.id]);

    useEffect(() => { carregarPreview(tom); }, [tom, carregarPreview]);
    useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

    // Quando a mensagem é editada, regenera o link wa.me localmente
    function handleEditarMsg(novoTexto) {
        setMensagem(novoTexto);
        if (telefoneCliente && prontoParaEnvio) {
            // Reconstrói o link com a mensagem nova
            const digitos = telefoneCliente.replace(/\D/g, "");
            const comDdi = digitos.startsWith("55") ? digitos : "55" + digitos;
            setLinkWhatsapp(`https://wa.me/${comDdi}?text=${encodeURIComponent(novoTexto)}`);
        }
    }

    async function handleEnviar() {
        if (!linkWhatsapp) return;

        // 1. Abre WhatsApp em nova aba (deve ser síncrono pra browser não bloquear popup)
        window.open(linkWhatsapp, "_blank", "noopener,noreferrer");

        // 2. Registra o envio (auditoria + histórico)
        try {
            await api.post(`/api/recebimentos/${recebimento.id}/cobranca/registrar`, {
                tipoMensagem: tom,
                mensagemCustomizada: mensagem,
            });
            setEnviado(true);
            // Recarrega o histórico pra mostrar a cobrança nova
            await carregarHistorico();
            // Avisa a página pai (pode atualizar lista, etc)
            if (onSucesso) onSucesso();
        } catch (err) {
            // Não desfaz o popup — o WhatsApp já abriu, só falhou o registro
            console.error("Erro ao registrar cobrança", err);
        }
    }

    // Cliente sem telefone — bloqueia tudo, dá orientação
    if (!recebimento.cliente?.telefone) {
        return (
            <div style={overlayStyle} onClick={onFechar}>
                <div style={modalStyle} onClick={e => e.stopPropagation()}>
                    <div style={modalHeader}>
                        <h2 style={tituloStyle}>
                            <LuMessageCircle size={20} style={{ color: "#25D366" }}/>
                            Cobrança via WhatsApp
                        </h2>
                        <button onClick={onFechar} style={closeBtn}><LuX size={20}/></button>
                    </div>
                    <div style={{ padding: "24px", textAlign: "center" }}>
                        <LuCircleAlert size={36} style={{ color: "#D4A017", margin: "0 auto 12px", display: "block" }}/>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                            Cliente sem telefone cadastrado
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
                            Pra cobrar via WhatsApp, primeiro adicione o número de <strong>{recebimento.cliente?.nome}</strong> no cadastro de clientes.
                        </div>
                        <button onClick={onFechar} className="btn-secondary"
                                style={{ padding: "10px 20px" }}>
                            Entendi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={overlayStyle} onClick={onFechar}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={modalHeader}>
                    <h2 style={tituloStyle}>
                        <LuMessageCircle size={20} style={{ color: "#25D366" }}/>
                        Cobrar via WhatsApp
                    </h2>
                    <button onClick={onFechar} style={closeBtn}><LuX size={20}/></button>
                </div>

                <div style={{ padding: "20px 24px" }}>

                    {/* Info do destinatário */}
                    <div style={{
                        padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                        background: "rgba(37,211,102,0.06)",
                        border: "1px solid rgba(37,211,102,0.20)",
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <LuPhone size={16} style={{ color: "#25D366", flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                {recebimento.cliente.nome}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {telefoneCliente}
                            </div>
                        </div>
                    </div>

                    {/* Aviso anti-spam */}
                    {avisoSpam && (
                        <div style={{
                            padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                            background: "rgba(212,160,23,0.10)",
                            border: "1px solid rgba(212,160,23,0.30)",
                            color: "#92660C", fontSize: 12,
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <LuClock size={14} style={{ flexShrink: 0 }}/>
                            {avisoSpam}
                        </div>
                    )}

                    {/* Seleção de tom */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={subtitulo}>Escolha o tom da mensagem</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                            {TIPOS_MENSAGEM.map(t => {
                                const ativo = tom === t.value;
                                return (
                                    <button key={t.value} type="button"
                                            onClick={() => setTom(t.value)}
                                            disabled={enviado}
                                            style={{
                                                padding: "10px 12px", borderRadius: 8,
                                                border: "1.5px solid",
                                                borderColor: ativo ? t.border : "var(--border)",
                                                background: ativo ? t.bg : "var(--surface)",
                                                cursor: enviado ? "not-allowed" : "pointer",
                                                textAlign: "left", transition: "all 0.15s",
                                                opacity: enviado ? 0.5 : 1,
                                            }}>
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            fontSize: 13, fontWeight: 700, marginBottom: 2,
                                            color: ativo ? t.cor : "var(--text)",
                                        }}>
                                            <span>{t.emoji}</span>
                                            {t.label}
                                            {ativo && <LuCheck size={14} style={{ marginLeft: "auto" }}/>}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>
                                            {t.descricao}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview da mensagem (editável) */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ ...subtitulo, marginBottom: 0 }}>Mensagem</div>
                            {!editandoMsg && !enviado && (
                                <button type="button" onClick={() => setEditandoMsg(true)}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "var(--cyan-dark)", fontSize: 11, fontWeight: 600,
                                            display: "inline-flex", alignItems: "center", gap: 3,
                                        }}>
                                    <LuPencil size={11}/> Editar
                                </button>
                            )}
                            {editandoMsg && (
                                <button type="button"
                                        onClick={() => carregarPreview(tom)}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "var(--text-dim)", fontSize: 11, fontWeight: 600,
                                            display: "inline-flex", alignItems: "center", gap: 3,
                                        }}>
                                    <LuRefreshCw size={11}/> Restaurar padrão
                                </button>
                            )}
                        </div>

                        {carregandoPreview ? (
                            <div style={{
                                padding: 16, textAlign: "center", color: "var(--text-dim)",
                                background: "var(--surface)", borderRadius: 8, fontSize: 12,
                            }}>
                                <LuLoader size={14} style={{ animation: "spin 1s linear infinite" }}/>
                                <div style={{ marginTop: 4 }}>Gerando mensagem...</div>
                            </div>
                        ) : (
                            <textarea
                                value={mensagem}
                                onChange={e => handleEditarMsg(e.target.value)}
                                disabled={!editandoMsg || enviado}
                                rows={6}
                                style={{
                                    width: "100%", padding: 12, borderRadius: 8,
                                    border: "1px solid var(--border)",
                                    background: editandoMsg ? "var(--bg)" : "var(--surface)",
                                    color: "var(--text)", fontSize: 13, lineHeight: 1.6,
                                    fontFamily: "inherit", resize: "vertical",
                                    cursor: editandoMsg ? "text" : "default",
                                }}
                            />
                        )}
                    </div>

                    {/* Botão histórico expansível */}
                    {historico.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <button type="button"
                                    onClick={() => setHistVisivel(v => !v)}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
                                        padding: 0, display: "inline-flex", alignItems: "center", gap: 4,
                                    }}>
                                {historicoVisivel ? "▼" : "▶"} Histórico de cobranças ({historico.length})
                            </button>
                            {historicoVisivel && (
                                <div style={{ marginTop: 8 }}>
                                    <HistoricoCobrancas historico={historico}/>
                                </div>
                            )}
                        </div>
                    )}

                    {erro && (
                        <div style={{
                            padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                            background: "rgba(220,38,38,0.05)",
                            border: "1px solid rgba(220,38,38,0.15)",
                            color: "#DC2626", fontSize: 13,
                        }}>{erro}</div>
                    )}

                    {/* Botões finais */}
                    {enviado ? (
                        <div style={{
                            padding: "14px 16px", borderRadius: 10,
                            background: "rgba(37,211,102,0.08)",
                            border: "1px solid rgba(37,211,102,0.30)",
                            color: "#15803D", fontSize: 13, fontWeight: 600,
                            textAlign: "center", marginTop: 8,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}>
                            <LuCheck size={16}/>
                            Cobrança registrada! O WhatsApp foi aberto em nova aba.
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button onClick={onFechar} className="btn-secondary"
                                    style={{ padding: "10px 16px" }}>
                                Cancelar
                            </button>
                            <button
                                onClick={handleEnviar}
                                disabled={!prontoParaEnvio || carregandoPreview || !mensagem.trim()}
                                style={{
                                    padding: "10px 20px",
                                    background: "#25D366", color: "#fff",
                                    border: "none", borderRadius: 8,
                                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    transition: "all 0.15s",
                                    opacity: (!prontoParaEnvio || carregandoPreview || !mensagem.trim()) ? 0.5 : 1,
                                }}
                                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#1FAA52"; }}
                                onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#25D366"; }}>
                                <LuSend size={14}/>
                                Abrir WhatsApp
                            </button>
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────
const overlayStyle = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16, zIndex: 1000,
};

const modalStyle = {
    width: "100%", maxWidth: 540,
    background: "var(--bg)", borderRadius: 12,
    border: "1px solid var(--border)",
    maxHeight: "90vh", overflowY: "auto",
};

const modalHeader = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px", borderBottom: "1px solid var(--border)",
};

const tituloStyle = {
    margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)",
    display: "flex", alignItems: "center", gap: 8,
};

const closeBtn = {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text-dim)", padding: 4, lineHeight: 0,
};

const subtitulo = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
    textTransform: "uppercase", color: "var(--text-dim)",
    marginBottom: 8,
};
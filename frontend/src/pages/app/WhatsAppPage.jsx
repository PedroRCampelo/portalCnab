import { useState, useEffect } from "react";
import {
    LuMessageCircle, LuCheck, LuX, LuRefreshCw, LuPhone,
    LuShieldCheck, LuUnplug, LuKeyRound,
} from "react-icons/lu";
import api from "../../services/api.js";
import { AiOutlineLoading3Quarters } from "react-icons/ai";


export default function WhatsAppPage() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [telefone, setTelefone] = useState("");
    const [codigo, setCodigo] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [verificando, setVerificando] = useState(false);
    const [mensagem, setMensagem] = useState(null);
    const [editando, setEditando] = useState(false);

    useEffect(() => { carregarStatus(); }, []);

    async function carregarStatus() {
        setLoading(true);
        try {
            const { data } = await api.get("/api/whatsapp/status");
            setStatus(data);
            if (data.telefone) setTelefone(formatarTelefone(data.telefone));
        } catch { setStatus({ vinculado: false, pendente: false }); }
        setLoading(false);
    }

    async function ativar() {
        if (!telefone || telefone.replace(/\D/g, "").length < 10) {
            setMensagem({ tipo: "erro", texto: "Informe um número válido com DDD." });
            return;
        }
        setEnviando(true);
        setMensagem(null);
        try {
            await api.post("/api/whatsapp/ativar", { telefone: telefone.replace(/\D/g, "") });
            setMensagem({ tipo: "ok", texto: "Código enviado pro seu WhatsApp! Digite-o abaixo pra confirmar." });
            setEditando(false);
            setCodigo("");
            setTimeout(carregarStatus, 1500);
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            const msg = typeof data === "string" ? data : data?.mensagem;
            if (status === 403) {
                setMensagem({ tipo: "erro", texto: msg || "O Bot WhatsApp está disponível apenas no plano Whallet+." });
            } else if (msg && msg.includes("vinculado")) {
                setMensagem({ tipo: "erro", texto: "⚠️ Este número já está vinculado a outra conta Whallet. Peça ao titular para desvincular primeiro." });
            } else {
                setMensagem({ tipo: "erro", texto: msg || "Erro ao enviar código. Tente novamente." });
            }
        }
        setEnviando(false);
    }

    async function verificarCodigo() {
        if (!codigo || codigo.replace(/\D/g, "").length !== 6) {
            setMensagem({ tipo: "erro", texto: "Digite o código de 6 dígitos." });
            return;
        }
        setVerificando(true);
        setMensagem(null);
        try {
            await api.post("/api/whatsapp/verificar", { codigo: codigo.replace(/\D/g, "") });
            setMensagem({ tipo: "ok", texto: "WhatsApp vinculado com sucesso!" });
            setCodigo("");
            setTimeout(carregarStatus, 1000);
        } catch (err) {
            setMensagem({ tipo: "erro", texto: err.response?.data?.mensagem || "Código inválido ou expirado." });
        }
        setVerificando(false);
    }

    async function desvincular() {
        if (!confirm("Deseja realmente desvincular o WhatsApp?")) return;
        try {
            await api.delete("/api/whatsapp/desvincular");
            setStatus({ vinculado: false, pendente: false });
            setTelefone("");
            setCodigo("");
            setMensagem({ tipo: "ok", texto: "WhatsApp desvinculado." });
        } catch {
            setMensagem({ tipo: "erro", texto: "Erro ao desvincular." });
        }
    }

    function formatarTelefone(num) {
        const d = (num || "").replace(/\D/g, "");
        if (d.startsWith("55") && d.length >= 12) {
            const local = d.substring(2);
            if (local.length === 11) return `(${local.slice(0,2)}) ${local.slice(2,7)}-${local.slice(7)}`;
            if (local.length === 10) return `(${local.slice(0,2)}) ${local.slice(2,6)}-${local.slice(6)}`;
        }
        if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
        if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
        return num;
    }

    function mascaraTelefone(v) {
        const d = v.replace(/\D/g, "").slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
        return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    }

    function mascaraCodigo(v) {
        return v.replace(/\D/g, "").slice(0, 6);
    }

    if (loading) {
        return (
            <div className="wa-page">
                <div className="wa-loading"><AiOutlineLoading3Quarters size={24} className="wa-spin" /> Carregando...</div>
                <style>{CSS}</style>
            </div>
        );
    }

    const vinculado = status?.vinculado;
    const pendente = status?.pendente;

    return (
        <div className="wa-page">
            {/* ── Aviso de manutenção ── */}
            <div className="wa-manutencao">
                <div className="wa-manutencao-icon">🔧</div>
                <div className="wa-manutencao-body">
                    <strong>Bot WhatsApp em manutenção</strong>
                    <p>
                        Estamos migrando nossa infraestrutura de WhatsApp para a <strong>API Oficial do Meta</strong>,
                        garantindo maior estabilidade e confiabilidade. O serviço ficará indisponível durante esse período.
                        Avisaremos assim que a migração for concluída.
                    </p>
                </div>
            </div>

            {/* Header */}
            <div className="wa-header">
                <div className="wa-header-icon"><LuMessageCircle size={28} /></div>
                <div>
                    <h1 className="wa-title">WhatsApp Bot</h1>
                    <p className="wa-subtitle">Gerencie lançamentos financeiros por texto ou áudio via WhatsApp</p>
                </div>
            </div>

            {/* Status Card */}
            <div className={`wa-card ${vinculado ? "wa-card--ok" : pendente ? "wa-card--pending" : "wa-card--off"}`}>
                <div className="wa-card-header">
                    <div className="wa-status-badge">
                        {vinculado ? <><LuShieldCheck size={16} /> Vinculado</> :
                            pendente  ? <><LuRefreshCw size={16} className="wa-spin" /> Aguardando verificação</> :
                                <><LuUnplug size={16} /> Não vinculado</>}
                    </div>
                    {vinculado && (
                        <span className="wa-telefone-display">
                            <LuPhone size={14} /> {formatarTelefone(status.telefone)}
                        </span>
                    )}
                </div>

                {/* ── Não vinculado: formulário ── */}
                {!vinculado && !pendente && (
                    <div className="wa-form">
                        <p className="wa-form-desc">
                            Digite seu número de WhatsApp pra receber um código de verificação.
                        </p>
                        <div className="wa-input-row">
                            <div className="wa-input-wrap">
                                <LuPhone size={16} className="wa-input-icon" />
                                <input
                                    type="tel"
                                    className="wa-input"
                                    placeholder="(11) 99111-1233"
                                    value={telefone}
                                    onChange={e => setTelefone(mascaraTelefone(e.target.value))}
                                    maxLength={16}
                                    disabled={enviando}
                                />
                            </div>
                            <button className="wa-btn wa-btn--primary" onClick={ativar} disabled={enviando}>
                                {enviando ? <AiOutlineLoading3Quarters size={16} className="wa-spin" /> : <LuCheck size={16} />}
                                {enviando ? "Enviando..." : "Enviar código"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Pendente: campo de código ── */}
                {pendente && (
                    <div className="wa-pending">
                        <p>📱 Código enviado para <strong>{formatarTelefone(status.telefone)}</strong></p>
                        <p className="wa-pending-hint">Verifique seu WhatsApp e digite o código de 6 dígitos abaixo:</p>

                        <div className="wa-code-row">
                            <div className="wa-input-wrap wa-code-wrap">
                                <LuKeyRound size={16} className="wa-input-icon" />
                                <input
                                    type="text"
                                    className="wa-input wa-code-input"
                                    placeholder="000000"
                                    value={codigo}
                                    onChange={e => setCodigo(mascaraCodigo(e.target.value))}
                                    maxLength={6}
                                    disabled={verificando}
                                    onKeyDown={e => e.key === "Enter" && verificarCodigo()}
                                />
                            </div>
                            <button className="wa-btn wa-btn--primary" onClick={verificarCodigo} disabled={verificando || codigo.length !== 6}>
                                {verificando ? <AiOutlineLoading3Quarters size={16} className="wa-spin" /> : <LuShieldCheck size={16} />}
                                {verificando ? "Verificando..." : "Verificar"}
                            </button>
                        </div>

                        <div className="wa-pending-actions">
                            <button className="wa-btn wa-btn--ghost" onClick={ativar} disabled={enviando}>
                                <LuRefreshCw size={14} /> Reenviar código
                            </button>
                            <button className="wa-btn wa-btn--ghost" onClick={() => { setStatus({ vinculado: false, pendente: false }); setTelefone(""); setCodigo(""); }}>
                                Tentar outro número
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Vinculado: info + ações ── */}
                {vinculado && (
                    <div className="wa-vinculado">
                        {!editando ? (
                            <div className="wa-actions">
                                <button className="wa-btn wa-btn--ghost" onClick={() => setEditando(true)}>
                                    <LuRefreshCw size={14} /> Alterar número
                                </button>
                                <button className="wa-btn wa-btn--danger" onClick={desvincular}>
                                    <LuX size={14} /> Desvincular
                                </button>
                            </div>
                        ) : (
                            <div className="wa-form">
                                <p className="wa-form-desc">Digite o novo número pra receber um novo código:</p>
                                <div className="wa-input-row">
                                    <div className="wa-input-wrap">
                                        <LuPhone size={16} className="wa-input-icon" />
                                        <input
                                            type="tel"
                                            className="wa-input"
                                            placeholder="(81) 99677-4063"
                                            value={telefone}
                                            onChange={e => setTelefone(mascaraTelefone(e.target.value))}
                                            maxLength={16}
                                            disabled={enviando}
                                        />
                                    </div>
                                    <button className="wa-btn wa-btn--primary" onClick={ativar} disabled={enviando}>
                                        {enviando ? <AiOutlineLoading3Quarters size={16} className="wa-spin" /> : <LuCheck size={16} />}
                                        Enviar código
                                    </button>
                                    <button className="wa-btn wa-btn--ghost" onClick={() => { setEditando(false); setTelefone(formatarTelefone(status.telefone)); }}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mensagem */}
            {mensagem && (
                <div className={`wa-msg wa-msg--${mensagem.tipo}`}>
                    {mensagem.tipo === "ok" ? <LuCheck size={16} /> : <LuX size={16} />}
                    {mensagem.texto}
                </div>
            )}

            {/* Comandos disponíveis */}
            {vinculado && (
                <div className="wa-card wa-card--info">
                    <h3 className="wa-section-title">Comandos disponíveis</h3>
                    <div className="wa-commands">
                        <div className="wa-cmd">
                            <span className="wa-cmd-emoji">💸</span>
                            <div>
                                <strong>"Gastei 200 na padaria"</strong>
                                <span className="wa-cmd-desc">Cria despesa e dá baixa automaticamente</span>
                            </div>
                        </div>
                        <div className="wa-cmd">
                            <span className="wa-cmd-emoji">💰</span>
                            <div>
                                <strong>"Recebi 1500 do João"</strong>
                                <span className="wa-cmd-desc">Registra recebimento e baixa</span>
                            </div>
                        </div>
                        <div className="wa-cmd">
                            <span className="wa-cmd-emoji">📊</span>
                            <div>
                                <strong>"Como tá meu saldo?"</strong>
                                <span className="wa-cmd-desc">Consulta saldo de todas as contas</span>
                            </div>
                        </div>
                        <div className="wa-cmd">
                            <span className="wa-cmd-emoji">📋</span>
                            <div>
                                <strong>"O que tá pendente?"</strong>
                                <span className="wa-cmd-desc">Lista títulos e recebimentos pendentes</span>
                            </div>
                        </div>
                        <div className="wa-cmd">
                            <span className="wa-cmd-emoji">🎙️</span>
                            <div>
                                <strong>Áudio</strong>
                                <span className="wa-cmd-desc">Envie comandos por áudio — transcrição automática</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{CSS}</style>
        </div>
    );
}

const CSS = `
.wa-page{max-width:700px;margin:0 auto;padding:32px 24px}
.wa-loading{display:flex;align-items:center;gap:10px;justify-content:center;padding:60px 0;color:var(--text-dim);font-size:14px}
.wa-spin{animation:wa-rotate 1s linear infinite}
@keyframes wa-rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}

.wa-header{display:flex;align-items:center;gap:16px;margin-bottom:28px}
.wa-header-icon{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#25D366,#128C7E);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.wa-title{font-family:var(--ff-sans);font-size:22px;font-weight:700;color:var(--navy-deep);letter-spacing:-0.02em;margin:0}
.wa-subtitle{font-size:13px;color:var(--text-dim);margin:4px 0 0;letter-spacing:-0.005em}

.wa-card{border-radius:14px;border:1.5px solid var(--hair);background:var(--surface);padding:24px;margin-bottom:16px;transition:border-color .2s}
.wa-card--ok{border-color:#25D366;background:rgba(37,211,102,.03)}
.wa-card--pending{border-color:var(--warning);background:rgba(245,166,35,.03)}
.wa-card--off{border-color:var(--hair)}
.wa-card--info{border-color:var(--hair)}

.wa-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.wa-status-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--ff-mono);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:100px}
.wa-card--ok .wa-status-badge{background:rgba(37,211,102,.1);color:#128C7E}
.wa-card--pending .wa-status-badge{background:var(--warning-bg);color:var(--warning)}
.wa-card--off .wa-status-badge{background:var(--bg);color:var(--text-dim)}

.wa-telefone-display{display:inline-flex;align-items:center;gap:6px;font-family:var(--ff-mono);font-size:13px;color:var(--ink-2);font-weight:500}

.wa-form{margin-top:8px}
.wa-form-desc{font-size:13px;color:var(--text-dim);margin:0 0 14px;line-height:1.5}
.wa-input-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.wa-input-wrap{position:relative;flex:1;min-width:200px}
.wa-input-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-dim)}
.wa-input{width:100%;padding:10px 12px 10px 38px;border-radius:8px;border:1.5px solid var(--hair);background:var(--surface);color:var(--text);font-family:var(--ff-sans);font-size:14px;outline:none;box-sizing:border-box;transition:border-color .15s}
.wa-input:focus{border-color:var(--cyan)}
.wa-input:disabled{background:var(--bg);cursor:not-allowed}

.wa-code-row{display:flex;gap:10px;align-items:center;margin:16px 0;flex-wrap:wrap}
.wa-code-wrap{max-width:180px;min-width:140px}
.wa-code-input{text-align:center;font-family:var(--ff-mono);font-size:20px;font-weight:700;letter-spacing:.3em;padding:12px 12px 12px 38px}

.wa-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:8px;font-family:var(--ff-sans);font-size:13px;font-weight:600;letter-spacing:-0.005em;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
.wa-btn:disabled{opacity:.5;cursor:not-allowed}
.wa-btn--primary{background:linear-gradient(135deg,#25D366,#128C7E);color:#fff}
.wa-btn--primary:hover:not(:disabled){filter:brightness(1.1)}
.wa-btn--ghost{background:transparent;color:var(--ink-2);border:1.5px solid var(--hair)}
.wa-btn--ghost:hover:not(:disabled){background:var(--bg);border-color:var(--text-dim)}
.wa-btn--danger{background:transparent;color:var(--error);border:1.5px solid rgba(229,72,77,.2)}
.wa-btn--danger:hover:not(:disabled){background:var(--error-bg)}

.wa-pending{text-align:center;padding:8px 0}
.wa-pending p{font-size:14px;color:var(--ink-2);margin:0 0 4px}
.wa-pending-hint{font-size:12px;color:var(--text-dim);margin-bottom:4px!important}
.wa-pending-actions{display:flex;gap:10px;justify-content:center;margin-top:12px}

.wa-vinculado{margin-top:4px}
.wa-actions{display:flex;gap:10px}

.wa-msg{display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:10px;font-size:13px;line-height:1.4;margin-bottom:16px;opacity:1;transform:none;max-width:100%}
.wa-msg--ok{background:rgba(37,211,102,.08);color:#128C7E;border:1px solid rgba(37,211,102,.2)}
.wa-msg--erro{background:var(--error-bg);color:var(--error);border:1px solid rgba(229,72,77,.2)}

.wa-section-title{font-family:var(--ff-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin:0 0 16px}
.wa-commands{display:flex;flex-direction:column;gap:12px}
.wa-cmd{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:10px;background:var(--bg);border:1px solid var(--hair)}
.wa-cmd-emoji{font-size:20px;flex-shrink:0;margin-top:2px}
.wa-cmd strong{display:block;font-size:13px;color:var(--navy-deep);letter-spacing:-0.005em;margin-bottom:2px}
.wa-cmd-desc{font-size:12px;color:var(--text-dim)}

@media(max-width:600px){.wa-input-row{flex-direction:column}.wa-input-wrap{min-width:100%}.wa-actions{flex-direction:column}.wa-code-row{flex-direction:column;align-items:stretch}.wa-code-wrap{max-width:100%}}

.wa-manutencao{display:flex;align-items:flex-start;gap:14px;padding:16px 20px;border-radius:12px;background:rgba(245,166,35,.08);border:1.5px solid rgba(245,166,35,.35);margin-bottom:24px}
.wa-manutencao-icon{font-size:22px;flex-shrink:0;margin-top:2px}
.wa-manutencao-body strong{display:block;font-size:14px;color:var(--warning);font-weight:700;margin-bottom:4px}
.wa-manutencao-body p{font-size:13px;color:var(--ink-2);margin:0;line-height:1.55}
`;
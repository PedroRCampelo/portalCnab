import { useState, useEffect } from "react";
import {
    LuLoader, LuSave, LuCircleCheck, LuTriangleAlert,
    LuClockAlert, LuCalendarClock, LuInfo, LuMail,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader from "../../components/shell/PageHeader.jsx";
import Card       from "../../components/ui/Card.jsx";

/**
 * PreferenciasAlertaPage — Configura alertas de e-mail para títulos
 * Sprint A3.6.10 · Refatoração
 *
 * Permite ativar/desativar e configurar:
 *  - Alerta de títulos vencidos em aberto (variant: error)
 *  - Alerta de títulos a vencer com X dias de antecedência (variant: warning)
 *
 * Endpoints:
 *  - GET /api/usuario/preferencias-alerta
 *  - PUT /api/usuario/preferencias-alerta
 */
export default function PreferenciasAlertaPage() {
    const [form,        setForm]        = useState({
        alertaVencidos: false,
        alertaAVencer: false,
        alertaDiasAntes: 3,
    });
    const [carregando,  setCarregando]  = useState(true);
    const [salvando,    setSalvando]    = useState(false);
    const [msg,         setMsg]         = useState({ texto: "", tipo: "" });

    // ── Carregamento ────────────────────────────────────────────────────────

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

    // ── Ações ──────────────────────────────────────────────────────────────

    async function salvar(e) {
        if (e?.preventDefault) e.preventDefault();
        setSalvando(true);
        setMsg({ texto: "", tipo: "" });

        try {
            await api.put("/api/usuario/preferencias-alerta", {
                alertaVencidos:  form.alertaVencidos,
                alertaAVencer:   form.alertaAVencer,
                alertaDiasAntes: form.alertaDiasAntes,
            });
            setMsg({ texto: "Preferências salvas com sucesso!", tipo: "ok" });
            setTimeout(() => setMsg({ texto: "", tipo: "" }), 3000);
        } catch (err) {
            setMsg({
                texto: err.response?.data?.mensagem ?? "Erro ao salvar preferências.",
                tipo: "erro",
            });
        } finally {
            setSalvando(false);
        }
    }

    // ── Render ──────────────────────────────────────────────────────────────

    if (carregando) {
        return (
            <>
                <PageHeader title="Alertas de e-mail" backTo="/titulos" backLabel="Títulos"/>
                <div className="pa-loading">
                    <LuLoader size={20} className="pa-spin"/>
                    <span>Carregando preferências...</span>
                </div>
                <style>{COMPONENT_CSS}</style>
            </>
        );
    }

    const OPCOES_DIAS = [1, 2, 3, 5, 7, 10, 14, 15, 20, 30];

    return (
        <div className="pa-container">
            <PageHeader
                title="Alertas de e-mail"
                backTo="/titulos"
                backLabel="Títulos"
                actions={
                    <button
                        className="ph-btn ph-btn--primary"
                        onClick={salvar}
                        disabled={salvando}
                    >
                        <LuSave size={14}/>
                        {salvando ? "Salvando..." : "Salvar preferências"}
                    </button>
                }
            />

            <p className="pa-subtitulo">
                Configure quando e como receber notificações sobre seus títulos.
                Os e-mails são enviados uma vez por dia, às 08:00.
            </p>

            {/* Mensagem de feedback */}
            {msg.texto && (
                <div className={`pa-msg pa-msg--${msg.tipo === "ok" ? "sucesso" : "erro"}`}>
                    {msg.tipo === "ok" ? <LuCircleCheck size={14}/> : <LuTriangleAlert size={14}/>}
                    {msg.texto}
                </div>
            )}

            {/* ── Card 1: Títulos vencidos ── */}
            <CardAlerta
                ativo={form.alertaVencidos}
                onToggle={() => setForm(f => ({ ...f, alertaVencidos: !f.alertaVencidos }))}
                icon={<LuClockAlert size={18}/>}
                titulo="Títulos vencidos em aberto"
                descricao="Receba uma lista diária de todos os títulos que já passaram do vencimento e ainda não foram pagos."
                variant="error"
                disabled={salvando}
            >
                {form.alertaVencidos && (
                    <div className="pa-status pa-status--error">
                        <LuCircleCheck size={13}/>
                        <span>
                            <strong>Ativo</strong> — você receberá um e-mail diário enquanto houver títulos vencidos.
                        </span>
                    </div>
                )}
            </CardAlerta>

            {/* ── Card 2: Títulos a vencer ── */}
            <CardAlerta
                ativo={form.alertaAVencer}
                onToggle={() => setForm(f => ({ ...f, alertaAVencer: !f.alertaAVencer }))}
                icon={<LuCalendarClock size={18}/>}
                titulo="Títulos a vencer"
                descricao="Receba antecipadamente a lista de títulos que vencerão em breve, com prazo configurável."
                variant="warning"
                disabled={salvando}
            >
                {form.alertaAVencer && (
                    <div className="pa-dias-config">
                        <div className="pa-dias-label">
                            Alertar quantos dias antes do vencimento?
                        </div>

                        <div className="pa-dias-pills">
                            {OPCOES_DIAS.map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    className={`pa-dias-pill ${form.alertaDiasAntes === d ? "active" : ""}`}
                                    onClick={() => setForm(f => ({ ...f, alertaDiasAntes: d }))}
                                    disabled={salvando}
                                >
                                    {d === 1 ? "1 dia" : `${d} dias`}
                                </button>
                            ))}
                        </div>

                        <div className="pa-status pa-status--warning">
                            <LuCircleCheck size={13}/>
                            <span>
                                <strong>Ativo</strong> — você receberá alertas de títulos que vencem em até{" "}
                                <strong>{form.alertaDiasAntes} {form.alertaDiasAntes === 1 ? "dia" : "dias"}</strong>.
                            </span>
                        </div>
                    </div>
                )}
            </CardAlerta>

            {/* ── Info box: horário e destinatário ── */}
            <div className="pa-info-box">
                <LuInfo size={14}/>
                <div>
                    <p className="pa-info-line">
                        Os alertas são processados <strong>uma vez por dia, às 08:00</strong>.
                        Você receberá no máximo um e-mail por dia, somente quando houver títulos relevantes.
                    </p>
                    <p className="pa-info-line pa-info-line--with-icon">
                        <LuMail size={12}/>
                        <span>O e-mail é enviado para <strong>sua conta cadastrada no Whallet</strong>.</span>
                    </p>
                </div>
            </div>

            {/* Footer com botão sticky em mobile */}
            <div className="pa-footer">
                <button
                    className="ph-btn ph-btn--primary"
                    onClick={salvar}
                    disabled={salvando}
                >
                    <LuSave size={14}/>
                    {salvando ? "Salvando..." : "Salvar preferências"}
                </button>
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   CardAlerta — card de cada tipo de alerta com toggle integrado
   ═════════════════════════════════════════════════════════════════════════════ */

function CardAlerta({ ativo, onToggle, icon, titulo, descricao, variant, disabled, children }) {
    return (
        <Card>
            <Card.Body>
                <div className={`pa-card pa-card--${variant} ${ativo ? `pa-card--ativo-${variant}` : ""}`}>
                    <div className="pa-card-row">
                        <div className="pa-card-info">
                            <div className="pa-card-head">
                                <span className={`pa-card-icon pa-card-icon--${variant}`}>
                                    {icon}
                                </span>
                                <span className="pa-card-titulo">{titulo}</span>
                            </div>
                            <p className="pa-card-desc">{descricao}</p>
                        </div>

                        {/* Toggle switch */}
                        <label className={`pa-toggle ${ativo ? `pa-toggle--ativo-${variant}` : ""} ${disabled ? "pa-toggle--disabled" : ""}`}>
                            <input
                                type="checkbox"
                                checked={ativo}
                                onChange={onToggle}
                                disabled={disabled}
                            />
                            <span className="pa-toggle-track">
                                <span className="pa-toggle-thumb"/>
                            </span>
                        </label>
                    </div>

                    {children}
                </div>
            </Card.Body>
        </Card>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .pa-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.pa-container {
    max-width: 720px;
    padding-bottom: 80px;
}

.pa-subtitulo {
    margin: 0 0 20px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
    max-width: 640px;
}

.pa-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 20px;
    color: var(--text-dim);
    font-size: 14px;
}

.pa-spin {
    animation: pa-spin 1s linear infinite;
}

@keyframes pa-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

/* ── Mensagem de feedback ────────────────────────────────────────────── */

.pa-msg {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.5;
}

.pa-msg svg {
    flex-shrink: 0;
    margin-top: 1px;
}

.pa-msg--sucesso {
    background: var(--success-bg);
    border: 1px solid rgba(24, 178, 107, 0.25);
    color: var(--success);
}

.pa-msg--erro {
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
}

/* ── Card de alerta ──────────────────────────────────────────────────── */

.pa-card {
    margin: -16px -20px;
    padding: 20px 24px;
    border-left: 3px solid var(--hair);
    transition: border-color 0.2s;
    border-radius: 0 12px 12px 0;
}

.pa-card--ativo-error {
    border-left-color: var(--error);
}

.pa-card--ativo-warning {
    border-left-color: var(--warning);
}

.pa-card-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.pa-card-info {
    flex: 1;
    min-width: 0;
}

.pa-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
}

.pa-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    flex-shrink: 0;
}

.pa-card-icon--error {
    background: var(--error-bg);
    color: var(--error);
}

.pa-card-icon--warning {
    background: var(--warning-bg);
    color: var(--warning);
}

.pa-card-titulo {
    font-size: 15px;
    font-weight: 700;
    color: var(--navy-deep);
    letter-spacing: -0.01em;
    line-height: 1.3;
}

.pa-card-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

/* ── Toggle switch ───────────────────────────────────────────────────── */

.pa-toggle {
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
    margin-top: 6px;
}

.pa-toggle--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pa-toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.pa-toggle-track {
    display: block;
    width: 44px;
    height: 24px;
    border-radius: 100px;
    background: var(--hair);
    position: relative;
    transition: background 0.2s;
}

.pa-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    transition: left 0.2s;
}

.pa-toggle--ativo-error .pa-toggle-track {
    background: var(--error);
}

.pa-toggle--ativo-warning .pa-toggle-track {
    background: var(--warning);
}

.pa-toggle input:checked + .pa-toggle-track .pa-toggle-thumb {
    left: 22px;
}

/* ── Status (ativo) ──────────────────────────────────────────────────── */

.pa-status {
    margin-top: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 8px;
}

.pa-status svg {
    flex-shrink: 0;
}

.pa-status--error {
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
}

.pa-status--warning {
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.2);
    color: var(--warning);
}

.pa-status strong {
    font-weight: 700;
}

/* ── Configuração de dias (sub-bloco) ────────────────────────────────── */

.pa-dias-config {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--hair);
}

.pa-dias-label {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 10px;
}

.pa-dias-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
}

.pa-dias-pill {
    padding: 6px 14px;
    border-radius: 100px;
    font-family: var(--ff-sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
    transition: all 0.15s;
}

.pa-dias-pill:hover:not(:disabled) {
    border-color: var(--text-dim);
    color: var(--navy-deep);
}

.pa-dias-pill.active {
    border-color: var(--warning);
    background: var(--warning-bg);
    color: var(--warning);
}

.pa-dias-pill:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ── Info box (horário) ──────────────────────────────────────────────── */

.pa-info-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 10px;
    margin-top: 8px;
    background: var(--bg);
    border: 1px solid var(--hair);
    font-size: 12px;
    line-height: 1.55;
    color: var(--text-muted);
}

.pa-info-box > svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--text-dim);
}

.pa-info-line {
    margin: 0;
}

.pa-info-line + .pa-info-line {
    margin-top: 6px;
}

.pa-info-line--with-icon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.pa-info-line--with-icon svg {
    color: var(--cyan-dark);
    flex-shrink: 0;
}

.pa-info-box strong {
    color: var(--navy-deep);
    font-weight: 600;
}

/* ── Footer ──────────────────────────────────────────────────────────── */

.pa-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--hair);
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .pa-container {
        padding-bottom: 100px;
    }

    .pa-card {
        margin: -16px -20px;
        padding: 16px 20px;
    }

    .pa-card-titulo {
        font-size: 14px;
    }

    .pa-footer {
        position: sticky;
        bottom: 0;
        margin: 0 -20px -20px;
        padding: 14px 20px;
        background: var(--surface);
        border-top: 1px solid var(--hair);
        z-index: 10;
    }

    .pa-footer .ph-btn {
        flex: 1;
        justify-content: center;
    }
}
`;
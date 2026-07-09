import { Link } from "react-router-dom";
import { LuCircleCheck, LuLightbulb, LuLandmark, LuSettings2 } from "react-icons/lu";

/**
 * Componentes compartilhados entre as 3 telas de ferramenta CNAB
 * Sprint A3.6.14 · Refatoração
 */

/* ─── FormCard — wrapper visual do formulário principal ───────────────── */

export function FormCard({ children }) {
    return (
        <div className="tool-form-card">
            {children}
            <style>{FORM_CARD_CSS}</style>
        </div>
    );
}

const FORM_CARD_CSS = `
.tool-form-card {
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 16px;
    padding: 24px;
}

@media (max-width: 600px) {
    .tool-form-card {
        padding: 20px 16px;
    }
}
`;

/* ─── SourceTabs — tabs Layout Bancário / Layout Protheus ─────────────── */

export function SourceTabs({ value, onChange }) {
    return (
        <div className="tool-source-tabs">
            <button
                type="button"
                className={`tool-source-tab ${value === "bank" ? "active" : ""}`}
                onClick={() => onChange("bank")}
            >
                <LuLandmark size={14}/>
                Layout Bancário
            </button>
            <button
                type="button"
                className={`tool-source-tab ${value === "protheus" ? "active" : ""}`}
                onClick={() => onChange("protheus")}
            >
                <LuSettings2 size={14}/>
                Layout Protheus
            </button>

            <style>{SOURCE_TABS_CSS}</style>
        </div>
    );
}

const SOURCE_TABS_CSS = `
.tool-source-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.tool-source-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 10px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
    transition: all 0.15s;
}

.tool-source-tab:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.tool-source-tab.active {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

@media (max-width: 600px) {
    .tool-source-tab {
        flex: 1;
        justify-content: center;
    }
}
`;

/* ─── InfoCard — card lateral com lista de features ──────────────────── */

export function InfoCard({ title, items, variant = "default" }) {
    return (
        <div className={`tool-info-card tool-info-card--${variant}`}>
            <h3 className="tool-info-title">{title}</h3>
            <ul className="tool-info-list">
                {items.map((item, i) => (
                    <li key={i} className="tool-info-item">
                        {item.severity ? (
                            <span className={`tool-info-sev tool-info-sev--${item.severity}`}>
                                {item.severityLabel || item.severity}
                            </span>
                        ) : item.bank ? (
                            <span className={`tool-info-bank tool-info-bank--${item.bank}`}>
                                {item.bankLabel}
                            </span>
                        ) : (
                            <LuCircleCheck size={12} className="tool-info-check"/>
                        )}
                        <span className="tool-info-text">{item.text || item}</span>
                    </li>
                ))}
            </ul>

            <style>{INFO_CARD_CSS}</style>
        </div>
    );
}

const INFO_CARD_CSS = `
.tool-info-card {
    padding: 20px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.tool-info-card--muted {
    background: var(--bg);
}

.tool-info-card + .tool-info-card {
    margin-top: 12px;
}

.tool-info-title {
    margin: 0 0 12px;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.tool-info-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tool-info-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

.tool-info-check {
    color: var(--success);
    flex-shrink: 0;
    margin-top: 3px;
}

.tool-info-text {
    flex: 1;
}

/* Severidades (alertas PDF) */
.tool-info-sev {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: 1px;
}

.tool-info-sev--critico {
    background: var(--error-bg);
    color: var(--error);
}

.tool-info-sev--atencao {
    background: var(--warning-bg);
    color: var(--warning);
}

.tool-info-sev--info {
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

/* Bancos (lista de layouts suportados) */
.tool-info-bank {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 38px;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-top: 1px;
}

.tool-info-bank--itau     { background: #FF6200;        color: white; }
.tool-info-bank--bradesco { background: #CC092F;        color: white; }
.tool-info-bank--bb       { background: #FFEF38;        color: #003F69; }
.tool-info-bank--caixa    { background: #003088;        color: white; }
.tool-info-bank--protheus { background: var(--bg);      color: var(--text-muted); border: 1px solid var(--hair); }
`;

/* ─── InfoTip — caixinha de "💡 dica" com link cruzado ──────────────── */

export function InfoTip({ children }) {
    return (
        <div className="tool-info-tip">
            <LuLightbulb size={14} className="tool-info-tip-icon"/>
            <span>{children}</span>

            <style>{INFO_TIP_CSS}</style>
        </div>
    );
}

const INFO_TIP_CSS = `
.tool-info-tip {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    margin-top: 12px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.18);
    font-size: 12px;
    line-height: 1.55;
    color: var(--ink-2);
}

.tool-info-tip-icon {
    color: var(--cyan-dark);
    flex-shrink: 0;
    margin-top: 1px;
}

.tool-info-tip a {
    color: var(--cyan-dark);
    font-weight: 600;
    text-decoration: none;
}

.tool-info-tip a:hover {
    text-decoration: underline;
}
`;

/* ─── ToolLink — atalho elegante pra outras tools ─────────────────────── */

export function ToolLink({ to, children }) {
    return (
        <Link to={to} className="tool-link-btn">
            {children}
        </Link>
    );
}

// CSS do link injetado em InfoTip já cobre - usa <a> normal
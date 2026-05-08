import { LuWallet, LuClock, LuCircleAlert, LuCircleCheck } from "react-icons/lu";
import { fmtValor } from "./_helpers.js";

/**
 * ResumoBoxes — 4 KPIs do topo da página de Títulos
 * Sprint A3.6.5 · Refatoração
 *
 * Total em aberto / Pendentes / Vencidos / Pagos
 */
export default function ResumoBoxes({ resumo }) {
    if (!resumo) return null;

    return (
        <div className="trb-grid">
            <ResumoBox
                label="Total em aberto"
                valor={fmtValor(resumo.totalAberto ?? 0)}
                variant="default"
                icon={<LuWallet size={16}/>}
                featured
            />
            <ResumoBox
                label="Pendentes"
                valor={String(resumo.qtdPendentes ?? 0)}
                variant="warning"
                icon={<LuClock size={16}/>}
            />
            <ResumoBox
                label="Vencidos"
                valor={String(resumo.qtdVencidos ?? 0)}
                variant="error"
                icon={<LuCircleAlert size={16}/>}
            />
            <ResumoBox
                label="Pagos"
                valor={String(resumo.qtdPagos ?? 0)}
                variant="success"
                icon={<LuCircleCheck size={16}/>}
            />

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

function ResumoBox({ label, valor, variant = "default", icon, featured = false }) {
    return (
        <div className={`trb-box trb-box--${variant} ${featured ? "trb-box--featured" : ""}`}>
            <div className="trb-head">
                <span className="trb-icon">{icon}</span>
                <span className="trb-label">{label}</span>
            </div>
            <div className="trb-value">{valor}</div>
        </div>
    );
}

const COMPONENT_CSS = `
.trb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.trb-box {
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.trb-box--featured {
    border-width: 1.5px;
}

.trb-box--featured.trb-box--default {
    background: var(--cyan-soft);
    border-color: rgba(21, 195, 221, 0.25);
}

.trb-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.trb-icon {
    display: inline-flex;
    line-height: 0;
}

.trb-box--default .trb-icon { color: var(--cyan-dark); }
.trb-box--warning .trb-icon { color: var(--warning); }
.trb-box--error   .trb-icon { color: var(--error); }
.trb-box--success .trb-icon { color: var(--success); }

.trb-value {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

.trb-box--featured.trb-box--default .trb-value { color: var(--cyan-dark); }

@media (max-width: 700px) {
    .trb-grid {
        grid-template-columns: 1fr 1fr;
    }
}
`;
import { LuHandCoins, LuCircleAlert, LuCalendar } from "react-icons/lu";
import { fmtValor } from "./_helpers.js";

/**
 * ResumoBoxes — KPIs do topo da página de Recebimentos
 * Sprint A3.6 · Refatoração
 *
 * 3 cards: A receber este mês / Atrasados / Próximos 7 dias
 */
export default function ResumoBoxes({ resumo }) {
    return (
        <div className="rb-grid">
            <ResumoBox
                label="A receber este mês"
                valor={fmtValor(resumo.aReceberMes ?? 0)}
                variant="success"
                icon={<LuHandCoins size={16}/>}
                featured
            />
            <ResumoBox
                label="Atrasados"
                valor={String(resumo.qtdAtrasados ?? 0)}
                variant="error"
                icon={<LuCircleAlert size={16}/>}
            />
            <ResumoBox
                label="Próximos 7 dias"
                valor={String(resumo.qtdProximosVencer ?? 0)}
                variant="warning"
                icon={<LuCalendar size={16}/>}
            />

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

function ResumoBox({ label, valor, variant = "default", icon, featured = false }) {
    return (
        <div className={`rb-box rb-box--${variant} ${featured ? "rb-box--featured" : ""}`}>
            <div className="rb-head">
                <span className="rb-icon">{icon}</span>
                <span className="rb-label">{label}</span>
            </div>
            <div className="rb-value">{valor}</div>
        </div>
    );
}

const COMPONENT_CSS = `
.rb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.rb-box {
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.rb-box--featured {
    border-width: 1.5px;
}

.rb-box--featured.rb-box--success {
    background: var(--success-bg);
    border-color: rgba(24, 178, 107, 0.25);
}

.rb-head {
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

.rb-icon {
    display: inline-flex;
    line-height: 0;
}

.rb-box--success .rb-icon { color: var(--success); }
.rb-box--error   .rb-icon { color: var(--error); }
.rb-box--warning .rb-icon { color: var(--warning); }
.rb-box--default .rb-icon { color: var(--cyan-dark); }

.rb-value {
    font-family: var(--ff-sans);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

.rb-box--featured.rb-box--success .rb-value { color: var(--success); }
.rb-box--featured.rb-box--error   .rb-value { color: var(--error); }
.rb-box--featured.rb-box--warning .rb-value { color: var(--warning); }

@media (max-width: 600px) {
    .rb-grid {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 380px) {
    .rb-grid {
        grid-template-columns: 1fr;
    }
}
`;
import {
    LuPiggyBank, LuTrendingUp, LuTrendingDown, LuScale,
    LuCircleAlert, LuLoader, LuRefreshCw,
} from "react-icons/lu";
import Card from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { fmtValor, fmtData, SITUACAO_INFO } from "./_helpers.js";
import TermometroFaturamento from "./TermometroFaturamento.jsx";

/**
 * SaudeMesTab — Tab "Saúde do mês" do Fluxo de Caixa
 * Sprint A3.5 · Refatoração piloto
 *
 * Estrutura:
 *  - Loading state com spinner
 *  - 4 KPI cards (Saldo / A receber / A pagar / Sobra projetada)
 *  - Banner de situação (positivo/neutro/atenção/negativo)
 *  - Alerta preditivo (se backend retornar)
 *  - EmptyState quando usuário não tem conta cadastrada
 *  - Botão atualizar
 *
 * Props:
 *   saude        — objeto retornado do backend (/api/fluxo-caixa/saude-mes)
 *   carregando   — bool — exibe loader
 *   onRecarregar — function — recarrega dados
 *   onIrPraContas — function — leva à aba "Contas Bancárias" (CTA quando não tem conta)
 */
export default function SaudeMesTab({ saude, carregando, onRecarregar, onIrPraContas }) {

    // Loading
    if (carregando) {
        return (
            <div className="smt-loading">
                <LuLoader size={22} className="smt-spinner"/>
                <span>Calculando saúde do mês...</span>
                <style>{LOADING_CSS}</style>
            </div>
        );
    }

    if (!saude) return null;

    const sit = SITUACAO_INFO[saude.situacao] ?? SITUACAO_INFO.NEUTRO;
    const semContas = saude.qtdContasBancarias === 0;

    // Caso: usuário sem conta cadastrada
    if (semContas) {
        return (
            <div className="smt-empty-wrap">
                <Card>
                    <Card.Body>
                        <EmptyState
                            icon={LuPiggyBank}
                            title="Cadastre sua primeira conta bancária"
                            description="Pra acompanhar saldo real, recebimentos e pagamentos automaticamente, cadastre suas contas na aba Contas Bancárias."
                            action={
                                <button
                                    className="ph-btn ph-btn--primary"
                                    onClick={onIrPraContas}
                                >
                                    Cadastrar conta bancária
                                </button>
                            }
                        />
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <div className="smt">

            {/* ═══ 4 KPI cards ═══ */}
            <div className="smt-kpis">
                <KpiCard
                    label="Saldo atual"
                    valor={fmtValor(saude.saldoAtual)}
                    icon={<LuPiggyBank size={16}/>}
                    sublabel={`${saude.qtdContasBancarias} ${saude.qtdContasBancarias === 1 ? "conta" : "contas"}`}
                    variant="default"
                />
                <KpiCard
                    label="A receber este mês"
                    valor={fmtValor(saude.aReceberMes)}
                    icon={<LuTrendingUp size={16}/>}
                    sublabel={saude.qtdRecebimentosAtrasados > 0
                        ? `${saude.qtdRecebimentosAtrasados} atrasado${saude.qtdRecebimentosAtrasados > 1 ? "s" : ""}`
                        : "Em dia"}
                    variant="success"
                />
                <KpiCard
                    label="A pagar este mês"
                    valor={fmtValor(saude.aPagarMes)}
                    icon={<LuTrendingDown size={16}/>}
                    sublabel={saude.qtdTitulosAtrasados > 0
                        ? `${saude.qtdTitulosAtrasados} atrasado${saude.qtdTitulosAtrasados > 1 ? "s" : ""}`
                        : "Em dia"}
                    variant="error"
                />
                <KpiCard
                    label={saude.sobraOuFalta >= 0 ? "Sobra projetada" : "Falta projetada"}
                    valor={fmtValor(Math.abs(saude.sobraOuFalta))}
                    icon={<LuScale size={16}/>}
                    variant={sit.variant}
                    featured
                />
            </div>

            {/* ═══ Termômetro de faturamento (Sprint 2.2-B) ═══ */}
            <TermometroFaturamento/>

            {/* ═══ Banner de situação ═══ */}
            <div className={`smt-banner smt-banner--${sit.variant}`}>
                <span className="smt-banner-emoji">{sit.emoji}</span>
                <div className="smt-banner-text">
                    <div className="smt-banner-label">Situação do mês</div>
                    <div className="smt-banner-msg">{saude.mensagemSituacao}</div>
                </div>
            </div>

            {/* ═══ Alerta preditivo (opcional) ═══ */}
            {saude.alertaPreditivo && (
                <div className="smt-alert">
                    <div className="smt-alert-icon">
                        <LuCircleAlert size={20}/>
                    </div>
                    <div className="smt-alert-text">
                        <div className="smt-alert-title">Alerta preditivo</div>
                        <div className="smt-alert-msg">{saude.alertaPreditivo.mensagem}</div>
                        <div className="smt-alert-meta">
                            Em {saude.alertaPreditivo.diasAteCritico} dia{saude.alertaPreditivo.diasAteCritico !== 1 ? "s" : ""}
                            {" — "}
                            {fmtData(saude.alertaPreditivo.dataCritica)}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Botão atualizar (canto inferior direito) ═══ */}
            <div className="smt-actions">
                <button className="ph-btn ph-btn--ghost" onClick={onRecarregar}>
                    <LuRefreshCw size={13}/>
                    Atualizar
                </button>
            </div>

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   KpiCard — sub-componente local
   Variantes: default, success, error, warning
   ═════════════════════════════════════════════════════════════════════════════ */

function KpiCard({ label, valor, icon, sublabel, variant = "default", featured = false }) {
    return (
        <div className={`smt-kpi smt-kpi--${variant} ${featured ? "smt-kpi--featured" : ""}`}>
            <div className="smt-kpi-head">
                <span className="smt-kpi-icon">{icon}</span>
                <span className="smt-kpi-label">{label}</span>
            </div>
            <div className="smt-kpi-value">{valor}</div>
            {sublabel && <div className="smt-kpi-sublabel">{sublabel}</div>}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .smt-*
   Coloco inline porque é localizado a esse componente apenas.
   Se ficar grande no futuro, extrair pra .css.
   ═════════════════════════════════════════════════════════════════════════════ */

const LOADING_CSS = `
.smt-loading {
    padding: 80px 20px;
    text-align: center;
    color: var(--text-dim);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 14px;
}
.smt-spinner {
    animation: smtSpin 1s linear infinite;
    color: var(--cyan-dark);
}
@keyframes smtSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
`;

const COMPONENT_CSS = `
.smt-empty-wrap {
    max-width: 640px;
    margin: 16px auto 0;
}

/* ── KPI cards (grid) ──────────────────────────────────────────────────── */

.smt-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.smt-kpi {
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
    transition: border-color 0.15s, transform 0.15s;
}

.smt-kpi:hover {
    border-color: var(--text-dim);
}

.smt-kpi--featured {
    border-width: 1.5px;
}

.smt-kpi--success.smt-kpi--featured {
    background: var(--success-bg);
    border-color: rgba(24, 178, 107, 0.3);
}

.smt-kpi--error.smt-kpi--featured {
    background: var(--error-bg);
    border-color: rgba(229, 72, 77, 0.3);
}

.smt-kpi--warning.smt-kpi--featured {
    background: var(--warning-bg);
    border-color: rgba(230, 162, 60, 0.3);
}

.smt-kpi--default.smt-kpi--featured {
    background: var(--cyan-soft);
    border-color: var(--cyan);
}

.smt-kpi-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.smt-kpi--success .smt-kpi-icon { color: var(--success); }
.smt-kpi--error   .smt-kpi-icon { color: var(--error); }
.smt-kpi--warning .smt-kpi-icon { color: var(--warning); }
.smt-kpi--default .smt-kpi-icon { color: var(--cyan-dark); }

.smt-kpi-icon {
    display: inline-flex;
    line-height: 0;
}

.smt-kpi-label {
    flex: 1;
}

.smt-kpi-value {
    font-family: var(--ff-sans);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

.smt-kpi--success.smt-kpi--featured .smt-kpi-value { color: var(--success); }
.smt-kpi--error.smt-kpi--featured   .smt-kpi-value { color: var(--error); }
.smt-kpi--warning.smt-kpi--featured .smt-kpi-value { color: var(--warning); }
.smt-kpi--default.smt-kpi--featured .smt-kpi-value { color: var(--cyan-dark); }

.smt-kpi-sublabel {
    margin-top: 6px;
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* ── Banner de situação ───────────────────────────────────────────────── */

.smt-banner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 14px;
    border: 1px solid;
}

.smt-banner--success { background: var(--success-bg); border-color: rgba(24, 178, 107, 0.25); }
.smt-banner--error   { background: var(--error-bg);   border-color: rgba(229, 72, 77, 0.25); }
.smt-banner--warning { background: var(--warning-bg); border-color: rgba(230, 162, 60, 0.25); }
.smt-banner--default { background: var(--cyan-soft);  border-color: rgba(21, 195, 221, 0.25); }

.smt-banner-emoji {
    font-size: 22px;
    line-height: 1;
    flex-shrink: 0;
}

.smt-banner-text {
    flex: 1;
}

.smt-banner-label {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 4px;
}

.smt-banner--success .smt-banner-label { color: var(--success); }
.smt-banner--error   .smt-banner-label { color: var(--error); }
.smt-banner--warning .smt-banner-label { color: var(--warning); }
.smt-banner--default .smt-banner-label { color: var(--cyan-dark); }

.smt-banner-msg {
    font-size: 14px;
    line-height: 1.5;
    color: var(--navy-deep);
    font-weight: 500;
}

/* ── Alerta preditivo ─────────────────────────────────────────────────── */

.smt-alert {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 14px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.25);
}

.smt-alert-icon {
    flex-shrink: 0;
    color: var(--error);
    margin-top: 2px;
}

.smt-alert-title {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--error);
    margin-bottom: 4px;
}

.smt-alert-msg {
    font-size: 14px;
    line-height: 1.5;
    color: var(--navy-deep);
    font-weight: 500;
    margin-bottom: 6px;
}

.smt-alert-meta {
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--text-muted);
}

/* ── Ações ───────────────────────────────────────────────────────────── */

.smt-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .smt-kpis {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    .smt-kpi {
        padding: 14px;
    }
    .smt-kpi-value {
        font-size: 20px;
    }
}

@media (max-width: 380px) {
    .smt-kpis {
        grid-template-columns: 1fr;
    }
}
`;
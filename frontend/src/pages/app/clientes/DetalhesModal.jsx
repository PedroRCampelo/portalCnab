import { Link } from "react-router-dom";
import {
    LuPhone, LuMail, LuPencil, LuExternalLink, LuTriangleAlert,
} from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import {
    fmtValor, mascaraDocumento, SCORE_INFO,
} from "./_helpers.js";

/**
 * DetalhesModal — Visualização detalhada de cliente
 * Sprint A3.6.4 · Refatoração
 *
 * Mostra:
 *  - Header: nome + badge de score (BOM/ATENCAO/INADIMPLENTE)
 *  - Contato: telefone + email
 *  - Histórico: 4 stat boxes (total, pagos, atrasados, valor recebido)
 *  - Alerta de valor em atraso (se houver)
 *  - Outros dados: documento, categoria, notas
 *  - Link "Ver recebimentos deste cliente"
 *
 * Props:
 *  cliente   — objeto com todos os dados (incluindo .estatisticas)
 *  onFechar  — function
 *  onEditar  — function — chama abertura do ClienteModal
 */
export default function DetalhesModal({ cliente, onFechar, onEditar }) {
    const stats     = cliente.estatisticas;
    const scoreInfo = stats?.score ? SCORE_INFO[stats.score] : null;
    const temAtraso = stats && Number(stats.valorTotalAtrasado) > 0;

    return (
        <Modal
            open={true}
            onClose={onFechar}
            size="lg"
            title={cliente.nome}
            description={
                scoreInfo && (
                    <span className={`dm-score dm-score--${scoreInfo.variant}`}>
                        <span className="dm-score-dot"/>
                        {scoreInfo.label}
                    </span>
                )
            }
        >
            <Modal.Body>

                {/* ── Contato ── */}
                <div className="dm-section">
                    <div className="dm-section-title">Contato</div>

                    {(cliente.telefoneFormatado || cliente.email) ? (
                        <div className="dm-info-list">
                            {cliente.telefoneFormatado && (
                                <div className="dm-info-row">
                                    <LuPhone size={14} className="dm-info-icon"/>
                                    <span>{cliente.telefoneFormatado}</span>
                                </div>
                            )}
                            {cliente.email && (
                                <div className="dm-info-row">
                                    <LuMail size={14} className="dm-info-icon"/>
                                    <span>{cliente.email}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="dm-info-empty">Sem dados de contato cadastrados</div>
                    )}
                </div>

                {/* ── Histórico (estatísticas) ── */}
                {stats && (
                    <div className="dm-section">
                        <div className="dm-section-title">Histórico</div>

                        <div className="dm-stats">
                            <StatBox
                                label="Total de recebimentos"
                                valor={String(stats.totalRecebimentos ?? 0)}
                                variant="default"
                            />
                            <StatBox
                                label="Pagos"
                                valor={String(stats.recebimentosPagos ?? 0)}
                                variant="success"
                            />
                            <StatBox
                                label="Atrasados"
                                valor={String(stats.recebimentosAtrasados ?? 0)}
                                variant="error"
                            />
                            <StatBox
                                label="Total recebido"
                                valor={fmtValor(stats.valorTotalRecebido)}
                                variant="success"
                            />
                        </div>

                        {temAtraso && (
                            <div className="dm-alert">
                                <LuTriangleAlert size={16} className="dm-alert-icon"/>
                                <div>
                                    <strong>Valor em atraso:</strong> {fmtValor(stats.valorTotalAtrasado)}
                                </div>
                            </div>
                        )}

                        {/* Link pra ver recebimentos */}
                        <Link
                            to={`/recebimentos?clienteId=${cliente.id}`}
                            className="dm-link"
                            onClick={onFechar}
                        >
                            Ver recebimentos deste cliente
                            <LuExternalLink size={12}/>
                        </Link>
                    </div>
                )}

                {/* ── Outros dados ── */}
                {(cliente.documento || cliente.categoria || cliente.notas) && (
                    <div className="dm-section">
                        <div className="dm-section-title">Outros dados</div>

                        <div className="dm-meta-list">
                            {cliente.documento && (
                                <div className="dm-meta-row">
                                    <span className="dm-meta-label">Documento</span>
                                    <span className="dm-meta-value">
                                        {mascaraDocumento(cliente.documento, cliente.tipoPessoa)}
                                    </span>
                                </div>
                            )}
                            {cliente.categoria && (
                                <div className="dm-meta-row">
                                    <span className="dm-meta-label">Categoria</span>
                                    <span className="dm-meta-value">
                                        <span className="dm-tag">{cliente.categoria}</span>
                                    </span>
                                </div>
                            )}
                            {cliente.notas && (
                                <div className="dm-meta-row dm-meta-row--block">
                                    <span className="dm-meta-label">Notas</span>
                                    <span className="dm-meta-value dm-meta-value--block">{cliente.notas}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </Modal.Body>

            <Modal.Footer>
                <button
                    className="ph-btn ph-btn--ghost"
                    onClick={onFechar}
                >
                    Fechar
                </button>
                <button
                    className="ph-btn ph-btn--primary"
                    onClick={onEditar}
                >
                    <LuPencil size={14}/>
                    Editar
                </button>
            </Modal.Footer>

            <style>{COMPONENT_CSS}</style>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   StatBox — caixa individual de estatística
   ═════════════════════════════════════════════════════════════════════════════ */

function StatBox({ label, valor, variant = "default" }) {
    return (
        <div className={`dm-stat dm-stat--${variant}`}>
            <div className="dm-stat-label">{label}</div>
            <div className="dm-stat-value">{valor}</div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .dm-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
/* ── Score badge no header (description) ────────────────────────────── */

.dm-score {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    padding: 4px 10px;
    border-radius: 100px;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.dm-score--success { background: var(--success-bg); color: var(--success); }
.dm-score--warning { background: var(--warning-bg); color: var(--warning); }
.dm-score--error   { background: var(--error-bg);   color: var(--error); }

.dm-score-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

/* ── Sections ─────────────────────────────────────────────────────────── */

.dm-section {
    margin-bottom: 24px;
}

.dm-section:last-child {
    margin-bottom: 0;
}

.dm-section-title {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 10px;
}

/* ── Info list (contato) ──────────────────────────────────────────────── */

.dm-info-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.dm-info-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--bg);
    border: 1px solid var(--hair);
    font-size: 13px;
    color: var(--ink-2);
    letter-spacing: -0.005em;
}

.dm-info-icon {
    color: var(--text-dim);
    flex-shrink: 0;
}

.dm-info-empty {
    padding: 12px;
    border-radius: 8px;
    background: var(--bg);
    border: 1px dashed var(--hair);
    text-align: center;
    font-size: 13px;
    color: var(--text-dim);
    font-style: italic;
}

/* ── Stats grid ───────────────────────────────────────────────────────── */

.dm-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 12px;
}

.dm-stat {
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.dm-stat-label {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 6px;
}

.dm-stat-value {
    font-family: var(--ff-sans);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

.dm-stat--success .dm-stat-value { color: var(--success); }
.dm-stat--error   .dm-stat-value { color: var(--error); }
.dm-stat--warning .dm-stat-value { color: var(--warning); }

/* ── Alerta de valor em atraso ───────────────────────────────────────── */

.dm-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.25);
    color: var(--ink-2);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 12px;
}

.dm-alert-icon {
    color: var(--error);
    flex-shrink: 0;
}

.dm-alert strong {
    color: var(--error);
    font-weight: 700;
}

/* ── Link "ver recebimentos" ──────────────────────────────────────────── */

.dm-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--cyan-dark);
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    padding: 6px 0;
    transition: gap 0.15s;
}

.dm-link:hover {
    gap: 8px;
    text-decoration: underline;
}

/* ── Meta list (outros dados) ────────────────────────────────────────── */

.dm-meta-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.dm-meta-row {
    display: flex;
    align-items: baseline;
    gap: 14px;
    font-size: 13px;
    line-height: 1.5;
}

.dm-meta-row--block {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
}

.dm-meta-label {
    flex-shrink: 0;
    width: 90px;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.dm-meta-row--block .dm-meta-label {
    width: auto;
}

.dm-meta-value {
    flex: 1;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}

.dm-meta-value--block {
    white-space: pre-wrap;
    background: var(--bg);
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--hair);
    width: 100%;
    box-sizing: border-box;
}

.dm-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 100px;
    background: var(--cyan-soft);
    color: var(--cyan-dark);
    font-family: var(--ff-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .dm-stats {
        grid-template-columns: 1fr 1fr;
    }
    .dm-meta-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }
    .dm-meta-label {
        width: auto;
    }
}
`;
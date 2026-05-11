import { useNavigate } from "react-router-dom";
import { LuArrowRight, LuClock4 } from "react-icons/lu";
import PageHeader from "../../components/shell/PageHeader.jsx";
import {
    GRUPOS, relatoriosDoGrupo,
    totalAtivos, totalEmBreve,
} from "./relatorios/_config.js";

/**
 * RelatoriosPage — Central de relatórios (índice)
 * Sprint A3.6.8.1 · Refatoração
 *
 * Mostra um catálogo de todos os relatórios do sistema agrupados por área:
 *  - A pagar
 *  - A receber
 *  - Fluxo e banco
 *  - Consolidado
 *
 * Cada relatório aparece como card com ícone, título, descrição e badge.
 * Cards "em-breve" ficam com opacidade reduzida e botão desabilitado.
 *
 * Estrutura controlada em /pages/app/relatorios/_config.js
 */
export default function RelatoriosPage() {
    const navigate = useNavigate();

    const ativos = totalAtivos();
    const breve = totalEmBreve();

    return (
        <>
            <PageHeader
                title="Relatórios"
                badge={{ label: `${ativos} ativos`, variant: "neutral" }}
            />

            <p className="rel-subtitulo">
                Análises e exportações dos seus dados financeiros.
                Selecione o relatório desejado abaixo.
            </p>

            {/* Grupos */}
            {GRUPOS.map(grupo => {
                const relatorios = relatoriosDoGrupo(grupo.key);
                if (relatorios.length === 0) return null;

                return (
                    <section key={grupo.key} className="rel-grupo">
                        <header className="rel-grupo-head">
                            <h2 className="rel-grupo-titulo">{grupo.label}</h2>
                            <p className="rel-grupo-desc">{grupo.descricao}</p>
                        </header>

                        <div className="rel-grid">
                            {relatorios.map(r => (
                                <CardRelatorio
                                    key={r.key}
                                    relatorio={r}
                                    onAcessar={() => navigate(r.rota)}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   CardRelatorio — card individual de cada relatório
   ═════════════════════════════════════════════════════════════════════════════ */

function CardRelatorio({ relatorio, onAcessar }) {
    const { titulo, descricao, icon: Icon, status } = relatorio;
    const ativo = status === "ativo";

    return (
        <button
            className={`rel-card ${ativo ? "rel-card--ativo" : "rel-card--breve"}`}
            onClick={ativo ? onAcessar : undefined}
            disabled={!ativo}
            type="button"
        >
            <div className="rel-card-icon">
                <Icon size={20}/>
            </div>

            <div className="rel-card-content">
                <div className="rel-card-head">
                    <span className="rel-card-titulo">{titulo}</span>
                    {!ativo && (
                        <span className="rel-card-badge">
                            <LuClock4 size={9}/>
                            Em breve
                        </span>
                    )}
                </div>
                <p className="rel-card-desc">{descricao}</p>
            </div>

            {ativo && (
                <div className="rel-card-arrow">
                    <LuArrowRight size={16}/>
                </div>
            )}
        </button>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .rel-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.rel-subtitulo {
    margin: 0 0 32px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
    max-width: 640px;
}

/* ── Grupo ───────────────────────────────────────────────────────────── */

.rel-grupo {
    margin-bottom: 36px;
}

.rel-grupo:last-child {
    margin-bottom: 0;
}

.rel-grupo-head {
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--hair);
}

.rel-grupo-titulo {
    margin: 0;
    font-family: var(--ff-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.rel-grupo-desc {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--text-dim);
    letter-spacing: -0.005em;
}

/* ── Grid ────────────────────────────────────────────────────────────── */

.rel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
}

/* ── Card ────────────────────────────────────────────────────────────── */

.rel-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 12px;
    border: 1.5px solid var(--hair);
    background: var(--surface);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--ff-sans);
    width: 100%;
    box-sizing: border-box;
    position: relative;
}

.rel-card--ativo:hover {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(11, 30, 54, 0.06);
}

.rel-card--ativo:hover .rel-card-arrow {
    transform: translateX(2px);
    color: var(--cyan-dark);
}

.rel-card--ativo:hover .rel-card-icon {
    background: var(--cyan);
    color: white;
}

.rel-card--breve {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--bg);
}

/* Icon do relatório */
.rel-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--cyan-soft);
    color: var(--cyan-dark);
    transition: background 0.15s, color 0.15s;
}

.rel-card--breve .rel-card-icon {
    background: var(--bg);
    color: var(--text-dim);
}

/* Conteúdo do card */
.rel-card-content {
    flex: 1;
    min-width: 0;
}

.rel-card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 4px;
}

.rel-card-titulo {
    font-size: 14px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.01em;
    line-height: 1.3;
}

.rel-card-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border-radius: 100px;
    background: var(--bg);
    border: 1px solid var(--hair);
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.rel-card-desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

/* Arrow indicador */
.rel-card-arrow {
    flex-shrink: 0;
    align-self: center;
    color: var(--text-dim);
    transition: transform 0.15s, color 0.15s;
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .rel-grid {
        grid-template-columns: 1fr;
    }
}
`;
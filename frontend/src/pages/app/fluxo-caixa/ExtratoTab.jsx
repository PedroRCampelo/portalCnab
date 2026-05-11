import { useState, useEffect, useCallback, useMemo } from "react";
import {
    LuLoader, LuFileText, LuArrowDownLeft, LuArrowUpRight,
    LuScale, LuChevronLeft, LuChevronRight, LuRotateCcw,
} from "react-icons/lu";
import api from "../../../services/api.js";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import {
    fmtValor, fmtDataExtenso, calcularPeriodoRapido,
    TIPO_MOVIMENTO_INFO, PERIODOS_RAPIDOS,
} from "./_helpers.js";

/**
 * ExtratoTab — Lista de movimentações bancárias com filtros
 * Sprint A3.5.3 · Refatoração piloto (final do Fluxo de Caixa)
 *
 * Estrutura:
 *  - Filtros: períodos rápidos (pills), conta, tipo, datas custom
 *  - Resumo do período (4 KPIs: entradas, saídas, saldo, lançamentos)
 *  - Lista agrupada por dia (estilo Nubank/Stripe)
 *  - Cada movimento: ícone colorido + tipo + descrição + conta + valor
 *  - Estados especiais: cancelado (line-through), estorno (badge)
 *  - Paginação simples
 *
 * Endpoint:
 *  - GET /api/movimentos-bancarios?pagina&tamanho&contaId&tipo&dataInicio&dataFim
 *
 * Props:
 *  contas — array de contas (vem do FluxoCaixaPage parent)
 */
export default function ExtratoTab({ contas }) {

    // ── Estado de dados ──────────────────────────────────────────────────────
    const [movimentos,     setMovimentos]     = useState([]);
    const [carregando,     setCarregando]     = useState(true);
    const [erro,           setErro]           = useState("");

    // ── Filtros ──────────────────────────────────────────────────────────────
    const [filtroConta,    setFiltroConta]    = useState("");
    const [filtroTipo,     setFiltroTipo]     = useState("");
    const [periodoRapido,  setPeriodoRapido]  = useState("30d");
    const [dataInicio,     setDataInicio]     = useState("");
    const [dataFim,        setDataFim]        = useState("");

    // ── Paginação ────────────────────────────────────────────────────────────
    const [pagina,         setPagina]         = useState(0);
    const [totalPaginas,   setTotalPaginas]   = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    // ── Estornos ─────────────────────────────────────────────────────────────
    const [contabilizarEstornos, setContabilizarEstornos] = useState(false);

    // Aplica período rápido ao mudar
    useEffect(() => {
        if (periodoRapido) {
            const { inicio, fim } = calcularPeriodoRapido(periodoRapido);
            setDataInicio(inicio);
            setDataFim(fim);
            setPagina(0);
        }
    }, [periodoRapido]);

    // Carregamento
    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const params = new URLSearchParams();
            params.set("pagina", pagina);
            params.set("tamanho", "25");
            if (filtroConta) params.set("contaId", filtroConta);
            if (filtroTipo)  params.set("tipo", filtroTipo);
            if (dataInicio)  params.set("dataInicio", dataInicio);
            if (dataFim)     params.set("dataFim", dataFim);

            const { data } = await api.get(`/api/movimentos-bancarios?${params}`);
            setMovimentos(data.content ?? []);
            setTotalPaginas(data.totalPages ?? 0);
            setTotalElementos(data.totalElements ?? 0);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar extrato");
            setMovimentos([]);
        } finally {
            setCarregando(false);
        }
    }, [pagina, filtroConta, filtroTipo, dataInicio, dataFim]);

    useEffect(() => { carregar(); }, [carregar]);

    function aplicarPeriodoCustomizado() {
        setPeriodoRapido(""); // limpa o "rápido" pra indicar custom
        setPagina(0);
        carregar();
    }

    function limparFiltros() {
        setFiltroConta("");
        setFiltroTipo("");
        setPeriodoRapido("30d");
        setPagina(0);
    }

    // ── Cálculos derivados (totais e agrupamento) ────────────────────────────

    const { totalEntradas, totalSaidas } = useMemo(() => {
        let entradas = 0, saidas = 0;

        if (contabilizarEstornos) {
            // Modo bruto: conta tudo (menos cancelados)
            for (const m of movimentos) {
                if (m.cancelado) continue;
                if (m.ehEntrada) entradas += Number(m.valor);
                else             saidas   += Number(m.valor);
            }
        } else {
            // Modo compensado: estornos anulam seus originais
            // 1. Coletar IDs dos movimentos que foram estornados
            const idsEstornados = new Set();
            for (const m of movimentos) {
                if (m.cancelado) continue;
                if (m.movimentoEstornadoId) {
                    idsEstornados.add(m.movimentoEstornadoId);
                }
            }
            // 2. Excluir tanto o estorno quanto o original estornado
            for (const m of movimentos) {
                if (m.cancelado) continue;
                // É um estorno? Pula.
                if (m.movimentoEstornadoId) continue;
                // Foi estornado? Pula também.
                if (idsEstornados.has(m.id)) continue;
                if (m.ehEntrada) entradas += Number(m.valor);
                else             saidas   += Number(m.valor);
            }
        }

        return { totalEntradas: entradas, totalSaidas: saidas };
    }, [movimentos, contabilizarEstornos]);

    // Agrupar movimentos por dia (key = data ISO)
    const { grupos, diasOrdenados } = useMemo(() => {
        const acc = {};
        for (const m of movimentos) {
            const dia = m.dataMovimento;
            if (!acc[dia]) acc[dia] = [];
            acc[dia].push(m);
        }
        return {
            grupos: acc,
            diasOrdenados: Object.keys(acc).sort().reverse(),
        };
    }, [movimentos]);

    const temFiltrosCustom = !periodoRapido && (dataInicio || dataFim);
    const temFiltrosAtivos = filtroConta || filtroTipo || periodoRapido !== "30d";

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            {/* ═══ FILTROS ═══════════════════════════════════════════════ */}
            <div className="ext-filtros">

                {/* Linha 1: Períodos rápidos (pills) */}
                <div className="ext-pills">
                    {PERIODOS_RAPIDOS.map(p => (
                        <button
                            key={p.key}
                            className={`ext-pill ${periodoRapido === p.key ? "active" : ""}`}
                            onClick={() => setPeriodoRapido(p.key)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Linha 2: Conta + Tipo + Datas custom */}
                <div className="ext-form-grid">
                    <div className="ext-field">
                        <label className="ext-label">Conta</label>
                        <select
                            className="ext-select"
                            value={filtroConta}
                            onChange={e => { setFiltroConta(e.target.value); setPagina(0); }}
                        >
                            <option value="">Todas as contas</option>
                            {contas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nomeConta}{c.banco ? ` — ${c.banco}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ext-field">
                        <label className="ext-label">Tipo</label>
                        <select
                            className="ext-select"
                            value={filtroTipo}
                            onChange={e => { setFiltroTipo(e.target.value); setPagina(0); }}
                        >
                            <option value="">Todos os tipos</option>
                            {Object.entries(TIPO_MOVIMENTO_INFO).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ext-field">
                        <label className="ext-label">Início</label>
                        <input
                            type="date"
                            className="ext-input"
                            value={dataInicio}
                            onChange={e => { setDataInicio(e.target.value); setPeriodoRapido(""); }}
                        />
                    </div>

                    <div className="ext-field">
                        <label className="ext-label">Fim</label>
                        <input
                            type="date"
                            className="ext-input"
                            value={dataFim}
                            onChange={e => { setDataFim(e.target.value); setPeriodoRapido(""); }}
                        />
                    </div>

                    <div className="ext-field-actions">
                        {temFiltrosCustom && (
                            <button
                                className="ph-btn ph-btn--primary"
                                onClick={aplicarPeriodoCustomizado}
                                style={{ fontSize: 12 }}
                            >
                                Aplicar
                            </button>
                        )}
                        {temFiltrosAtivos && (
                            <button
                                className="ph-btn ph-btn--icon"
                                onClick={limparFiltros}
                                title="Limpar filtros"
                            >
                                <LuRotateCcw size={13}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ TOGGLE ESTORNOS ══════════════════════════════════════ */}
            <label className="ext-toggle-row">
                <span className="ext-toggle-track" data-on={contabilizarEstornos}>
                    <input
                        type="checkbox"
                        checked={contabilizarEstornos}
                        onChange={e => setContabilizarEstornos(e.target.checked)}
                        className="ext-toggle-input"
                    />
                    <span className="ext-toggle-thumb"/>
                </span>
                <span className="ext-toggle-label">
                    Contabilizar estornos
                </span>
                <span className="ext-toggle-hint">
                    {contabilizarEstornos
                        ? "Estornos estão somando nos totais"
                        : "Estornos se compensam com o original"}
                </span>
            </label>

            {/* ═══ RESUMO DO PERÍODO ═════════════════════════════════════ */}
            {!carregando && movimentos.length > 0 && (
                <div className="ext-resumo">
                    <ResumoBox
                        label="Entradas no período"
                        valor={fmtValor(totalEntradas)}
                        variant="success"
                        icon={<LuArrowDownLeft size={16}/>}
                    />
                    <ResumoBox
                        label="Saídas no período"
                        valor={fmtValor(totalSaidas)}
                        variant="error"
                        icon={<LuArrowUpRight size={16}/>}
                    />
                    <ResumoBox
                        label="Saldo do período"
                        valor={fmtValor(totalEntradas - totalSaidas)}
                        variant={totalEntradas - totalSaidas >= 0 ? "success" : "error"}
                        icon={<LuScale size={16}/>}
                        featured
                    />
                    <ResumoBox
                        label="Total de lançamentos"
                        valor={String(totalElementos)}
                        variant="default"
                        icon={<LuFileText size={16}/>}
                    />
                </div>
            )}

            {/* ═══ ERRO ═══════════════════════════════════════════════════ */}
            {erro && <div className="ext-erro">{erro}</div>}

            {/* ═══ LISTA / EMPTY / LOADING ═══════════════════════════════ */}
            {carregando ? (
                <div className="ext-loading">
                    <LuLoader size={20} className="ext-spinner"/>
                    <span>Carregando extrato...</span>
                </div>
            ) : movimentos.length === 0 ? (
                <EmptyState
                    icon={LuFileText}
                    title="Nenhum lançamento no período"
                    description="Toda baixa de recebimento ou pagamento aparece aqui automaticamente. Tente ajustar os filtros ou aguarde novos movimentos."
                    action={
                        temFiltrosAtivos && (
                            <button
                                className="ph-btn ph-btn--ghost"
                                onClick={limparFiltros}
                            >
                                <LuRotateCcw size={14}/>
                                Limpar filtros
                            </button>
                        )
                    }
                />
            ) : (
                <>
                    <div className="ext-grupos">
                        {diasOrdenados.map(dia => (
                            <div key={dia} className="ext-grupo">
                                <div className="ext-grupo-head">
                                    {fmtDataExtenso(dia)}
                                </div>
                                <div className="ext-grupo-body">
                                    {grupos[dia].map((m, idx) => (
                                        <MovimentoLinha
                                            key={m.id}
                                            movimento={m}
                                            ultima={idx === grupos[dia].length - 1}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginação */}
                    {totalPaginas > 1 && (
                        <div className="ext-paginacao">
                            <button
                                className="ph-btn ph-btn--icon"
                                onClick={() => setPagina(p => Math.max(0, p - 1))}
                                disabled={pagina === 0}
                            >
                                <LuChevronLeft size={14}/>
                            </button>
                            <span className="ext-paginacao-texto">
                                Página <strong>{pagina + 1}</strong> de <strong>{totalPaginas}</strong>
                                <span className="ext-paginacao-total">
                                    · {totalElementos} {totalElementos === 1 ? "lançamento" : "lançamentos"}
                                </span>
                            </span>
                            <button
                                className="ph-btn ph-btn--icon"
                                onClick={() => setPagina(p => p + 1)}
                                disabled={pagina >= totalPaginas - 1}
                            >
                                <LuChevronRight size={14}/>
                            </button>
                        </div>
                    )}
                </>
            )}

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ResumoBox — KPI compacto pro resumo do período
   ═════════════════════════════════════════════════════════════════════════════ */

function ResumoBox({ label, valor, variant = "default", icon, featured = false }) {
    return (
        <div className={`ext-resumo-box ext-resumo-box--${variant} ${featured ? "ext-resumo-box--featured" : ""}`}>
            <div className="ext-resumo-head">
                <span className="ext-resumo-icon">{icon}</span>
                <span className="ext-resumo-label">{label}</span>
            </div>
            <div className="ext-resumo-value">{valor}</div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   MovimentoLinha — Linha individual de movimentação bancária
   Estilo: Nubank-like
   ═════════════════════════════════════════════════════════════════════════════ */

function MovimentoLinha({ movimento, ultima }) {
    const info = TIPO_MOVIMENTO_INFO[movimento.tipo] ?? {
        label:    movimento.tipo,
        variant:  "neutral",
        icon:     LuFileText,
    };
    const Icon = info.icon;
    const ehEstorno = movimento.tipo?.startsWith("ESTORNO");

    return (
        <div className={`ext-mov ${ultima ? "ext-mov--last" : ""} ${movimento.cancelado ? "ext-mov--cancelado" : ""}`}>

            {/* Ícone colorido por tipo */}
            <div className={`ext-mov-icon ext-mov-icon--${info.variant}`}>
                <Icon size={16}/>
            </div>

            {/* Descrição central */}
            <div className="ext-mov-text">
                <div className="ext-mov-head">
                    <span className={`ext-mov-tipo ext-mov-tipo--${info.variant}`}>
                        {info.label}
                    </span>
                    {movimento.cancelado && (
                        <span className="ext-mov-badge ext-mov-badge--cancelado">
                            CANCELADO
                        </span>
                    )}
                    {ehEstorno && !movimento.cancelado && (
                        <span className="ext-mov-badge ext-mov-badge--estorno">
                            ↩ ESTORNO
                        </span>
                    )}
                </div>
                <div className="ext-mov-desc">
                    {movimento.descricao || "—"}
                </div>
                {movimento.conta?.nomeConta && (
                    <div className="ext-mov-conta">
                        {movimento.conta.nomeConta}
                    </div>
                )}
            </div>

            {/* Valor à direita */}
            <div className={`ext-mov-valor ${movimento.ehEntrada ? "entrada" : "saida"}`}>
                {movimento.ehEntrada ? "+ " : "− "}
                {fmtValor(movimento.valor)}
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .ext-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
/* ═══ FILTROS ═══════════════════════════════════════════════════════════ */

.ext-filtros {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

/* Pills de período rápido */
.ext-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--hair);
}

.ext-pill {
    padding: 6px 14px;
    border-radius: 100px;
    font-family: var(--ff-sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
    border: 1px solid var(--hair);
    background: var(--bg);
    color: var(--text-muted);
    transition: all 0.15s;
}

.ext-pill:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
}

.ext-pill.active {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

/* Grid de filtros */
.ext-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    align-items: end;
}

.ext-field {
    min-width: 0;
}

.ext-field-actions {
    display: flex;
    gap: 6px;
    align-items: flex-end;
}

.ext-label {
    display: block;
    margin-bottom: 6px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.ext-select,
.ext-input {
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1.5px solid var(--hair);
    background: var(--bg);
    color: var(--ink-2);
    font-family: var(--ff-sans);
    font-size: 13px;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
}

.ext-select:focus,
.ext-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

/* ═══ TOGGLE ESTORNOS ═══════════════════════════════════════════════════ */

.ext-toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    margin-bottom: 16px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--hair);
    cursor: pointer;
    user-select: none;
    transition: border-color 0.15s;
}

.ext-toggle-row:hover {
    border-color: var(--text-dim);
}

.ext-toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.ext-toggle-track {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    border-radius: 100px;
    background: var(--hair);
    flex-shrink: 0;
    transition: background 0.2s;
}

.ext-toggle-track[data-on="true"] {
    background: var(--cyan);
}

.ext-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform 0.2s;
}

.ext-toggle-track[data-on="true"] .ext-toggle-thumb {
    transform: translateX(16px);
}

.ext-toggle-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}

.ext-toggle-hint {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
    margin-left: auto;
}

/* ═══ RESUMO DO PERÍODO (KPIs) ═════════════════════════════════════════ */

.ext-resumo {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
}

.ext-resumo-box {
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--hair);
}

.ext-resumo-box--featured {
    border-width: 1.5px;
}

.ext-resumo-box--featured.ext-resumo-box--success {
    background: var(--success-bg);
    border-color: rgba(24, 178, 107, 0.25);
}

.ext-resumo-box--featured.ext-resumo-box--error {
    background: var(--error-bg);
    border-color: rgba(229, 72, 77, 0.25);
}

.ext-resumo-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
}

.ext-resumo-icon {
    display: inline-flex;
    line-height: 0;
}

.ext-resumo-box--success .ext-resumo-icon { color: var(--success); }
.ext-resumo-box--error   .ext-resumo-icon { color: var(--error); }
.ext-resumo-box--default .ext-resumo-icon { color: var(--cyan-dark); }

.ext-resumo-value {
    font-family: var(--ff-sans);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

.ext-resumo-box--featured.ext-resumo-box--success .ext-resumo-value { color: var(--success); }
.ext-resumo-box--featured.ext-resumo-box--error   .ext-resumo-value { color: var(--error); }

/* ═══ AGRUPAMENTO POR DIA ═══════════════════════════════════════════════ */

.ext-grupos {
    /* container das listas agrupadas */
}

.ext-grupo {
    margin-bottom: 18px;
}

.ext-grupo-head {
    padding: 0 4px 8px;
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: capitalize;
    color: var(--text-dim);
}

.ext-grupo-body {
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 10px;
    overflow: hidden;
}

/* ═══ MOVIMENTO INDIVIDUAL ══════════════════════════════════════════════ */

.ext-mov {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--hair);
    transition: background 0.1s;
}

.ext-mov:hover {
    background: var(--bg);
}

.ext-mov--last {
    border-bottom: none;
}

.ext-mov--cancelado {
    opacity: 0.55;
}

/* Ícone circular colorido */
.ext-mov-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.ext-mov-icon--success { background: var(--success-bg); color: var(--success); }
.ext-mov-icon--error   { background: var(--error-bg);   color: var(--error); }
.ext-mov-icon--warning { background: var(--warning-bg); color: var(--warning); }
.ext-mov-icon--default { background: var(--cyan-soft);  color: var(--cyan-dark); }
.ext-mov-icon--neutral { background: var(--bg);         color: var(--text-dim); }

/* Texto central */
.ext-mov-text {
    flex: 1;
    min-width: 0;
}

.ext-mov-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
    flex-wrap: wrap;
}

.ext-mov-tipo {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.ext-mov-tipo--success { color: var(--success); }
.ext-mov-tipo--error   { color: var(--error); }
.ext-mov-tipo--warning { color: var(--warning); }
.ext-mov-tipo--default { color: var(--cyan-dark); }
.ext-mov-tipo--neutral { color: var(--text-dim); }

.ext-mov-badge {
    font-family: var(--ff-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 2px 6px;
    border-radius: 100px;
    text-transform: uppercase;
}

.ext-mov-badge--cancelado {
    background: var(--bg);
    color: var(--text-dim);
}

.ext-mov-badge--estorno {
    background: var(--warning-bg);
    color: var(--warning);
}

.ext-mov-desc {
    font-size: 13px;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ext-mov--cancelado .ext-mov-desc {
    text-decoration: line-through;
}

.ext-mov-conta {
    margin-top: 2px;
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* Valor à direita */
.ext-mov-valor {
    font-family: var(--ff-sans);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
}

.ext-mov-valor.entrada { color: var(--success); }
.ext-mov-valor.saida   { color: var(--error); }

.ext-mov--cancelado .ext-mov-valor {
    text-decoration: line-through;
}

/* ═══ PAGINAÇÃO ═════════════════════════════════════════════════════════ */

.ext-paginacao {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 16px 0;
}

.ext-paginacao-texto {
    padding: 0 16px;
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--ff-sans);
    letter-spacing: -0.005em;
}

.ext-paginacao-texto strong {
    color: var(--navy-deep);
    font-weight: 600;
}

.ext-paginacao-total {
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    margin-left: 6px;
}

/* ═══ ESTADOS GERAIS ═══════════════════════════════════════════════════ */

.ext-loading {
    padding: 60px 20px;
    text-align: center;
    color: var(--text-dim);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 14px;
}

.ext-spinner {
    animation: extSpin 1s linear infinite;
    color: var(--cyan-dark);
}

@keyframes extSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

.ext-erro {
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
}

/* ═══ RESPONSIVO ═══════════════════════════════════════════════════════ */

@media (max-width: 600px) {
    .ext-filtros {
        padding: 12px;
    }

    .ext-pills {
        margin-bottom: 12px;
        padding-bottom: 12px;
    }

    .ext-form-grid {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .ext-field-actions {
        grid-column: span 2;
        justify-content: flex-end;
    }

    .ext-resumo {
        grid-template-columns: 1fr 1fr;
    }

    .ext-mov {
        padding: 10px 12px;
    }

    .ext-mov-valor {
        font-size: 14px;
    }

    .ext-paginacao-total {
        display: none;
    }

    .ext-toggle-hint {
        display: none;
    }
}

@media (max-width: 380px) {
    .ext-resumo {
        grid-template-columns: 1fr;
    }

    .ext-mov-icon {
        width: 32px;
        height: 32px;
    }
}
`;
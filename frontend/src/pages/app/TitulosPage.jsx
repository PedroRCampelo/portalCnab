import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileAlt } from "react-icons/fa";

import {
    LuPlus, LuSearch, LuPencil, LuTrash2,
    LuCircleCheck, LuUndo2, LuDownload, LuTags,
    LuRotateCcw, LuChevronLeft, LuChevronRight, LuTriangleAlert,
    LuWallet,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader      from "../../components/shell/PageHeader.jsx";
import DataTable       from "../../components/ui/DataTable.jsx";
import EmptyState      from "../../components/ui/EmptyState.jsx";
import Modal           from "../../components/ui/Modal.jsx";
import InsightCard     from "../../components/InsightCard.jsx";

import ResumoBoxes     from "./titulos/ResumoBoxes.jsx";
import TituloModal     from "./titulos/TituloModal.jsx";
import BaixaModal      from "./titulos/BaixaModal.jsx";
import ParceladoModal  from "./titulos/ParceladoModal.jsx";
import {
    fmtData, fmtValor, vencimentoContexto,
    STATUS_INFO, FILTROS_STATUS,
} from "./titulos/_helpers.js";

/**
 * TitulosPage — Lista e gerenciamento de títulos a pagar
 * Sprint A3.6.5.3 · Refatoração (orquestrador final)
 *
 * Atualização nesta sub-fase:
 *  - Conecta ParceladoModal real (não mais placeholder)
 *  - Orquestra fluxo: TituloModal "Parcelar" → fecha → abre ParceladoModal
 *  - BaixaModal real conectado
 */
export default function TitulosPage() {
    const navigate = useNavigate();

    // Estado
    const [titulos,     setTitulos]     = useState([]);
    const [resumo,      setResumo]      = useState(null);
    const [categorias,  setCategorias]  = useState([]);
    const [carregando,  setCarregando]  = useState(true);
    const [erro,        setErro]        = useState("");

    // Filtros + paginação
    const [busca,         setBusca]         = useState("");
    const [filtroStatus,  setFiltroStatus]  = useState("");
    const [pagina,        setPagina]        = useState(0);
    const [total,         setTotal]         = useState(0);

    // Modais
    const [tituloModal,    setTituloModal]    = useState({ aberto: false, titulo: null });
    const [parceladoModal, setParceladoModal] = useState({ aberto: false, formBase: null });
    const [baixaModal,     setBaixaModal]     = useState(null);
    const [salvando,       setSalvando]       = useState(false);
    const [confirmExcluir, setConfirmExcluir] = useState(null);
    const [confirmEstorno, setConfirmEstorno] = useState(null);

    // Importação Excel
    const [importando, setImportando] = useState(false);
    const [msgImport,  setMsgImport]  = useState("");
    const inputFileRef = useRef();

    // ── Carregamento ────────────────────────────────────────────────────────

    const carregarTitulos = useCallback(async () => {
        setCarregando(true);
        try {
            const params = new URLSearchParams({
                pagina,
                tamanho: 20,
                ...(busca        ? { busca }                : {}),
                ...(filtroStatus ? { status: filtroStatus } : {}),
            });
            const { data } = await api.get(`/api/titulos?${params}`);
            setTitulos(data.content ?? []);
            setTotal(data.totalElements ?? 0);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar títulos");
            setTitulos([]);
        } finally {
            setCarregando(false);
        }
    }, [pagina, busca, filtroStatus]);

    const carregarResumo = useCallback(async () => {
        try {
            const { data } = await api.get("/api/titulos/resumo");
            setResumo(data);
        } catch {}
    }, []);

    const carregarTiposGasto = useCallback(async () => {
        try {
            const { data } = await api.get("/api/categorias?tipo=DESPESA");
            setCategorias(data);
        } catch {}
    }, []);

    useEffect(() => {
        carregarResumo();
        carregarTiposGasto();
    }, [carregarResumo, carregarTiposGasto]);

    useEffect(() => {
        carregarTitulos();
    }, [carregarTitulos]);

    function recarregarTudo() {
        carregarTitulos();
        carregarResumo();
    }

    // ── Ações ──────────────────────────────────────────────────────────────

    function abrirNovo() {
        setTituloModal({ aberto: true, titulo: null });
    }

    function abrirEdicao(t) {
        setTituloModal({ aberto: true, titulo: t });
    }

    async function salvarTitulo(payload) {
        setSalvando(true);
        try {
            if (tituloModal.titulo) {
                await api.put(`/api/titulos/${tituloModal.titulo.id}`, payload);
            } else {
                await api.post("/api/titulos", payload);
            }
            setTituloModal({ aberto: false, titulo: null });
            recarregarTudo();
        } finally {
            setSalvando(false);
        }
    }

    /**
     * Chamado quando usuário clica "Parcelar" no TituloModal.
     * Fluxo:
     *  1. TituloModal valida campos básicos (Número, Fornecedor, Valor)
     *  2. Chama onParcelar(form) com o form atual
     *  3. Aqui: fecha o TituloModal e abre o ParceladoModal com o form
     */
    function abrirParcelado(formDoTitulo) {
        setTituloModal({ aberto: false, titulo: null });
        setParceladoModal({ aberto: true, formBase: formDoTitulo });
    }

    /**
     * Callback do ParceladoModal — payload já vem montado:
     *  { titulo: {...}, qtdParcelas, intervaloDias }
     */
    async function salvarParcelado(payload) {
        setSalvando(true);
        try {
            await api.post("/api/titulos/parcelado", payload);
            setParceladoModal({ aberto: false, formBase: null });
            recarregarTudo();
        } finally {
            setSalvando(false);
        }
    }

    async function confirmarBaixa(payload) {
        await api.post(`/api/titulos/${baixaModal.id}/baixa`, payload);
        setBaixaModal(null);
        recarregarTudo();
    }

    async function executarExclusao() {
        try {
            await api.delete(`/api/titulos/${confirmExcluir.id}`);
            setConfirmExcluir(null);
            recarregarTudo();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao excluir título");
            setConfirmExcluir(null);
        }
    }

    async function executarEstorno() {
        try {
            await api.post(`/api/titulos/${confirmEstorno.id}/estornar`);
            setConfirmEstorno(null);
            recarregarTudo();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao estornar");
            setConfirmEstorno(null);
        }
    }

    async function importarExcel(e) {
        const arquivo = e.target.files?.[0];
        if (!arquivo) return;

        setImportando(true);
        setMsgImport("");
        try {
            const fd = new FormData();
            fd.append("arquivo", arquivo);
            const { data } = await api.post("/api/titulos/importar", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMsgImport({
                tipo: "sucesso",
                texto: `${data.importados} título(s) importado(s).${data.erros?.length ? ` ${data.erros.length} erro(s).` : ""}`,
            });
            recarregarTudo();
        } catch (err) {
            setMsgImport({
                tipo: "erro",
                texto: err.response?.data?.mensagem ?? "Erro ao importar arquivo",
            });
        } finally {
            setImportando(false);
            e.target.value = "";
        }
    }

    // ── Definição das colunas da DataTable ──────────────────────────────────

    const colunas = useMemo(() => [
        {
            key: "numero",
            label: "Número / Parcela",
            sortable: true,
            render: t => (
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{
                        fontFamily: "var(--ff-mono)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--navy-deep)",
                        letterSpacing: "0.02em",
                    }}>
                        {t.numero}
                    </span>
                    {t.parcelaTotal > 1 && (
                        <span style={{
                            fontFamily: "var(--ff-mono)",
                            fontSize: 10,
                            color: "var(--text-dim)",
                            letterSpacing: "0.04em",
                        }}>
                            Parcela {String(t.parcelaAtual).padStart(2, "0")}/{String(t.parcelaTotal).padStart(2, "0")}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "fornecedorNome",
            label: "Fornecedor",
            sortable: true,
            render: t => (
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>
                        {t.fornecedorNome}
                    </span>
                    {t.fornecedorDocumento && (
                        <span style={{
                            fontFamily: "var(--ff-mono)",
                            fontSize: 10,
                            color: "var(--text-dim)",
                            letterSpacing: "0.04em",
                        }}>
                            {t.fornecedorDocumento}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "tipoGastoId",
            label: "Tipo de gasto",
            render: t => {
                const nome = categorias.find(c => c.id === t.categoriaId || c.id === t.tipoGastoId)?.nome;
                if (!nome) return <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>;
                return (
                    <span className="ui-badge ui-badge--neutral" style={{ fontSize: 11 }}>
                        {nome}
                    </span>
                );
            },
        },
        {
            key: "vencimento",
            label: "Vencimento",
            sortable: true,
            render: t => {
                const ctx = vencimentoContexto(t.vencimento, t.status);
                return (
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                        <span className="ui-table-num" style={{ fontSize: 13 }}>
                            {fmtData(t.vencimento)}
                        </span>
                        {ctx && (
                            <span style={{
                                fontFamily: "var(--ff-mono)",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                color: ctx.variant === "error"
                                    ? "var(--error)"
                                    : ctx.variant === "warning"
                                        ? "var(--warning)"
                                        : "var(--text-dim)",
                            }}>
                                {ctx.texto}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "valor",
            label: "Valor / Saldo",
            sortable: true,
            align: "right",
            render: t => {
                const temBaixa = t.saldo != null && t.valor != null && t.saldo < t.valor;
                return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.3 }}>
                        <span className="ui-table-num" style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--navy-deep)",
                        }}>
                            {fmtValor(t.valor)}
                        </span>
                        {temBaixa && (
                            <span className="ui-table-num" style={{
                                fontSize: 11,
                                color: "var(--warning)",
                                fontWeight: 600,
                            }}>
                                Saldo: {fmtValor(t.saldo)}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "status",
            label: "Status",
            align: "center",
            render: t => {
                const info = STATUS_INFO[t.status] ?? { label: t.status, variant: "neutral" };
                return (
                    <span className={`ui-badge ui-badge--${info.variant}`}>
                        {info.label}
                    </span>
                );
            },
        },
        {
            key: "_actions",
            label: "",
            align: "right",
            render: t => <AcoesInline
                titulo={t}
                onBaixar={() => setBaixaModal(t)}
                onEstornar={() => setConfirmEstorno(t)}
                onEditar={() => abrirEdicao(t)}
                onExcluir={() => setConfirmExcluir(t)}
            />,
        },
    ], [categorias]);

    // ── Render ──────────────────────────────────────────────────────────────

    const temFiltrosAtivos = filtroStatus || busca.trim();
    const totalPaginas = Math.ceil(total / 20);

    return (
        <>
            <PageHeader
                title="Títulos a Pagar"
                actions={
                    <>
                        <input
                            type="file"
                            ref={inputFileRef}
                            accept=".xlsx"
                            style={{ display: "none" }}
                            onChange={importarExcel}
                        />
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => navigate("/relatorios")}
                        >
                            <FaFileAlt size={14}/>
                            Relatórios
                        </button>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => navigate("/categorias")}
                        >
                            <LuTags size={14}/>
                            Tipos de gasto
                        </button>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => inputFileRef.current?.click()}
                            disabled={importando}
                        >
                            <LuDownload size={14}/>
                            {importando ? "Importando..." : "Importar Excel"}
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={abrirNovo}
                        >
                            <LuPlus size={14}/>
                            Novo título
                        </button>
                    </>
                }
            />

            {/* Mensagem de importação */}
            {msgImport && (
                <div className={`tit-msg-import tit-msg-import--${msgImport.tipo}`}>
                    {msgImport.tipo === "sucesso" ? <LuCircleCheck size={14}/> : <LuTriangleAlert size={14}/>}
                    {msgImport.texto}
                </div>
            )}

            {/* Erro geral */}
            {erro && <div className="tit-erro">{erro}</div>}

            {/* KPIs */}
            <ResumoBoxes resumo={resumo}/>

            {/* InsightCard (IA) */}
            <div style={{ marginBottom: 20 }}>
                <InsightCard/>
            </div>

            {/* Filtros + busca */}
            <div className="tit-toolbar">
                <div className="tit-pills">
                    {FILTROS_STATUS.map(f => (
                        <button
                            key={f.value || "todos"}
                            className={`tit-pill ${filtroStatus === f.value ? "active" : ""}`}
                            onClick={() => { setFiltroStatus(f.value); setPagina(0); }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="tit-busca">
                    <LuSearch size={14} className="tit-busca-icon"/>
                    <input
                        type="text"
                        className="tit-busca-input"
                        value={busca}
                        onChange={e => { setBusca(e.target.value); setPagina(0); }}
                        placeholder="Buscar por fornecedor, número ou documento..."
                    />
                </div>
            </div>

            {/* Tabela */}
            <DataTable
                columns={colunas}
                data={titulos}
                keyField="id"
                loading={carregando}
                empty={
                    <EmptyState
                        icon={LuWallet}
                        title={temFiltrosAtivos ? "Nenhum título encontrado" : "Nenhum título cadastrado"}
                        description={
                            temFiltrosAtivos
                                ? "Tente ajustar os filtros ou a busca."
                                : "Cadastre seus títulos a pagar manualmente ou importe via Excel pra começar a gerenciar suas contas."
                        }
                        action={
                            !temFiltrosAtivos ? (
                                <button className="ph-btn ph-btn--primary" onClick={abrirNovo}>
                                    <LuPlus size={14}/>
                                    Cadastrar primeiro título
                                </button>
                            ) : (
                                <button
                                    className="ph-btn ph-btn--ghost"
                                    onClick={() => { setFiltroStatus(""); setBusca(""); setPagina(0); }}
                                >
                                    <LuRotateCcw size={14}/>
                                    Limpar filtros
                                </button>
                            )
                        }
                    />
                }
            />

            {/* Paginação */}
            {totalPaginas > 1 && (
                <div className="tit-paginacao">
                    <button
                        className="ph-btn ph-btn--icon"
                        onClick={() => setPagina(p => Math.max(0, p - 1))}
                        disabled={pagina === 0}
                    >
                        <LuChevronLeft size={14}/>
                    </button>
                    <span className="tit-paginacao-texto">
                        Página <strong>{pagina + 1}</strong> de <strong>{totalPaginas}</strong>
                        <span className="tit-paginacao-total">
                            · {total} {total === 1 ? "título" : "títulos"}
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

            {/* ═══ MODAIS ═══ */}

            {tituloModal.aberto && (
                <TituloModal
                    titulo={tituloModal.titulo}
                    tiposGasto={categorias}
                    onSalvar={salvarTitulo}
                    onParcelar={abrirParcelado}
                    onFechar={() => setTituloModal({ aberto: false, titulo: null })}
                    salvando={salvando}
                />
            )}

            {parceladoModal.aberto && (
                <ParceladoModal
                    formBase={parceladoModal.formBase}
                    onSalvar={salvarParcelado}
                    onFechar={() => setParceladoModal({ aberto: false, formBase: null })}
                    salvando={salvando}
                />
            )}

            {baixaModal && (
                <BaixaModal
                    titulo={baixaModal}
                    onConfirmar={confirmarBaixa}
                    onFechar={() => setBaixaModal(null)}
                />
            )}

            {/* Confirmação: Excluir */}
            <Modal
                open={confirmExcluir !== null}
                onClose={() => setConfirmExcluir(null)}
                size="sm"
                title="Excluir título?"
                description={confirmExcluir && (
                    <>O título <strong>#{confirmExcluir.numero}</strong> será excluído permanentemente.
                        Esta ação não pode ser desfeita.</>
                )}
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setConfirmExcluir(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={executarExclusao}
                            style={{ background: "var(--error)", borderColor: "var(--error)" }}
                        >
                            Sim, excluir
                        </button>
                    </>
                }
            />

            {/* Confirmação: Estornar */}
            <Modal
                open={confirmEstorno !== null}
                onClose={() => setConfirmEstorno(null)}
                size="sm"
                title="Estornar baixa?"
                description={confirmEstorno && (
                    <>O título <strong>#{confirmEstorno.numero}</strong> voltará pra status pendente.
                        O movimento bancário do pagamento será compensado e fica registrado no histórico.</>
                )}
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setConfirmEstorno(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={executarEstorno}
                            style={{ background: "var(--warning)", borderColor: "var(--warning)" }}
                        >
                            Sim, estornar
                        </button>
                    </>
                }
            />

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   AcoesInline — botões de ação no canto direito de cada linha
   ═════════════════════════════════════════════════════════════════════════════ */

function AcoesInline({ titulo: t, onBaixar, onEstornar, onEditar, onExcluir }) {
    const ehPago     = t.status === "PAGO";
    const temBaixa   = ehPago || (t.saldo != null && t.valor != null && t.saldo < t.valor);
    const podeBaixar   = !ehPago;
    const podeEstornar = temBaixa;
    const podeEditar   = !temBaixa;
    const podeExcluir  = !temBaixa;

    return (
        <div className="tit-actions" onClick={e => e.stopPropagation()}>
            {podeBaixar && (
                <button
                    className="tit-action tit-action--baixar"
                    onClick={onBaixar}
                    title="Registrar baixa (pagamento)"
                >
                    <LuCircleCheck size={14}/>
                </button>
            )}

            {podeEstornar && (
                <button
                    className="tit-action tit-action--estornar"
                    onClick={onEstornar}
                    title="Estornar baixa"
                >
                    <LuUndo2 size={14}/>
                </button>
            )}

            {podeEditar && (
                <button
                    className="tit-action"
                    onClick={onEditar}
                    title="Editar"
                >
                    <LuPencil size={14}/>
                </button>
            )}

            {podeExcluir && (
                <button
                    className="tit-action tit-action--excluir"
                    onClick={onExcluir}
                    title="Excluir título"
                >
                    <LuTrash2 size={14}/>
                </button>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .tit-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.tit-erro {
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
}

.tit-msg-import {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.4;
}

.tit-msg-import--sucesso {
    background: var(--success-bg);
    border: 1px solid rgba(24, 178, 107, 0.25);
    color: var(--success);
}

.tit-msg-import--erro {
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.25);
    color: var(--warning);
}

.tit-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.tit-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.tit-pill {
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

.tit-pill:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
}

.tit-pill.active {
    border-color: var(--cyan);
    background: var(--cyan-soft);
    color: var(--cyan-dark);
}

.tit-busca {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 380px;
    margin-left: auto;
}

.tit-busca-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    pointer-events: none;
}

.tit-busca-input {
    width: 100%;
    padding: 8px 12px 8px 34px;
    border: 1.5px solid var(--hair);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink-2);
    font-family: var(--ff-sans);
    font-size: 13px;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
}

.tit-busca-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.tit-actions {
    display: inline-flex;
    gap: 4px;
    align-items: center;
}

.tit-action {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.12s;
    flex-shrink: 0;
}

.tit-action:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.tit-action--baixar:hover {
    border-color: var(--success);
    background: var(--success-bg);
    color: var(--success);
}

.tit-action--estornar:hover {
    border-color: var(--warning);
    background: var(--warning-bg);
    color: var(--warning);
}

.tit-action--excluir:hover {
    border-color: var(--error);
    background: var(--error-bg);
    color: var(--error);
}

.tit-paginacao {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 16px 0;
}

.tit-paginacao-texto {
    padding: 0 16px;
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--ff-sans);
    letter-spacing: -0.005em;
}

.tit-paginacao-texto strong {
    color: var(--navy-deep);
    font-weight: 600;
}

.tit-paginacao-total {
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    margin-left: 6px;
}

@media (max-width: 700px) {
    .tit-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .tit-busca {
        max-width: 100%;
        margin-left: 0;
    }

    .tit-paginacao-total {
        display: none;
    }
}
`;
import { useState, useEffect, useCallback } from "react";
import {
    LuPlus, LuPencil, LuTrash2, LuCheck, LuX, LuTags, LuLoader,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader   from "../../components/shell/PageHeader.jsx";
import Card         from "../../components/ui/Card.jsx";
import EmptyState   from "../../components/ui/EmptyState.jsx";
import Modal        from "../../components/ui/Modal.jsx";

/**
 * TiposGastoPage — Cadastro de tipos de gasto (categorias)
 * Sprint A3.6.6 · Refatoração
 *
 * Recursos:
 *  - Form de criação inline (input + botão criar)
 *  - Lista com avatar circular (1ª letra)
 *  - Edição inline (input troca o nome, atalho Enter salva, ESC cancela)
 *  - Confirmação de exclusão via modal
 *  - Empty state quando não tem nada
 *
 * Endpoints:
 *  - GET    /api/tipos-gasto
 *  - POST   /api/tipos-gasto
 *  - PUT    /api/tipos-gasto/{id}
 *  - DELETE /api/tipos-gasto/{id}
 */
export default function TiposGastoPage() {
    const [tipos,        setTipos]        = useState([]);
    const [carregando,   setCarregando]   = useState(true);
    const [erro,         setErro]         = useState("");

    // Criação
    const [novoNome,     setNovoNome]     = useState("");
    const [salvando,     setSalvando]     = useState(false);

    // Edição inline
    const [editId,       setEditId]       = useState(null);
    const [editNome,     setEditNome]     = useState("");

    // Modal de confirmação de exclusão
    const [confirmExcluir, setConfirmExcluir] = useState(null);
    const [excluindo,      setExcluindo]      = useState(false);

    // ── Carregamento ────────────────────────────────────────────────────────

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const { data } = await api.get("/api/tipos-gasto");
            setTipos(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar tipos de gasto");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    // ── Ações ──────────────────────────────────────────────────────────────

    async function criar() {
        if (!novoNome.trim()) return;

        setSalvando(true);
        setErro("");
        try {
            await api.post("/api/tipos-gasto", { nome: novoNome.trim() });
            setNovoNome("");
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar tipo de gasto");
        } finally {
            setSalvando(false);
        }
    }

    function abrirEdicao(tipo) {
        setEditId(tipo.id);
        setEditNome(tipo.nome);
        setErro("");
    }

    function cancelarEdicao() {
        setEditId(null);
        setEditNome("");
    }

    async function salvarEdicao(id) {
        if (!editNome.trim()) return;

        setSalvando(true);
        setErro("");
        try {
            await api.put(`/api/tipos-gasto/${id}`, { nome: editNome.trim() });
            cancelarEdicao();
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar alterações");
        } finally {
            setSalvando(false);
        }
    }

    async function executarExclusao() {
        setExcluindo(true);
        try {
            await api.delete(`/api/tipos-gasto/${confirmExcluir.id}`);
            setConfirmExcluir(null);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao excluir");
            setConfirmExcluir(null);
        } finally {
            setExcluindo(false);
        }
    }

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="tg-container">
            <PageHeader
                title="Tipos de gasto"
                backTo="/titulos"
                backLabel="Títulos"
            />

            <p className="tg-subtitulo">
                Categorize seus títulos para facilitar análises e relatórios.
                Cada conta tem sua própria lista.
            </p>

            {erro && <div className="tg-erro">{erro}</div>}

            {/* ── Card de criação ── */}
            <Card>
                <Card.Body>
                    <div className="tg-form-label">Novo tipo de gasto</div>
                    <div className="tg-form-row">
                        <input
                            type="text"
                            className="tg-input"
                            value={novoNome}
                            onChange={e => setNovoNome(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && novoNome.trim()) {
                                    e.preventDefault();
                                    criar();
                                }
                            }}
                            placeholder="Ex: Fornecedores, Aluguel, Impostos..."
                            maxLength={100}
                            disabled={salvando}
                        />
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={criar}
                            disabled={salvando || !novoNome.trim()}
                        >
                            <LuPlus size={14}/>
                            {salvando ? "Criando..." : "Criar"}
                        </button>
                    </div>
                </Card.Body>
            </Card>

            {/* ── Lista de tipos ── */}
            <div className="tg-lista-wrap">
                {carregando ? (
                    <div className="tg-loading">
                        <LuLoader size={18} className="tg-spin"/>
                        <span>Carregando...</span>
                    </div>
                ) : tipos.length === 0 ? (
                    <Card>
                        <Card.Body>
                            <EmptyState
                                icon={LuTags}
                                title="Nenhum tipo de gasto cadastrado"
                                description="Crie o primeiro acima para começar a categorizar seus títulos."
                                variant="compact"
                            />
                        </Card.Body>
                    </Card>
                ) : (
                    <Card>
                        <Card.Body padded={false}>
                            <ul className="tg-lista">
                                {tipos.map((t, i) => (
                                    <li
                                        key={t.id}
                                        className={`tg-item ${i > 0 ? "tg-item--bordered" : ""}`}
                                    >
                                        <div className="tg-avatar">
                                            {t.nome.charAt(0).toUpperCase()}
                                        </div>

                                        {editId === t.id ? (
                                            // Modo edição inline
                                            <div className="tg-edit-row">
                                                <input
                                                    type="text"
                                                    className="tg-input"
                                                    value={editNome}
                                                    onChange={e => setEditNome(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" && editNome.trim()) {
                                                            e.preventDefault();
                                                            salvarEdicao(t.id);
                                                        }
                                                        if (e.key === "Escape") {
                                                            cancelarEdicao();
                                                        }
                                                    }}
                                                    maxLength={100}
                                                    autoFocus
                                                    disabled={salvando}
                                                />
                                                <button
                                                    className="tg-icon-btn tg-icon-btn--success"
                                                    onClick={() => salvarEdicao(t.id)}
                                                    disabled={salvando || !editNome.trim()}
                                                    title="Salvar (Enter)"
                                                >
                                                    <LuCheck size={14}/>
                                                </button>
                                                <button
                                                    className="tg-icon-btn"
                                                    onClick={cancelarEdicao}
                                                    disabled={salvando}
                                                    title="Cancelar (Esc)"
                                                >
                                                    <LuX size={14}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="tg-nome">{t.nome}</span>
                                                <div className="tg-actions">
                                                    <button
                                                        className="tg-icon-btn"
                                                        onClick={() => abrirEdicao(t)}
                                                        title="Editar"
                                                    >
                                                        <LuPencil size={14}/>
                                                    </button>
                                                    <button
                                                        className="tg-icon-btn tg-icon-btn--danger"
                                                        onClick={() => setConfirmExcluir(t)}
                                                        title="Excluir"
                                                    >
                                                        <LuTrash2 size={14}/>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                )}

                {tipos.length > 0 && !carregando && (
                    <p className="tg-contagem">
                        {tipos.length} {tipos.length === 1 ? "tipo" : "tipos"} cadastrado{tipos.length > 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* ═══ MODAL DE CONFIRMAÇÃO ═══ */}
            <Modal
                open={confirmExcluir !== null}
                onClose={() => setConfirmExcluir(null)}
                size="sm"
                title="Excluir tipo de gasto?"
                description={confirmExcluir && (
                    <>O tipo <strong>"{confirmExcluir.nome}"</strong> será excluído.
                        Os títulos que usam essa categoria ficarão sem tipo de gasto.</>
                )}
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setConfirmExcluir(null)}
                            disabled={excluindo}
                        >
                            Cancelar
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={executarExclusao}
                            disabled={excluindo}
                            style={{ background: "var(--error)", borderColor: "var(--error)" }}
                        >
                            {excluindo ? "Excluindo..." : "Sim, excluir"}
                        </button>
                    </>
                }
            />

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .tg-*
   ═════════════════════════════════════════════════════════════════════════════ */

const COMPONENT_CSS = `
.tg-container {
    max-width: 720px;
}

.tg-subtitulo {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
    letter-spacing: -0.005em;
}

.tg-erro {
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--warning-bg);
    border: 1px solid rgba(230, 162, 60, 0.25);
    color: var(--warning);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
}

/* ── Form de criação ─────────────────────────────────────────────────── */

.tg-form-label {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 10px;
}

.tg-form-row {
    display: flex;
    gap: 10px;
    align-items: stretch;
}

.tg-input {
    flex: 1;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1.5px solid var(--hair);
    background: var(--surface);
    color: var(--text);
    font-family: var(--ff-sans);
    font-size: 14px;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
}

.tg-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.tg-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}

/* ── Lista ────────────────────────────────────────────────────────────── */

.tg-lista-wrap {
    margin-top: 20px;
}

.tg-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 32px;
    color: var(--text-dim);
    font-size: 13px;
}

.tg-spin {
    animation: tg-spin 1s linear infinite;
}

@keyframes tg-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.tg-lista {
    list-style: none;
    margin: 0;
    padding: 0;
}

.tg-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    transition: background 0.12s;
}

.tg-item--bordered {
    border-top: 1px solid var(--hair);
}

.tg-item:hover {
    background: var(--bg);
}

/* Avatar circular cyan-soft */
.tg-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cyan-soft);
    color: var(--cyan-dark);
    font-family: var(--ff-mono);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
}

.tg-nome {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    line-height: 1.3;
}

.tg-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

/* Modo edição inline */
.tg-edit-row {
    flex: 1;
    display: flex;
    gap: 6px;
    align-items: stretch;
}

.tg-edit-row .tg-input {
    padding: 7px 10px;
    font-size: 13px;
}

/* ── Botões de ícone ─────────────────────────────────────────────────── */

.tg-icon-btn {
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

.tg-icon-btn:hover:not(:disabled) {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.tg-icon-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tg-icon-btn--success:hover:not(:disabled) {
    border-color: var(--success);
    background: var(--success-bg);
    color: var(--success);
}

.tg-icon-btn--danger:hover:not(:disabled) {
    border-color: var(--error);
    background: var(--error-bg);
    color: var(--error);
}

/* ── Contagem ────────────────────────────────────────────────────────── */

.tg-contagem {
    margin: 12px 0 0;
    text-align: center;
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* ── Responsivo ──────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .tg-form-row {
        flex-direction: column;
    }

    .tg-form-row .ph-btn {
        justify-content: center;
    }

    .tg-item {
        padding: 12px 16px;
        gap: 10px;
    }

    .tg-edit-row {
        flex-wrap: wrap;
    }

    .tg-edit-row .tg-input {
        flex-basis: 100%;
    }
}
`;
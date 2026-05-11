import { useState, useEffect, useCallback } from "react";
import {
    LuPlus, LuPencil, LuTrash2, LuCheck, LuX, LuTags, LuLoader,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader   from "../../components/shell/PageHeader.jsx";
import Card         from "../../components/ui/Card.jsx";
import Tabs         from "../../components/ui/Tabs.jsx";
import EmptyState   from "../../components/ui/EmptyState.jsx";
import Modal        from "../../components/ui/Modal.jsx";

/**
 * CategoriasPage — Cadastro de categorias unificadas (receitas e despesas)
 * Sprint F1.2
 *
 * Substitui TiposGastoPage.
 * Abas: Todas | Despesas | Receitas
 * Criação com seletor de tipo (DESPESA / RECEITA / AMBOS)
 *
 * Endpoints:
 *  - GET    /api/categorias?tipo=...
 *  - POST   /api/categorias
 *  - PUT    /api/categorias/{id}
 *  - DELETE /api/categorias/{id}
 */

const TIPOS = [
    { value: "DESPESA", label: "Despesa" },
    { value: "RECEITA", label: "Receita" },
    { value: "AMBOS",   label: "Ambos" },
];

const TIPO_INFO = {
    DESPESA: { label: "Despesa", cor: "var(--error)",   bg: "var(--error-bg)" },
    RECEITA: { label: "Receita", cor: "var(--success)",  bg: "var(--success-bg)" },
    AMBOS:   { label: "Ambos",   cor: "var(--cyan-dark)", bg: "var(--cyan-soft)" },
};

export default function CategoriasPage() {
    const [categorias,   setCategorias]   = useState([]);
    const [carregando,   setCarregando]   = useState(true);
    const [erro,         setErro]         = useState("");

    // Filtro por aba
    const [abaAtiva, setAbaAtiva] = useState("todas");

    // Criação
    const [novoNome,     setNovoNome]     = useState("");
    const [novoTipo,     setNovoTipo]     = useState("DESPESA");
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
            const params = abaAtiva !== "todas" ? `?tipo=${abaAtiva.toUpperCase()}` : "";
            const { data } = await api.get(`/api/categorias${params}`);
            setCategorias(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar categorias");
        } finally {
            setCarregando(false);
        }
    }, [abaAtiva]);

    useEffect(() => { carregar(); }, [carregar]);

    // ── Ações ──────────────────────────────────────────────────────────────

    async function criar() {
        if (!novoNome.trim()) return;

        setSalvando(true);
        setErro("");
        try {
            await api.post("/api/categorias", { nome: novoNome.trim(), tipo: novoTipo });
            setNovoNome("");
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar categoria");
        } finally {
            setSalvando(false);
        }
    }

    function abrirEdicao(cat) {
        setEditId(cat.id);
        setEditNome(cat.nome);
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
            await api.put(`/api/categorias/${id}`, { nome: editNome.trim() });
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
            await api.delete(`/api/categorias/${confirmExcluir.id}`);
            setConfirmExcluir(null);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao excluir");
            setConfirmExcluir(null);
        } finally {
            setExcluindo(false);
        }
    }

    function trocarAba(aba) {
        setAbaAtiva(aba);
        cancelarEdicao();
    }

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="tg-container">
            <PageHeader title="Categorias" />

            <p className="tg-subtitulo">
                Categorize suas receitas e despesas para facilitar análises e relatórios.
            </p>

            {erro && <div className="tg-erro">{erro}</div>}

            {/* ── Card de criação ── */}
            <Card>
                <Card.Body>
                    <div className="tg-form-label">Nova categoria</div>
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
                            placeholder="Ex: Aluguel, Consultoria, Impostos..."
                            maxLength={100}
                            disabled={salvando}
                        />
                        <select
                            className="tg-input tg-select-tipo"
                            value={novoTipo}
                            onChange={e => setNovoTipo(e.target.value)}
                            disabled={salvando}
                        >
                            {TIPOS.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
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

            {/* ── Abas de filtro ── */}
            <div className="tg-tabs-wrap">
                <Tabs
                    variant="pills"
                    value={abaAtiva}
                    onChange={trocarAba}
                    items={[
                        { key: "todas",   label: "Todas" },
                        { key: "despesa", label: "Despesas" },
                        { key: "receita", label: "Receitas" },
                    ]}
                />
            </div>

            {/* ── Lista de categorias ── */}
            <div className="tg-lista-wrap">
                {carregando ? (
                    <div className="tg-loading">
                        <LuLoader size={18} className="tg-spin"/>
                        <span>Carregando...</span>
                    </div>
                ) : categorias.length === 0 ? (
                    <Card>
                        <Card.Body>
                            <EmptyState
                                icon={LuTags}
                                title="Nenhuma categoria cadastrada"
                                description="Crie a primeira acima para começar a categorizar suas receitas e despesas."
                                variant="compact"
                            />
                        </Card.Body>
                    </Card>
                ) : (
                    <Card>
                        <Card.Body padded={false}>
                            <ul className="tg-lista">
                                {categorias.map((c, i) => {
                                    const info = TIPO_INFO[c.tipo] || TIPO_INFO.AMBOS;
                                    return (
                                        <li
                                            key={c.id}
                                            className={`tg-item ${i > 0 ? "tg-item--bordered" : ""}`}
                                        >
                                            <div className="tg-avatar">
                                                {c.nome.charAt(0).toUpperCase()}
                                            </div>

                                            {editId === c.id ? (
                                                <div className="tg-edit-row">
                                                    <input
                                                        type="text"
                                                        className="tg-input"
                                                        value={editNome}
                                                        onChange={e => setEditNome(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === "Enter" && editNome.trim()) {
                                                                e.preventDefault();
                                                                salvarEdicao(c.id);
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
                                                        onClick={() => salvarEdicao(c.id)}
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
                                                    <span className="tg-nome">{c.nome}</span>
                                                    <span
                                                        className="tg-tipo-badge"
                                                        style={{
                                                            color: info.cor,
                                                            background: info.bg,
                                                        }}
                                                    >
                                                        {info.label}
                                                    </span>
                                                    <div className="tg-actions">
                                                        <button
                                                            className="tg-icon-btn"
                                                            onClick={() => abrirEdicao(c)}
                                                            title="Editar"
                                                        >
                                                            <LuPencil size={14}/>
                                                        </button>
                                                        <button
                                                            className="tg-icon-btn tg-icon-btn--danger"
                                                            onClick={() => setConfirmExcluir(c)}
                                                            title="Excluir"
                                                        >
                                                            <LuTrash2 size={14}/>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </Card.Body>
                    </Card>
                )}

                {categorias.length > 0 && !carregando && (
                    <p className="tg-contagem">
                        {categorias.length} {categorias.length === 1 ? "categoria" : "categorias"}
                    </p>
                )}
            </div>

            {/* ═══ MODAL DE CONFIRMAÇÃO ═══ */}
            <Modal
                open={confirmExcluir !== null}
                onClose={() => setConfirmExcluir(null)}
                size="sm"
                title="Excluir categoria?"
                description={confirmExcluir && (
                    <>A categoria <strong>"{confirmExcluir.nome}"</strong> será excluída.
                        Títulos e recebimentos que usam essa categoria ficarão sem categorização.</>
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

.tg-select-tipo {
    flex: 0 0 130px;
}

/* ── Abas ────────────────────────────────────────────────────────────── */

.tg-tabs-wrap {
    margin: 20px 0 4px;
}

/* ── Lista ────────────────────────────────────────────────────────────── */

.tg-lista-wrap {
    margin-top: 8px;
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
}

.tg-nome {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
    line-height: 1.3;
}

.tg-tipo-badge {
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.tg-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

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

    .tg-select-tipo {
        flex: auto;
    }

    .tg-form-row .ph-btn {
        justify-content: center;
    }

    .tg-item {
        padding: 12px 16px;
        gap: 10px;
        flex-wrap: wrap;
    }

    .tg-edit-row {
        flex-wrap: wrap;
    }

    .tg-edit-row .tg-input {
        flex-basis: 100%;
    }
}
`;
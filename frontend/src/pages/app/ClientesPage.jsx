import { useState, useEffect, useCallback, memo } from "react";
import api from "../../services/api.js";
import {
    LuUsers, LuSearch, LuPlus, LuPencil, LuTrash2, LuPhone, LuMail,
    LuX, LuChevronDown, LuChevronUp, LuLoader,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const TIPOS_PESSOA = [
    { value: "PF", label: "Pessoa Física" },
    { value: "PJ", label: "Pessoa Jurídica" },
];

const SCORE_INFO = {
    BOM:           { label: "Bom pagador",  cor: "#10B981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)" },
    ATENCAO:       { label: "Atenção",       cor: "#D4A017", bg: "rgba(212,160,23,0.12)",  border: "rgba(212,160,23,0.30)" },
    INADIMPLENTE:  { label: "Inadimplente", cor: "#DC2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.20)" },
};

const CLIENTE_VAZIO = {
    nome: "",
    documento: "",
    tipoPessoa: "PF",
    email: "",
    telefone: "",
    categoria: "",
    notas: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function mascaraTelefone(valor) {
    const nums = (valor || "").replace(/\D/g, "").slice(0, 11);
    if (nums.length === 0) return "";
    if (nums.length <= 2)  return `(${nums}`;
    if (nums.length <= 6)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
}

function mascaraDocumento(valor, tipoPessoa) {
    const nums = (valor || "").replace(/\D/g, "").slice(0, tipoPessoa === "PJ" ? 14 : 11);
    if (tipoPessoa === "PJ") {
        return nums.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) => {
            let r = a;
            if (b) r += "." + b;
            if (c) r += "." + c;
            if (d) r += "/" + d;
            if (e) r += "-" + e;
            return r;
        });
    }
    return nums.replace(/(\d{3})?(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) => {
        let r = a || "";
        if (b) r += "." + b;
        if (c) r += "." + c;
        if (d) r += "-" + d;
        return r;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Badge de Score
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
    if (!score || !SCORE_INFO[score]) return null;
    const info = SCORE_INFO[score];
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: info.bg, border: `1px solid ${info.border}`, color: info.cor,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: info.cor }}/>
            {info.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Modal de cadastro/edição
// ─────────────────────────────────────────────────────────────────────────────
const ClienteModal = memo(function ClienteModal({ cliente, onSalvar, onFechar, salvando }) {
    const [form, setForm]            = useState(cliente || CLIENTE_VAZIO);
    const [maisDetalhes, setMais]    = useState(false);
    const [erro, setErro]            = useState("");

    function atualizar(campo, valor) {
        setForm(p => ({ ...p, [campo]: valor }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (!form.nome.trim()) { setErro("Nome é obrigatório"); return; }
        try {
            // Normaliza antes de enviar (backend também normaliza, mas envia limpo)
            const payload = {
                ...form,
                documento: form.documento ? form.documento.replace(/\D/g, "") : null,
                telefone:  form.telefone  ? form.telefone.replace(/\D/g, "")  : null,
            };
            await onSalvar(payload);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar cliente");
        }
    }

    return (
        <div style={overlayStyle} onClick={onFechar}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
                        {cliente ? "Editar cliente" : "Novo cliente"}
                    </h2>
                    <button onClick={onFechar} style={closeBtn} aria-label="Fechar">
                        <LuX size={20}/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
                    {/* Campos essenciais */}
                    <div className="field-group">
                        <label>Nome *</label>
                        <input
                            type="text"
                            value={form.nome}
                            onChange={e => atualizar("nome", e.target.value)}
                            placeholder="Nome do cliente"
                            required disabled={salvando}
                            autoFocus
                        />
                    </div>

                    <div className="field-group">
                        <label>
                            Telefone (WhatsApp){" "}
                            <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 11 }}>
                                — recomendado pra cobrança
                            </span>
                        </label>
                        <input
                            type="tel"
                            value={mascaraTelefone(form.telefone)}
                            onChange={e => atualizar("telefone", e.target.value)}
                            placeholder="(11) 98765-4321"
                            disabled={salvando} maxLength={16}
                        />
                    </div>

                    <div className="field-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => atualizar("email", e.target.value)}
                            placeholder="cliente@email.com"
                            disabled={salvando}
                        />
                    </div>

                    {/* Toggle "+ Detalhes" — revelação progressiva */}
                    <button
                        type="button"
                        onClick={() => setMais(m => !m)}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "var(--cyan-dark)", fontSize: 13, fontWeight: 600,
                            padding: "8px 0", display: "flex", alignItems: "center", gap: 4,
                            margin: "8px 0 16px",
                        }}
                    >
                        {maisDetalhes ? <LuChevronUp size={14}/> : <LuChevronDown size={14}/>}
                        {maisDetalhes ? "Esconder detalhes" : "+ Adicionar mais detalhes"}
                    </button>

                    {/* Campos avançados (escondidos por padrão) */}
                    {maisDetalhes && (
                        <div style={{
                            padding: "16px", borderRadius: 8, marginBottom: 16,
                            background: "rgba(21,195,221,0.03)",
                            border: "1px solid rgba(21,195,221,0.10)",
                        }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                                <div className="field-group" style={{ margin: 0 }}>
                                    <label>Tipo</label>
                                    <select
                                        value={form.tipoPessoa}
                                        onChange={e => atualizar("tipoPessoa", e.target.value)}
                                        disabled={salvando}
                                    >
                                        {TIPOS_PESSOA.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field-group" style={{ margin: 0 }}>
                                    <label>{form.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}</label>
                                    <input
                                        type="text"
                                        value={mascaraDocumento(form.documento, form.tipoPessoa)}
                                        onChange={e => atualizar("documento", e.target.value)}
                                        placeholder={form.tipoPessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                                        disabled={salvando}
                                        maxLength={form.tipoPessoa === "PJ" ? 18 : 14}
                                    />
                                </div>
                            </div>

                            <div className="field-group" style={{ marginTop: 12 }}>
                                <label>Categoria</label>
                                <input
                                    type="text"
                                    value={form.categoria}
                                    onChange={e => atualizar("categoria", e.target.value)}
                                    placeholder="ex: consultoria, recorrente, varejo"
                                    disabled={salvando} maxLength={50}
                                />
                            </div>

                            <div className="field-group" style={{ marginBottom: 0 }}>
                                <label>Notas internas</label>
                                <textarea
                                    value={form.notas}
                                    onChange={e => atualizar("notas", e.target.value)}
                                    placeholder="Observações sobre o cliente..."
                                    disabled={salvando}
                                    rows={3}
                                    style={{ resize: "vertical", fontFamily: "inherit" }}
                                />
                            </div>
                        </div>
                    )}

                    {erro && (
                        <div style={erroBoxStyle}>{erro}</div>
                    )}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                        <button type="button" onClick={onFechar} className="btn-secondary" disabled={salvando}>
                            Cancelar
                        </button>
                        <button type="submit" className="auth-box-btn" disabled={salvando || !form.nome.trim()}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            {salvando ? "Salvando..." : (cliente ? "Salvar alterações" : "Criar cliente")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Modal de detalhes (com estatísticas)
// ─────────────────────────────────────────────────────────────────────────────
function DetalhesModal({ cliente, onFechar, onEditar }) {
    const stats = cliente.estatisticas;
    return (
        <div style={overlayStyle} onClick={onFechar}>
            <div style={{ ...modalStyle, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{cliente.nome}</h2>
                        {stats && (
                            <div style={{ marginTop: 6 }}>
                                <ScoreBadge score={stats.score}/>
                            </div>
                        )}
                    </div>
                    <button onClick={onFechar} style={closeBtn}><LuX size={20}/></button>
                </div>

                <div style={{ padding: "20px 24px" }}>
                    {/* Contato */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={subtitulo}>Contato</div>
                        {cliente.telefoneFormatado && (
                            <div style={infoRow}><LuPhone size={14}/> {cliente.telefoneFormatado}</div>
                        )}
                        {cliente.email && (
                            <div style={infoRow}><LuMail size={14}/> {cliente.email}</div>
                        )}
                        {!cliente.telefoneFormatado && !cliente.email && (
                            <div style={{ ...infoRow, color: "var(--text-dim)" }}>
                                Sem dados de contato cadastrados
                            </div>
                        )}
                    </div>

                    {/* Estatísticas */}
                    {stats && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={subtitulo}>Histórico</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                                <StatBox label="Total de recebimentos" valor={stats.totalRecebimentos}/>
                                <StatBox label="Pagos" valor={stats.recebimentosPagos} cor="#10B981"/>
                                <StatBox label="Atrasados" valor={stats.recebimentosAtrasados} cor="#DC2626"/>
                                <StatBox label="Total recebido" valor={`R$ ${Number(stats.valorTotalRecebido).toLocaleString('pt-BR', {minimumFractionDigits:2})}`}/>
                            </div>
                            {Number(stats.valorTotalAtrasado) > 0 && (
                                <div style={{
                                    marginTop: 10, padding: "10px 12px", borderRadius: 8,
                                    background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
                                    fontSize: 13, color: "#DC2626", fontWeight: 600,
                                }}>
                                    💰 Valor em atraso: R$ {Number(stats.valorTotalAtrasado).toLocaleString('pt-BR', {minimumFractionDigits:2})}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Outros dados */}
                    {(cliente.documento || cliente.categoria || cliente.notas) && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={subtitulo}>Outros dados</div>
                            {cliente.documento && (
                                <div style={infoRow}>
                                    <strong>Documento:</strong> {mascaraDocumento(cliente.documento, cliente.tipoPessoa)}
                                </div>
                            )}
                            {cliente.categoria && (
                                <div style={infoRow}>
                                    <strong>Categoria:</strong> {cliente.categoria}
                                </div>
                            )}
                            {cliente.notas && (
                                <div style={{ ...infoRow, alignItems: "flex-start" }}>
                                    <strong style={{ flexShrink: 0 }}>Notas:</strong>
                                    <span style={{ whiteSpace: "pre-wrap" }}>{cliente.notas}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button className="btn-secondary" onClick={onFechar}>Fechar</button>
                        <button
                            className="auth-box-btn"
                            onClick={onEditar}
                            style={{ width: "auto", padding: "10px 20px" }}
                        >
                            <LuPencil size={14} style={{ marginRight: 6 }}/>
                            Editar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, valor, cor }) {
    return (
        <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: "var(--surface)", border: "1px solid var(--border)",
        }}>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: cor || "var(--text)" }}>{valor}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientesPage() {
    const [clientes,    setClientes]    = useState([]);
    const [carregando,  setCarregando]  = useState(true);
    const [busca,       setBusca]       = useState("");
    const [paginaAtual, setPaginaAtual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [erro,        setErro]        = useState("");

    const [modalAberto,   setModalAberto]   = useState(false);
    const [editando,      setEditando]      = useState(null);
    const [salvando,      setSalvando]      = useState(false);
    const [detalhesAberto,setDetalhesAberto]= useState(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            // Se tem busca, usa endpoint de busca; senão, listagem paginada
            if (busca.trim()) {
                const { data } = await api.get(`/api/clientes/buscar?termo=${encodeURIComponent(busca.trim())}`);
                setClientes(data);
                setTotalPaginas(1);
            } else {
                const { data } = await api.get(`/api/clientes?pagina=${paginaAtual}&tamanho=20`);
                setClientes(data.content);
                setTotalPaginas(data.totalPages);
            }
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar clientes");
        } finally {
            setCarregando(false);
        }
    }, [busca, paginaAtual]);

    // Debounce: aguarda 300ms depois de digitar pra fazer a busca
    useEffect(() => {
        const t = setTimeout(carregar, busca.trim() ? 300 : 0);
        return () => clearTimeout(t);
    }, [carregar]);

    async function abrirDetalhes(id) {
        try {
            const { data } = await api.get(`/api/clientes/${id}`);
            setDetalhesAberto(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar detalhes");
        }
    }

    function abrirNovo() {
        setEditando(null);
        setModalAberto(true);
    }

    function abrirEdicao(cliente) {
        setEditando(cliente);
        setDetalhesAberto(null);
        setModalAberto(true);
    }

    async function salvarCliente(payload) {
        setSalvando(true);
        try {
            if (editando) {
                await api.put(`/api/clientes/${editando.id}`, payload);
            } else {
                await api.post("/api/clientes", payload);
            }
            setModalAberto(false);
            setEditando(null);
            await carregar();
        } finally {
            setSalvando(false);
        }
    }

    async function inativar(cliente) {
        if (!window.confirm(`Inativar "${cliente.nome}"? Os recebimentos dele continuam visíveis.`)) return;
        try {
            await api.delete(`/api/clientes/${cliente.id}`);
            await carregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao inativar");
        }
    }

    return (
        <div style={containerStyle}>
            {/* Cabeçalho */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}>
                        <LuUsers size={26}/> Clientes
                    </h1>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
                        Cadastre seus clientes para criar recebimentos e enviar cobranças via WhatsApp.
                    </p>
                </div>
                <button className="auth-box-btn" onClick={abrirNovo}
                        style={{ width: "auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 6 }}>
                    <LuPlus size={16}/> Novo cliente
                </button>
            </div>

            {/* Barra de busca */}
            <div style={{ position: "relative", marginBottom: 16 }}>
                <LuSearch size={16} style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    color: "var(--text-dim)",
                }}/>
                <input
                    type="text"
                    value={busca}
                    onChange={e => { setBusca(e.target.value); setPaginaAtual(0); }}
                    placeholder="Buscar por nome..."
                    style={{
                        width: "100%", padding: "10px 12px 10px 38px",
                        border: "1px solid var(--border)", borderRadius: 8,
                        fontSize: 14, background: "var(--surface)",
                    }}
                />
            </div>

            {erro && (
                <div style={erroBoxStyle}>{erro}</div>
            )}

            {/* Lista */}
            {carregando ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>
                    <LuLoader size={20} style={{ animation: "spin 1s linear infinite" }}/>
                    <div style={{ marginTop: 8 }}>Carregando clientes...</div>
                </div>
            ) : clientes.length === 0 ? (
                <div style={{
                    padding: 40, textAlign: "center", borderRadius: 12,
                    background: "var(--surface)", border: "1px dashed var(--border)",
                }}>
                    <LuUsers size={32} style={{ color: "var(--text-dim)", margin: "0 auto 12px", display: "block" }}/>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        {busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                        {busca
                            ? "Tente buscar por outro termo."
                            : "Cadastre seu primeiro cliente para começar a registrar recebimentos."}
                    </div>
                    {!busca && (
                        <button className="auth-box-btn" onClick={abrirNovo}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            <LuPlus size={14} style={{ marginRight: 6 }}/>
                            Cadastrar primeiro cliente
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {clientes.map(c => (
                            <div
                                key={c.id}
                                onClick={() => abrirDetalhes(c.id)}
                                style={cardStyle}
                                className="cliente-card"
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                                        {c.nome}
                                    </div>
                                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
                                        {c.telefoneFormatado && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                <LuPhone size={12}/> {c.telefoneFormatado}
                                            </span>
                                        )}
                                        {c.email && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                <LuMail size={12}/> {c.email}
                                            </span>
                                        )}
                                        {c.categoria && (
                                            <span style={{
                                                padding: "1px 8px", borderRadius: 999,
                                                background: "rgba(21,195,221,0.06)",
                                                color: "var(--cyan-dark)", fontWeight: 600,
                                            }}>{c.categoria}</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <button
                                        onClick={e => { e.stopPropagation(); abrirEdicao(c); }}
                                        style={iconBtn}
                                        title="Editar"
                                    >
                                        <LuPencil size={14}/>
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); inativar(c); }}
                                        style={{ ...iconBtn, color: "#DC2626" }}
                                        title="Inativar"
                                    >
                                        <LuTrash2 size={14}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginação */}
                    {totalPaginas > 1 && !busca && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                            <button
                                onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                                disabled={paginaAtual === 0}
                                className="btn-secondary"
                            >
                                ← Anterior
                            </button>
                            <span style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-muted)" }}>
                                Página {paginaAtual + 1} de {totalPaginas}
                            </span>
                            <button
                                onClick={() => setPaginaAtual(p => p + 1)}
                                disabled={paginaAtual >= totalPaginas - 1}
                                className="btn-secondary"
                            >
                                Próxima →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modais */}
            {modalAberto && (
                <ClienteModal
                    cliente={editando}
                    onSalvar={salvarCliente}
                    onFechar={() => { setModalAberto(false); setEditando(null); }}
                    salvando={salvando}
                />
            )}
            {detalhesAberto && (
                <DetalhesModal
                    cliente={detalhesAberto}
                    onFechar={() => setDetalhesAberto(null)}
                    onEditar={() => abrirEdicao(detalhesAberto)}
                />
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
                .cliente-card:hover {
                    border-color: var(--cyan-deep) !important;
                    background: rgba(21,195,221,0.03) !important;
                }
                .btn-secondary {
                    padding: 8px 16px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background: var(--surface);
                    color: var(--text);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .btn-secondary:hover:not(:disabled) {
                    border-color: var(--cyan-deep);
                    color: var(--cyan-dark);
                }
                .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos inline reutilizados
// ─────────────────────────────────────────────────────────────────────────────
const containerStyle = {
    maxWidth: 960, margin: "0 auto", padding: "32px 24px",
};

const overlayStyle = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16, zIndex: 1000,
};

const modalStyle = {
    width: "100%", maxWidth: 480,
    background: "var(--bg)", borderRadius: 12,
    border: "1px solid var(--border)",
    maxHeight: "90vh", overflowY: "auto",
};

const modalHeader = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px", borderBottom: "1px solid var(--border)",
};

const closeBtn = {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text-dim)", padding: 4, lineHeight: 0,
};

const cardStyle = {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 16px", borderRadius: 10,
    background: "var(--surface)", border: "1px solid var(--border)",
    cursor: "pointer", transition: "all 0.15s",
};

const iconBtn = {
    width: 32, height: 32, display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "transparent", border: "1px solid var(--border)",
    borderRadius: 6, cursor: "pointer", color: "var(--text-muted)",
    transition: "all 0.15s",
};

const subtitulo = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
    textTransform: "uppercase", color: "var(--cyan-dark)",
    marginBottom: 8,
};

const infoRow = {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 14, color: "var(--text)", marginBottom: 6,
};

const erroBoxStyle = {
    padding: "10px 14px", borderRadius: 8, marginBottom: 12,
    background: "rgba(220,38,38,0.05)",
    border: "1px solid rgba(220,38,38,0.15)",
    color: "#DC2626", fontSize: 13,
};
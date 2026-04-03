import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

const EMPRESA_ID = "00000000-0000-0000-0000-000000000001";
const IS_DEV = import.meta.env.VITE_APP_ENV === "dev" || import.meta.env.DEV;

const PERFIS = [
    { value: "OPERADOR",     label: "Operador" },
    { value: "VISUALIZADOR", label: "Visualizador" },
    { value: "ADMIN",        label: "Admin" },
];

export default function AdminUsuariosPage() {
    const [usuarios,   setUsuarios]   = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro,       setErro]       = useState("");

    // Filtros
    const [filtroAtivo,  setFiltroAtivo]  = useState("todos");
    const [filtroPerfil, setFiltroPerfil] = useState("");
    const [filtroBusca,  setFiltroBusca]  = useState("");

    // Formulario de criacao
    const [form, setForm]       = useState({ nome: "", email: "", senha: "", perfil: "OPERADOR" });
    const [criando,  setCriando]  = useState(false);
    const [formErro, setFormErro] = useState("");
    const [formMsg,  setFormMsg]  = useState("");

    // Modal senha
    const [modalSenha, setModalSenha] = useState(null);
    const [novaSenha,  setNovaSenha]  = useState("");
    const [senhaMsg,   setSenhaMsg]   = useState("");

    const carregarUsuarios = useCallback(async () => {
        try {
            setCarregando(true);
            const params = new URLSearchParams();
            if (filtroAtivo !== "todos") params.append("ativo", filtroAtivo === "ativos");
            if (filtroPerfil) params.append("perfil", filtroPerfil);
            if (filtroBusca)  params.append("busca", filtroBusca);

            const { data } = await api.get(`/api/admin/usuarios?${params}`);
            setUsuarios(data);
        } catch {
            setErro("Erro ao carregar usuários");
        } finally {
            setCarregando(false);
        }
    }, [filtroAtivo, filtroPerfil, filtroBusca]);

    useEffect(() => { carregarUsuarios(); }, [carregarUsuarios]);

    async function handleCriar(e) {
        e.preventDefault();
        setFormErro(""); setFormMsg("");
        setCriando(true);
        try {
            await api.post("/api/admin/usuarios", { ...form, empresaId: EMPRESA_ID });
            setFormMsg(`Usuario ${form.email} criado com sucesso`);
            setForm({ nome: "", email: "", senha: "", perfil: "OPERADOR" });
            carregarUsuarios();
        } catch (err) {
            setFormErro(err.response?.data?.mensagem ?? "Erro ao criar usuário");
        } finally {
            setCriando(false);
        }
    }

    async function toggleStatus(usuario) {
        try {
            await api.patch(`/api/admin/usuarios/${usuario.id}/status`, { ativo: !usuario.ativo });
            carregarUsuarios();
        } catch (err) {
            alert(err.response?.data?.mensagem ?? "Erro ao alterar status");
        }
    }

    async function handleExcluir(usuario) {
        if (!window.confirm(`Excluir permanentemente ${usuario.nome} (${usuario.email})?\n\nEsta acao nao pode ser desfeita.`)) return;
        try {
            await api.delete(`/api/admin/usuarios/${usuario.id}`);
            carregarUsuarios();
        } catch (err) {
            alert(err.response?.data?.mensagem ?? "Erro ao excluir usuario");
        }
    }

    async function handleRedefinirSenha(e) {
        e.preventDefault();
        setSenhaMsg("");
        try {
            await api.patch(`/api/admin/usuarios/${modalSenha.id}/senha`, { novaSenha });
            setSenhaMsg("Senha redefinida com sucesso");
            setNovaSenha("");
        } catch (err) {
            setSenhaMsg(err.response?.data?.mensagem ?? "Erro ao redefinir senha");
        }
    }

    function fmtData(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1 className="admin-title">Gestao de Usuarios</h1>
                <p className="admin-subtitle">Crie e gerencie os acessos ao sistema</p>
            </div>

            {/* Formulario de criacao */}
            <div className="admin-card">
                <h2 className="admin-card-title">Novo usuario</h2>
                <form onSubmit={handleCriar} className="admin-form">
                    <div className="admin-form-row">
                        <div className="field-group">
                            <label>Nome</label>
                            <input type="text" placeholder="Nome completo"
                                   value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                   required disabled={criando} />
                        </div>
                        <div className="field-group">
                            <label>Email</label>
                            <input type="email" placeholder="email@empresa.com"
                                   value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                   required disabled={criando} />
                        </div>
                    </div>
                    <div className="admin-form-row">
                        <div className="field-group">
                            <label>Senha inicial</label>
                            <input type="text" placeholder="Mínimo 8 caracteres"
                                   value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })}
                                   required minLength={8} disabled={criando} />
                        </div>
                        <div className="field-group">
                            <label>Perfil</label>
                            <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })} disabled={criando}>
                                {PERFIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>
                    {formErro && <div className="admin-msg admin-msg--erro">{formErro}</div>}
                    {formMsg  && <div className="admin-msg admin-msg--ok">{formMsg}</div>}
                    <button type="submit" className="btn-primary" disabled={criando}>
                        {criando ? "Criando..." : "Criar usuario"}
                    </button>
                </form>
            </div>

            {/* Filtros */}
            <div className="admin-card">
                <div className="admin-filtros">
                    <div className="field-group" style={{ flex: 2 }}>
                        <label>Buscar</label>
                        <input type="text" placeholder="Nome ou email..."
                               value={filtroBusca}
                               onChange={(e) => setFiltroBusca(e.target.value)} />
                    </div>
                    <div className="field-group">
                        <label>Status</label>
                        <select value={filtroAtivo} onChange={(e) => setFiltroAtivo(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="ativos">Ativos</option>
                            <option value="inativos">Inativos</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label>Perfil</label>
                        <select value={filtroPerfil} onChange={(e) => setFiltroPerfil(e.target.value)}>
                            <option value="">Todos</option>
                            {PERFIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div className="field-group" style={{ justifyContent: "flex-end" }}>
                        <label>&nbsp;</label>
                        <button className="btn-secondary" onClick={() => { setFiltroBusca(""); setFiltroAtivo("todos"); setFiltroPerfil(""); }}>
                            Limpar
                        </button>
                    </div>
                </div>

                <h2 className="admin-card-title" style={{ marginTop: 20 }}>
                    Usuarios cadastrados
                    <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-dim)", marginLeft: 8 }}>
            ({usuarios.length} encontrado{usuarios.length !== 1 ? "s" : ""})
          </span>
                </h2>

                {carregando && <p className="admin-loading">Carregando...</p>}
                {erro       && <p className="admin-msg admin-msg--erro">{erro}</p>}

                {!carregando && !erro && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Perfil</th>
                                <th>Email verificado</th>
                                <th>Criado em</th>
                                <th>Ultimo acesso</th>
                                <th>Status</th>
                                <th>Acoes</th>
                            </tr>
                            </thead>
                            <tbody>
                            {usuarios.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-dim)", padding: 24 }}>Nenhum usuario encontrado</td></tr>
                            )}
                            {usuarios.map((u) => (
                                <tr key={u.id} className={u.ativo ? "" : "admin-row--inativo"}>
                                    <td>{u.nome}</td>
                                    <td>{u.email}</td>
                                    <td>
                      <span className={`perfil-badge perfil-badge--${u.perfil.toLowerCase()}`}>
                        {u.perfil}
                      </span>
                                    </td>
                                    <td>
                      <span style={{ color: u.emailVerificado ? "var(--success)" : "var(--warning)", fontSize: 12, fontWeight: 600 }}>
                        {u.emailVerificado ? "Sim" : "Pendente"}
                      </span>
                                    </td>
                                    <td>{fmtData(u.criadoEm)}</td>
                                    <td>{fmtData(u.ultimoAcesso)}</td>
                                    <td>
                      <span className={`status-badge ${u.ativo ? "status-badge--ativo" : "status-badge--inativo"}`}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                                    </td>
                                    <td className="admin-acoes">
                                        <button className={`btn-acao ${u.ativo ? "btn-acao--desativar" : "btn-acao--ativar"}`} onClick={() => toggleStatus(u)}>
                                            {u.ativo ? "Desativar" : "Ativar"}
                                        </button>
                                        <button className="btn-acao btn-acao--senha" onClick={() => { setModalSenha(u); setSenhaMsg(""); setNovaSenha(""); }}>
                                            Senha
                                        </button>
                                        {IS_DEV && (
                                            <button className="btn-acao btn-acao--excluir" onClick={() => handleExcluir(u)}>
                                                Excluir
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal senha */}
            {modalSenha && (
                <div className="modal-overlay" onClick={() => setModalSenha(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Redefinir senha</h3>
                        <p className="modal-subtitle">{modalSenha.nome} — {modalSenha.email}</p>
                        <form onSubmit={handleRedefinirSenha}>
                            <div className="field-group">
                                <label>Nova senha</label>
                                <input type="text" placeholder="Mínimo 8 caracteres"
                                       value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)}
                                       required minLength={8} />
                            </div>
                            {senhaMsg && (
                                <div className={`admin-msg ${senhaMsg.includes("sucesso") ? "admin-msg--ok" : "admin-msg--erro"}`}>
                                    {senhaMsg}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setModalSenha(null)}>Fechar</button>
                                <button type="submit" className="btn-primary">Salvar senha</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
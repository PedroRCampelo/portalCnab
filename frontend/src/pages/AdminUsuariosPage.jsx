import { useState, useEffect } from "react";
import api from "../services/api.js";

const EMPRESA_ID = "00000000-0000-0000-0000-000000000001";

const PERFIS = [
    { value: "OPERADOR",     label: "Operador" },
    { value: "VISUALIZADOR", label: "Visualizador" },
    { value: "ADMIN",        label: "Admin" },
];

export default function AdminUsuariosPage() {
    const [usuarios,    setUsuarios]    = useState([]);
    const [carregando,  setCarregando]  = useState(true);
    const [erro,        setErro]        = useState("");

    // Estado do formulário de criação
    const [form, setForm] = useState({
        nome: "", email: "", senha: "", perfil: "OPERADOR"
    });
    const [criando,   setCriando]   = useState(false);
    const [formErro,  setFormErro]  = useState("");
    const [formMsg,   setFormMsg]   = useState("");

    // Estado do modal de redefinição de senha
    const [modalSenha, setModalSenha] = useState(null); // { id, nome }
    const [novaSenha,  setNovaSenha]  = useState("");
    const [senhaMsg,   setSenhaMsg]   = useState("");

    useEffect(() => { carregarUsuarios(); }, []);

    async function carregarUsuarios() {
        try {
            setCarregando(true);
            const { data } = await api.get("/api/admin/usuarios");
            setUsuarios(data);
        } catch {
            setErro("Erro ao carregar usuarios");
        } finally {
            setCarregando(false);
        }
    }

    async function handleCriar(e) {
        e.preventDefault();
        setFormErro(""); setFormMsg("");
        setCriando(true);
        try {
            await api.post("/api/admin/usuarios", {
                ...form,
                empresaId: EMPRESA_ID,
            });
            setFormMsg(`Usuario ${form.email} criado com sucesso`);
            setForm({ nome: "", email: "", senha: "", perfil: "OPERADOR" });
            carregarUsuarios();
        } catch (err) {
            setFormErro(err.response?.data?.mensagem ?? "Erro ao criar usuario");
        } finally {
            setCriando(false);
        }
    }

    async function toggleStatus(usuario) {
        try {
            await api.patch(`/api/admin/usuarios/${usuario.id}/status`, {
                ativo: !usuario.ativo
            });
            carregarUsuarios();
        } catch (err) {
            alert(err.response?.data?.mensagem ?? "Erro ao alterar status");
        }
    }

    async function handleRedefinirSenha(e) {
        e.preventDefault();
        setSenhaMsg("");
        try {
            await api.patch(`/api/admin/usuarios/${modalSenha.id}/senha`, {
                novaSenha
            });
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
                <h1 className="admin-title">Gestão de Usuários</h1>
                <p className="admin-subtitle">Crie e gerencie os acessos ao sistema</p>
            </div>

            {/* Formulário de criação */}
            <div className="admin-card">
                <h2 className="admin-card-title">Novo usuário</h2>
                <form onSubmit={handleCriar} className="admin-form">
                    <div className="admin-form-row">
                        <div className="field-group">
                            <label>Nome</label>
                            <input
                                type="text" placeholder="Nome completo"
                                value={form.nome}
                                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                required disabled={criando}
                            />
                        </div>
                        <div className="field-group">
                            <label>Email</label>
                            <input
                                type="email" placeholder="email@empresa.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required disabled={criando}
                            />
                        </div>
                    </div>
                    <div className="admin-form-row">
                        <div className="field-group">
                            <label>Senha inicial</label>
                            <input
                                type="text" placeholder="Minimo 8 caracteres"
                                value={form.senha}
                                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                                required minLength={8} disabled={criando}
                            />
                        </div>
                        <div className="field-group">
                            <label>Perfil</label>
                            <select
                                value={form.perfil}
                                onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                                disabled={criando}
                            >
                                {PERFIS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {formErro && <div className="admin-msg admin-msg--erro">{formErro}</div>}
                    {formMsg  && <div className="admin-msg admin-msg--ok">{formMsg}</div>}

                    <button type="submit" className="btn-primary" disabled={criando}>
                        {criando ? "Criando..." : "Criar usuário"}
                    </button>
                </form>
            </div>

            {/* Lista de usuários */}
            <div className="admin-card">
                <h2 className="admin-card-title">Usuários cadastrados</h2>

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
                                <th>Criado em</th>
                                <th>Ultimo acesso</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {usuarios.map((u) => (
                                <tr key={u.id} className={u.ativo ? "" : "admin-row--inativo"}>
                                    <td>{u.nome}</td>
                                    <td>{u.email}</td>
                                    <td>
                      <span className={`perfil-badge perfil-badge--${u.perfil.toLowerCase()}`}>
                        {u.perfil}
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
                                        <button
                                            className={`btn-acao ${u.ativo ? "btn-acao--desativar" : "btn-acao--ativar"}`}
                                            onClick={() => toggleStatus(u)}
                                        >
                                            {u.ativo ? "Desativar" : "Ativar"}
                                        </button>
                                        <button
                                            className="btn-acao btn-acao--senha"
                                            onClick={() => { setModalSenha(u); setSenhaMsg(""); setNovaSenha(""); }}
                                        >
                                            Senha
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal redefinir senha */}
            {modalSenha && (
                <div className="modal-overlay" onClick={() => setModalSenha(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Redefinir senha</h3>
                        <p className="modal-subtitle">{modalSenha.nome} — {modalSenha.email}</p>
                        <form onSubmit={handleRedefinirSenha}>
                            <div className="field-group">
                                <label>Nova senha</label>
                                <input
                                    type="text" placeholder="Minimo 8 caracteres"
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    required minLength={8}
                                />
                            </div>
                            {senhaMsg && (
                                <div className={`admin-msg ${senhaMsg.includes("sucesso") ? "admin-msg--ok" : "admin-msg--erro"}`}>
                                    {senhaMsg}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary"
                                        onClick={() => setModalSenha(null)}>
                                    Fechar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Salvar senha
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
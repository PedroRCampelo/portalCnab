import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function CadastroPage() {
    const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmarSenha: "" });
    const [erro,       setErro]       = useState("");
    const [sucesso,    setSucesso]    = useState(false);
    const [carregando, setCarregando] = useState(false);

    function atualizar(campo, valor) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (form.senha !== form.confirmarSenha) { setErro("As senhas nao coincidem"); return; }
        if (form.senha.length < 8) { setErro("A senha deve ter no minimo 8 caracteres"); return; }
        setCarregando(true);
        try {
            await api.post("/api/auth/cadastro", { nome: form.nome, email: form.email, senha: form.senha });
            setSucesso(true);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar conta. Tente novamente.");
        } finally {
            setCarregando(false);
        }
    }

    if (sucesso) {
        return (
            <div className="auth-wrap">
                <div className="auth-box" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
                    <h2 className="auth-box-title">Verifique seu email</h2>
                    <p className="auth-box-sub">
                        Enviamos um link de confirmacao para <strong>{form.email}</strong>.
                        Clique no link para ativar sua conta.
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 16 }}>
                        Nao recebeu?{" "}
                        <button onClick={async () => {
                            await api.post("/api/auth/reenviar-verificacao", { email: form.email });
                            alert("Email reenviado!");
                        }} className="auth-box-link" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0 }}>
                            Reenviar email
                        </button>
                    </p>
                    <Link to="/login" className="auth-box-btn" style={{ display: "block", marginTop: 24, textAlign: "center", textDecoration: "none" }}>
                        Ir para o login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-wrap">
            <div className="auth-box">
                <div className="auth-box-brand">
                    <span className="brand-wordmark">Whallet</span>
                </div>

                <div className="auth-box-plan">
                    <span className="auth-box-plan-label">Plano Gratuito</span>
                    <span className="auth-box-plan-price">R$ 0 <em>/mes</em></span>
                    <span className="auth-box-plan-desc">8 arquivos/mes · todos os bancos · sem cartao</span>
                </div>

                <h1 className="auth-box-title">Crie sua conta</h1>
                <p className="auth-box-sub">Comece gratuitamente, sem cartao de credito</p>

                <form onSubmit={handleSubmit} className="auth-box-form" noValidate>
                    <div className="field-group">
                        <label>Nome completo</label>
                        <input type="text" placeholder="Seu nome"
                               value={form.nome} onChange={(e) => atualizar("nome", e.target.value)}
                               required disabled={carregando}/>
                    </div>
                    <div className="field-group">
                        <label>Email</label>
                        <input type="email" placeholder="seu@email.com"
                               value={form.email} onChange={(e) => atualizar("email", e.target.value)}
                               autoComplete="email" required disabled={carregando}/>
                    </div>
                    <div className="field-group">
                        <label>Senha</label>
                        <input type="password" placeholder="Minimo 8 caracteres"
                               value={form.senha} onChange={(e) => atualizar("senha", e.target.value)}
                               autoComplete="new-password" required disabled={carregando}/>
                    </div>
                    <div className="field-group">
                        <label>Confirmar senha</label>
                        <input type="password" placeholder="Repita a senha"
                               value={form.confirmarSenha} onChange={(e) => atualizar("confirmarSenha", e.target.value)}
                               autoComplete="new-password" required disabled={carregando}/>
                    </div>

                    {erro && <div className="auth-box-erro">{erro}</div>}

                    <button type="submit" className="auth-box-btn"
                            disabled={carregando || !form.nome || !form.email || !form.senha || !form.confirmarSenha}>
                        {carregando ? "Criando conta..." : "Criar conta gratuita"}
                    </button>
                </form>

                <p className="auth-box-footer">
                    Ja tem conta?{" "}
                    <Link to="/login" className="auth-box-link">Fazer login</Link>
                </p>
            </div>
        </div>
    );
}
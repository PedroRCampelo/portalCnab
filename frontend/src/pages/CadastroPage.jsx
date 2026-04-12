import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

// Mascara: (11) 91234-5678 ou (11) 1234-5678
function aplicarMascaraTelefone(valor) {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length === 0) return "";
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 6) return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
}

export default function CadastroPage() {
    const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "", confirmarSenha: "" });
    const [erro,       setErro]       = useState("");
    const [sucesso,    setSucesso]    = useState(false);
    const [carregando, setCarregando] = useState(false);

    function atualizar(campo, valor) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    function handleTelefone(e) {
        atualizar("telefone", aplicarMascaraTelefone(e.target.value));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (form.senha !== form.confirmarSenha) { setErro("As senhas nao coincidem"); return; }
        if (form.senha.length < 8) { setErro("A senha deve ter no mínimo 8 caracteres"); return; }
        setCarregando(true);
        try {
            await api.post("/api/auth/cadastro", { nome: form.nome, email: form.email, senha: form.senha, telefone: form.telefone || null });
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
                        Enviamos um link de confirmação para <strong>{form.email}</strong>.
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
                    <span className="auth-box-plan-price">R$ 0 <em>/mês</em></span>
                    <span className="auth-box-plan-desc">8 arquivos/mês · todos os bancos · sem cartão</span>
                </div>

                <h1 className="auth-box-title">Crie sua conta</h1>
                <p className="auth-box-sub">Comece gratuitamente, sem cartão de crédito</p>

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
                        <label>Telefone <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 12 }}>(opcional)</span></label>
                        <input type="tel" placeholder="(11) 91234-5678"
                               value={form.telefone} onChange={handleTelefone}
                               autoComplete="tel" disabled={carregando} maxLength={16}/>
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
                    Já tem conta?{" "}
                    <Link to="/login" className="auth-box-link">Fazer login</Link>
                </p>
            </div>
        </div>
    );
}
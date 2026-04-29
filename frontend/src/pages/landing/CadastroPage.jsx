import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import GoogleLoginButton from "../../components/GoogleLoginButton.jsx";
import { LuEye, LuEyeOff, LuArrowLeft, LuMail, LuRotateCw } from "react-icons/lu";
import "./AuthPages.css";

/**
 * CadastroPage — split-screen premium
 * Sprint A2.3 · Refatoração de auth
 *
 * MUDANÇAS:
 *  - Removido seletor de planos (todos entram como Free, plano só dentro do app)
 *  - Layout split-screen consistente com LoginPage
 *  - Google em destaque
 *  - Tela de sucesso com mesma estética
 */

function aplicarMascaraTelefone(valor) {
    const nums = valor.replace(/\D/g, "").slice(0, 11);
    if (nums.length === 0) return "";
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 6) return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
}

function calcularForcaSenha(senha) {
    if (senha.length === 0) return { nivel: 0, label: "" };
    if (senha.length < 4)   return { nivel: 1, label: "Muito fraca" };
    if (senha.length < 6)   return { nivel: 2, label: "Fraca" };
    if (senha.length < 8)   return { nivel: 3, label: "Boa" };
    return { nivel: 4, label: "Forte" };
}

export default function CadastroPage() {
    const navigate  = useNavigate();
    const { login } = useAuth();

    const [form,       setForm]       = useState({ nome: "", email: "", telefone: "", senha: "", confirmarSenha: "" });
    const [erro,       setErro]       = useState("");
    const [carregando, setCarregando] = useState(false);
    const [ok,         setOk]         = useState("");
    const [showPass,   setShowPass]   = useState(false);

    const atualizar = (c, v) => setForm(p => ({ ...p, [c]: v }));
    const forca     = calcularForcaSenha(form.senha);

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (form.senha !== form.confirmarSenha) { setErro("As senhas não coincidem."); return; }
        if (form.senha.length < 8) { setErro("Mínimo 8 caracteres na senha."); return; }
        setCarregando(true);
        try {
            await api.post("/api/auth/cadastro", {
                nome: form.nome, email: form.email,
                senha: form.senha, telefone: form.telefone || null,
            });
            setOk(form.email);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao criar conta.");
            setCarregando(false);
        }
    }

    /**
     * Cadastro via Google: o backend já cria o usuário se não existir.
     * Diferente do email/senha, não passa pela tela de "verifique seu email"
     * porque o Google já verificou. Vai direto pro app.
     */
    async function handleGoogleSuccess(idToken) {
        setErro("");
        setCarregando(true);
        try {
            const { data } = await api.post("/api/auth/google", { idToken });
            login(data);
            navigate("/", { replace: true });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao cadastrar com Google.");
            setCarregando(false);
        }
    }

    /* ── Tela de sucesso pós-cadastro ───────────────────────────────────── */
    if (ok) {
        return (
            <div className="auth-shell">
                {/* ESQUERDA — mesmo storytelling */}
                <SidebarStorytelling navigate={navigate}/>

                {/* DIREITA — sucesso */}
                <main className="auth-main">
                    <button className="auth-main-brand-mobile" onClick={() => navigate("/")}>
                        whallet<span className="dot"/>
                    </button>

                    <div className="auth-success">
                        <div className="auth-success-icon">
                            <LuMail size={28}/>
                        </div>

                        <div className="auth-success-eyebrow">Quase lá</div>
                        <h1 className="auth-success-title">Verifique seu email</h1>
                        <p className="auth-success-desc">
                            Enviamos um link de ativação para
                        </p>
                        <div className="auth-success-email">{ok}</div>

                        <button
                            onClick={() => navigate("/login")}
                            className="auth-cta"
                            style={{ width: "100%" }}
                        >
                            Ir para o login →
                        </button>

                        <p className="auth-footer">
                            Não recebeu?{" "}
                            <button
                                className="auth-footer-link"
                                onClick={async () => {
                                    try {
                                        await api.post("/api/auth/reenviar-verificacao", { email: ok });
                                        alert("Email reenviado!");
                                    } catch {
                                        alert("Erro ao reenviar. Tente novamente em alguns minutos.");
                                    }
                                }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                                <LuRotateCw size={11}/> Reenviar
                            </button>
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    /* ── Layout principal ────────────────────────────────────────────── */
    return (
        <div className="auth-shell">

            {/* ESQUERDA — Storytelling */}
            <SidebarStorytelling navigate={navigate}/>

            {/* DIREITA — Formulário */}
            <main className="auth-main">

                <button className="auth-main-brand-mobile" onClick={() => navigate("/")}>
                    whallet<span className="dot"/>
                </button>

                <button className="auth-main-back" onClick={() => navigate("/")}>
                    <LuArrowLeft size={12}/>
                    <span className="label">Voltar</span>
                </button>

                <div className="auth-form-wrap">

                    <div className="auth-form-eyebrow">Comece grátis</div>
                    <h1 className="auth-form-title">Crie sua conta</h1>
                    <p className="auth-form-sub">
                        Em 30 segundos você está dentro. 7 dias grátis de Whallet+,
                        sem cartão.
                    </p>

                    {/* Google em destaque */}
                    <div className="auth-google-wrap">
                        <GoogleLoginButton
                            onSuccess={handleGoogleSuccess}
                            onError={(msg) => setErro(msg)}
                            disabled={carregando}
                            texto="signup_with"
                        />
                    </div>

                    {/* Divisor */}
                    <div className="auth-divisor">
                        <span>ou com email</span>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} noValidate className="auth-form">

                        <div className="auth-field">
                            <label className="auth-field-label">Nome completo</label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Seu nome"
                                value={form.nome}
                                onChange={e => atualizar("nome", e.target.value)}
                                required
                                disabled={carregando}
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-field-label">Email</label>
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="seu@email.com"
                                value={form.email}
                                onChange={e => atualizar("email", e.target.value)}
                                autoComplete="email"
                                required
                                disabled={carregando}
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-field-label">
                                Telefone
                                <span className="opt">opcional</span>
                            </label>
                            <input
                                type="tel"
                                className="auth-input"
                                placeholder="(11) 91234-5678"
                                value={form.telefone}
                                onChange={e => atualizar("telefone", aplicarMascaraTelefone(e.target.value))}
                                disabled={carregando}
                                maxLength={16}
                            />
                        </div>

                        <div className="auth-senha-grid">
                            <div className="auth-field">
                                <label className="auth-field-label">Senha</label>
                                <div className="auth-input-wrap">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        className="auth-input"
                                        placeholder="Mín. 8 caracteres"
                                        value={form.senha}
                                        onChange={e => atualizar("senha", e.target.value)}
                                        autoComplete="new-password"
                                        required
                                        disabled={carregando}
                                        style={{ paddingRight: 38 }}
                                    />
                                    <button
                                        type="button"
                                        className="auth-input-toggle"
                                        onClick={() => setShowPass(s => !s)}
                                        aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPass ? <LuEyeOff size={14}/> : <LuEye size={14}/>}
                                    </button>
                                </div>
                            </div>

                            <div className="auth-field">
                                <label className="auth-field-label">Confirmar</label>
                                <input
                                    type={showPass ? "text" : "password"}
                                    className="auth-input"
                                    placeholder="Repita"
                                    value={form.confirmarSenha}
                                    onChange={e => atualizar("confirmarSenha", e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    disabled={carregando}
                                />
                            </div>
                        </div>

                        {/* Força da senha */}
                        {form.senha.length > 0 && (
                            <div className="auth-senha-forca">
                                <div className="auth-senha-forca-bars">
                                    {[1, 2, 3, 4].map(n => (
                                        <div
                                            key={n}
                                            className={`auth-senha-forca-bar ${n <= forca.nivel ? `f${forca.nivel}` : ""}`}
                                        />
                                    ))}
                                </div>
                                <div className="auth-senha-forca-label">{forca.label}</div>
                            </div>
                        )}

                        {erro && <div className="auth-erro">{erro}</div>}

                        <button
                            type="submit"
                            className="auth-cta"
                            disabled={carregando || !form.nome || !form.email || !form.senha || !form.confirmarSenha}
                        >
                            {carregando ? "Criando conta..." : "Criar conta grátis →"}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Já tem conta?{" "}
                        <Link to="/login">Fazer login</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

/* ── Componente compartilhado: lateral storytelling ───────────────────────── */

function SidebarStorytelling({ navigate }) {
    return (
        <aside className="auth-side">
            <div className="auth-side-inner">

                <button className="auth-side-brand" onClick={() => navigate("/")}>
                    whallet<span className="dot"/>
                </button>

                <div className="auth-side-story">
                    <div className="auth-side-eyebrow">Comece grátis</div>
                    <h2 className="auth-side-quote">
                        O fim do Excel<br/>
                        pra controlar seu <em>dinheiro.</em>
                    </h2>
                    <ul className="auth-side-bullets">
                        <li>Veja o que entra e o que sai</li>
                        <li>Saldo atualizado em tempo real</li>
                        <li>Saiba antes que aperte</li>
                    </ul>
                </div>

                <div className="auth-side-footer">
                    <span>7 dias grátis · Sem cartão</span>
                    <span>2026</span>
                </div>
            </div>
        </aside>
    );
}
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import GoogleLoginButton from "../../components/GoogleLoginButton.jsx";
import { LuEye, LuEyeOff, LuArrowLeft } from "react-icons/lu";
import "./AuthPages.css";

/**
 * LoginPage — split-screen premium
 * Sprint A2.3 · Refatoração de auth
 *
 * Estrutura:
 *  Esquerda: storytelling navy (oculta em mobile)
 *  Direita: formulário com Google em destaque + email/senha
 */
export default function LoginPage() {
    const [email,      setEmail]      = useState("");
    const [senha,      setSenha]      = useState("");
    const [erro,       setErro]       = useState("");
    const [carregando, setCarregando] = useState(false);
    const [showPass,   setShowPass]   = useState(false);

    const { login }  = useAuth();
    const navigate   = useNavigate();
    const location   = useLocation();

    const planoAposLogin = location.state?.planoAposLogin ?? null;
    const destino        = location.state?.from?.pathname ?? "/";

    // ── Pós-login compartilhado entre email/senha e Google ─────────────────
    async function processarPosLogin(data) {
        login(data);
        if (planoAposLogin === "whallet-plus") {
            try {
                const { data: stripe } = await api.post("/api/stripe/checkout/whallet-plus");
                window.location.href = stripe.url;
                return;
            } catch {
                navigate("/planos", { replace: true });
                return;
            }
        }
        navigate(destino === "/login" ? "/" : destino, { replace: true });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);
        try {
            const { data } = await api.post("/api/auth/login", { email, senha });
            await processarPosLogin(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao conectar com o servidor");
        } finally {
            setCarregando(false);
        }
    }

    async function handleGoogleSuccess(idToken) {
        setErro("");
        setCarregando(true);
        try {
            const { data } = await api.post("/api/auth/google", { idToken });
            await processarPosLogin(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao entrar com Google");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="auth-shell">

            {/* ── ESQUERDA — Storytelling ──────────────────────────────── */}
            <aside className="auth-side">
                <div className="auth-side-inner">

                    {/* Brand */}
                    <button className="auth-side-brand" onClick={() => navigate("/")}>
                        whallet<span className="dot"/>
                    </button>

                    {/* Storytelling */}
                    <div className="auth-side-story">
                        <div className="auth-side-eyebrow">Bem-vindo de volta</div>
                        <h2 className="auth-side-quote">
                            Continue de onde<br/>
                            <em>parou.</em>
                        </h2>
                        <ul className="auth-side-bullets">
                            <li>Seus recebimentos e títulos te esperam</li>
                            <li>Saúde do mês atualizada em tempo real</li>
                            <li>Tudo no mesmo lugar, sem planilha</li>
                        </ul>
                    </div>

                    {/* Footer da coluna */}
                    <div className="auth-side-footer">
                        <span>O fim do Excel</span>
                        <span>2026</span>
                    </div>
                </div>
            </aside>

            {/* ── DIREITA — Formulário ─────────────────────────────────── */}
            <main className="auth-main">

                {/* Brand mobile (só aparece em telas pequenas) */}
                <button className="auth-main-brand-mobile" onClick={() => navigate("/")}>
                    whallet<span className="dot"/>
                </button>

                {/* Voltar ao site */}
                <button className="auth-main-back" onClick={() => navigate("/")}>
                    <LuArrowLeft size={12}/>
                    <span className="label">Voltar</span>
                </button>

                <div className="auth-form-wrap">

                    <div className="auth-form-eyebrow">Entrar</div>
                    <h1 className="auth-form-title">Acesse sua conta</h1>
                    <p className="auth-form-sub">
                        Bem-vindo de volta. Continue gerenciando seu dinheiro.
                    </p>

                    {/* Banner plano pós-login */}
                    {planoAposLogin && (
                        <div className="auth-banner-plano">
                            <strong>✨ Plano Whallet+</strong>
                            Após entrar, você será direcionado ao pagamento.
                        </div>
                    )}

                    {/* Google em destaque */}
                    <div className="auth-google-wrap">
                        <GoogleLoginButton
                            onSuccess={handleGoogleSuccess}
                            onError={(msg) => setErro(msg)}
                            disabled={carregando}
                            texto="continue_with"
                        />
                    </div>

                    {/* Divisor "ou" */}
                    <div className="auth-divisor">
                        <span>ou com email</span>
                    </div>

                    {/* Formulário email/senha */}
                    <form onSubmit={handleSubmit} className="auth-form" noValidate>

                        <div className="auth-field">
                            <label className="auth-field-label" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="auth-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                autoComplete="email"
                                required
                                disabled={carregando}
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-field-label" htmlFor="senha">
                                Senha
                                <Link
                                    to="/esqueci-senha"
                                    className="auth-field-label-link"
                                    style={{ textDecoration: "none" }}
                                >
                                    Esqueci
                                </Link>
                            </label>
                            <div className="auth-input-wrap">
                                <input
                                    id="senha"
                                    type={showPass ? "text" : "password"}
                                    className="auth-input"
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    disabled={carregando}
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    className="auth-input-toggle"
                                    onClick={() => setShowPass(s => !s)}
                                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPass ? <LuEyeOff size={16}/> : <LuEye size={16}/>}
                                </button>
                            </div>
                        </div>

                        {erro && <div className="auth-erro">{erro}</div>}

                        <button
                            type="submit"
                            className="auth-cta"
                            disabled={carregando || !email || !senha}
                        >
                            {carregando ? "Entrando..." : "Entrar →"}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="auth-footer">
                        Não tem conta?{" "}
                        <Link to="/cadastro">Crie agora, é grátis</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
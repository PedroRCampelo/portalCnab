import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdMenuBook } from "react-icons/md";
import {
    LuChevronDown, LuSheet, LuWalletCards, LuClipboardList,
    LuBellRing, LuShieldCheck, LuLogOut, LuMenu, LuX,
    LuGem, LuFileText, LuTrendingUp, LuSparkles, LuBot, LuUser,
    LuHandCoins, LuActivity, LuSettings,
} from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Navbar — App logado
 * Sprint A2.6 · Refatoração de branding
 *
 * Mudanças:
 *  - Wordmark "whallet." editorial (Geist 800 + dot cyan)
 *  - Mega-menu mantido com visual refinado (mono labels, cyan accents)
 *  - Plano Pro removido (V27)
 *  - Badge de trial visível enquanto ativo (graceful fallback se backend não suporta)
 *  - Duplicatas de Clientes/Recebimentos removidas
 */

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

/* ── Estrutura do mega-menu ────────────────────────────────────────────────
   Removidas as duplicatas de Clientes e Recebimentos. */

const MENU = [
    {
        label: "Ferramentas",
        items: [
            { to: "/valida-cnab", icon: <LuSheet size={16}/>, label: "Conversor CNAB", desc: "CNAB 240/400 para Excel e PDF" },
        ],
    },
    {
        label: "Gestão",
        items: [
            { to: "/fluxo-caixa",        icon: <LuActivity size={16}/>,    label: "Fluxo de Caixa",  desc: "Saúde do mês, contas e extrato" },
            { to: "/titulos",            icon: <LuWalletCards size={16}/>, label: "Títulos a pagar", desc: "Contas a pagar e baixas" },
            { to: "/recebimentos",       icon: <LuHandCoins size={16}/>,   label: "Recebimentos",    desc: "Contas a receber e cobranças" },
            { to: "/clientes",           icon: <LuUser size={16}/>,        label: "Clientes",        desc: "Cadastro de clientes para recebimentos" },
            { to: "/tipos-gasto",        icon: <LuTrendingUp size={16}/>,  label: "Tipos de gasto",  desc: "Categorias de despesa" },
            { to: "/relatorios-titulos", icon: <LuFileText size={16}/>,    label: "Relatórios",      desc: "Fluxo de caixa, aging e fornecedores" },
            { to: "/preferencias-alerta",icon: <LuBellRing size={16}/>,    label: "Alertas de e-mail", desc: "Notificações de vencimento" },
        ],
    },
    {
        label: "Inteligência",
        items: [
            { to: "/titulos",          icon: <LuSparkles size={16}/>, label: "Insights de IA", desc: "Aurora, Frank e Anne" },
            { to: "/assistente-cnab",  icon: <LuBot size={16}/>,      label: "Agente CNAB",    desc: "Elvis · Especialista CNAB" },
        ],
    },
    {
        label: "Configurações",
        items: [
            { to: "/configuracoes", icon: <LuSettings size={16}/>, label: "Geral", desc: "Empresa, regime tributário e DAS" },
        ],
    },
];

const AUTH_ROUTES = ["/verificar-email", "/esqueci-senha", "/redefinir-senha"];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: calcula dias restantes do trial
// ─────────────────────────────────────────────────────────────────────────────

function calcularDiasTrial(usuario) {
    // Backend ainda não emite esses campos. Quando emitir, código abaixo liga sozinho.
    if (!usuario) return null;
    if (usuario.assinaturaStatus !== "TRIAL") return null;
    if (!usuario.trialExpiraEm) return null;

    const expira = new Date(usuario.trialExpiraEm).getTime();
    const agora  = Date.now();
    if (expira <= agora) return 0;

    const dias = Math.ceil((expira - agora) / (1000 * 60 * 60 * 24));
    return dias;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper: esconde navbar em rotas de auth + landing (App.jsx já trata)
// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
    const { pathname } = useLocation();
    if (AUTH_ROUTES.some(r => pathname.startsWith(r))) return null;
    return <NavbarInner/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

function NavbarInner() {
    const { pathname }                     = useLocation();
    const navigate                         = useNavigate();
    const { autenticado, usuario, logout } = useAuth();

    const [menuAberto,     setMenuAberto]     = useState(false);
    const [submenuAberto,  setSubmenuAberto]  = useState(null);
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const dropdownRef  = useRef(null);
    const submenuTimer = useRef(null);

    const temWhalletPlus = usuario?.perfil === "ADMIN" || usuario?.planoId === PLANO_WHALLET_PLUS;
    const isAdmin        = usuario?.perfil === "ADMIN";
    const diasTrial      = calcularDiasTrial(usuario);
    const trialAtivo     = diasTrial !== null && diasTrial > 0;
    const trialCritico   = trialAtivo && diasTrial <= 3;

    const iniciais = usuario?.nome
        ? usuario.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
        : "?";

    function handleLogout() {
        logout();
        navigate("/login");
        setMenuAberto(false);
        setDropdownAberto(false);
        setSubmenuAberto(null);
    }

    function abrirSubmenu(label) {
        clearTimeout(submenuTimer.current);
        setSubmenuAberto(label);
    }

    function fecharSubmenuDelay() {
        submenuTimer.current = setTimeout(() => setSubmenuAberto(null), 150);
    }

    useEffect(() => {
        function handleClickFora(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, []);

    useEffect(() => {
        setMenuAberto(false);
        setSubmenuAberto(null);
        setDropdownAberto(false);
    }, [pathname]);

    function filtrarItems(items) {
        return items.filter(item => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.authOnly && !autenticado) return false;
            return true;
        });
    }

    return (
        <>
            <header className="nb-header">
                <div className="nb-inner">

                    {/* ── Wordmark editorial ──────────────────────────────── */}
                    <Link
                        to="/"
                        onClick={() => setMenuAberto(false)}
                        className="nb-brand"
                    >
                        whallet<span className="nb-brand-dot"/>
                    </Link>

                    {/* ── Nav central desktop com mega-menu ─────────────── */}
                    <nav className="nb-nav-desktop">

                        {/* Mega-menu (autenticado) */}
                        {autenticado && MENU.map(grupo => {
                            const itensFiltrados = filtrarItems(grupo.items);
                            if (itensFiltrados.length === 0) return null;
                            const aberto = submenuAberto === grupo.label;

                            return (
                                <div
                                    key={grupo.label}
                                    className="nb-menu-group"
                                    onMouseEnter={() => abrirSubmenu(grupo.label)}
                                    onMouseLeave={fecharSubmenuDelay}
                                >
                                    <button className={`nb-menu-trigger ${aberto ? "open" : ""}`}>
                                        {grupo.label}
                                        <LuChevronDown size={13} className="nb-menu-chevron"/>
                                    </button>

                                    {aberto && (
                                        <div
                                            className="nb-menu-dropdown"
                                            onMouseEnter={() => abrirSubmenu(grupo.label)}
                                            onMouseLeave={fecharSubmenuDelay}
                                        >
                                            <div className="nb-menu-dropdown-eyebrow">
                                                {grupo.label}
                                            </div>
                                            {itensFiltrados.map(item => (
                                                <Link
                                                    key={item.to + item.label}
                                                    to={item.to}
                                                    className="nb-menu-item"
                                                >
                                                    <div className="nb-menu-item-icon">
                                                        {item.icon}
                                                    </div>
                                                    <div className="nb-menu-item-text">
                                                        <div className="nb-menu-item-label">{item.label}</div>
                                                        <div className="nb-menu-item-desc">{item.desc}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Links públicos (não autenticado) */}
                        {!autenticado && (
                            <>
                                <Link to="/valida-cnab" className="nb-link-simple">Conversor CNAB</Link>
                                <Link to="/gestao-financeira" className="nb-link-simple">Gestão financeira</Link>
                            </>
                        )}

                        <Link to="/planos" className="nb-link-simple">Planos</Link>
                    </nav>

                    {/* ── Ações direita ─────────────────────────────────── */}
                    <div className="nb-actions-desktop">

                        {/* Badge de trial — só aparece se backend forneceu */}
                        {trialAtivo && (
                            <Link
                                to="/planos"
                                className={`nb-trial-badge ${trialCritico ? "critical" : ""}`}
                            >
                                <span className="nb-trial-dot"/>
                                {diasTrial === 1
                                    ? "Último dia do trial"
                                    : `${diasTrial} dias do trial`
                                }
                                <span className="nb-trial-arrow">→</span>
                            </Link>
                        )}

                        {autenticado ? (
                            <div ref={dropdownRef} className="nb-user-wrap">
                                <button
                                    onClick={() => setDropdownAberto(o => !o)}
                                    className="nb-user-trigger"
                                >
                                    <div className="nb-user-avatar">{iniciais}</div>
                                    <span className="nb-user-name">
                                        {usuario?.nome?.split(" ")[0]}
                                    </span>
                                    <LuChevronDown
                                        size={13}
                                        className={`nb-user-chevron ${dropdownAberto ? "open" : ""}`}
                                    />
                                </button>

                                {dropdownAberto && (
                                    <div className="nb-user-dropdown">
                                        <div className="nb-user-info">
                                            <div className="nb-user-info-name">{usuario?.nome}</div>
                                            <div className="nb-user-info-email">{usuario?.email}</div>
                                            {temWhalletPlus && (
                                                <div className="nb-user-info-plan">Whallet+</div>
                                            )}
                                        </div>

                                        {[
                                            { to: "/historico",            icon: <LuClipboardList size={15}/>, label: "Histórico CNAB" },
                                            { to: "/preferencias-alerta",  icon: <LuBellRing size={15}/>,      label: "Alertas de email" },
                                            { to: "/configuracoes",        icon: <LuSettings size={15}/>,      label: "Configurações" },
                                            ...(isAdmin ? [
                                                { to: "/admin/usuarios",       icon: <LuUser size={15}/>,        label: "Usuários" },
                                                { to: "/admin/cnab-knowledge", icon: <MdMenuBook size={15}/>,    label: "Base CNAB" },
                                                { to: "/assistente-cnab",      icon: <LuShieldCheck size={15}/>, label: "Agente CNAB" },
                                            ] : []),
                                        ].map(item => (
                                            <Link
                                                key={item.to + item.label}
                                                to={item.to}
                                                onClick={() => setDropdownAberto(false)}
                                                className="nb-user-item"
                                            >
                                                <span className="nb-user-item-icon">{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        ))}

                                        <div className="nb-user-divider"/>
                                        <button onClick={handleLogout} className="nb-user-logout">
                                            <LuLogOut size={15}/>
                                            Sair da conta
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="nb-link-simple">Entrar</Link>
                                <Link to="/cadastro" className="nb-cta">
                                    Comece grátis
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Hamburger mobile */}
                    <button
                        onClick={() => setMenuAberto(o => !o)}
                        className="nb-hamburger"
                        aria-label="Menu"
                    >
                        {menuAberto ? <LuX size={22}/> : <LuMenu size={22}/>}
                    </button>
                </div>
            </header>

            {/* ── Menu mobile ───────────────────────────────────────────── */}
            {menuAberto && (
                <>
                    <div className="nb-mobile-panel">
                        <div className="nb-mobile-inner">

                            {/* Trial badge mobile */}
                            {trialAtivo && (
                                <Link
                                    to="/planos"
                                    onClick={() => setMenuAberto(false)}
                                    className={`nb-trial-badge mobile ${trialCritico ? "critical" : ""}`}
                                >
                                    <span className="nb-trial-dot"/>
                                    {diasTrial === 1 ? "Último dia do trial" : `${diasTrial} dias do trial`}
                                    <span className="nb-trial-arrow">→</span>
                                </Link>
                            )}

                            {autenticado && MENU.map(grupo => {
                                const itensFiltrados = filtrarItems(grupo.items);
                                if (itensFiltrados.length === 0) return null;
                                return (
                                    <div key={grupo.label} className="nb-mobile-group">
                                        <div className="nb-mobile-group-label">{grupo.label}</div>
                                        {itensFiltrados.map(item => (
                                            <Link
                                                key={item.to + item.label}
                                                to={item.to}
                                                onClick={() => setMenuAberto(false)}
                                                className="nb-mobile-item"
                                            >
                                                <span className="nb-mobile-item-icon">{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                );
                            })}

                            {!autenticado && (
                                <div className="nb-mobile-group">
                                    <Link
                                        to="/valida-cnab"
                                        onClick={() => setMenuAberto(false)}
                                        className="nb-mobile-item"
                                    >
                                        <span className="nb-mobile-item-icon"><LuSheet size={15}/></span>
                                        Conversor CNAB
                                    </Link>
                                    <Link
                                        to="/gestao-financeira"
                                        onClick={() => setMenuAberto(false)}
                                        className="nb-mobile-item"
                                    >
                                        <span className="nb-mobile-item-icon"><LuWalletCards size={15}/></span>
                                        Gestão Financeira
                                    </Link>
                                </div>
                            )}

                            <div className="nb-mobile-group">
                                <Link
                                    to="/planos"
                                    onClick={() => setMenuAberto(false)}
                                    className="nb-mobile-item"
                                >
                                    <span className="nb-mobile-item-icon"><LuGem size={15}/></span>
                                    Planos
                                </Link>
                            </div>

                            <div className="nb-mobile-divider"/>

                            {autenticado ? (
                                <div className="nb-mobile-user">
                                    <div>
                                        <div className="nb-mobile-user-name">{usuario?.nome}</div>
                                        <div className="nb-mobile-user-email">{usuario?.email}</div>
                                    </div>
                                    <button onClick={handleLogout} className="nb-mobile-logout">
                                        <LuLogOut size={14}/>
                                        Sair
                                    </button>
                                </div>
                            ) : (
                                <div className="nb-mobile-auth">
                                    <Link
                                        to="/login"
                                        onClick={() => setMenuAberto(false)}
                                        className="nb-mobile-auth-ghost"
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        to="/cadastro"
                                        onClick={() => setMenuAberto(false)}
                                        className="nb-mobile-auth-cta"
                                    >
                                        Criar conta
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <div onClick={() => setMenuAberto(false)} className="nb-mobile-overlay"/>
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                ESTILOS — escopo isolado .nb-*
                ═══════════════════════════════════════════════════════════════ */}
            <style>{`
                /* ── Header ───────────────────────────────────────────────── */
                .nb-header {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 200;
                    background: rgba(255, 255, 255, 0.92);
                    backdrop-filter: blur(20px) saturate(1.4);
                    -webkit-backdrop-filter: blur(20px) saturate(1.4);
                    border-bottom: 1px solid var(--hair);
                }

                .nb-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 32px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* ── Wordmark ─────────────────────────────────────────────── */
                .nb-brand {
                    display: inline-flex;
                    align-items: baseline;
                    gap: 3px;
                    font-family: var(--ff-sans);
                    font-weight: 800;
                    font-size: 24px;
                    letter-spacing: -0.05em;
                    line-height: 1;
                    color: var(--navy-deep);
                    text-decoration: none;
                    flex-shrink: 0;
                    margin-right: 32px;
                    transition: opacity 0.15s;
                }
                .nb-brand:hover { opacity: 0.8; }

                .nb-brand-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--cyan);
                    display: inline-block;
                }

                /* ── Nav central ─────────────────────────────────────────── */
                .nb-nav-desktop {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                }

                .nb-link-simple {
                    padding: 8px 14px;
                    border-radius: 8px;
                    font-family: var(--ff-sans);
                    font-size: 14px;
                    font-weight: 500;
                    letter-spacing: -0.005em;
                    color: var(--ink-2);
                    text-decoration: none;
                    transition: color 0.15s, background 0.15s;
                }
                .nb-link-simple:hover {
                    color: var(--navy-deep);
                    background: rgba(11, 30, 54, 0.04);
                }

                /* ── Mega-menu trigger ───────────────────────────────────── */
                .nb-menu-group {
                    position: relative;
                }

                .nb-menu-trigger {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 14px;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    font-family: var(--ff-sans);
                    font-size: 14px;
                    font-weight: 500;
                    letter-spacing: -0.005em;
                    color: var(--ink-2);
                    cursor: pointer;
                    transition: color 0.15s, background 0.15s;
                }
                .nb-menu-trigger:hover {
                    color: var(--navy-deep);
                    background: rgba(11, 30, 54, 0.04);
                }
                .nb-menu-trigger.open {
                    color: var(--cyan-dark);
                    background: var(--cyan-soft);
                }

                .nb-menu-chevron {
                    transition: transform 0.2s;
                    color: currentColor;
                }
                .nb-menu-trigger.open .nb-menu-chevron {
                    transform: rotate(180deg);
                }

                /* ── Mega-menu dropdown ──────────────────────────────────── */
                .nb-menu-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    background: var(--surface);
                    border: 1px solid var(--hair);
                    border-radius: 14px;
                    min-width: 300px;
                    z-index: 999;
                    box-shadow: 0 12px 40px rgba(11, 30, 54, 0.10);
                    overflow: hidden;
                    padding: 8px;
                    animation: nbDropdownIn 0.15s ease;
                }

                @keyframes nbDropdownIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .nb-menu-dropdown-eyebrow {
                    padding: 8px 12px 10px;
                    font-family: var(--ff-mono);
                    font-size: 10px;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--cyan-dark);
                    border-bottom: 1px solid var(--hair);
                    margin-bottom: 4px;
                }

                .nb-menu-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    text-decoration: none;
                    transition: background 0.12s;
                }
                .nb-menu-item:hover {
                    background: var(--bg);
                }

                .nb-menu-item-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: var(--cyan-soft);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--cyan-dark);
                    flex-shrink: 0;
                }

                .nb-menu-item-text {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }

                .nb-menu-item-label {
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: -0.005em;
                    color: var(--navy-deep);
                }

                .nb-menu-item-desc {
                    font-size: 11px;
                    color: var(--text-dim);
                    line-height: 1.4;
                }

                /* ── Ações direita ──────────────────────────────────────── */
                .nb-actions-desktop {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }

                /* ── Badge de trial ─────────────────────────────────────── */
                .nb-trial-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 14px;
                    border-radius: 100px;
                    background: var(--cyan-soft);
                    border: 1px solid rgba(21, 195, 221, 0.25);
                    color: var(--cyan-dark);
                    font-family: var(--ff-mono);
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    text-decoration: none;
                    transition: all 0.15s;
                    white-space: nowrap;
                }

                .nb-trial-badge:hover {
                    background: rgba(21, 195, 221, 0.12);
                    border-color: var(--cyan);
                }

                .nb-trial-badge.critical {
                    background: var(--warning-bg);
                    border-color: rgba(230, 162, 60, 0.3);
                    color: var(--warning);
                }

                .nb-trial-badge.critical:hover {
                    background: rgba(230, 162, 60, 0.15);
                    border-color: var(--warning);
                }

                .nb-trial-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: currentColor;
                    box-shadow: 0 0 8px currentColor;
                    animation: nbBlink 2s ease-in-out infinite;
                }

                @keyframes nbBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                .nb-trial-arrow {
                    transition: transform 0.15s;
                }
                .nb-trial-badge:hover .nb-trial-arrow {
                    transform: translateX(2px);
                }

                /* ── Avatar do usuário ──────────────────────────────────── */
                .nb-user-wrap {
                    position: relative;
                }

                .nb-user-trigger {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 5px 12px 5px 5px;
                    border-radius: 100px;
                    border: 1px solid var(--hair);
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .nb-user-trigger:hover {
                    border-color: var(--cyan);
                    background: var(--cyan-soft);
                }

                .nb-user-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--navy-deep);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--ff-sans);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }

                .nb-user-name {
                    font-family: var(--ff-sans);
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--navy-deep);
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    letter-spacing: -0.005em;
                }

                .nb-user-chevron {
                    color: var(--text-dim);
                    transition: transform 0.2s;
                }
                .nb-user-chevron.open {
                    transform: rotate(180deg);
                }

                /* ── User dropdown ──────────────────────────────────────── */
                .nb-user-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    background: var(--surface);
                    border: 1px solid var(--hair);
                    border-radius: 14px;
                    min-width: 240px;
                    z-index: 999;
                    box-shadow: 0 12px 40px rgba(11, 30, 54, 0.10);
                    overflow: hidden;
                    padding: 6px;
                    animation: nbDropdownIn 0.15s ease;
                }

                .nb-user-info {
                    padding: 12px 14px 14px;
                    border-bottom: 1px solid var(--hair);
                    margin-bottom: 4px;
                }

                .nb-user-info-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--navy-deep);
                    letter-spacing: -0.005em;
                }

                .nb-user-info-email {
                    font-size: 11px;
                    color: var(--text-dim);
                    margin-top: 2px;
                }

                .nb-user-info-plan {
                    display: inline-block;
                    margin-top: 8px;
                    padding: 2px 8px;
                    border-radius: 100px;
                    background: var(--cyan-soft);
                    color: var(--cyan-dark);
                    font-family: var(--ff-mono);
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .nb-user-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 8px;
                    color: var(--ink-2);
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 500;
                    letter-spacing: -0.005em;
                    transition: background 0.1s, color 0.1s;
                }
                .nb-user-item:hover {
                    background: var(--bg);
                    color: var(--navy-deep);
                }

                .nb-user-item-icon {
                    color: var(--text-dim);
                    display: inline-flex;
                }

                .nb-user-divider {
                    height: 1px;
                    background: var(--hair);
                    margin: 4px 6px;
                }

                .nb-user-logout {
                    width: 100%;
                    padding: 9px 12px;
                    border-radius: 8px;
                    background: transparent;
                    border: none;
                    color: var(--ink-2);
                    font-family: var(--ff-sans);
                    font-weight: 500;
                    font-size: 13px;
                    letter-spacing: -0.005em;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: background 0.1s, color 0.1s;
                }
                .nb-user-logout:hover {
                    background: var(--error-bg);
                    color: var(--error);
                }

                /* ── CTA "Comece grátis" (não autenticado) ──────────────── */
                .nb-cta {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 18px;
                    border-radius: 100px;
                    background: var(--navy-deep);
                    color: white;
                    font-family: var(--ff-sans);
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: -0.005em;
                    text-decoration: none;
                    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
                }
                .nb-cta:hover {
                    background: var(--navy);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(11, 30, 54, 0.2);
                }

                /* ── Hamburger mobile ───────────────────────────────────── */
                .nb-hamburger {
                    display: none;
                    background: none;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    margin-left: auto;
                    color: var(--navy-deep);
                }

                /* ── Painel mobile ──────────────────────────────────────── */
                .nb-mobile-panel {
                    position: fixed;
                    top: 64px;
                    left: 0;
                    right: 0;
                    z-index: 199;
                    background: var(--surface);
                    border-bottom: 1px solid var(--hair);
                    box-shadow: 0 12px 32px rgba(11, 30, 54, 0.08);
                    animation: nbSlideDown 0.18s ease;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .nb-mobile-overlay {
                    position: fixed;
                    inset: 0;
                    top: 64px;
                    z-index: 198;
                    background: rgba(11, 30, 54, 0.25);
                }

                .nb-mobile-inner {
                    padding: 16px 20px 24px;
                }

                .nb-mobile-group {
                    margin-bottom: 16px;
                }

                .nb-mobile-group-label {
                    font-family: var(--ff-mono);
                    font-size: 10px;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--cyan-dark);
                    padding: 0 14px 6px;
                }

                .nb-mobile-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 11px 14px;
                    border-radius: 10px;
                    font-family: var(--ff-sans);
                    font-size: 14px;
                    font-weight: 500;
                    letter-spacing: -0.005em;
                    text-decoration: none;
                    color: var(--ink-2);
                    transition: background 0.1s;
                }
                .nb-mobile-item:hover {
                    background: var(--bg);
                }

                .nb-mobile-item-icon {
                    color: var(--cyan-dark);
                    display: inline-flex;
                }

                .nb-mobile-divider {
                    height: 1px;
                    background: var(--hair);
                    margin: 8px 0 16px;
                }

                .nb-mobile-user {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 14px;
                }

                .nb-mobile-user-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--navy-deep);
                }

                .nb-mobile-user-email {
                    font-size: 11px;
                    color: var(--text-dim);
                    margin-top: 2px;
                }

                .nb-mobile-logout {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    border-radius: 8px;
                    background: var(--error-bg);
                    border: 1px solid rgba(229, 72, 77, 0.2);
                    color: var(--error);
                    font-family: var(--ff-sans);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .nb-mobile-auth {
                    display: flex;
                    gap: 10px;
                    padding: 0 4px;
                }

                .nb-mobile-auth-ghost,
                .nb-mobile-auth-cta {
                    flex: 1;
                    text-align: center;
                    padding: 12px;
                    border-radius: 10px;
                    font-family: var(--ff-sans);
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: -0.005em;
                    text-decoration: none;
                }

                .nb-mobile-auth-ghost {
                    border: 1px solid var(--hair);
                    color: var(--navy-deep);
                }

                .nb-mobile-auth-cta {
                    background: var(--navy-deep);
                    color: white;
                }

                .nb-trial-badge.mobile {
                    display: inline-flex;
                    margin-bottom: 16px;
                }

                /* ── Animação ──────────────────────────────────────────── */
                @keyframes nbSlideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Responsivo ────────────────────────────────────────── */
                @media (max-width: 900px) {
                    .nb-nav-desktop      { display: none !important; }
                    .nb-actions-desktop  { display: none !important; }
                    .nb-hamburger        { display: flex !important; }
                }

                @media (max-width: 600px) {
                    .nb-inner { padding: 0 20px; }
                    .nb-brand { margin-right: 0; }
                }
            `}</style>
        </>
    );
}
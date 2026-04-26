import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdMenuBook } from "react-icons/md";
import { ImUserPlus } from "react-icons/im";


import {
    LuChevronDown, LuSheet, LuWalletCards, LuClipboardList,
    LuBellRing, LuShieldCheck, LuLogOut, LuMenu, LuX,
    LuGem, LuFileText, LuTrendingUp, LuSparkles, LuBot, LuUser, LuHandCoins
} from "react-icons/lu";
import logoSvg from "../assets/logo.svg";
import { useAuth } from "../context/AuthContext.jsx";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

// Estrutura do mega-menu
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
            { to: "/titulos",           icon: <LuWalletCards size={16}/>, label: "Títulos a pagar",    desc: "Contas a pagar e baixas" },
            { to: "/clientes",          icon: <ImUserPlus size={16}/>,       label: "Clientes",           desc: "Cadastro de clientes para recebimentos" },
            { to: "/recebimentos",      icon: <LuHandCoins size={16}/>,   label: "Recebimentos",       desc: "Contas a receber e cobranças" },
            { to: "/tipos-gasto",       icon: <LuTrendingUp size={16}/>,  label: "Tipos de gasto",     desc: "Categorias de despesa" },
            { to: "/relatorios-titulos", icon: <LuFileText size={16}/>, label: "Relatórios", desc: "Fluxo de caixa, aging e fornecedores" },
            { to: "/preferencias-alerta", icon: <LuBellRing size={16}/>, label: "Alertas de e-mail",  desc: "Notificações de vencimento" },
        ],
    },
    {
        label: "Inteligência",
        items: [
            { to: "/titulos",     icon: <LuSparkles size={16}/>, label: "Insights de IA",  desc: "Aurora, Frank e Anne" },
            { to: "/assistente-cnab", icon: <LuBot size={16}/>,  label: "Agente CNAB",     desc: "Elvis · Especialista CNAB" },
        ],
    },
];

const AUTH_ROUTES = ["/verificar-email", "/esqueci-senha", "/redefinir-senha"];

// Wrapper que esconde a navbar em rotas de auth sem violar regra de hooks
export default function Navbar() {
    const { pathname } = useLocation();
    if (AUTH_ROUTES.some(r => pathname.startsWith(r))) return null;
    return <NavbarInner/>;
}

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
    const rotaGestao     = temWhalletPlus ? "/titulos" : "/gestao-financeira";

    const iniciais = usuario?.nome
        ? usuario.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
        : "?";

    function handleLogout() {
        logout(); navigate("/login");
        setMenuAberto(false); setDropdownAberto(false); setSubmenuAberto(null);
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
        setMenuAberto(false); setSubmenuAberto(null); setDropdownAberto(false);
    }, [pathname]);

    // Filtra itens do menu por autenticação e perfil
    function filtrarItems(items) {
        return items.filter(item => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.authOnly && !autenticado) return false;
            return true;
        });
    }

    return (
        <>
            <header style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
                background: "#FFFFFF", borderBottom: "1px solid rgba(26,43,66,0.1)",
                boxShadow: "0 1px 3px rgba(26,43,66,0.04)",
            }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 0 }}>

                    {/* Logo */}
                    <Link to="/" onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0, marginRight: 32 }}>
                        <img src={logoSvg} alt="Whallet" style={{ height: 56, width: "auto", display: "block" }}/>
                    </Link>

                    {/* Nav central desktop com submenus */}
                    <nav style={{ display: "flex", alignItems: "center", gap: 0, flex: 1 }} className="nb-nav-desktop">

                        {/* Links de mega-menu (só para autenticados) */}
                        {autenticado && MENU.map(grupo => {
                            const itensFiltrados = filtrarItems(grupo.items);
                            if (itensFiltrados.length === 0) return null;
                            const aberto = submenuAberto === grupo.label;

                            return (
                                <div key={grupo.label} style={{ position: "relative" }}
                                     onMouseEnter={() => abrirSubmenu(grupo.label)}
                                     onMouseLeave={fecharSubmenuDelay}>
                                    <button style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        padding: "6px 14px", borderRadius: 8, background: "transparent", border: "none",
                                        fontSize: 13.5, fontWeight: 600, color: aberto ? "var(--cyan)" : "var(--text-muted)",
                                        cursor: "pointer", transition: "color 0.15s",
                                    }}>
                                        {grupo.label}
                                        <LuChevronDown size={13} style={{ transform: aberto ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}/>
                                    </button>

                                    {aberto && (
                                        <div style={{
                                            position: "absolute", top: "calc(100% + 8px)", left: 0,
                                            background: "#fff", border: "1px solid rgba(26,43,66,0.1)",
                                            borderRadius: 14, minWidth: 260, zIndex: 999,
                                            boxShadow: "0 8px 32px rgba(26,43,66,0.12)",
                                            overflow: "hidden", padding: "8px",
                                        }}
                                             onMouseEnter={() => abrirSubmenu(grupo.label)}
                                             onMouseLeave={fecharSubmenuDelay}>
                                            {itensFiltrados.map(item => (
                                                <Link key={item.to} to={item.to} style={{
                                                    display: "flex", alignItems: "center", gap: 12,
                                                    padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                                                    transition: "background 0.1s",
                                                }}
                                                      onMouseEnter={e => e.currentTarget.style.background = "rgba(26,43,66,0.04)"}
                                                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(21,195,221,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cyan)", flexShrink: 0 }}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                                                        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>{item.desc}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Links simples para não autenticados */}
                        {!autenticado && (
                            <>
                                <Link to="/valida-cnab" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
                                      onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                                    Conversor CNAB
                                </Link>
                                <Link to="/gestao-financeira" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
                                      onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                                    Gestão Financeira
                                </Link>
                            </>
                        )}

                        <Link to="/planos" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
                              onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                            Planos
                        </Link>
                    </nav>

                    {/* Ações direita */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }} className="nb-actions-desktop">
                        {autenticado ? (
                            <div ref={dropdownRef} style={{ position: "relative" }}>
                                <button onClick={() => setDropdownAberto(o => !o)} style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "6px 12px 6px 6px", borderRadius: 99,
                                    border: "1px solid rgba(26,43,66,0.12)", background: "transparent", cursor: "pointer",
                                    transition: "border-color 0.15s, background 0.15s",
                                }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(21,195,221,0.4)"; e.currentTarget.style.background = "rgba(21,195,221,0.04)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(26,43,66,0.12)"; e.currentTarget.style.background = "transparent"; }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0B1E36" }}>{iniciais}</div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuario?.nome?.split(" ")[0]}</span>
                                    <LuChevronDown size={13} style={{ color: "var(--text-dim)", transform: dropdownAberto ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}/>
                                </button>

                                {dropdownAberto && (
                                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid rgba(26,43,66,0.1)", borderRadius: 14, minWidth: 220, zIndex: 999, boxShadow: "0 8px 32px rgba(26,43,66,0.12)", overflow: "hidden" }}>
                                        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(26,43,66,0.07)" }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{usuario?.nome}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{usuario?.email}</div>
                                        </div>
                                        {[
                                            { to: "/historico",            icon: <LuClipboardList size={15}/>, label: "Histórico CNAB" },
                                            { to: "/preferencias-alerta",  icon: <LuBellRing size={15}/>,     label: "Alertas de e-mail" },
                                            ...(isAdmin ? [
                                                { to: "/admin/usuarios",       icon: <LuUser size={15}/>, label: "Usuários" },
                                                { to: "/admin/cnab-knowledge", icon: <MdMenuBook size={15}/>, label: "Base CNAB" },
                                                { to: "/assistente-cnab",      icon: <LuShieldCheck size={15}/>, label: "Agente CNAB" },
                                            ] : []),
                                        ].map(item => (
                                            <Link key={item.to} to={item.to} onClick={() => setDropdownAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "var(--text-muted)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, transition: "background 0.1s, color 0.1s" }}
                                                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,43,66,0.04)"; e.currentTarget.style.color = "var(--text)"; }}
                                                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                                                <span style={{ color: "var(--text-dim)" }}>{item.icon}</span>{item.label}
                                            </Link>
                                        ))}
                                        <div style={{ borderTop: "1px solid rgba(26,43,66,0.07)", padding: "6px 8px" }}>
                                            <button onClick={handleLogout} style={{ width: "100%", padding: "9px 8px", borderRadius: 8, background: "transparent", border: "none", color: "var(--text-muted)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background 0.1s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.05)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <LuLogOut size={15} style={{ color: "var(--error)" }}/> Sair da conta
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
                                      onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>Entrar</Link>
                                <Link to="/cadastro" style={{ padding: "7px 18px", borderRadius: 8, background: "var(--grad)", color: "#0B1E36", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}
                                      onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>Criar conta</Link>
                            </>
                        )}
                    </div>

                    {/* Hamburger mobile */}
                    <button onClick={() => setMenuAberto(o => !o)} className="nb-hamburger" aria-label="Menu" style={{ display: "none", background: "none", border: "none", padding: 8, cursor: "pointer", marginLeft: "auto", color: "var(--text)" }}>
                        {menuAberto ? <LuX size={22}/> : <LuMenu size={22}/>}
                    </button>
                </div>
            </header>

            {/* Menu mobile */}
            {menuAberto && (
                <>
                    <div style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 199, background: "#fff", borderBottom: "1px solid rgba(26,43,66,0.1)", boxShadow: "0 8px 24px rgba(26,43,66,0.08)", animation: "nbSlideDown 0.18s ease", maxHeight: "80vh", overflowY: "auto" }}>
                        <div style={{ padding: "12px 20px 20px" }}>

                            {autenticado && MENU.map(grupo => {
                                const itensFiltrados = filtrarItems(grupo.items);
                                if (itensFiltrados.length === 0) return null;
                                return (
                                    <div key={grupo.label} style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 14px", marginBottom: 4 }}>{grupo.label}</div>
                                        {itensFiltrados.map(item => (
                                            <Link key={item.to} to={item.to} onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--text-muted)" }}>
                                                <span style={{ color: "var(--cyan)" }}>{item.icon}</span> {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                );
                            })}

                            {!autenticado && (
                                <div style={{ marginBottom: 16 }}>
                                    <Link to="/valida-cnab" onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--text-muted)" }}><LuSheet size={15}/> Conversor CNAB</Link>
                                    <Link to="/gestao-financeira" onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--text-muted)" }}><LuWalletCards size={15}/> Gestão Financeira</Link>
                                </div>
                            )}

                            <Link to="/planos" onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--text-muted)", marginBottom: 12 }}><LuGem size={15}/> Planos</Link>

                            <div style={{ height: 1, background: "rgba(26,43,66,0.07)", margin: "4px 0 12px" }}/>

                            {autenticado ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{usuario?.nome}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{usuario?.email}</div>
                                    </div>
                                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--error)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                        <LuLogOut size={14}/> Sair
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", gap: 10 }}>
                                    <Link to="/login" onClick={() => setMenuAberto(false)} style={{ flex: 1, textAlign: "center", padding: "11px", borderRadius: 10, border: "1px solid rgba(26,43,66,0.12)", fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>Entrar</Link>
                                    <Link to="/cadastro" onClick={() => setMenuAberto(false)} style={{ flex: 1, textAlign: "center", padding: "11px", borderRadius: 10, background: "var(--grad)", fontSize: 14, fontWeight: 700, color: "#0B1E36", textDecoration: "none" }}>Criar conta</Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <div onClick={() => setMenuAberto(false)} style={{ position: "fixed", inset: 0, top: 64, zIndex: 198, background: "rgba(26,43,66,0.25)" }}/>
                </>
            )}

            <style>{`
            @keyframes nbSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
            @media (max-width: 768px) {
                .nb-nav-desktop { display: none !important; }
                .nb-actions-desktop { display: none !important; }
                .nb-hamburger { display: flex !important; }
            }
        `}</style>
        </>
    );
}
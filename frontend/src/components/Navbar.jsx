import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoWhale from "../assets/logo.svg";
import { IcoExcel, IcoPdf, IcoBack } from "./icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function Navbar() {
    const { pathname }                     = useLocation();
    const navigate                         = useNavigate();
    const { autenticado, usuario, logout } = useAuth();
    const isHome    = pathname === "/";
    const [menuAberto,     setMenuAberto]     = useState(false);
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const dropdownRef = useRef(null);

    const temWhalletPlus = usuario?.perfil === "ADMIN" || usuario?.planoId === PLANO_WHALLET_PLUS;
    const rotaGestao     = temWhalletPlus ? "/titulos" : "/gestao-financeira";

    const iniciais = usuario?.nome
        ? usuario.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
        : "?";

    function handleLogout() {
        logout();
        navigate("/login");
        setMenuAberto(false);
        setDropdownAberto(false);
    }

    function fecharMenu() {
        setMenuAberto(false);
        setDropdownAberto(false);
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

    // Fecha menu ao navegar
    useEffect(() => { setMenuAberto(false); }, [pathname]);

    return (
        <>
            <header className="topbar">
                <div className="topbar-gradient-line" aria-hidden="true"/>
                <div className="topbar-inner">

                    {/* Brand */}
                    <Link to="/" className="brand brand-btn" onClick={fecharMenu}>

                        <span className="brand-wordmark">Whallet</span>
                        <div className="brand-whale-wrap">
                            {/*<img src={logoWhale} alt="" className="brand-whale"/>*/}
                        </div>
                    </Link>

                    {/* Nav central — só desktop */}
                    {isHome ? (
                        <nav className="topbar-nav" aria-label="Navegação principal">
                            <div className="nav-pill">
                                <Link to="/excel" className="nav-link">
                                    <span className="nav-link-icon">⚡</span>
                                    <span className="nav-link-text">Ferramenta</span>
                                </Link>
                                <div className="nav-divider"/>
                                <a href="#como-funciona" className="nav-link">
                                    <span className="nav-link-icon">📖</span>
                                    <span className="nav-link-text">Como funciona</span>
                                </a>
                            </div>
                        </nav>
                    ) : (
                        <nav className="topbar-nav">
                            <div className="nav-pill">
                                <Link to="/" className="nav-link">
                                    <IcoBack/><span className="nav-link-text"> Home</span>
                                </Link>
                                <div className="nav-divider"/>
                                <Link to="/excel" className={"nav-link " + (pathname==="/excel" ? "nav-link--active" : "")}>
                                    <IcoExcel/><span className="nav-link-text"> Excel</span>
                                </Link>
                                <div className="nav-divider"/>
                                <Link to="/pdf" className={"nav-link " + (pathname==="/pdf" ? "nav-link--active" : "")}>
                                    <IcoPdf/><span className="nav-link-text"> PDF</span>
                                </Link>
                            </div>
                        </nav>
                    )}

                    {/* Ações direita — só desktop */}
                    <div className="topbar-actions">
                    <span className="topbar-badge">
                        <span className="topbar-badge-dot"/>
                        7 layouts ativos
                    </span>

                        {autenticado ? (
                            <div className="topbar-user" ref={dropdownRef} style={{ position: "relative" }}>
                                <Link to="/planos" className="topbar-admin-link topbar-admin-link--planos">
                                    Planos
                                </Link>
                                <Link to={rotaGestao} className="topbar-admin-link topbar-admin-link--gestao">
                                    Gestão Financeira
                                </Link>

                                {/* Avatar + dropdown */}
                                <button onClick={() => setDropdownAberto(o => !o)} className="topbar-avatar-btn">
                                    <div className="topbar-avatar">{iniciais}</div>
                                    <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {usuario?.nome?.split(" ")[0]}
                                </span>
                                    <span style={{ fontSize: 10, color: "var(--text-dim)",
                                        transform: dropdownAberto ? "rotate(180deg)" : "none",
                                        transition: "transform 0.2s" }}>▼</span>
                                </button>

                                {dropdownAberto && (
                                    <div className="topbar-dropdown">
                                        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{usuario?.nome}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{usuario?.email}</div>
                                        </div>
                                        {[
                                            { to: "/historico", icon: "📋", label: "Histórico" },
                                            ...(usuario?.perfil === "ADMIN"
                                                ? [{ to: "/admin/usuarios", icon: "⚙️", label: "Admin" }]
                                                : []),
                                        ].map(item => (
                                            <Link key={item.to} to={item.to}
                                                  onClick={() => setDropdownAberto(false)}
                                                  style={{
                                                      display: "flex", alignItems: "center", gap: 10,
                                                      padding: "11px 16px", color: "var(--text-muted)",
                                                      textDecoration: "none", fontSize: 14
                                                  }}
                                                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <span>{item.icon}</span><span>{item.label}</span>
                                            </Link>
                                        ))}
                                        <div style={{ borderTop: "1px solid var(--border)", padding: "8px" }}>
                                            <button onClick={handleLogout} style={{
                                                width: "100%", padding: "10px 8px", borderRadius: 8,
                                                background: "transparent", border: "none",
                                                color: "var(--text-muted)", fontWeight: 600, fontSize: 14,
                                                cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                                            }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(17,17,17,0.06)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <span>🚪</span> Sair da conta
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="topbar-user">
                                <Link to="/planos" className="topbar-admin-link topbar-admin-link--planos">
                                    Planos
                                </Link>
                                <Link to="/login" className="topbar-cta">Entrar</Link>
                                {isHome && (
                                    <Link to="/cadastro" className="topbar-admin-link">Criar conta</Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hambúrguer — fora do topbar-actions, sempre visível no mobile */}
                    <button
                        className="hamburger"
                        onClick={() => setMenuAberto(o => !o)}
                        aria-label="Menu"
                        aria-expanded={menuAberto}
                    >
                        <span className={"hamburger-bar" + (menuAberto ? " hamburger-bar--top-open" : "")}/>
                        <span className={"hamburger-bar" + (menuAberto ? " hamburger-bar--mid-open" : "")}/>
                        <span className={"hamburger-bar" + (menuAberto ? " hamburger-bar--bot-open" : "")}/>
                    </button>

                </div>
            </header>

            {/* Menu mobile */}
            {menuAberto && (
                <div className="mobile-menu">
                    <div className="mobile-menu-inner">
                        <div className="mobile-menu-section">
                            <Link to="/"               className="mobile-menu-link" onClick={fecharMenu}>🏠 Home</Link>
                            <Link to="/excel"           className="mobile-menu-link" onClick={fecharMenu}>📊 Excel</Link>
                            <Link to="/pdf"             className="mobile-menu-link" onClick={fecharMenu}>📄 PDF</Link>
                            <Link to="/planos"          className="mobile-menu-link" onClick={fecharMenu}>💎 Planos</Link>
                            {autenticado && (
                                <Link to={rotaGestao}  className="mobile-menu-link" onClick={fecharMenu}>💰 Gestão Financeira</Link>
                            )}
                            {autenticado && (
                                <Link to="/historico"  className="mobile-menu-link" onClick={fecharMenu}>📋 Histórico</Link>
                            )}
                            {autenticado && usuario?.perfil === "ADMIN" && (
                                <Link to="/admin/usuarios" className="mobile-menu-link" onClick={fecharMenu}>⚙️ Admin</Link>
                            )}
                        </div>
                        <div className="mobile-menu-section" style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                            {autenticado ? (
                                <>
                                    <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12 }}>
                                        Logado como <strong style={{ color: "var(--text)" }}>{usuario?.nome}</strong>
                                    </div>
                                    <button className="mobile-menu-logout" onClick={handleLogout}>
                                        Sair da conta
                                    </button>
                                </>
                            ) : (
                                <div style={{ display: "flex", gap: 10 }}>
                                    <Link to="/login" className="topbar-cta"
                                          style={{ flex: 1, textAlign: "center" }} onClick={fecharMenu}>
                                        Entrar
                                    </Link>
                                    <Link to="/cadastro" className="topbar-cta-secondary"
                                          style={{ flex: 1, textAlign: "center" }} onClick={fecharMenu}>
                                        Criar conta
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {menuAberto && <div className="mobile-menu-overlay" onClick={fecharMenu}/>}
        </>
    );
}
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoSvg from "../assets/logo.svg";
import {
    LuChevronDown, LuSheet, LuWalletCards, LuClipboardList,
    LuBellRing, LuShieldCheck, LuLogOut, LuMenu, LuX,
    LuGem, LuUser
} from "react-icons/lu";
import { IcoExcel, IcoWallet } from "./icons.jsx";
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
        setDropdownAberto(false);
    }, [pathname]);

    // Fecha menu ao rolar
    useEffect(() => {
        if (!menuAberto) return;
        const fn = () => setMenuAberto(false);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, [menuAberto]);

    const navLinks = [
        { to: "/valida-cnab", label: "Conversor CNAB", icon: <LuSheet size={14}/> },
        { to: rotaGestao,     label: "Gestão Financeira", icon: <LuWalletCards size={14}/> },
        { to: "/planos",      label: "Planos", icon: <LuGem size={14}/> },
    ];

    const isActive = (to) => {
        if (to === rotaGestao) return ["/titulos", "/gestao-financeira"].includes(pathname);
        return pathname === to || pathname.startsWith(to + "/");
    };

    return (
        <>
            {/* ── Navbar ── */}
            <header style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
                background: "#FFFFFF",
                borderBottom: "1px solid rgba(30,41,59,0.1)",
                boxShadow: "0 1px 3px rgba(30,41,59,0.04)",
            }}>
                <div style={{
                    maxWidth: 1200, margin: "0 auto",
                    padding: "0 32px",
                    height: 64,
                    display: "flex", alignItems: "center", gap: 0,
                }}>

                    {/* ── Logo ── */}
                    <Link to="/" onClick={() => setMenuAberto(false)} style={{
                        display: "flex", alignItems: "center",
                        textDecoration: "none", flexShrink: 0, marginRight: 40,
                    }}>
                        <img
                            src={logoSvg}
                            alt="Whallet"
                            style={{ height: 54, width: "auto", display: "block" }}
                        />
                    </Link>

                    {/* ── Nav central — desktop ── */}
                    <nav style={{
                        display: "flex", alignItems: "center", gap: 2, flex: 1,
                    }} className="nb-nav-desktop">
                        {navLinks.map(link => (
                            <Link key={link.to} to={link.to} style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "6px 14px", borderRadius: 8,
                                fontSize: 13.5, fontWeight: 600,
                                textDecoration: "none",
                                color: isActive(link.to) ? "var(--cyan)" : "var(--text-muted)",
                                background: isActive(link.to) ? "rgba(6,182,212,0.07)" : "transparent",
                                transition: "all 0.15s",
                                whiteSpace: "nowrap",
                            }}
                                  onMouseEnter={e => { if (!isActive(link.to)) { e.currentTarget.style.background = "rgba(30,41,59,0.05)"; e.currentTarget.style.color = "var(--text)"; }}}
                                  onMouseLeave={e => { if (!isActive(link.to)) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* ── Ações direita ── */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
                    }} className="nb-actions-desktop">
                        {autenticado ? (
                            <div ref={dropdownRef} style={{ position: "relative" }}>
                                <button
                                    onClick={() => setDropdownAberto(o => !o)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        padding: "6px 12px 6px 6px",
                                        borderRadius: 99, border: "1px solid rgba(30,41,59,0.12)",
                                        background: "transparent", cursor: "pointer",
                                        transition: "border-color 0.15s, background 0.15s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)"; e.currentTarget.style.background = "rgba(6,182,212,0.04)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(30,41,59,0.12)"; e.currentTarget.style.background = "transparent"; }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: "var(--grad)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 800, color: "#083344",
                                    }}>{iniciais}</div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {usuario?.nome?.split(" ")[0]}
                                </span>
                                    <LuChevronDown size={13} style={{
                                        color: "var(--text-dim)",
                                        transform: dropdownAberto ? "rotate(180deg)" : "none",
                                        transition: "transform 0.2s",
                                    }}/>
                                </button>

                                {/* Dropdown */}
                                {dropdownAberto && (
                                    <div style={{
                                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                                        background: "#FFFFFF", border: "1px solid rgba(30,41,59,0.1)",
                                        borderRadius: 14, minWidth: 220, zIndex: 999,
                                        boxShadow: "0 8px 32px rgba(30,41,59,0.12)",
                                        overflow: "hidden",
                                    }}>
                                        {/* Info usuário */}
                                        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(30,41,59,0.07)" }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{usuario?.nome}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{usuario?.email}</div>
                                        </div>

                                        {/* Links */}
                                        {[
                                            { to: "/historico",            icon: <LuClipboardList size={15}/>, label: "Histórico CNAB" },
                                            { to: "/preferencias-alerta",  icon: <LuBellRing size={15}/>,     label: "Alertas de e-mail" },
                                            ...(usuario?.perfil === "ADMIN"
                                                ? [{ to: "/admin/usuarios", icon: <LuShieldCheck size={15}/>, label: "Admin" }]
                                                : []),
                                        ].map(item => (
                                            <Link key={item.to} to={item.to}
                                                  onClick={() => setDropdownAberto(false)}
                                                  style={{
                                                      display: "flex", alignItems: "center", gap: 10,
                                                      padding: "10px 16px", color: "var(--text-muted)",
                                                      textDecoration: "none", fontSize: 13.5, fontWeight: 500,
                                                      transition: "background 0.1s, color 0.1s",
                                                  }}
                                                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(30,41,59,0.04)"; e.currentTarget.style.color = "var(--text)"; }}
                                                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                            >
                                                <span style={{ color: "var(--text-dim)" }}>{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        ))}

                                        {/* Logout */}
                                        <div style={{ borderTop: "1px solid rgba(30,41,59,0.07)", padding: "6px 8px" }}>
                                            <button onClick={handleLogout} style={{
                                                width: "100%", padding: "9px 8px", borderRadius: 8,
                                                background: "transparent", border: "none",
                                                color: "var(--text-muted)", fontWeight: 600, fontSize: 13.5,
                                                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                                                transition: "background 0.1s",
                                            }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.05)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                <LuLogOut size={15} style={{ color: "var(--error)" }}/>
                                                Sair da conta
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" style={{
                                    padding: "7px 16px", borderRadius: 8,
                                    fontSize: 13.5, fontWeight: 600, color: "var(--text-muted)",
                                    textDecoration: "none", transition: "color 0.15s",
                                }}
                                      onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                                >Entrar</Link>
                                <Link to="/cadastro" style={{
                                    padding: "7px 18px", borderRadius: 8,
                                    background: "var(--grad)", color: "#083344",
                                    fontSize: 13.5, fontWeight: 700, textDecoration: "none",
                                    transition: "opacity 0.15s",
                                }}
                                      onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                >Criar conta</Link>
                            </>
                        )}
                    </div>

                    {/* ── Hamburger mobile ── */}
                    <button
                        onClick={() => setMenuAberto(o => !o)}
                        className="nb-hamburger"
                        aria-label="Menu"
                        style={{
                            display: "none",
                            background: "none", border: "none",
                            padding: 8, cursor: "pointer", marginLeft: "auto",
                            color: "var(--text)",
                        }}
                    >
                        {menuAberto ? <LuX size={22}/> : <LuMenu size={22}/>}
                    </button>
                </div>
            </header>

            {/* ── Menu mobile ── */}
            {menuAberto && (
                <>
                    <div style={{
                        position: "fixed", top: 64, left: 0, right: 0, zIndex: 199,
                        background: "#FFFFFF",
                        borderBottom: "1px solid rgba(30,41,59,0.1)",
                        boxShadow: "0 8px 24px rgba(30,41,59,0.08)",
                        animation: "nbSlideDown 0.18s ease",
                    }}>
                        <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
                            {/* Nav links */}
                            {navLinks.map(link => (
                                <Link key={link.to} to={link.to}
                                      onClick={() => setMenuAberto(false)}
                                      style={{
                                          display: "flex", alignItems: "center", gap: 10,
                                          padding: "12px 14px", borderRadius: 10,
                                          fontSize: 15, fontWeight: 600,
                                          textDecoration: "none",
                                          color: isActive(link.to) ? "var(--cyan)" : "var(--text-muted)",
                                          background: isActive(link.to) ? "rgba(6,182,212,0.07)" : "transparent",
                                      }}
                                >
                                    {link.icon} {link.label}
                                </Link>
                            ))}

                            {autenticado && <>
                                <div style={{ height: 1, background: "rgba(30,41,59,0.07)", margin: "8px 0" }}/>
                                <Link to="/historico"            onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--text-muted)" }}><LuClipboardList size={15}/> Histórico CNAB</Link>
                                <Link to="/preferencias-alerta" onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--text-muted)" }}><LuBellRing size={15}/> Alertas de e-mail</Link>
                                {usuario?.perfil === "ADMIN" && (
                                    <Link to="/admin/usuarios" onClick={() => setMenuAberto(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--text-muted)" }}><LuShieldCheck size={15}/> Admin</Link>
                                )}
                            </>}

                            {/* Auth section */}
                            <div style={{ height: 1, background: "rgba(30,41,59,0.07)", margin: "8px 0" }}/>
                            {autenticado ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{usuario?.nome}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{usuario?.email}</div>
                                    </div>
                                    <button onClick={handleLogout} style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "8px 14px", borderRadius: 8,
                                        background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)",
                                        color: "var(--error)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                    }}><LuLogOut size={14}/> Sair</button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", gap: 10, padding: "4px 0" }}>
                                    <Link to="/login" onClick={() => setMenuAberto(false)} style={{
                                        flex: 1, textAlign: "center", padding: "11px",
                                        borderRadius: 10, border: "1px solid rgba(30,41,59,0.12)",
                                        fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none",
                                    }}>Entrar</Link>
                                    <Link to="/cadastro" onClick={() => setMenuAberto(false)} style={{
                                        flex: 1, textAlign: "center", padding: "11px",
                                        borderRadius: 10, background: "var(--grad)",
                                        fontSize: 14, fontWeight: 700, color: "#083344", textDecoration: "none",
                                    }}>Criar conta</Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <div onClick={() => setMenuAberto(false)} style={{
                        position: "fixed", inset: 0, top: 64, zIndex: 198,
                        background: "rgba(30,41,59,0.25)",
                    }}/>
                </>
            )}

            <style>{`
            @keyframes nbSlideDown {
                from { opacity: 0; transform: translateY(-8px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            @media (max-width: 768px) {
                .nb-nav-desktop { display: none !important; }
                .nb-actions-desktop { display: none !important; }
                .nb-hamburger { display: flex !important; }
            }
        `}</style>
        </>
    );
}
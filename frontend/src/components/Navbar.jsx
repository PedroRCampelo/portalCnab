import { Link, useLocation, useNavigate } from "react-router-dom";
import logoWhale from "../assets/logo.png";
import { IcoExcel, IcoPdf, IcoBack } from "./icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const { pathname }          = useLocation();
    const navigate              = useNavigate();
    const { autenticado, usuario, logout } = useAuth();
    const isHome = pathname === "/";

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="topbar">
            <div className="topbar-gradient-line" aria-hidden="true"/>
            <div className="topbar-inner">

                {/* Brand */}
                <Link to="/" className="brand brand-btn">
                    <div className="brand-whale-wrap">
                        <img src={logoWhale} alt="" className="brand-whale"/>
                    </div>
                    <span className="brand-wordmark">Whallet</span>
                </Link>

                {/* Nav central */}
                {isHome ? (
                    <nav className="topbar-nav" aria-label="Navegacao principal">
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
                            <Link to="/excel"
                                  className={`nav-link ${pathname==="/excel"?"nav-link--active":""}`}>
                                <IcoExcel/><span className="nav-link-text"> Excel</span>
                            </Link>
                            <div className="nav-divider"/>
                            <Link to="/pdf"
                                  className={`nav-link ${pathname==="/pdf"?"nav-link--active":""}`}>
                                <IcoPdf/><span className="nav-link-text"> PDF</span>
                            </Link>
                        </div>
                    </nav>
                )}

                {/* Direita */}
                <div className="topbar-actions">
          <span className="topbar-badge">
            <span className="topbar-badge-dot"/>
            7 layouts ativos
          </span>

                    {autenticado ? (
                        <div className="topbar-user">
                            {usuario?.perfil === "ADMIN" && (
                                <Link to="/admin/usuarios" className="topbar-admin-link">
                                    Admin
                                </Link>
                            )}
                            <span className="topbar-user-nome">{usuario?.nome}</span>
                            <button className="topbar-logout" onClick={handleLogout}>
                                Sair
                            </button>
                        </div>
                    ) : (
                        isHome && (
                            <Link to="/excel" className="topbar-cta">
                                Começar <IcoArrow/>
                            </Link>
                        )
                    )}
                </div>

            </div>
        </header>
    );
}

function IcoArrow() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}
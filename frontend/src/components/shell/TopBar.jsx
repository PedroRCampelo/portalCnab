import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    LuMenu, LuChevronDown, LuBuilding2, LuBell, LuLogOut,
    LuSettings, LuUserCog, LuShieldCheck,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext.jsx";
import { useShell } from "./ShellContext.jsx";
import "./TopBar.css";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

/**
 * TopBar — Barra superior do shell
 * Sprint A3.1
 *
 * Estrutura:
 *  Esquerda: Menu (☰) + Brand + Seletor de Empresa
 *  Direita:  Trial badge + Notificações + Avatar (com dropdown)
 *
 * Props:
 *  onMobileMenuToggle: função pra abrir/fechar sidebar em mobile
 *  mobileOpen: estado da sidebar mobile (afeta ícone do botão)
 */
export default function TopBar({ onMobileMenuToggle, mobileOpen = false }) {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();
    const { toggleSidebar } = useShell();

    const [dropdownAberto, setDropdownAberto] = useState(false);
    const dropdownRef = useRef(null);

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temWhalletPlus = isAdmin || usuario?.planoId === PLANO_WHALLET_PLUS;
    const empresa        = usuario?.empresa ?? null;

    const iniciais = usuario?.nome
        ? usuario.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
        : "?";

    const empresaIniciais = empresa?.nome
        ? empresa.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
        : (usuario?.nome ? usuario.nome.split(" ")[0][0]?.toUpperCase() : "W");

    // Trial info (graceful fallback se backend não emite)
    const diasTrial = calcularDiasTrial(usuario);
    const trialAtivo = diasTrial !== null && diasTrial > 0;
    const trialCritico = trialAtivo && diasTrial <= 3;

    // Click fora fecha dropdown
    useEffect(() => {
        function handleClickFora(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, []);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    /**
     * Toggle do menu — em desktop colapsa sidebar, em mobile abre/fecha overlay
     */
    function handleMenuClick() {
        if (window.innerWidth <= 900) {
            onMobileMenuToggle?.();
        } else {
            toggleSidebar();
        }
    }

    return (
        <header className="shell-topbar">
            <div className="tb">

                {/* ─── Esquerda ────────────────────────────────────── */}
                <div className="tb-left">
                    <button
                        className="tb-menu-btn"
                        onClick={handleMenuClick}
                        aria-label="Toggle menu"
                    >
                        <LuMenu size={18}/>
                    </button>

                    <Link to="/fluxo-caixa" className="tb-brand">
                        whallet<span className="tb-brand-dot"/>
                    </Link>

                    {/* Seletor de empresa — TODO: dropdown quando multi-empresa */}
                    <button className="tb-empresa">
                        <div className="tb-empresa-icon">
                            {empresa?.logoBase64
                                ? <img src={empresa.logoBase64} alt="" className="tb-empresa-logo"/>
                                : empresaIniciais
                            }
                        </div>
                        <div className="tb-empresa-text">
                            <span className="tb-empresa-label">Empresa</span>
                            <span className="tb-empresa-name">
                                {empresa?.nome ?? "Minha Empresa"}
                            </span>
                        </div>
                        <LuChevronDown size={13} className="tb-empresa-chevron"/>
                    </button>
                </div>

                {/* ─── Direita ─────────────────────────────────────── */}
                <div className="tb-right">

                    {/* Trial badge — graceful fallback */}
                    {trialAtivo && (
                        <Link
                            to="/planos"
                            className={`tb-trial ${trialCritico ? "critical" : ""}`}
                        >
                            <span className="tb-trial-dot"/>
                            {diasTrial === 1
                                ? "Último dia do trial"
                                : `${diasTrial} dias do trial`
                            }
                        </Link>
                    )}

                    {/* Notificações (futuro) */}
                    <button className="tb-icon-btn" aria-label="Notificações">
                        <LuBell size={18}/>
                        {/* <span className="tb-icon-btn-dot"/> ← descomente quando houver notificação */}
                    </button>

                    {/* Avatar com dropdown */}
                    <div ref={dropdownRef} className="tb-user-wrap">
                        <button
                            onClick={() => setDropdownAberto(o => !o)}
                            className="tb-user"
                        >
                            <div className="tb-user-avatar">{iniciais}</div>
                            <span className="tb-user-name">
                                {usuario?.nome?.split(" ")[0]}
                            </span>
                            <LuChevronDown
                                size={13}
                                className={`tb-user-chevron ${dropdownAberto ? "open" : ""}`}
                            />
                        </button>

                        {dropdownAberto && (
                            <div className="tb-user-dropdown">
                                <div className="tb-user-info">
                                    <div className="tb-user-info-name">
                                        {usuario?.nome ?? "Usuário"}
                                    </div>
                                    <div className="tb-user-info-email">
                                        {usuario?.email}
                                    </div>
                                    {temWhalletPlus && (
                                        <div className="tb-user-info-plan">Whallet+</div>
                                    )}
                                </div>

                                <Link
                                    to="/configuracoes"
                                    onClick={() => setDropdownAberto(false)}
                                    className="tb-user-item"
                                >
                                    <span className="tb-user-item-icon">
                                        <LuSettings size={15}/>
                                    </span>
                                    Configurações
                                </Link>

                                <Link
                                    to="/planos"
                                    onClick={() => setDropdownAberto(false)}
                                    className="tb-user-item"
                                >
                                    <span className="tb-user-item-icon">
                                        <LuUserCog size={15}/>
                                    </span>
                                    Planos & assinatura
                                </Link>

                                {isAdmin && (
                                    <Link
                                        to="/admin/usuarios"
                                        onClick={() => setDropdownAberto(false)}
                                        className="tb-user-item"
                                    >
                                        <span className="tb-user-item-icon">
                                            <LuShieldCheck size={15}/>
                                        </span>
                                        Admin
                                    </Link>
                                )}

                                <div className="tb-user-divider"/>

                                <button onClick={handleLogout} className="tb-user-logout">
                                    <LuLogOut size={15}/>
                                    Sair da conta
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function calcularDiasTrial(usuario) {
    if (!usuario) return null;
    if (usuario.assinaturaStatus !== "TRIAL") return null;
    if (!usuario.trialExpiraEm) return null;

    const expira = new Date(usuario.trialExpiraEm).getTime();
    const agora  = Date.now();
    if (expira <= agora) return 0;

    return Math.ceil((expira - agora) / (1000 * 60 * 60 * 24));
}
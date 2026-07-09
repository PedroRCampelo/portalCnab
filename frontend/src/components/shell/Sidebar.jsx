import { Link, useLocation } from "react-router-dom";
import {
    LuActivity, LuHandCoins, LuWalletCards, LuUsers, LuTag,
    LuFileText,
    LuSettings, LuPin, LuPinOff, LuBellRing,
    LuShoppingCart, LuFileCheck, LuTruck,
} from "react-icons/lu";
import { useAuth } from "../../context/AuthContext.jsx";
import { useShell } from "./ShellContext.jsx";
import "./Sidebar.css";

/**
 * Sidebar — Navegação lateral do shell
 * Sprint A3.1 · ERP-style layout
 *
 * Estrutura:
 *  Body (scrollável):
 *    - VISÃO GERAL: Fluxo de Caixa
 *    - GESTÃO: Recebimentos, Títulos, Clientes, Tipos de Gasto
 *    - RELATÓRIOS: Relatórios
 *
 *  Footer (fixo):
 *    - Configurações
 *    - Alertas de email
 *    - [Pin button]
 *
 * Props:
 *  onItemClick: callback ao clicar em item (usado pra fechar sidebar mobile)
 */

const MENU = [
    {
        label: "Visão geral",
        items: [
            { to: "/fluxo-caixa", icon: LuActivity, label: "Fluxo de Caixa" },
        ],
    },
    {
        label: "Gestão",
        items: [
            { to: "/recebimentos", icon: LuHandCoins,   label: "Recebimentos" },
            { to: "/titulos",      icon: LuWalletCards, label: "Títulos a pagar" },
            { to: "/clientes",     icon: LuUsers,       label: "Clientes" },
            { to: "/categorias",   icon: LuTag,         label: "Categorias" },
        ],
    },
    {
        label: "Comercial",
        items: [
            { to: "/orcamentos",    icon: LuFileCheck,    label: "Orçamentos"       },
            { to: "/pedidos-venda", icon: LuShoppingCart, label: "Pedidos de Venda" },
            { to: "/cargas",        icon: LuTruck,        label: "Cargas"           },
        ],
    },
    {
        label: "Relatórios",
        items: [
            { to: "/relatorios", icon: LuFileText, label: "Relatórios" },
        ],
    },
];

const FOOTER_ITEMS = [
    { to: "/preferencias-alerta", icon: LuBellRing, label: "Alertas de email" },
    { to: "/configuracoes",       icon: LuSettings, label: "Configurações" },
];

export default function Sidebar({ onItemClick }) {
    const { pathname } = useLocation();
    const { sidebarPinned, togglePin } = useShell();
    const { usuario } = useAuth();

    const isAdmin = usuario?.perfil === "ADMIN";

    function isActive(to) {
        // Match exato
        if (pathname === to) return true;
        // Match de sub-rota: /recebimentos/123 ativa /recebimentos
        if (to !== "/" && pathname.startsWith(to + "/")) return true;
        return false;
    }

    function handleItemClick() {
        onItemClick?.();
    }

    return (
        <aside className="shell-sidebar">
            <div className="sb">

                {/* ─── Body com grupos ──────────────────────────────────── */}
                <div className="sb-body">
                    {MENU.map(grupo => (
                        <div key={grupo.label} className="sb-group">
                            <span className="sb-group-label">{grupo.label}</span>
                            {grupo.items.map(item => {
                                const Icon = item.icon;
                                const ativo = isActive(item.to);
                                if (item.disabled) {
                                    return (
                                        <span
                                            key={item.to}
                                            className="sb-item sb-item--disabled"
                                            data-tooltip={`${item.label} (em breve)`}
                                        >
                                            <span className="sb-item-icon"><Icon size={16}/></span>
                                            <span className="sb-item-label">{item.label}</span>
                                        </span>
                                    );
                                }
                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        onClick={handleItemClick}
                                        className={`sb-item ${ativo ? "active" : ""}`}
                                        data-tooltip={item.label}
                                    >
                                        <span className="sb-item-icon">
                                            <Icon size={16}/>
                                        </span>
                                        <span className="sb-item-label">{item.label}</span>
                                        {item.badge != null && (
                                            <span className="sb-item-badge">{item.badge}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}

                    {/* Admin section (só pra admin) */}
                    {isAdmin && (
                        <div className="sb-group">
                            <span className="sb-group-label">Admin</span>
                            <Link
                                to="/admin/usuarios"
                                onClick={handleItemClick}
                                className={`sb-item ${isActive("/admin/usuarios") ? "active" : ""}`}
                                data-tooltip="Usuários"
                            >
                                <span className="sb-item-icon">
                                    <LuUsers size={16}/>
                                </span>
                                <span className="sb-item-label">Usuários</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* ─── Footer fixo ──────────────────────────────────────── */}
                <div className="sb-footer">
                    {FOOTER_ITEMS.map(item => {
                        const Icon = item.icon;
                        const ativo = isActive(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={handleItemClick}
                                className={`sb-item ${ativo ? "active" : ""}`}
                                data-tooltip={item.label}
                            >
                                <span className="sb-item-icon">
                                    <Icon size={16}/>
                                </span>
                                <span className="sb-item-label">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Linha com último item + botão de pin */}
                    <div className="sb-footer-row" style={{ marginTop: 4 }}>
                        <button
                            className={`sb-pin-btn ${sidebarPinned ? "active" : ""}`}
                            onClick={togglePin}
                            aria-label={sidebarPinned ? "Desfixar sidebar" : "Fixar sidebar"}
                            title={sidebarPinned ? "Desfixar sidebar" : "Fixar sidebar"}
                        >
                            {sidebarPinned ? <LuPinOff size={14}/> : <LuPin size={14}/>}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
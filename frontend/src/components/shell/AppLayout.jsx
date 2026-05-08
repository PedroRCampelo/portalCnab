import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useShell } from "./ShellContext.jsx";
import TopBar from "./TopBar.jsx";
import Sidebar from "./Sidebar.jsx";
import "./AppLayout.css";

/**
 * AppLayout — Shell do app interno
 *
 * Sprint A3.1 · ERP-style layout
 *
 * Compõe TopBar + Sidebar + Content (via Outlet do react-router).
 *
 * Uso no App.jsx:
 *   <Route element={<AppLayout/>}>
 *     <Route path="/fluxo-caixa" element={<FluxoCaixaPage/>}/>
 *     ...
 *   </Route>
 */
export default function AppLayout() {
    const { sidebarCollapsed } = useShell();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Fecha sidebar mobile ao mudar de tamanho de tela (>900px)
    useEffect(() => {
        function onResize() {
            if (window.innerWidth > 900) setMobileOpen(false);
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Fecha sidebar mobile com tecla ESC
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") setMobileOpen(false);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const shellClasses = [
        "shell",
        sidebarCollapsed && "sidebar-collapsed",
        mobileOpen && "sidebar-mobile-open",
    ].filter(Boolean).join(" ");

    return (
        <div
            className={shellClasses}
            onClick={(e) => {
                // Click no overlay (::before do .shell em mobile) fecha sidebar
                if (mobileOpen && e.target === e.currentTarget) {
                    setMobileOpen(false);
                }
            }}
        >
            <TopBar
                onMobileMenuToggle={() => setMobileOpen(o => !o)}
                mobileOpen={mobileOpen}
            />

            <Sidebar onItemClick={() => setMobileOpen(false)}/>

            <main className="shell-content">
                <div className="shell-content-inner">
                    <Outlet/>
                </div>
            </main>
        </div>
    );
}
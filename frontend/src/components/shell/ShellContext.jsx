import { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * ShellContext — Estado global do shell do app.
 *
 * Sprint A3.1 · App Shell ERP-style
 *
 * Gerencia:
 *  - sidebarCollapsed: se a sidebar está colapsada (true) ou expandida (false)
 *  - sidebarPinned:    se o usuário fixou o estado (não muda ao mudar de rota)
 *
 * Persistência: ambos os estados são salvos no localStorage
 * sob a chave "shell-prefs", restaurados ao carregar a aplicação.
 */

const ShellContext = createContext(null);
const STORAGE_KEY = "shell-prefs";

function lerPrefsSalvas() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function salvarPrefs(prefs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // silently ignore — localStorage pode estar bloqueado
    }
}

export function ShellProvider({ children }) {
    // Estado inicial vem do localStorage ou padrão (expandida + não fixada)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const prefs = lerPrefsSalvas();
        return prefs?.sidebarCollapsed ?? false;
    });

    const [sidebarPinned, setSidebarPinned] = useState(() => {
        const prefs = lerPrefsSalvas();
        return prefs?.sidebarPinned ?? false;
    });

    // Persiste mudanças
    useEffect(() => {
        salvarPrefs({ sidebarCollapsed, sidebarPinned });
    }, [sidebarCollapsed, sidebarPinned]);

    // Toggle simples — alterna entre colapsada e expandida
    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(c => !c);
    }, []);

    // Toggle do pin — quando fixa, mantém o estado atual
    const togglePin = useCallback(() => {
        setSidebarPinned(p => !p);
    }, []);

    return (
        <ShellContext.Provider
            value={{
                sidebarCollapsed,
                sidebarPinned,
                toggleSidebar,
                togglePin,
                setSidebarCollapsed,
            }}
        >
            {children}
        </ShellContext.Provider>
    );
}

export function useShell() {
    const ctx = useContext(ShellContext);
    if (!ctx) throw new Error("useShell deve ser usado dentro de ShellProvider");
    return ctx;
}
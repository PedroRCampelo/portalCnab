import { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api.js";

// Contexto de autenticacao — disponivel em toda a aplicacao
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => {
        // localStorage persiste entre abas e recarregamentos
        try {
            const salvo = localStorage.getItem("auth");
            if (!salvo) return null;
            const parsed = JSON.parse(salvo);
            // Sessão expirada: trata como deslogado em vez de manter estado autenticado
            // até o primeiro 401 do backend.
            if (parsed?.expiraEm && parsed.expiraEm <= Date.now()) {
                localStorage.removeItem("auth");
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    });

    const login = useCallback((dadosAuth) => {
        setUsuario(dadosAuth);
        localStorage.setItem("auth", JSON.stringify(dadosAuth));
    }, []);

    const logout = useCallback(() => {
        setUsuario(null);
        localStorage.removeItem("auth");
    }, []);

    // Atualiza apenas campos específicos do usuário (planoId, assinatura)
    // sem precisar fazer logout/login — usado após checkout
    const atualizarUsuario = useCallback(async () => {
        try {
            const { data } = await api.get("/api/usuario/me");
            setUsuario(prev => {
                if (!prev) return prev;
                const atualizado = { ...prev, ...data };
                localStorage.setItem("auth", JSON.stringify(atualizado));
                return atualizado;
            });
        } catch {
            // Silencioso — falha não quebra a sessão
        }
    }, []);

    const token = usuario?.token ?? null;
    const autenticado = !!token;

    return (
        <AuthContext.Provider value={{ usuario, token, autenticado, login, logout, atualizarUsuario }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para usar o contexto de autenticacao em qualquer componente
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
    return ctx;
}
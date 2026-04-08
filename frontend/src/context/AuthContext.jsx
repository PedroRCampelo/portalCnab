import { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api.js";

// Contexto de autenticacao — disponivel em toda a aplicacao
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => {
        // Tenta restaurar sessao do sessionStorage ao recarregar a pagina
        // sessionStorage e limpo ao fechar o navegador — mais seguro que localStorage
        try {
            const salvo = sessionStorage.getItem("auth");
            return salvo ? JSON.parse(salvo) : null;
        } catch {
            return null;
        }
    });

    const login = useCallback((dadosAuth) => {
        // dadosAuth e o objeto retornado pelo POST /api/auth/login
        setUsuario(dadosAuth);
        sessionStorage.setItem("auth", JSON.stringify(dadosAuth));
    }, []);

    const logout = useCallback(() => {
        setUsuario(null);
        sessionStorage.removeItem("auth");
    }, []);

    // Atualiza apenas campos específicos do usuário (planoId, assinatura)
    // sem precisar fazer logout/login — usado após checkout
    const atualizarUsuario = useCallback(async () => {
        try {
            const { data } = await api.get("/api/usuario/me");
            setUsuario(prev => {
                if (!prev) return prev;
                const atualizado = { ...prev, ...data };
                sessionStorage.setItem("auth", JSON.stringify(atualizado));
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
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
    timeout: 30000,
});

// Injeta o token JWT em todas as requisições automaticamente
api.interceptors.request.use((config) => {
    try {
        const auth = localStorage.getItem("auth");
        if (auth) {
            const { token } = JSON.parse(auth);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // localStorage indisponível ou dado corrompido — segue sem token
    }
    return config;
});

// Trata respostas de erro globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const paginaAtual   = window.location.pathname;
            const requestUrl    = error.config?.url ?? "";

            const emPaginaAuth = ["/login", "/cadastro", "/verificar-email", "/redefinir-senha", "/esqueci-senha", "/upgrade/sucesso", "/upgrade/cancelado"]
                .includes(paginaAtual);

            const ehRotaPublica = requestUrl.includes("/api/cnab/anonimo/")
                || requestUrl.includes("/api/cnab/export-bank")
                || requestUrl.includes("/api/cnab/report-bank");

            const estaAutenticado = !!localStorage.getItem("auth");

            if (!emPaginaAuth && !ehRotaPublica && estaAutenticado) {
                localStorage.removeItem("auth");
                window.location.href = "/login?sessao=expirada";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
    timeout: 30000,
});

// Injeta o token JWT em todas as requisições automaticamente
api.interceptors.request.use((config) => {
    try {
        const auth = sessionStorage.getItem("auth");
        if (auth) {
            const { token } = JSON.parse(auth);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // sessionStorage indisponível ou dado corrompido — segue sem token
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

            // Só redireciona para login se:
            // 1. Não estiver já em página de autenticação
            // 2. A requisição veio de uma rota que requer token (não rota pública)
            const emPaginaAuth = ["/login", "/cadastro", "/verificar-email", "/redefinir-senha", "/esqueci-senha", "/upgrade/sucesso", "/upgrade/cancelado"]
                .includes(paginaAtual);

            // Rotas que são públicas e podem retornar 401 para anônimos
            const ehRotaPublica = requestUrl.includes("/api/cnab/anonimo/")
                || requestUrl.includes("/api/cnab/export-bank")
                || requestUrl.includes("/api/cnab/report-bank");

            // Só faz logout se estiver autenticado e o token for inválido/expirado
            const estaAutenticado = !!sessionStorage.getItem("auth");

            if (!emPaginaAuth && !ehRotaPublica && estaAutenticado) {
                sessionStorage.removeItem("auth");
                window.location.href = "/login?sessao=expirada";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
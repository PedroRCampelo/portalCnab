import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
    timeout: 30000,
});

// Injeta o token JWT em todas as requisicoes automaticamente
api.interceptors.request.use((config) => {
    try {
        const auth = sessionStorage.getItem("auth");
        if (auth) {
            const { token } = JSON.parse(auth);
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // sessionStorage indisponivel ou dado corrompido — segue sem token
    }
    return config;
});

// Trata respostas de erro globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Redireciona para login APENAS quando o token expirou ou e invalido
        // Erros 400, 409, 500 devem ser tratados pelo componente que chamou
        if (error.response?.status === 401) {
            const url = window.location.pathname;
            // Nao redireciona se ja estiver no login ou cadastro
            if (url !== "/login" && url !== "/cadastro" && url !== "/verificar-email") {
                sessionStorage.removeItem("auth");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
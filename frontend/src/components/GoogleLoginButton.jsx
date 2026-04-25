import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SCRIPT_SRC   = "https://accounts.google.com/gsi/client";

// ── Estado global compartilhado entre instâncias do componente ─────────────
// Evita re-inicializar GIS toda vez que o componente monta (LoginPage,
// CadastroPage, ou re-render do React StrictMode em dev).
let scriptCarregadoPromise = null;
let gisInicializado = false;
// Cada componente registra seu próprio callback aqui — quando o Google
// dispara o callback global, despachamos pro callback ativo no momento.
let callbackAtivo = null;

function carregarScriptGoogle() {
    if (scriptCarregadoPromise) return scriptCarregadoPromise;

    scriptCarregadoPromise = new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src   = GIS_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload  = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return scriptCarregadoPromise;
}

function inicializarGIS() {
    if (gisInicializado) return;

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        // Callback "roteador" — chama quem estiver ativo no momento
        callback: (response) => {
            if (callbackAtivo) callbackAtivo(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
    });

    gisInicializado = true;
}

/**
 * Renderiza o botão oficial "Sign in with Google" do Google Identity Services.
 *
 * @param onSuccess  recebe o ID Token JWT do Google
 * @param onError    chamado em falha de configuração ou rede
 * @param disabled   desabilita o botão (ex: durante request)
 * @param texto      "signin_with" | "signup_with" | "continue_with"
 */
export default function GoogleLoginButton({
                                              onSuccess,
                                              onError,
                                              disabled = false,
                                              texto = "continue_with",
                                          }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.error("VITE_GOOGLE_CLIENT_ID não está configurado");
            onError?.("Google não configurado. Use email/senha.");
            return;
        }

        let cancelado = false;

        // Registra o callback desta instância como o ativo
        callbackAtivo = onSuccess;

        carregarScriptGoogle()
            .then(() => {
                if (cancelado || !containerRef.current) return;

                inicializarGIS();

                // Renderiza o botão dentro do container desta instância
                window.google.accounts.id.renderButton(containerRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: texto,
                    shape: "rectangular",
                    logo_alignment: "left",
                    width: containerRef.current.offsetWidth || 320,
                    locale: "pt-BR",
                });
            })
            .catch((err) => {
                console.error("Falha ao carregar Google Identity Services", err);
                onError?.("Não foi possível carregar o login do Google");
            });

        return () => {
            cancelado = true;
            // Se este componente era o "dono" do callback, remove
            // (próxima instância vai re-registrar o seu)
            if (callbackAtivo === onSuccess) {
                callbackAtivo = null;
            }
        };
    }, [onSuccess, onError, texto]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? "none" : "auto",
            }}
            aria-label="Entrar com Google"
        />
    );
}
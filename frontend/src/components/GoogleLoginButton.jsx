import { useEffect, useRef, useCallback } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SCRIPT_SRC   = "https://accounts.google.com/gsi/client";

// ── Estado global compartilhado entre instâncias do componente ─────────────
let scriptCarregadoPromise = null;
let gisInicializado = false;
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
    const botaoRenderizado = useRef(false);

    // Guarda os callbacks em refs pra não causar re-render do useEffect
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef   = useRef(onError);
    onSuccessRef.current = onSuccess;
    onErrorRef.current   = onError;

    // Callback estável que lê sempre o ref mais recente
    const handleSuccess = useCallback((credential) => {
        onSuccessRef.current?.(credential);
    }, []);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.error("VITE_GOOGLE_CLIENT_ID não está configurado");
            onErrorRef.current?.("Google não configurado. Use email/senha.");
            return;
        }

        // Registra o callback desta instância como o ativo
        callbackAtivo = handleSuccess;

        // Só renderiza o botão uma vez
        if (botaoRenderizado.current) return;

        let cancelado = false;

        carregarScriptGoogle()
            .then(() => {
                if (cancelado || !containerRef.current) return;

                inicializarGIS();

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

                botaoRenderizado.current = true;
            })
            .catch((err) => {
                console.error("Falha ao carregar Google Identity Services", err);
                onErrorRef.current?.("Não foi possível carregar o login do Google");
            });

        return () => {
            cancelado = true;
            if (callbackAtivo === handleSuccess) {
                callbackAtivo = null;
            }
        };
    }, [handleSuccess, texto]);

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
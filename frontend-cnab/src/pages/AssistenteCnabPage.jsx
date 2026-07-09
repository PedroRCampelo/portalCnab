import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CnabChatPage from "./CnabChatPage.jsx";

/**
 * AssistenteCnabPage — Roteador para o chat do Elvis
 * Sprint A3.9 · Frontend · Refatorado para liberar Free
 *
 * Estados:
 *  - Anônimo            → redireciona pra /cadastro
 *  - Logado (qualquer)  → renderiza CnabChatPage diretamente
 *                         (gate de quota acontece dentro do chat)
 *
 * Mudança importante:
 *  ANTES: Free via paywall e não conseguia entrar
 *  AGORA: Free entra direto, vê badge "X de 5 usadas", pode usar até atingir
 *         limite (depois disso, banner de upgrade dentro do chat)
 *
 * Por que essa mudança?
 *   Conversão real: quem nunca testou nunca vai assinar.
 *   5 perguntas/mês são suficientes pro "aha moment" sem comprometer custos.
 */
export default function AssistenteCnabPage() {
    const { autenticado } = useAuth();
    const navigate = useNavigate();

    // Anônimo → manda pro cadastro
    if (!autenticado) {
        navigate("/cadastro", { state: { redirectTo: "/assistente-cnab" } });
        return (
            <div className="acn-redirect">
                <p className="acn-redirect-text">Redirecionando…</p>
                <p className="acn-redirect-sub">
                    Você precisa estar logado pra usar o Elvis.{" "}
                    <Link to="/login" className="acn-redirect-link">Já tenho conta</Link>
                </p>

                <style>{REDIRECT_CSS}</style>
            </div>
        );
    }

    // Logado (qualquer plano): vai direto pro chat
    // Quota é validada por pergunta dentro do CnabChatPage
    return <CnabChatPage/>;
}

const REDIRECT_CSS = `
.acn-redirect {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px;
    text-align: center;
}

.acn-redirect-text {
    margin: 0;
    font-family: var(--ff-sans);
    font-size: 16px;
    font-weight: 600;
    color: var(--navy-deep);
}

.acn-redirect-sub {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
}

.acn-redirect-link {
    color: var(--cyan-dark);
    font-weight: 600;
    text-decoration: none;
}

.acn-redirect-link:hover {
    text-decoration: underline;
}
`;
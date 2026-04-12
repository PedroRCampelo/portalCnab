import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LuPartyPopper, LuArrowRight, LuCircleSlash } from "react-icons/lu";

const PLANO_PRO          = "10000000-0000-0000-0000-000000000002";
const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export function UpgradeSucessoPage() {
    const { usuario, atualizarUsuario } = useAuth();
    const navigate = useNavigate();
    const [tentativas, setTentativas] = useState(0);
    const [planoAtivado, setPlanoAtivado] = useState(false);

    const planoAtual = usuario?.planoId;
    const temPlano   = planoAtual === PLANO_PRO || planoAtual === PLANO_WHALLET_PLUS;
    const nomePlano  = planoAtual === PLANO_WHALLET_PLUS ? "Whallet+" : "Pro";

    useEffect(() => {
        // Tenta atualizar até 8 vezes com intervalo crescente
        // Dá tempo para o webhook do Stripe processar
        if (planoAtivado || temPlano) {
            setPlanoAtivado(true);
            return;
        }
        if (tentativas >= 8) return;

        const delay = tentativas === 0 ? 1500 : 2000;
        const timer = setTimeout(async () => {
            await atualizarUsuario();
            setTentativas(t => t + 1);
        }, delay);

        return () => clearTimeout(timer);
    }, [tentativas, temPlano, planoAtivado]);

    // Detecta quando o plano foi ativado
    useEffect(() => {
        if (temPlano) setPlanoAtivado(true);
    }, [planoAtual]);

    return (
        <div className="auth-wrap">
            <div className="auth-box" style={{ textAlign: "center", maxWidth: 440 }}>
                {planoAtivado ? (
                    <>
                        <div style={{ marginBottom: 16, display:"flex", justifyContent:"center" }}><LuPartyPopper size={52} color="var(--cyan)"/></div>
                        <h1 className="auth-box-title">
                            Bem-vindo ao {nomePlano}!
                        </h1>
                        <p className="auth-box-sub" style={{ marginBottom: 24 }}>
                            Sua assinatura foi confirmada. Aproveite todos os recursos do seu plano.
                        </p>
                        <Link
                            to={planoAtual === PLANO_WHALLET_PLUS ? "/titulos" : "/excel"}
                            className="auth-box-btn"
                            style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                            <span style={{display:"inline-flex",alignItems:"center",gap:8}}>Começar a usar <LuArrowRight size={16}/></span>
                        </Link>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: 48, height: 48, border: "3px solid var(--gold)",
                            borderTopColor: "transparent", borderRadius: "50%",
                            margin: "0 auto 20px",
                            animation: "spin 0.8s linear infinite"
                        }}/>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <h1 className="auth-box-title">Confirmando pagamento...</h1>
                        <p className="auth-box-sub">
                            Aguarde enquanto processamos sua assinatura.
                        </p>
                        {tentativas >= 8 && (
                            <div style={{
                                marginTop: 20, padding: "12px 16px", borderRadius: 10,
                                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                                fontSize: 13, color: "var(--text-muted)"
                            }}>
                                O processamento está demorando mais que o esperado.<br/>
                                <strong>Seu pagamento foi confirmado pelo Stripe.</strong> O acesso
                                será liberado em instantes — tente{" "}
                                <button
                                    onClick={() => { setTentativas(0); }}
                                    style={{ background: "none", border: "none", color: "var(--gold)", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                                    verificar novamente
                                </button>{" "}ou faça logout e login.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export function UpgradeCanceladoPage() {
    return (
        <div className="auth-wrap">
            <div className="auth-box" style={{ textAlign: "center", maxWidth: 440 }}>
                <div style={{ marginBottom: 16, display:"flex", justifyContent:"center" }}><LuCircleSlash size={52} color="var(--text-dim)"/></div>
                <h1 className="auth-box-title">Pagamento cancelado</h1>
                <p className="auth-box-sub" style={{ marginBottom: 24 }}>
                    Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
                </p>
                <Link to="/planos" className="auth-box-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                    Ver planos
                </Link>
            </div>
        </div>
    );
}
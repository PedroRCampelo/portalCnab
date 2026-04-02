import { Link } from "react-router-dom";

export function UpgradeSucessoPage() {
    return (
        <div className="auth-wrap">
            <div className="auth-box" style={{ textAlign: "center", maxWidth: 440 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h1 className="auth-box-title">Bem-vindo ao Pro!</h1>
                <p className="auth-box-sub" style={{ marginBottom: 24 }}>
                    Sua assinatura foi confirmada. Voce agora tem acesso ilimitado ao Excel e PDF.
                </p>
                <Link to="/excel" className="auth-box-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                    Comecar a usar
                </Link>
            </div>
        </div>
    );
}

export function UpgradeCanceladoPage() {
    return (
        <div className="auth-wrap">
            <div className="auth-box" style={{ textAlign: "center", maxWidth: 440 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>↩️</div>
                <h1 className="auth-box-title">Pagamento cancelado</h1>
                <p className="auth-box-sub" style={{ marginBottom: 24 }}>
                    Nenhuma cobranca foi realizada. Voce pode tentar novamente quando quiser.
                </p>
                <Link to="/upgrade" className="auth-box-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                    Tentar novamente
                </Link>
            </div>
        </div>
    );
}
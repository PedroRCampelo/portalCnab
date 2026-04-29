import { useNavigate } from "react-router-dom";
import {
    LuLock, LuTrendingUp, LuLandmark, LuPercent, LuMessageCircle,
    LuFileText, LuCircleCheck, LuArrowRight,
} from "react-icons/lu";

/**
 * Tela de paywall — mostrada quando MEI tenta acessar feature Whallet+
 * sem ter o plano. Fica acessível em /upgrade ou disparada via interceptor 402.
 */
export default function PaywallPage() {
    const navigate = useNavigate();

    function irParaPlanos() {
        navigate("/planos");
    }

    return (
        <div style={containerStyle}>
            {/* Hero */}
            <div style={heroStyle}>
                <div style={iconCircle}>
                    <LuLock size={32} style={{ color: "var(--cyan-dark)" }}/>
                </div>
                <h1 style={titleStyle}>
                    Esta é uma feature <span style={{ color: "var(--cyan-dark)" }}>Whallet+</span>
                </h1>
                <p style={subtitleStyle}>
                    Para gerenciar seu fluxo de caixa, recebimentos, títulos e clientes,
                    você precisa do plano Whallet+.
                </p>
            </div>

            {/* Lista de features */}
            <div style={cardStyle}>
                <h2 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "var(--text-dim)",
                    textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    O que você ganha:
                </h2>

                <FeatureItem
                    icon={<LuTrendingUp size={18}/>}
                    titulo="Fluxo de caixa em tempo real"
                    descricao="Saldos, alertas preditivos e saúde do mês"/>

                <FeatureItem
                    icon={<LuFileText size={18}/>}
                    titulo="Recebimentos e títulos a pagar"
                    descricao="Controle completo das suas finanças"/>

                <FeatureItem
                    icon={<LuLandmark size={18}/>}
                    titulo="Múltiplas contas bancárias"
                    descricao="Acompanhe saldo de todas as suas contas"/>

                <FeatureItem
                    icon={<LuMessageCircle size={18}/>}
                    titulo="Cobrança via WhatsApp"
                    descricao="Mensagens automatizadas pra seus clientes"/>

                <FeatureItem
                    icon={<LuPercent size={18}/>}
                    titulo="Termômetro do limite MEI"
                    descricao="Acompanhe quanto falta pra estourar R$ 81 mil/ano"/>

                <FeatureItem
                    icon={<LuCircleCheck size={18}/>}
                    titulo="Controle do DAS"
                    descricao="Calendário, alertas e geração automática"/>
            </div>

            {/* Preço + CTA */}
            <div style={ctaStyle}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>
                        Investimento mensal
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                        <span style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 600 }}>R$</span>
                        <span style={{ fontSize: 42, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>39,90</span>
                        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>/mês</span>
                    </div>
                </div>

                <button onClick={irParaPlanos} style={ctaBtnStyle}>
                    Assinar Whallet+
                    <LuArrowRight size={16}/>
                </button>

                <p style={{ marginTop: 12, fontSize: 11, color: "var(--text-dim)", textAlign: "center" }}>
                    Cancele quando quiser. Sem fidelidade.
                </p>
            </div>
        </div>
    );
}

function FeatureItem({ icon, titulo, descricao }) {
    return (
        <div style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            padding: "10px 0", borderBottom: "1px solid var(--border)",
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "rgba(21,195,221,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--cyan-dark)",
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                    {titulo}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{descricao}</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────────────────
const containerStyle = {
    maxWidth: 560,
    margin: "0 auto",
    padding: "40px 24px",
};
const heroStyle = {
    textAlign: "center",
    marginBottom: 32,
};
const iconCircle = {
    width: 72, height: 72, margin: "0 auto 16px",
    borderRadius: "50%",
    background: "rgba(21,195,221,0.10)",
    border: "1px solid rgba(21,195,221,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
};
const titleStyle = {
    margin: "0 0 8px", fontSize: 26, fontWeight: 700, color: "var(--text)",
    lineHeight: 1.3,
};
const subtitleStyle = {
    margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5,
    maxWidth: 420, marginLeft: "auto", marginRight: "auto",
};
const cardStyle = {
    padding: 24, borderRadius: 12, marginBottom: 24,
    background: "var(--surface)",
    border: "1px solid var(--border)",
};
const ctaStyle = {
    padding: 24, borderRadius: 12, textAlign: "center",
    background: "linear-gradient(135deg, rgba(21,195,221,0.05), rgba(21,195,221,0.02))",
    border: "1px solid rgba(21,195,221,0.20)",
};
const ctaBtnStyle = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "14px 28px", borderRadius: 10, border: "none",
    background: "var(--cyan-dark)", color: "white",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 12px rgba(21,195,221,0.30)",
};
import { Link } from "react-router-dom";
import { LuBot, LuSparkles, LuArrowRight } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";
import elvisImg from "../assets/bots/elvis.png";

const PLANO_PRO          = "10000000-0000-0000-0000-000000000002";
const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function ElvisMiniChat() {
    const { autenticado, usuario } = useAuth();

    const isAdmin        = usuario?.perfil === "ADMIN";
    const temPro         = usuario?.planoId === PLANO_PRO;
    const temWhalletPlus = usuario?.planoId === PLANO_WHALLET_PLUS;
    const temAcesso      = isAdmin || temPro || temWhalletPlus;

    // Usuário com plano Pro ou Whallet+ — botão para abrir o chat completo
    if (autenticado && temAcesso) {
        return (
            <div style={{
                background: "var(--text)", borderRadius: 16, overflow: "hidden",
                padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={elvisImg} alt="Elvis" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(6,182,212,0.35)", flexShrink: 0 }}/>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Elvis</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Agente especialista em CNAB</div>
                    </div>
                    <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#22D3EE", boxShadow: "0 0 8px rgba(6,182,212,0.7)", animation: "elvBlink 2s infinite" }}/>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.7 }}>
                    Envie dúvidas sobre layouts CNAB, segmentos e campos. O Elvis analisa arquivos de remessa e responde com base na documentação oficial dos bancos.
                </p>
                <Link
                    to="/assistente-cnab"
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "11px 16px", borderRadius: 10,
                        background: "var(--grad)", color: "#083344",
                        fontWeight: 700, fontSize: 14, textDecoration: "none",
                        transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                    Conversar com Elvis <LuArrowRight size={14}/>
                </Link>
                <style>{`@keyframes elvBlink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
            </div>
        );
    }

    // Usuário logado mas sem plano adequado — CTA para upgrade
    if (autenticado && !temAcesso) {
        return (
            <div style={{
                background: "var(--text)", borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
            }}>
                {/* Header escuro com Elvis */}
                <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={elvisImg} alt="Elvis" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(6,182,212,0.3)", flexShrink: 0 }}/>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Elvis · Agente CNAB</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Disponível no plano Pro</div>
                    </div>
                </div>

                <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7 }}>
                        Com o Elvis você analisa arquivos de remessa, tira dúvidas sobre CNAB 240/400 e identifica erros com base na documentação oficial dos bancos.
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                        {["Identifica erros no arquivo de remessa", "Responde sobre segmentos e campos", "Suporte a Itaú, Bradesco, BB e Caixa"].map(f => (
                            <li key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", gap: 7 }}>
                                <span style={{ color: "rgba(6,182,212,0.7)", flexShrink: 0 }}>✓</span> {f}
                            </li>
                        ))}
                    </ul>
                    <Link
                        to="/planos"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "11px 16px", borderRadius: 10,
                            background: "var(--grad)", color: "#083344",
                            fontWeight: 700, fontSize: 13, textDecoration: "none",
                        }}
                    >
                        <LuSparkles size={14}/> Fazer upgrade para Pro
                    </Link>
                </div>
            </div>
        );
    }

    // Não autenticado — banner para criar conta
    return (
        <div style={{
            background: "var(--text)", borderRadius: 16, overflow: "hidden",
        }}>
            {/* Banner de apresentação */}
            <div style={{ padding: "24px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <img src={elvisImg} alt="Elvis" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(6,182,212,0.35)", flexShrink: 0 }}/>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Elvis</span>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                                background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.35)",
                                color: "#22D3EE", letterSpacing: "0.05em",
                            }}>IA · PRO</span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Agente especialista em CNAB</div>
                    </div>
                </div>

                {/* Balão de exemplo */}
                <div style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "4px 12px 12px 12px", padding: "10px 14px",
                    fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, marginBottom: 16,
                }}>
                    "O segmento J é obrigatório para pagamento de boletos no CNAB 240. Identifiquei 3 possíveis erros no seu arquivo de remessa..."
                </div>

                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 16px", lineHeight: 1.7 }}>
                    Analise arquivos de remessa, tire dúvidas sobre layouts bancários e identifique erros antes de enviar ao banco.
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                        "Analisa arquivos de remessa em tempo real",
                        "Identifica erros com base no manual do banco",
                        "Suporte a CNAB 240 e 400 de todos os bancos",
                    ].map(f => (
                        <li key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", gap: 7 }}>
                            <span style={{ color: "rgba(6,182,212,0.6)", flexShrink: 0 }}>✓</span> {f}
                        </li>
                    ))}
                </ul>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Link
                        to="/cadastro"
                        state={{ plano: "pro" }}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "12px", borderRadius: 10,
                            background: "var(--grad)", color: "#083344",
                            fontWeight: 700, fontSize: 13, textDecoration: "none",
                        }}
                    >
                        <LuBot size={14}/> Criar conta e usar Elvis
                    </Link>
                    <Link
                        to="/planos"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "10px", borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 12, textDecoration: "none", textAlign: "center",
                        }}
                    >
                        Ver todos os planos
                    </Link>
                </div>
            </div>
        </div>
    );
}
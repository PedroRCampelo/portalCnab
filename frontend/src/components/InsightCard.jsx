import { useState, useEffect } from "react";
import api from "../services/api.js";

// ── Avatares SVG ────────────────────────────────────────────────────────────
// Coloque os arquivos SVG em: frontend/src/assets/bots/
// Nomes esperados: aurora.svg · frank.svg · anne.svg
// Tamanho ideal: 40×40px, fundo transparente, formato quadrado
// Para usar: import auroraImg from "../assets/bots/aurora.svg";
// e substitua o componente <AvatarPlaceholder> pelo <img src={auroraImg} ...>

import auroraImg from "../assets/bots/aurora.png";
import frankImg  from "../assets/bots/frank.png";
import anneImg   from "../assets/bots/anne.png";

function AvatarPlaceholder({ bot }) {
    const imgs = { aurora: auroraImg, frank: frankImg, anne: anneImg };
    return (
        <img
            src={imgs[bot]}
            alt={bot}
            style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }}
        />
    );
}

// ── Config dos bots ──────────────────────────────────────────────────────────
const BOTS = {
    aurora: {
        nome: "Aurora",
        slogan: "Descontraída e animada",
        cor: "#DB2777",
        bgCor: "rgba(219,39,119,0.06)",
        borda: "rgba(219,39,119,0.18)",
        bordaAtivo: "rgba(219,39,119,0.45)",
        grad: "linear-gradient(135deg, #DB2777, #F472B6)",
    },
    frank: {
        nome: "Frank",
        slogan: "Sério e direto ao ponto",
        cor: "#1A2B42",
        bgCor: "rgba(26,43,66,0.05)",
        borda: "rgba(26,43,66,0.15)",
        bordaAtivo: "rgba(26,43,66,0.4)",
        grad: "linear-gradient(135deg, #1A2B42, #3F4E66)",
    },
    anne: {
        nome: "Anne",
        slogan: "Analítica e estratégica",
        cor: "#0891A8",
        bgCor: "rgba(8,145,178,0.06)",
        borda: "rgba(8,145,178,0.18)",
        bordaAtivo: "rgba(8,145,178,0.45)",
        grad: "linear-gradient(135deg, #15C3DD, #0891A8)",
    },
};

const BOT_KEY = "whallet_insight_bot";

const BOTS_VALIDOS = ["aurora", "frank", "anne"];

export default function InsightCard() {
    const [botAtivo, setBotAtivo] = useState(() => {
        const salvo = localStorage.getItem(BOT_KEY);
        return BOTS_VALIDOS.includes(salvo) ? salvo : "aurora";
    });
    const [insights,   setInsights]   = useState({ aurora: null, frank: null, anne: null });
    const [carregando, setCarregando] = useState(true);
    const [gerando,    setGerando]    = useState(false);
    const [erro,       setErro]       = useState("");

    // Carrega o insight do bot ativo ao montar
    useEffect(() => {
        carregarBot(botAtivo);
    }, []);

    async function carregarBot(bot) {
        setCarregando(true);
        setErro("");
        try {
            const { data } = await api.get(`/api/insight?bot=${bot}`);
            setInsights(prev => ({ ...prev, [bot]: data }));
        } catch {
            setErro("Não foi possível carregar o insight.");
        } finally {
            setCarregando(false);
        }
    }

    function selecionarBot(bot) {
        setBotAtivo(bot);
        localStorage.setItem(BOT_KEY, bot);
        // Carrega do servidor se ainda não tem cache local
        if (!insights[bot]) {
            carregarBot(bot);
        }
    }

    async function gerarNovoInsight() {
        setGerando(true);
        setErro("");
        try {
            const { data } = await api.get(`/api/insight?bot=${botAtivo}`);
            setInsights(prev => ({ ...prev, [botAtivo]: data }));
        } catch {
            setErro("Erro ao gerar insight. Tente novamente.");
        } finally {
            setGerando(false);
        }
    }

    const bot          = BOTS[botAtivo];
    const insightAtual = insights[botAtivo];

    // Só bloqueia o botão se geradoHoje === true (a IA foi chamada hoje)
    const jáGeradoHoje = insightAtual?.geradoHoje === false && !!insightAtual?.insight
        && !insightAtual?.insight?.includes("suficientes")
        && !insightAtual?.insight?.includes("Cadastra")
        && !insightAtual?.insight?.includes("Registre");

    const semDados = !!insightAtual?.semDados;

    return (
        <div style={{
            background: "#fff",
            border: "1px solid rgba(26,43,66,0.1)",
            borderRadius: 16,
            overflow: "hidden",
        }}>
            {/* Barra de acento no topo */}
            <div style={{ height: 3, background: bot.grad }}/>

            <div style={{ padding: "18px 20px" }}>

                {/* ── Seleção de bots — sempre visível ── */}
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8, marginBottom: 16,
                }}>
                    {Object.entries(BOTS).map(([key, b]) => {
                        const ativo = key === botAtivo;
                        return (
                            <button
                                key={key}
                                onClick={() => selecionarBot(key)}
                                style={{
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", gap: 6,
                                    padding: "10px 8px", borderRadius: 12, cursor: "pointer",
                                    border: ativo ? `2px solid ${b.bordaAtivo}` : "1.5px solid rgba(26,43,66,0.09)",
                                    background: ativo ? b.bgCor : "rgba(26,43,66,0.01)",
                                    transition: "all 0.15s",
                                    position: "relative",
                                }}
                            >
                                {/* Badge ativo */}
                                {ativo && (
                                    <div style={{
                                        position: "absolute", top: -8, right: -8,
                                        width: 16, height: 16, borderRadius: "50%",
                                        background: b.grad, border: "2px solid #fff",
                                    }}/>
                                )}

                                <AvatarPlaceholder bot={key}/>

                                <div style={{
                                    fontSize: 12, fontWeight: 700,
                                    color: ativo ? b.cor : "var(--text-muted)",
                                }}>
                                    {b.nome}
                                </div>
                                <div style={{
                                    fontSize: 10, color: "var(--text-dim)",
                                    textAlign: "center", lineHeight: 1.3,
                                }}>
                                    {b.slogan}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ── Cabeçalho do bot ativo ── */}
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 12,
                }}>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>
                        Insight financeiro · atualiza 1× por dia
                    </div>

                    {!carregando && !semDados && (
                        <button
                            onClick={gerarNovoInsight}
                            disabled={gerando || !!jáGeradoHoje}
                            title={jáGeradoHoje
                                ? "Já gerado hoje. Volte amanhã para um novo insight."
                                : "Gerar insight agora"}
                            style={{
                                padding: "4px 12px", borderRadius: 8,
                                border: `1px solid ${jáGeradoHoje ? "rgba(26,43,66,0.1)" : bot.borda}`,
                                background: "transparent",
                                fontSize: 11, fontWeight: 600,
                                color: jáGeradoHoje ? "var(--text-dim)" : bot.cor,
                                cursor: jáGeradoHoje ? "default" : "pointer",
                                opacity: gerando ? 0.6 : 1,
                                transition: "all 0.15s",
                            }}
                        >
                            {gerando
                                ? "Gerando..."
                                : jáGeradoHoje
                                    ? "✓ Gerado hoje"
                                    : "✨ Gerar insight"}
                        </button>
                    )}
                </div>

                {/* ── Conteúdo ── */}
                {carregando ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
                        <div style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: `2px solid ${bot.bgCor}`,
                            borderTopColor: bot.cor,
                            animation: "icSpin 0.8s linear infinite",
                        }}/>
                        <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                            {bot.nome} está analisando seus dados...
                        </span>
                    </div>
                ) : erro ? (
                    <div style={{ fontSize: 13, color: "var(--error)", lineHeight: 1.6 }}>{erro}</div>
                ) : !insightAtual ? (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                        <button
                            onClick={gerarNovoInsight}
                            disabled={gerando}
                            style={{
                                padding: "9px 20px", borderRadius: 10,
                                background: bot.grad, border: "none",
                                color: "#fff", fontSize: 13, fontWeight: 700,
                                cursor: "pointer", opacity: gerando ? 0.6 : 1,
                            }}
                        >
                            {gerando ? "Gerando..." : `✨ Gerar insight com ${bot.nome}`}
                        </button>
                    </div>
                ) : semDados ? (
                    <div style={{
                        padding: "14px 16px", borderRadius: 10, textAlign: "center",
                        background: "rgba(26,43,66,0.02)",
                        border: "1px dashed rgba(26,43,66,0.12)",
                    }}>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                            {insightAtual.insight}
                        </p>
                    </div>
                ) : (
                    <div style={{
                        padding: "14px 16px", borderRadius: 10,
                        background: bot.bgCor, border: `1px solid ${bot.borda}`,
                    }}>
                        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.75, margin: 0 }}>
                            {insightAtual.insight}
                        </p>
                    </div>
                )}

                {/* ── Rodapé ── */}
                {insightAtual && !carregando && !semDados && (
                    <div style={{
                        marginTop: 12, paddingTop: 10,
                        borderTop: "1px solid rgba(26,43,66,0.07)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                            {insightAtual.geradoEm
                                ? new Date(insightAtual.geradoEm + "T00:00:00")
                                    .toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
                                : ""}
                        </span>
                        <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 8px",
                            borderRadius: 20, background: bot.bgCor, color: bot.cor,
                        }}>
                            GPT-4o mini
                        </span>
                    </div>
                )}
            </div>

            <style>{`@keyframes icSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
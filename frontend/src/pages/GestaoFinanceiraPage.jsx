import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

import titulosPagarImg from "../assets/gestao-financeira/titulos-pagar.png";
import novoTituloImg from "../assets/gestao-financeira/novo-titulo.png";
import registrarBaixaImg from "../assets/gestao-financeira/registrar-baixa.png";
import relatoriosFinanceirosImg from "../assets/gestao-financeira/relatorios-financeiros.png";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";
const PLANO_PRO = "10000000-0000-0000-0000-000000000002";

export default function GestaFinanceiraPage() {
    const { usuario, autenticado } = useAuth();
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [activeDemo, setActiveDemo] = useState("titulos");
    const [imagemModalAberta, setImagemModalAberta] = useState(false);
    const navigate = useNavigate();

    const isAdmin = usuario?.perfil === "ADMIN";
    const temWhalletPlus = isAdmin || usuario?.planoId === PLANO_WHALLET_PLUS;
    const temPro = isAdmin || usuario?.planoId === PLANO_PRO || temWhalletPlus;

    if (autenticado && temWhalletPlus) {
        navigate("/titulos", { replace: true });
        return null;
    }

    async function handleUpgrade() {
        if (!autenticado) {
            navigate("/cadastro");
            return;
        }

        setCarregando(true);
        setErro("");

        try {
            const { data } = await api.post("/api/stripe/checkout/whallet-plus");
            window.location.href = data.url;
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao iniciar pagamento.");
            setCarregando(false);
        }
    }

    const features = [
        {
            icon: "📋",
            titulo: "Contas a pagar",
            desc: "Cadastre títulos manualmente ou importe via Excel. Controle vencimentos, saldos e status em tempo real.",
            badge: "Disponível",
            badgeColor: "#6c5310",
        },
        {
            icon: "📊",
            titulo: "Relatórios financeiros",
            desc: "Visão consolidada por período, fornecedor e status. Exporte para Excel ou PDF com um clique.",
            badge: "Em breve",
            badgeColor: "#4D4A42",
        },
        {
            icon: "🔔",
            titulo: "Alertas de vencimento",
            desc: "Receba e-mails automáticos dias antes do vencimento. Configure a antecedência conforme sua necessidade.",
            badge: "Em breve",
            badgeColor: "#4D4A42",
        },
        {
            icon: "🏦",
            titulo: "Remessa CNAB integrada",
            desc: "Gere arquivos de remessa bancária diretamente dos títulos cadastrados — sem redigitar dados.",
            badge: "Em breve",
            badgeColor: "#4D4A42",
        },
        {
            icon: "📥",
            titulo: "Importação via Excel",
            desc: "Compatível com exportações do Protheus (SE2/E2) e planilhas customizadas. Importe centenas de títulos.",
            badge: "Disponível",
            badgeColor: "#6c5310",
        },
        {
            icon: "🔄",
            titulo: "Integração Protheus",
            desc: "Busque títulos diretamente do ERP, gere remessas e faça write-back de baixas automaticamente.",
            badge: "Sob consulta",
            badgeColor: "#7B766A",
        },
    ];

    const planos = [
        {
            nome: "Gratuito",
            preco: "R$ 0",
            cor: "var(--text-dim)",
            items: ["8/mês", "Excel e PDF", "Todos", "—", "—", "—"],
        },
        {
            nome: "Pro",
            preco: "R$ 18,90/mês",
            cor: "#4D4A42",
            items: ["Ilimitado", "Excel e PDF", "Todos", "—", "—", "—"],
        },
        {
            nome: "Whallet+",
            preco: "R$ 39,90/mês",
            cor: "#6c5310",
            items: ["Ilimitado", "Excel e PDF", "Todos", "✓", "✓", "✓"],
        },
    ];

    const linhas = [
        "Conversões",
        "Formato",
        "Bancos",
        "Contas a pagar",
        "Alertas e-mail",
        "Remessa integrada",
    ];

    const demoItems = useMemo(
        () => [
            {
                id: "titulos",
                step: "01",
                badge: "Painel principal",
                titulo: "Títulos a pagar",
                resumo:
                    "Visualize totais em aberto, pendentes, vencidos e pagos com busca e filtros rápidos.",
                descricao:
                    "A tela centraliza a operação diária com cards de resumo, filtros por status e campo de busca para localizar títulos rapidamente.",
                bullets: [
                    "Resumo financeiro imediato",
                    "Busca por fornecedor, número ou documento",
                    "Acesso rápido a relatórios e importação",
                ],
                imagem: titulosPagarImg,
            },
            {
                id: "cadastro",
                step: "02",
                badge: "Cadastro detalhado",
                titulo: "Novo título",
                resumo:
                    "Cadastre títulos com dados essenciais, vencimento, juros, multa e categoria de gasto.",
                descricao:
                    "O formulário foi pensado para ser direto e operacional, permitindo lançar títulos completos sem depender de planilhas paralelas.",
                bullets: [
                    "Campos organizados por contexto",
                    "Cadastro rápido e padronizado",
                    "Base pronta para rotinas futuras de CNAB e alertas",
                ],
                imagem: novoTituloImg,
            },
            {
                id: "baixa",
                step: "03",
                badge: "Quitação simplificada",
                titulo: "Registrar baixa",
                resumo:
                    "Marque títulos como quitados com data de baixa, valor pago e observações.",
                descricao:
                    "A rotina de baixa reduz atrito operacional e ajuda a manter o status financeiro sempre atualizado dentro da plataforma.",
                bullets: [
                    "Confirmação simples e objetiva",
                    "Registro de data da baixa",
                    "Atualização rápida do status do título",
                ],
                imagem: registrarBaixaImg,
            },
            {
                id: "relatorios",
                step: "04",
                badge: "Visão gerencial",
                titulo: "Relatórios financeiros",
                resumo:
                    "Acompanhe distribuição por categoria, fornecedores e títulos vencidos em uma visão consolidada.",
                descricao:
                    "Os relatórios ajudam a enxergar concentração de gastos, vencimentos em aberto e indicadores úteis para tomada de decisão.",
                bullets: [
                    "Visão consolidada do financeiro",
                    "Leitura visual por categoria",
                    "Base para análises e exportações futuras",
                ],
                imagem: relatoriosFinanceirosImg,
            },
        ],
        []
    );

    const currentDemo =
        demoItems.find((item) => item.id === activeDemo) ?? demoItems[0];

    return (
        <>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 64px" }}>
                <div style={{ textAlign: "center", marginBottom: 56 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            background: "rgba(212,160,23,0.10)",
                            border: "1px solid rgba(212,160,23,0.28)",
                            borderRadius: 20,
                            padding: "6px 18px",
                            marginBottom: 24,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#6c5310",
                            letterSpacing: "0.06em",
                        }}
                    >
                        ✦ WHALLET+ — GESTÃO FINANCEIRA
                    </div>

                    <h1
                        style={{
                            fontSize: "clamp(26px, 5vw, 42px)",
                            fontWeight: 900,
                            color: "var(--text)",
                            margin: "0 0 16px",
                            letterSpacing: "-0.025em",
                            lineHeight: 1.1,
                        }}
                    >
                        Controle financeiro integrado
                        <br />
                        <span style={{ color: "#6c5310" }}>ao seu workflow bancário</span>
                    </h1>

                    <p
                        style={{
                            color: "var(--text-dim)",
                            fontSize: 17,
                            margin: "0 auto 20px",
                            maxWidth: 640,
                            lineHeight: 1.7,
                        }}
                    >
                    </p>

                    <p
                        style={{
                            color: "var(--text-dim)",
                            fontSize: 17,
                            margin: "0 auto 32px",
                            maxWidth: 640,
                            lineHeight: 1.7,
                        }}
                    >
                        Do cadastro de títulos à geração de remessa CNAB — tudo em uma única
                        plataforma, sem planilhas paralelas ou retrabalho.
                    </p>

                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            justifyContent: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            onClick={handleUpgrade}
                            disabled={carregando}
                            style={{
                                padding: "14px 32px",
                                borderRadius: 12,
                                background: "var(--grad)",
                                border: "1px solid rgba(212,160,23,0.45)",
                                color: "#1a1a1a",
                                fontWeight: 800,
                                fontSize: 16,
                                cursor: "pointer",
                                opacity: carregando ? 0.7 : 1,
                            }}
                        >
                            {carregando
                                ? "Redirecionando..."
                                : autenticado
                                    ? "Assinar Whallet+ — R$ 39,90/mês"
                                    : "Criar conta grátis e assinar"}
                        </button>

                        <Link
                            to="/planos"
                            style={{
                                padding: "14px 24px",
                                borderRadius: 12,
                                border: "1px solid var(--border)",
                                color: "var(--text-muted)",
                                fontWeight: 600,
                                fontSize: 15,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            Ver todos os planos
                        </Link>
                    </div>

                    {erro && (
                        <div style={{ marginTop: 16, fontSize: 14, color: "var(--warning)" }}>
                            {erro}
                        </div>
                    )}

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 16,
                            background: "rgba(212,160,23,0.08)",
                            border: "1px solid rgba(212,160,23,0.2)",
                            borderRadius: 20,
                            padding: "4px 14px",
                            fontSize: 12,
                            color: "#6c5310",
                            fontWeight: 600,
                        }}
                    >
                        🎯 Preço beta — promocional para os primeiros usuários
                    </div>
                </div>

                <section
                    style={{
                        marginBottom: 64,
                        background: "linear-gradient(180deg, rgba(212,160,23,0.06), rgba(212,160,23,0.01))",
                        border: "1px solid rgba(212,160,23,0.16)",
                        borderRadius: 24,
                        padding: "28px 20px 20px",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 12px",
                                borderRadius: 999,
                                background: "rgba(212,160,23,0.08)",
                                border: "1px solid rgba(212,160,23,0.16)",
                                color: "#6c5310",
                                fontWeight: 700,
                                fontSize: 12,
                                marginBottom: 14,
                            }}
                        >
                            ✨ DEMO DA ROTINA
                        </div>

                        <h2
                            style={{
                                fontSize: "clamp(24px, 4vw, 34px)",
                                fontWeight: 900,
                                color: "var(--text)",
                                margin: "0 0 10px",
                                lineHeight: 1.1,
                            }}
                        >
                            Veja a gestão financeira em ação
                        </h2>

                        <p
                            style={{
                                color: "var(--text-dim)",
                                fontSize: 15,
                                lineHeight: 1.7,
                                margin: "0 auto",
                                maxWidth: 720,
                            }}
                        >
                            Explore as principais telas da rotina e entenda como a Whallet
                            organiza cadastro, acompanhamento, baixa e visão gerencial em um
                            fluxo único.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            overflowX: "auto",
                            paddingBottom: 6,
                            marginBottom: 24,
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        {demoItems.map((item) => {
                            const active = item.id === activeDemo;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveDemo(item.id)}
                                    style={{
                                        flex: "0 0 auto",
                                        borderRadius: 14,
                                        padding: "12px 16px",
                                        border: active
                                            ? "1px solid rgba(212,160,23,0.45)"
                                            : "1px solid var(--border)",
                                        background: active ? "rgba(212,160,23,0.10)" : "var(--surface)",
                                        color: "var(--text)",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        minWidth: 190,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            color: active ? "#6c5310" : "var(--text-dim)",
                                            letterSpacing: "0.05em",
                                            marginBottom: 6,
                                        }}
                                    >
                                        ETAPA {item.step}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
                                        {item.titulo}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "var(--text-dim)",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {item.badge}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)",
                            gap: 20,
                            alignItems: "stretch",
                        }}
                    >
                        <div
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 22,
                                padding: 22,
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    borderRadius: 999,
                                    padding: "6px 12px",
                                    background: "rgba(212,160,23,0.09)",
                                    border: "1px solid rgba(212,160,23,0.14)",
                                    color: "#6c5310",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    marginBottom: 16,
                                }}
                            >
                                {currentDemo.badge}
                            </div>

                            <h3
                                style={{
                                    fontSize: 28,
                                    lineHeight: 1.1,
                                    margin: "0 0 12px",
                                    color: "var(--text)",
                                    fontWeight: 900,
                                }}
                            >
                                {currentDemo.titulo}
                            </h3>

                            <p
                                style={{
                                    margin: "0 0 14px",
                                    color: "var(--text)",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    lineHeight: 1.6,
                                }}
                            >
                                {currentDemo.resumo}
                            </p>

                            <p
                                style={{
                                    margin: "0 0 18px",
                                    color: "var(--text-dim)",
                                    fontSize: 14,
                                    lineHeight: 1.7,
                                }}
                            >
                                {currentDemo.descricao}
                            </p>

                            <div
                                style={{
                                    display: "grid",
                                    gap: 10,
                                    marginBottom: 18,
                                }}
                            >
                                {currentDemo.bullets.map((bullet) => (
                                    <div
                                        key={bullet}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 10,
                                            padding: "10px 12px",
                                            borderRadius: 14,
                                            background: "rgba(255,255,255,0.55)",
                                            border: "1px solid var(--border)",
                                        }}
                                    >
                                        <span style={{ color: "#6c5310", fontWeight: 900 }}>✓</span>
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "var(--text)",
                                                lineHeight: 1.55,
                                            }}
                                        >
                      {bullet}
                    </span>
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    onClick={() => setImagemModalAberta(true)}
                                    style={{
                                        padding: "12px 16px",
                                        borderRadius: 12,
                                        border: "1px solid rgba(212,160,23,0.35)",
                                        background: "rgba(212,160,23,0.10)",
                                        color: "#6c5310",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                    }}
                                >
                                    Ampliar screenshot
                                </button>

                                <button
                                    onClick={handleUpgrade}
                                    disabled={carregando}
                                    style={{
                                        padding: "12px 16px",
                                        borderRadius: 12,
                                        border: "1px solid var(--border)",
                                        background: "var(--surface)",
                                        color: "var(--text)",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        opacity: carregando ? 0.7 : 1,
                                    }}
                                >
                                    {autenticado ? "Quero liberar essa rotina" : "Criar conta para testar"}
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 22,
                                padding: 14,
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    padding: "4px 4px 14px",
                                }}
                            >
                                <div style={{ display: "flex", gap: 6 }}>
                  <span
                      style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#e5c07b",
                          display: "inline-block",
                      }}
                  />
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: "#d6d3d1",
                                            display: "inline-block",
                                        }}
                                    />
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: "#c4b5fd",
                                            display: "inline-block",
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "var(--text-dim)",
                                        fontWeight: 700,
                                        textAlign: "right",
                                    }}
                                >
                                    Preview da rotina
                                </div>
                            </div>

                            <button
                                onClick={() => setImagemModalAberta(true)}
                                style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    padding: 0,
                                    cursor: "zoom-in",
                                }}
                            >
                                <img
                                    src={currentDemo.imagem}
                                    alt={currentDemo.titulo}
                                    style={{
                                        width: "100%",
                                        display: "block",
                                        borderRadius: 18,
                                        border: "1px solid rgba(0,0,0,0.06)",
                                        boxShadow: "0 14px 40px rgba(0,0,0,0.08)",
                                        transition: "transform 0.25s ease",
                                    }}
                                />
                            </button>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                    gap: 10,
                                    marginTop: 14,
                                }}
                            >
                                {demoItems.map((item) => {
                                    const active = item.id === activeDemo;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveDemo(item.id)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                textAlign: "left",
                                                borderRadius: 14,
                                                padding: 10,
                                                border: active
                                                    ? "1px solid rgba(212,160,23,0.4)"
                                                    : "1px solid var(--border)",
                                                background: active ? "rgba(212,160,23,0.08)" : "var(--surface)",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 38,
                                                    height: 38,
                                                    borderRadius: 12,
                                                    background: active ? "rgba(212,160,23,0.16)" : "rgba(0,0,0,0.04)",
                                                    color: active ? "#6c5310" : "var(--text-dim)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: 900,
                                                    fontSize: 12,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {item.step}
                                            </div>

                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        color: "var(--text)",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {item.titulo}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--text-dim)",
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {item.badge}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: 56 }}>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <h2
                            style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: "var(--text)",
                                margin: "0 0 10px",
                            }}
                        >
                            Fluxo da rotina
                        </h2>
                        <p
                            style={{
                                color: "var(--text-dim)",
                                fontSize: 14,
                                maxWidth: 620,
                                margin: "0 auto",
                                lineHeight: 1.7,
                            }}
                        >
                            Uma operação desenhada para sair do lançamento manual e evoluir
                            para um fluxo financeiro realmente organizado.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 16,
                        }}
                    >
                        {demoItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveDemo(item.id)}
                                style={{
                                    textAlign: "left",
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 18,
                                    padding: 20,
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 14,
                                        background: "rgba(212,160,23,0.10)",
                                        color: "#6c5310",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 900,
                                        fontSize: 13,
                                        marginBottom: 14,
                                    }}
                                >
                                    {item.step}
                                </div>

                                <div
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 800,
                                        color: "var(--text)",
                                        marginBottom: 8,
                                    }}
                                >
                                    {item.titulo}
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "var(--text-dim)",
                                        lineHeight: 1.65,
                                    }}
                                >
                                    {item.resumo}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <div style={{ marginBottom: 56 }}>
                    <h2
                        style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "var(--text)",
                            margin: "0 0 24px",
                            textAlign: "center",
                        }}
                    >
                        O que está incluso no{" "}
                        <span
                            style={{
                                background:
                                    "linear-gradient(135deg, rgb(245, 158, 11), rgb(252, 211, 77))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                display: "inline-block",
                            }}
                        >
              Whallet+
            </span>
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: 16,
                        }}
                    >
                        {features.map((f) => (
                            <div
                                key={f.titulo}
                                style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 16,
                                    padding: "24px 20px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        marginBottom: 12,
                                    }}
                                >
                                    <span style={{ fontSize: 28 }}>{f.icon}</span>
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: "0.05em",
                                            padding: "3px 10px",
                                            borderRadius: 20,
                                            background: `${f.badgeColor}18`,
                                            border: `1px solid ${f.badgeColor}40`,
                                            color: f.badgeColor,
                                        }}
                                    >
                    {f.badge}
                  </span>
                                </div>

                                <div
                                    style={{
                                        fontWeight: 700,
                                        color: "var(--text)",
                                        marginBottom: 6,
                                        fontSize: 15,
                                    }}
                                >
                                    {f.titulo}
                                </div>

                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "var(--text-dim)",
                                        lineHeight: 1.65,
                                    }}
                                >
                                    {f.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 20,
                        padding: "32px 24px",
                        marginBottom: 40,
                    }}
                >
                    <h2
                        style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "var(--text)",
                            margin: "0 0 4px",
                        }}
                    >
                        Compare os planos
                    </h2>

                    <p
                        style={{
                            fontSize: 12,
                            color: "var(--text-dim)",
                            margin: "0 0 20px",
                        }}
                    >
                        ← Deslize para ver todos os planos →
                    </p>

                    <div
                        style={{
                            overflowX: "auto",
                            WebkitOverflowScrolling: "touch",
                            cursor: "grab",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
                                minWidth: 460,
                                gap: 0,
                            }}
                        >
                            {planos.map((p, i) => (
                                <div
                                    key={p.nome}
                                    style={{
                                        padding: "0 16px",
                                        borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: p.cor,
                                            marginBottom: 4,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                        }}
                                    >
                                        {p.nome}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 800,
                                            color: "var(--text)",
                                            marginBottom: 16,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {p.preco}
                                    </div>

                                    {linhas.map((label, j) => (
                                        <div
                                            key={label}
                                            style={{
                                                padding: "8px 0",
                                                borderTop: "1px solid var(--border)",
                                                fontSize: 12,
                                            }}
                                        >
                                            <div style={{ color: "var(--text-dim)", marginBottom: 2 }}>
                                                {label}
                                            </div>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    color:
                                                        p.items[j] === "✓"
                                                            ? "#6c5310"
                                                            : p.items[j] === "—"
                                                                ? "var(--text-dim)"
                                                                : "var(--text)",
                                                }}
                                            >
                                                {p.items[j]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(17,17,17,0.03), rgba(212,160,23,0.08))",
                        border: "1px solid rgba(212,160,23,0.2)",
                        borderRadius: 20,
                        padding: "40px 32px",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "var(--text)",
                            margin: "0 0 10px",
                        }}
                    >
                        Pronto para começar?
                    </h2>

                    <p
                        style={{
                            color: "var(--text-dim)",
                            fontSize: 14,
                            margin: "0 0 24px",
                        }}
                    >
                        Cancele quando quiser. Sem fidelidade, sem taxa de cancelamento.
                    </p>

                    <button
                        onClick={handleUpgrade}
                        disabled={carregando}
                        style={{
                            padding: "14px 36px",
                            borderRadius: 12,
                            background: "var(--grad)",
                            border: "1px solid rgba(212,160,23,0.45)",
                            color: "#1a1a1a",
                            fontWeight: 800,
                            fontSize: 16,
                            cursor: "pointer",
                            opacity: carregando ? 0.7 : 1,
                        }}
                    >
                        {carregando
                            ? "Redirecionando..."
                            : autenticado
                                ? "Assinar agora — R$ 39,90/mês"
                                : "Criar conta e assinar"}
                    </button>

                    {!autenticado && (
                        <p
                            style={{
                                fontSize: 12,
                                color: "var(--text-dim)",
                                marginTop: 12,
                            }}
                        >
                            Já tem conta?{" "}
                            <Link to="/login" style={{ color: "#6c5310" }}>
                                Entrar
                            </Link>
                        </p>
                    )}
                </div>
            </div>

            {imagemModalAberta && (
                <div
                    onClick={() => setImagemModalAberta(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.72)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        cursor: "zoom-out",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(1280px, 96vw)",
                            maxHeight: "92vh",
                            background: "#fff",
                            borderRadius: 20,
                            overflow: "hidden",
                            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                        }}
                    >
                        <div
                            style={{
                                padding: "14px 16px",
                                borderBottom: "1px solid rgba(0,0,0,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        color: "#111",
                                        fontSize: 16,
                                        marginBottom: 2,
                                    }}
                                >
                                    {currentDemo.titulo}
                                </div>
                                <div
                                    style={{
                                        color: "#666",
                                        fontSize: 13,
                                    }}
                                >
                                    {currentDemo.badge}
                                </div>
                            </div>

                            <button
                                onClick={() => setImagemModalAberta(false)}
                                style={{
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    background: "#fff",
                                    borderRadius: 12,
                                    padding: "10px 14px",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    color: "#111",
                                }}
                            >
                                Fechar
                            </button>
                        </div>

                        <div
                            style={{
                                maxHeight: "calc(92vh - 74px)",
                                overflow: "auto",
                                background: "#f8f8f8",
                            }}
                        >
                            <img
                                src={currentDemo.imagem}
                                alt={currentDemo.titulo}
                                style={{
                                    width: "100%",
                                    display: "block",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

function fmtValor(v) {
    if (v == null || v === "") return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function fmtMes(anoMes) {
    if (!anoMes) return "";
    const [ano, mes] = anoMes.split("-");
    const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${nomes[parseInt(mes) - 1]}/${ano.slice(2)}`;
}

function BarraHorizontal({ valor, max, cor = "var(--gold, #F59E0B)" }) {
    const pct = max > 0 ? Math.max(2, (valor / max) * 100) : 0;
    return (
        <div style={{ height: 6, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 4, transition: "width 0.4s ease" }}/>
        </div>
    );
}

const COR_AGING = { "0-30": "#F59E0B", "31-60": "#F97316", "61-90": "#EF4444", "+90": "#991B1B" };

export default function RelatoriosTitulosPage() {
    const [dados,      setDados]      = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [aba,        setAba]        = useState("fluxo"); // fluxo | tipos | fornecedores | aging

    useEffect(() => {
        api.get("/api/titulos/relatorio")
            .then(({ data }) => setDados(data))
            .catch(() => {})
            .finally(() => setCarregando(false));
    }, []);

    const tabStyle = (id) => ({
        padding: "9px 18px", border: "none", cursor: "pointer",
        background: "transparent", fontSize: 13, fontWeight: 600,
        color: aba === id ? "var(--text)" : "var(--text-dim)",
        borderBottom: aba === id ? "2px solid var(--gold, #F59E0B)" : "2px solid transparent",
        transition: "color 0.15s",
    });

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

            {/* Cabeçalho */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: 0 }}>
                        Relatórios financeiros
                    </h1>
                    <p style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 4 }}>
                        Visão consolidada dos seus títulos a pagar
                    </p>
                </div>
                <Link to="/titulos" style={{
                    padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)",
                    color: "var(--text-muted)", fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}>
                    ← Voltar para Títulos
                </Link>
            </div>

            {carregando ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)" }}>
                    Carregando relatórios...
                </div>
            ) : !dados ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)" }}>
                    Não foi possível carregar os relatórios.
                </div>
            ) : (
                <>
                    {/* Cards de resumo rápido */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
                        {[
                            {
                                label: "A vencer (12 meses)",
                                valor: fmtValor(dados.fluxoCaixa?.reduce((s, i) => s + Number(i.total || 0), 0)),
                                icon: "📅",
                            },
                            {
                                label: "Fornecedores ativos",
                                valor: dados.fornecedores?.length ?? 0,
                                icon: "🏢",
                            },
                            {
                                label: "Categorias de gasto",
                                valor: dados.porTipoGasto?.length ?? 0,
                                icon: "🏷️",
                            },
                            {
                                label: "Vencidos em aberto",
                                valor: fmtValor(dados.aging?.reduce((s, i) => s + Number(i.total || 0), 0)),
                                icon: "⚠️",
                                alerta: true,
                            },
                        ].map(c => (
                            <div key={c.label} style={{
                                background: "var(--surface)", border: `1px solid ${c.alerta ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
                                borderRadius: 12, padding: "16px 18px",
                            }}>
                                <div style={{ fontSize: 20, marginBottom: 8 }}>{c.icon}</div>
                                <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                                    {c.label}
                                </div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: c.alerta ? "#DC2626" : "var(--text)" }}>
                                    {c.valor}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Abas */}
                    <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
                        <button style={tabStyle("fluxo")}      onClick={() => setAba("fluxo")}>📅 Fluxo de caixa</button>
                        <button style={tabStyle("tipos")}       onClick={() => setAba("tipos")}>🏷️ Por tipo de gasto</button>
                        <button style={tabStyle("fornecedores")} onClick={() => setAba("fornecedores")}>🏢 Por fornecedor</button>
                        <button style={tabStyle("aging")}       onClick={() => setAba("aging")}>⚠️ Títulos vencidos</button>
                    </div>

                    {/* ── Fluxo de caixa ── */}
                    {aba === "fluxo" && (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px" }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>
                                Vencimentos nos próximos 12 meses
                            </h2>
                            <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 24px" }}>
                                Soma dos saldos em aberto por mês de vencimento
                            </p>
                            {!dados.fluxoCaixa?.length ? (
                                <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Nenhum vencimento nos próximos 12 meses.</p>
                            ) : (() => {
                                const max = Math.max(...dados.fluxoCaixa.map(i => Number(i.total)));
                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                        {dados.fluxoCaixa.map(item => (
                                            <div key={item.mes}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                                        {fmtMes(item.mes)}
                                                    </span>
                                                    <div style={{ textAlign: "right" }}>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                                            {fmtValor(item.total)}
                                                        </span>
                                                        <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 8 }}>
                                                            {item.quantidade} título{item.quantidade != 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                                <BarraHorizontal valor={Number(item.total)} max={max}/>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ── Por tipo de gasto ── */}
                    {aba === "tipos" && (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px" }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>
                                Distribuição por tipo de gasto
                            </h2>
                            <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 24px" }}>
                                Títulos em aberto agrupados por categoria
                            </p>
                            {!dados.porTipoGasto?.length ? (
                                <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Nenhum dado disponível.</p>
                            ) : (() => {
                                const total = dados.porTipoGasto.reduce((s, i) => s + Number(i.total), 0);
                                const max   = Math.max(...dados.porTipoGasto.map(i => Number(i.total)));
                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                        {dados.porTipoGasto.map(item => {
                                            const pct = total > 0 ? ((Number(item.total) / total) * 100).toFixed(1) : 0;
                                            return (
                                                <div key={item.nome}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                                            {item.nome}
                                                        </span>
                                                        <div style={{ textAlign: "right" }}>
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                                                {fmtValor(item.total)}
                                                            </span>
                                                            <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 8 }}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <BarraHorizontal valor={Number(item.total)} max={max}/>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ── Top fornecedores ── */}
                    {aba === "fornecedores" && (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px" }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>
                                Top fornecedores por valor em aberto
                            </h2>
                            <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 24px" }}>
                                Os 10 maiores fornecedores com saldo em aberto
                            </p>
                            {!dados.fornecedores?.length ? (
                                <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Nenhum dado disponível.</p>
                            ) : (() => {
                                const max = Math.max(...dados.fornecedores.map(i => Number(i.total)));
                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                        {dados.fornecedores.map((item, idx) => (
                                            <div key={item.nome} style={{
                                                display: "flex", alignItems: "center", gap: 14,
                                                padding: "14px 0",
                                                borderBottom: idx < dados.fornecedores.length - 1 ? "1px solid var(--border)" : "none",
                                            }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                                                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 11, fontWeight: 800, color: "#92400E",
                                                }}>{idx + 1}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4,
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {item.nome}
                                                    </div>
                                                    <BarraHorizontal valor={Number(item.total)} max={max}/>
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                                        {fmtValor(item.total)}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                                        {item.quantidade} título{item.quantidade != 1 ? "s" : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ── Aging (vencidos) ── */}
                    {aba === "aging" && (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px" }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>
                                Análise de inadimplência (aging)
                            </h2>
                            <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 24px" }}>
                                Títulos vencidos agrupados por faixas de dias em atraso
                            </p>
                            {!dados.aging?.length ? (
                                <div style={{ textAlign: "center", padding: "40px 0" }}>
                                    <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                                    <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Nenhum título vencido em aberto.</p>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                                    {/* Garante ordem correta */}
                                    {["0-30", "31-60", "61-90", "+90"].map(faixa => {
                                        const item = dados.aging.find(a => a.nome === faixa);
                                        const cor = COR_AGING[faixa];
                                        const labels = { "0-30": "Até 30 dias", "31-60": "31 a 60 dias", "61-90": "61 a 90 dias", "+90": "Mais de 90 dias" };
                                        return (
                                            <div key={faixa} style={{
                                                borderRadius: 12, padding: "20px",
                                                background: `${cor}08`, border: `1px solid ${cor}25`,
                                            }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: cor, textTransform: "uppercase",
                                                    letterSpacing: "0.06em", marginBottom: 8 }}>
                                                    {labels[faixa]}
                                                </div>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                                                    {item ? fmtValor(item.total) : "R$ 0,00"}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                                                    {item ? `${item.quantidade} título${item.quantidade != 1 ? "s" : ""}` : "0 títulos"}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
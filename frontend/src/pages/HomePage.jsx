import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoWhale from "../assets/logo.png";
import { IcoExcel, IcoPdf, IcoArrow } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function HomePage() {
  const { autenticado, usuario } = useAuth();
  const temWhalletPlus = usuario?.perfil === "ADMIN" || usuario?.planoId === PLANO_WHALLET_PLUS;
  const rotaGestao = temWhalletPlus ? "/titulos" : "/gestao-financeira";

  const [animouHero, setAnimouHero] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimouHero(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = "Whallet · Portal CNAB — Converta remessas bancárias em Excel e PDF";
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content",
        "Transforme arquivos CNAB de vários bancos em planilhas Excel estruturadas " +
        "ou relatórios PDF analíticos com alertas automáticos. Suporte a CNAB 240 e 400.");
  }, []);

  return (
    <>
      {/* ── Botão flutuante — Gestão Financeira ── */}
      <button
        onClick={() => document.getElementById("gestao-financeira")?.scrollIntoView({ behavior: "smooth" })}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 900,
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 20px", borderRadius: 50,
          background: "#111111",
          border: "1px solid rgba(212,160,23,0.35)", color: "#FFFFFF",
          fontWeight: 800, fontSize: 13, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(17,17,17,0.28)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(17,17,17,0.34)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(17,17,17,0.28)";
        }}
      >
        <span style={{ fontSize: 16 }}>💰</span>
        Gestão Financeira
      </button>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Portal Financeiro · CNAB + Gestão
          </div>

          <h1 className="hero-title">
            Transforme arquivos<br />
            <span className="">CNAB</span>
            <span className=""> em dados</span>
            <span className=""> úteis</span>
          </h1>

          <p className="hero-sub">
            Faça upload da sua remessa ou retorno bancário e gere planilhas Excel
            estruturadas ou relatórios PDF analíticos com alertas, resumo executivo
            e distribuição de pagamentos — sem instalar nada.
          </p>

          <div className="hero-ctas">
            <Link to="/excel" className="cta-primary">
              <IcoExcel /> Gerar Excel
            </Link>
            <Link to="/pdf" className="cta-secondary">
              <IcoPdf /> Gerar PDF analítico
            </Link>
          </div>

          <div className="hero-trust">
            <span className="trust-item"><span className="trust-dot trust-dot--bank" />Itaú 240 e 400</span>
            <span className="trust-sep" />
            <span className="trust-item"><span className="trust-dot trust-dot--bank" />Bradesco 240 e 400</span>
            <span className="trust-sep" />
            <span className="trust-item"><span className="trust-dot trust-dot--bank" />Banco do Brasil 240</span>
            <span className="trust-sep" />
            <span className="trust-item"><span className="trust-dot trust-dot--bank" />Caixa 240</span>
            <span className="trust-sep" />
            <span className="trust-item"><span className="trust-dot trust-dot--feature" />Remessa e Retorno</span>
            <span className="trust-sep" />
            <span className="trust-item"><span className="trust-dot trust-dot--feature" />Excel e PDF</span>
          </div>
        </div>

        {/* Showcase editorial */}
        <div className="hero-visual" aria-hidden="true">
          <div className={`hero-showcase hero-showcase--premium ${animouHero ? "is-ready" : ""}`}>
            <div className="hero-showcase-head">
              <span className="hero-showcase-kicker">Exemplo real de saída</span>
              <span className="hero-showcase-period">sem dados reais</span>
            </div>

            <div className="hero-output-scene">
              <div className="hero-glow hero-glow--1" />
              <div className="hero-glow hero-glow--2" />

              <div className="hero-source-file">
                <div className="hero-source-file__label">arquivo de entrada</div>
                <div className="hero-source-file__name">bra240pg.txt</div>
                <div className="hero-source-file__rows">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="hero-transform-line">
                <span className="hero-transform-line__dot" />
                <span className="hero-transform-line__dot" />
                <span className="hero-transform-line__dot" />
              </div>

              <div className="hero-sheet hero-sheet--excel">
                <div className="sheet-toolbar">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="sheet-title">bra240pg_resultado.xlsx</span>
                </div>

                <div className="excel-tabs">
                  <span className="excel-tab excel-tab--active">Resumo</span>
                  <span className="excel-tab">Seg J — Boletos</span>
                  <span className="excel-tab">Header Arquivo</span>
                </div>

                <div className="excel-grid">
                  <div className="excel-grid-head">
                    <span>Banco</span>
                    <span>Lote</span>
                    <span>Segmento</span>
                    <span>Vencimento</span>
                    <span>Valor</span>
                  </div>

                  <div className="excel-grid-row">
                    <span>237</span>
                    <span>0002</span>
                    <span>J</span>
                    <span>08/04/2026</span>
                    <strong>R$ 34,54</strong>
                  </div>

                  <div className="excel-grid-row">
                    <span>237</span>
                    <span>0003</span>
                    <span>J</span>
                    <span>08/04/2026</span>
                    <strong>R$ 583.471,31</strong>
                  </div>

                  <div className="excel-grid-row excel-grid-row--muted">
                    <span>237</span>
                    <span>0001</span>
                    <span>A</span>
                    <span>08/04/2026</span>
                    <strong>R$ 2.403,11</strong>
                  </div>
                </div>
              </div>

              <div className="hero-sheet hero-sheet--pdf">
                <div className="pdf-topbar">
                  <div className="pdf-brand">
                    <span className="pdf-brand-mark" />
                    <span>Whallet · Portal CNAB</span>
                  </div>
                  <span className="pdf-page-pill">PDF analítico</span>
                </div>

                <div className="pdf-title-block">
                  <div className="pdf-overline">REMESSA · BRADESCO CNAB 240</div>
                  <h3>Relatório de Pagamentos CNAB</h3>
                  <p>Empresa TESTE · Arquivo bra240pg.txt</p>
                </div>

                <div className="pdf-kpi-grid">
                  <div className="pdf-kpi">
                    <span>Valor total</span>
                    <strong>R$ 585.943,50</strong>
                  </div>
                  <div className="pdf-kpi">
                    <span>Títulos</span>
                    <strong>4</strong>
                  </div>
                  <div className="pdf-kpi">
                    <span>Lotes</span>
                    <strong>4</strong>
                  </div>
                  <div className="pdf-kpi">
                    <span>Alertas</span>
                    <strong>1 atenção</strong>
                  </div>
                </div>

                <div className="pdf-chart-card">
                  <div className="pdf-chart-head">
                    <span>Distribuição por segmento</span>
                    <span>50% / 50%</span>
                  </div>

                  <div className="pdf-bars">
                    <div className="pdf-bar-row">
                      <label>Seg A</label>
                      <div className="pdf-bar-track">
                        <div className="pdf-bar-fill pdf-bar-fill--a" />
                      </div>
                      <strong>R$ 2.437,65</strong>
                    </div>

                    <div className="pdf-bar-row">
                      <label>Seg J</label>
                      <div className="pdf-bar-track">
                        <div className="pdf-bar-fill pdf-bar-fill--j" />
                      </div>
                      <strong>R$ 583.505,85</strong>
                    </div>
                  </div>
                </div>

                <div className="pdf-alert-card">
                  <div className="pdf-alert-head">
                    <span className="pdf-alert-badge">ATENÇÃO</span>
                    <strong>Vencimentos no passado</strong>
                  </div>
                  <p>2 ocorrência(s) · 2 título(s) com data anterior a 08/04/2026.</p>
                </div>

                <div className="pdf-footer-line">
                  Gerado automaticamente pelo Whallet
                </div>
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* ── Stats ── */}
      <section className="stats-bar">
        {[
          { n: "7", l: "Layouts bancários" },
          { n: "4", l: "Bancos integrados" },
          { n: "240/400", l: "Versões CNAB" },
          { n: "9", l: "Tipos de alerta" },
        ].map(s => (
          <div key={s.l} className="stat-item">
            <span className="stat-n">{s.n}</span>
            <span className="stat-l">{s.l}</span>
          </div>
        ))}
      </section>

      {/* ── Ferramentas CNAB ── */}
      <section className="tools-section" id="ferramentas">
        <div className="tools-header">
          <h2>Conversão de CNAB</h2>
          <p>Duas saídas, uma única remessa. Sem configuração.</p>
        </div>
        <div className="tools-grid">
          <div className="tool-card-home tool-card-home--excel">
            <div className="tool-card-icon-wrap"><IcoExcel /></div>
            <h3>Exportar para Excel</h3>
            <p>
              Converta sua remessa ou retorno CNAB numa planilha estruturada com abas
              separadas por tipo de registro — Header, Segmentos, Trailer — pronta
              para conferência e importação.
            </p>
            <ul className="tool-features">
              <li>Abas por segmento (A, J, O, N, P, Q)</li>
              <li>Formatação automática de datas e valores</li>
              <li>Compatível com Itaú e Bradesco</li>
              <li>CNAB 240 e 400</li>
            </ul>
            <Link to="/excel" className="tool-btn tool-btn--excel">
              Gerar Excel <IcoArrow />
            </Link>
          </div>

          <div className="tool-card-home tool-card-home--pdf">
            <div className="tool-card-icon-wrap tool-card-icon-wrap--pdf"><IcoPdf /></div>
            <h3>Relatório PDF analítico</h3>
            <p>
              Gere um relatório executivo completo com capa, resumo financeiro,
              análise de alertas automáticos e ranking dos principais favorecidos
              — pronto para enviar ao gestor.
            </p>
            <ul className="tool-features">
              <li>Resumo executivo com KPIs financeiros</li>
              <li>9 categorias de alertas automáticos</li>
              <li>Distribuição mensal e por segmento</li>
              <li>Top favorecidos / sacados</li>
            </ul>
            <Link to="/pdf" className="tool-btn tool-btn--pdf">
              Gerar PDF <IcoArrow />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Gestão Financeira — seção de destaque ── */}
      <section id="gestao-financeira" className="gestao-section">
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.28)",
              borderRadius: 20, padding: "6px 18px", marginBottom: 20,
              fontSize: 12, fontWeight: 700, color: "#6c5310", letterSpacing: "0.06em"
            }}>
              ✦ WHALLET+ — GESTÃO FINANCEIRA
            </div>
            <h2 style={{
              fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900,
              color: "var(--text)", margin: "0 0 14px", letterSpacing: "-0.02em"
            }}>
              Muito além da conversão de CNAB
            </h2>
            <p style={{
              color: "var(--text-dim)", fontSize: 16, maxWidth: 520,
              margin: "0 auto", lineHeight: 1.7
            }}>
              O Whallet+ transforma o portal em uma central financeira completa —
              do controle de contas a pagar à geração de remessas integradas.
            </p>
          </div>

          {/* Grid de features */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 40
          }}>
            {[
              { icon: "📋", titulo: "Contas a pagar", desc: "Cadastre e importe títulos via Excel. Controle vencimentos e saldos em tempo real.", novo: true },
              { icon: "📊", titulo: "Relatórios", desc: "Visão consolidada por período e fornecedor. Exporte para Excel ou PDF com um clique.", novo: false },
              { icon: "🔔", titulo: "Alertas de vencimento", desc: "E-mails automáticos antes do vencimento. Configure a antecedência.", novo: false },
              { icon: "🏦", titulo: "Remessa integrada", desc: "Gere arquivos CNAB diretamente dos títulos — sem redigitar dados.", novo: false },
            ].map(f => (
              <div key={f.titulo} style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14, padding: "22px 18px",
                position: "relative", overflow: "hidden"
              }}>
                {f.novo && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: "rgba(17,17,17,0.06)", border: "1px solid rgba(17,17,17,0.18)",
                    borderRadius: 20, padding: "2px 8px",
                    fontSize: 10, fontWeight: 700, color: "#111111", letterSpacing: "0.04em"
                  }}>DISPONÍVEL</div>
                )}
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6, fontSize: 14 }}>{f.titulo}</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <Link to={rotaGestao} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 32px", borderRadius: 12,
              background: "#111111",
              border: "1px solid rgba(212,160,23,0.35)",
              color: "#FFFFFF", fontWeight: 800, fontSize: 16,
              textDecoration: "none"
            }}>
              {temWhalletPlus ? "Abrir Gestão Financeira" : "Conhecer o Whallet+"} <IcoArrow />
            </Link>
            {!autenticado && (
              <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-dim)" }}>
                Teste grátis · sem cartão de crédito
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="steps-section" id="como-funciona">
        <div className="tools-header">
          <h2>Como funciona</h2>
          <p>Três passos. Menos de um minuto.</p>
        </div>
        <div className="steps-grid">
          {[
            { n: "01", icon: "🏦", t: "Escolha o banco", d: "Selecione o banco e o layout CNAB — cobrança ou pagamento, 240 ou 400." },
            { n: "02", icon: "📁", t: "Envie o arquivo", d: "Upload da remessa ou retorno. Nenhum arquivo de configuração extra." },
            { n: "03", icon: "⬇", t: "Baixe o resultado", d: "Excel estruturado ou relatório PDF analítico gerado instantaneamente." },
          ].map(s => (
            <div key={s.n} className="step-card">
              <div className="step-top">
                <span className="step-n">{s.n}</span>
                <span className="step-icon">{s.icon}</span>
              </div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <img src={logoWhale} alt="" className="footer-whale" />
        <span>Whallet · Portal Financeiro</span>
      </footer>
    </>
  );
}
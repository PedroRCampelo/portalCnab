import { useEffect } from "react";
import { Link } from "react-router-dom";
import logoWhale from "../assets/logo.png";
import { IcoExcel, IcoPdf, IcoArrow } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PLANO_WHALLET_PLUS = "10000000-0000-0000-0000-000000000003";

export default function HomePage() {
  const { autenticado, usuario } = useAuth();
  const temWhalletPlus = usuario?.perfil === "ADMIN" || usuario?.planoId === PLANO_WHALLET_PLUS;
  const rotaGestao     = temWhalletPlus ? "/titulos" : "/gestao-financeira";

  useEffect(() => {
    document.title = "Whallet · Portal Financeiro — CNAB, Gestão e Relatórios";
    document.querySelector('meta[name="description"]')
        ?.setAttribute("content",
            "Transforme arquivos CNAB em Excel e PDF. Gerencie contas a pagar, " +
            "receba alertas de vencimento e gere remessas bancárias integradas.");
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
              background: "linear-gradient(135deg,#F59E0B,#FCD34D)",
              border: "none", color: "#1a1a1a",
              fontWeight: 800, fontSize: 13, cursor: "pointer",
              boxShadow: "0 4px 24px rgba(245,158,11,0.4)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 6px 32px rgba(245,158,11,0.55)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(245,158,11,0.4)";
            }}
        >
          <span style={{ fontSize: 16 }}>💰</span>
          Gestão Financeira
        </button>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot"/>
              Portal Financeiro · CNAB + Gestão
            </div>

            <h1 className="hero-title">
              Do arquivo CNAB<br/>
              <span className="gradient-text">à gestão financeira</span>
              <span className="hero-title"> completa</span>
            </h1>

            <p className="hero-sub">
              Converta remessas bancárias em Excel e PDF, gerencie contas a pagar,
              receba alertas de vencimento e gere remessas diretamente dos seus títulos
              — sem instalar nada.
            </p>

            <div className="hero-ctas">
              <Link to="/excel" className="cta-primary">
                <IcoExcel/> Gerar Excel
              </Link>
              <Link to="/pdf" className="cta-secondary">
                <IcoPdf/> Gerar PDF analítico
              </Link>
            </div>

            <div className="hero-trust">
              <span className="trust-item"><span className="trust-dot trust-dot--bank"/>Itaú 240 e 400</span>
              <span className="trust-sep"/>
              <span className="trust-item"><span className="trust-dot trust-dot--bank"/>Bradesco 240 e 400</span>
              <span className="trust-sep"/>
              <span className="trust-item"><span className="trust-dot trust-dot--bank"/>Banco do Brasil 240</span>
              <span className="trust-sep"/>
              <span className="trust-item"><span className="trust-dot trust-dot--bank"/>Caixa 240</span>
              <span className="trust-sep"/>
              <span className="trust-item"><span className="trust-dot trust-dot--feature"/>Remessa e Retorno</span>
              <span className="trust-sep"/>
              <span className="trust-item"><span className="trust-dot trust-dot--feature"/>Excel e PDF</span>
            </div>
          </div>

          {/* Cards flutuantes decorativos */}
          <div className="hero-visual" aria-hidden="true">
            <div className="float-card float-card--top">
              <span className="float-card-icon">📊</span>
              <div>
                <div className="float-card-label">Valor total processado</div>
                <div className="float-card-val">R$ 1.284.900,00</div>
                <div className="float-card-sub">128 títulos · Itaú CNAB 240</div>
              </div>
              <span className="float-card-badge float-card-badge--ok">✓</span>
            </div>
            <div className="float-card float-card--mid">
              <span className="float-card-icon">⚠️</span>
              <div>
                <div className="float-card-label">Alerta detectado</div>
                <div className="float-card-val">3 vencimentos no passado</div>
                <div className="float-card-sub">Verificar antes de enviar ao banco</div>
              </div>
              <span className="float-card-badge float-card-badge--warn">!</span>
            </div>
            <div className="float-card float-card--bot">
              <span className="float-card-icon">🏦</span>
              <div>
                <div className="float-card-label">Relatório PDF gerado</div>
                <div className="float-card-val">retorno_mar2026.pdf</div>
                <div className="float-card-sub">Bradesco Multipag · 247 registros</div>
              </div>
              <span className="float-card-badge float-card-badge--ok">✓</span>
            </div>
            <div className="float-card float-card--xs">
              <span className="float-card-icon">🔍</span>
              <div>
                <div className="float-card-label">Nosso número duplicado</div>
                <div className="float-card-val">2 ocorrências críticas</div>
                <div className="float-card-sub">Linha 47 e linha 89</div>
              </div>
              <span className="float-card-badge float-card-badge--err">✕</span>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="stats-bar">
          {[
            { n:"7",       l:"Layouts bancários" },
            { n:"4",       l:"Bancos integrados" },
            { n:"240/400", l:"Versões CNAB" },
            { n:"9",       l:"Tipos de alerta" },
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
              <div className="tool-card-icon-wrap"><IcoExcel/></div>
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
                Gerar Excel <IcoArrow/>
              </Link>
            </div>

            <div className="tool-card-home tool-card-home--pdf">
              <div className="tool-card-icon-wrap tool-card-icon-wrap--pdf"><IcoPdf/></div>
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
                Gerar PDF <IcoArrow/>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Gestão Financeira — seção de destaque ── */}
        <section id="gestao-financeira" style={{
          padding: "80px 24px",
          background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.04) 30%, rgba(251,191,36,0.04) 70%, transparent)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 20, padding: "6px 18px", marginBottom: 20,
                fontSize: 12, fontWeight: 700, color: "#FCD34D", letterSpacing: "0.06em"
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
                          background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: 20, padding: "2px 8px",
                          fontSize: 10, fontWeight: 700, color: "#4ADE80", letterSpacing: "0.04em"
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
                background: "linear-gradient(135deg,#F59E0B,#FCD34D)",
                color: "#1a1a1a", fontWeight: 800, fontSize: 16,
                textDecoration: "none"
              }}>
                {temWhalletPlus ? "Abrir Gestão Financeira" : "Conhecer o Whallet+"} <IcoArrow/>
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
              { n:"01", icon:"🏦", t:"Escolha o banco",  d:"Selecione o banco e o layout CNAB — cobrança ou pagamento, 240 ou 400." },
              { n:"02", icon:"📁", t:"Envie o arquivo",   d:"Upload da remessa ou retorno. Nenhum arquivo de configuração extra." },
              { n:"03", icon:"⬇", t:"Baixe o resultado", d:"Excel estruturado ou relatório PDF analítico gerado instantaneamente." },
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
          <img src={logoWhale} alt="" className="footer-whale"/>
          <span>Whallet · Portal Financeiro</span>
        </footer>
      </>
  );
}
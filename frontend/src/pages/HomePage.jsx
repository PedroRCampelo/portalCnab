import { useEffect } from "react";
import { Link } from "react-router-dom";
import logoWhale from "../assets/logo.png";
import { IcoExcel, IcoPdf, IcoArrow } from "../components/icons.jsx";

export default function HomePage() {
  useEffect(() => {
    document.title = "Whallet · Portal CNAB — Converta remessas bancárias em Excel e PDF";
    document.querySelector('meta[name="description"]')
        ?.setAttribute("content",
            "Transforme arquivos CNAB do Itaú e Bradesco em planilhas Excel estruturadas " +
            "ou relatórios PDF analíticos com alertas automáticos. Suporte a CNAB 240 e 400.");
  }, []);

  return (
      <>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot"/>
              Automação bancária · Portal CNAB
            </div>

            <h1 className="hero-title">
              Transforme arquivos<br/>
              <span className="gradient-text">CNAB</span>
              <span className="hero-title"> em dados</span>
              <span className="gradient-text"> úteis</span>
            </h1>

            <p className="hero-sub">
              Faça upload da sua remessa ou retorno bancário e gere planilhas Excel
              estruturadas ou relatórios PDF analíticos com alertas, resumo executivo
              e distribuição de pagamentos — sem instalar nada.
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

        {/* ── Ferramentas ── */}
        <section className="tools-section" id="ferramentas">
          <div className="tools-header">
            <h2>Escolha sua ferramenta</h2>
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
          <span>Whallet · Portal CNAB</span>
        </footer>
      </>
  );
}
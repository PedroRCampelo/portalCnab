import { useState } from "react";
import axios from "axios";
import "./App.css";
import logoWhale from "./assets/logo.png";

// ── Logos dos bancos ──────────────────────────────────────────────────────────
const LogoItau = () => (
    <svg viewBox="0 0 88 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
      <rect width="88" height="28" rx="5" fill="#EC7000"/>
      <text x="44" y="19" textAnchor="middle" fill="#fff"
            fontFamily="Arial,sans-serif" fontWeight="900" fontSize="14" letterSpacing="1">itaú</text>
    </svg>
);
const LogoBradesco = () => (
    <svg viewBox="0 0 100 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
      <rect width="100" height="28" rx="5" fill="#CC092F"/>
      <text x="50" y="19" textAnchor="middle" fill="#fff"
            fontFamily="Arial,sans-serif" fontWeight="900" fontSize="10" letterSpacing="0.8">BRADESCO</text>
    </svg>
);

// ── Catálogo de layouts ───────────────────────────────────────────────────────
const BANK_LAYOUTS = [
  { key:"ITAU_400_COBRANCA",      bank:"ITAU",     bankId:"itau",     LogoComponent:LogoItau,     version:"400", mode:"COBRANCA",  label:"CNAB 400 — Cobrança",  desc:"Remessa e retorno de boletos (layout clássico)" },
  { key:"ITAU_240_COBRANCA",      bank:"ITAU",     bankId:"itau",     LogoComponent:LogoItau,     version:"240", mode:"COBRANCA",  label:"CNAB 240 — Cobrança",  desc:"Remessa e retorno de boletos (FEBRABAN 240)" },
  { key:"ITAU_240_PAGAMENTO",     bank:"ITAU",     bankId:"itau",     LogoComponent:LogoItau,     version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"SISPAG — TED, PIX, boletos, tributos" },
  { key:"BRADESCO_240_PAGAMENTO", bank:"BRADESCO", bankId:"bradesco", LogoComponent:LogoBradesco, version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"Multipag — crédito conta, boletos, tributos" },
];
const BANKS = (() => {
  const map = new Map();
  for (const bl of BANK_LAYOUTS) {
    if (!map.has(bl.bankId)) map.set(bl.bankId, { bankId:bl.bankId, LogoComponent:bl.LogoComponent, layouts:[] });
    map.get(bl.bankId).layouts.push(bl);
  }
  return [...map.values()];
})();

// ── Ícones ────────────────────────────────────────────────────────────────────
const IcoCheck = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IcoChevron = ({ open }) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         style={{ transform:open?"rotate(180deg)":"none", transition:"transform .2s" }}>
      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IcoUpload = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
);
const IcoSpinner = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="spinner">
      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
      <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const IcoExcel = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 5l2 3-2 3M8 11h3M9.5 8h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
);
const IcoPdf = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M4 9.5c0 .8.6 1.5 1.5 1.5S7 10.3 7 9.5 6.4 8 5.5 8H4V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 8h1a1.5 1.5 0 010 3H9V8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8v4M11 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
);
const IcoArrow = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IcoBack = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ── Formulário bancário compartilhado ─────────────────────────────────────────
function BankForm({ toolMode, onSuccess }) {
  const [openBankId, setOpenBankId] = useState("itau");
  const [bankLayout, setBankLayout] = useState(BANK_LAYOUTS[0]);
  const [bankFile,   setBankFile]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState("");

  const downloadBlob = (data, filename, mime) => {
    const blob = new Blob([data], { type: mime });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  const bankParams = `?bank=${bankLayout.bank}&version=${bankLayout.version}&mode=${bankLayout.mode}`;
  const isExcel = toolMode === "excel";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bankFile) { setMsg("Selecione o arquivo antes de continuar."); return; }
    try {
      setLoading(true); setMsg("");
      const fd = new FormData();
      fd.append("remessaFile", bankFile);
      const endpoint = isExcel ? "export-bank" : "report-bank";
      const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/cnab/${endpoint}${bankParams}`,
          fd, { responseType:"blob", headers:{"Content-Type":"multipart/form-data"} }
      );
      const ext  = isExcel ? "xlsx" : "pdf";
      const mime = isExcel
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      const suffix = isExcel ? "_resultado" : "_relatorio";
      downloadBlob(res.data, bankFile.name.replace(/\.[^/.]+$/, "") + suffix + "." + ext, mime);
      const label = isExcel ? "Excel gerado com sucesso." : "Relatório PDF gerado com sucesso.";
      setMsg(label);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setMsg(`Erro ao gerar o ${isExcel ? "Excel" : "PDF"}. Verifique a API.`);
    } finally { setLoading(false); }
  };

  return (
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label">Banco e layout</label>
          <div className="bank-accordion">
            {BANKS.map((bank) => {
              const isOpen = openBankId === bank.bankId;
              return (
                  <div key={bank.bankId} className={`bank-group ${isOpen?"bank-group--open":""}`}>
                    <button type="button" className="bank-group-header"
                            onClick={() => setOpenBankId(isOpen ? null : bank.bankId)}>
                      <bank.LogoComponent/>
                      <span className="bank-group-count">
                    {bank.layouts.length} layout{bank.layouts.length>1?"s":""}
                  </span>
                      <IcoChevron open={isOpen}/>
                    </button>
                    {isOpen && (
                        <div className="bank-group-items">
                          {bank.layouts.map((bl) => {
                            const isActive = bankLayout.key === bl.key;
                            return (
                                <button key={bl.key} type="button"
                                        className={`bank-item ${isActive?"bank-item--active":""}`}
                                        onClick={() => { setBankLayout(bl); setBankFile(null); setMsg(""); }}>
                                  <div className="bank-item-main">
                                    <span className="bank-item-label">{bl.label}</span>
                                    {isActive && <span className="bank-item-check"><IcoCheck/></span>}
                                  </div>
                                  <span className="bank-item-desc">{bl.desc}</span>
                                </button>
                            );
                          })}
                        </div>
                    )}
                  </div>
              );
            })}
          </div>
        </div>

        <div className="bank-info-box">
          <bankLayout.LogoComponent/>
          <div className="bank-info-text">
            <strong>{bankLayout.label}</strong>
            <span>{bankLayout.desc}</span>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Arquivo de remessa ou retorno</label>
          <label className="upload-card">
            <input type="file" accept=".rem,.ret,.txt,.cnab"
                   onChange={(e) => setBankFile(e.target.files?.[0] || null)}/>
            <span className="upload-icon-wrap"><IcoUpload/></span>
            <span className="upload-title">
            {bankFile ? bankFile.name : "Arraste ou clique para selecionar"}
          </span>
            <span className="upload-subtitle">
            {bankFile ? "Arquivo selecionado — pronto para processar" : "Formatos: .rem .ret .txt .cnab"}
          </span>
          </label>
        </div>

        <button type="submit"
                className={`action-btn ${isExcel ? "action-btn--excel" : "action-btn--pdf action-btn--pdf-solid"}`}
                disabled={loading}>
          {loading
              ? <><IcoSpinner/> Gerando…</>
              : isExcel
                  ? <><IcoExcel/> Gerar Excel</>
                  : <><IcoPdf/> Gerar Relatório PDF</>}
        </button>

        {msg && (
            <div className={`msg ${msg.includes("Erro") ? "msg--error" : "msg--success"}`}>
              {msg.includes("Erro") ? "✕ " : "✓ "}{msg}
            </div>
        )}
      </form>
  );
}

// ── Formulário Protheus (layout customizado) ──────────────────────────────────
function ProtheusForm() {
  const [layoutFile, setLayoutFile] = useState(null);
  const [remessaFile, setRemessaFile] = useState(null);
  const [cnabType, setCnabType]     = useState("400");
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState("");

  const downloadBlob = (data, filename, mime) => {
    const blob = new Blob([data], { type: mime });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!layoutFile || !remessaFile) { setMsg("Selecione os dois arquivos antes de continuar."); return; }
    try {
      setLoading(true); setMsg("");
      const fd = new FormData();
      fd.append("layoutFile", layoutFile);
      fd.append("remessaFile", remessaFile);
      fd.append("cnabType", cnabType);
      const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/cnab/export`, fd,
          { responseType:"blob", headers:{"Content-Type":"multipart/form-data"} }
      );
      downloadBlob(res.data, "cnab-export.xlsx",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      setMsg("Excel gerado com sucesso.");
    } catch (err) {
      console.error(err);
      setMsg("Erro ao gerar o Excel. Verifique a API.");
    } finally { setLoading(false); }
  };

  return (
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label">Versão CNAB</label>
          <div className="cnab-toggle">
            <button type="button"
                    className={`cnab-option ${cnabType==="400"?"active":""}`}
                    onClick={() => setCnabType("400")}>
              <span className="cnab-option-title">CNAB 400</span>
              <span className="cnab-option-subtitle">Layout clássico</span>
            </button>
            <button type="button"
                    className={`cnab-option ${cnabType==="240"?"active":""}`}
                    onClick={() => setCnabType("240")}>
              <span className="cnab-option-title">CNAB 240*</span>
              <span className="cnab-option-subtitle">Em construção</span>
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Arquivo de layout</label>
          <label className="upload-card">
            <input type="file" onChange={(e) => setLayoutFile(e.target.files?.[0] || null)}/>
            <span className="upload-icon-wrap"><IcoUpload/></span>
            <span className="upload-title">{layoutFile ? layoutFile.name : "Arraste ou clique para selecionar"}</span>
            <span className="upload-subtitle">{layoutFile ? "Layout selecionado" : "Arquivo de layout do Protheus"}</span>
          </label>
        </div>

        <div className="field">
          <label className="field-label">Arquivo de remessa</label>
          <label className="upload-card">
            <input type="file" onChange={(e) => setRemessaFile(e.target.files?.[0] || null)}/>
            <span className="upload-icon-wrap"><IcoUpload/></span>
            <span className="upload-title">{remessaFile ? remessaFile.name : "Arraste ou clique para selecionar"}</span>
            <span className="upload-subtitle">{remessaFile ? "Remessa selecionada" : "Arquivo de remessa CNAB"}</span>
          </label>
        </div>

        <button type="submit" className="action-btn action-btn--excel" disabled={loading}>
          {loading ? <><IcoSpinner/> Gerando…</> : <><IcoExcel/> Gerar Excel</>}
        </button>

        {msg && (
            <div className={`msg ${msg.includes("Erro") ? "msg--error" : "msg--success"}`}>
              {msg.includes("Erro") ? "✕ " : "✓ "}{msg}
            </div>
        )}
      </form>
  );
}

// ── Página Excel (com abas Bancário / Protheus) ───────────────────────────────
function ExcelPage({ goTo }) {
  const [source, setSource] = useState("bank"); // "bank" | "protheus"

  return (
      <div className="tool-page">
        <div className="tool-page-header">
          <button type="button" className="back-btn" onClick={() => goTo("home")}>
            <IcoBack/> Voltar
          </button>
          <div className="tool-page-title">
            <div className="tool-page-icon tool-page-icon--excel"><IcoExcel/></div>
            <div>
              <h1>Exportar para Excel</h1>
              <p>Converta sua remessa CNAB em planilha estruturada</p>
            </div>
          </div>
        </div>

        <div className="tool-page-body">
          <div className="tool-page-form">
            <div className="source-tabs">
              <button type="button"
                      className={`source-tab ${source==="bank"?"source-tab--active":""}`}
                      onClick={() => setSource("bank")}>
                🏦 Layout Bancário
              </button>
              <button type="button"
                      className={`source-tab ${source==="protheus"?"source-tab--active":""}`}
                      onClick={() => setSource("protheus")}>
                ⚙️ Layout Protheus
              </button>
            </div>
            {source === "bank"     && <BankForm toolMode="excel"/>}
            {source === "protheus" && <ProtheusForm/>}
          </div>

          <div className="tool-page-info">
            <div className="info-card">
              <h3>O que você recebe</h3>
              <ul className="info-list">
                <li><span className="info-check">✓</span> Planilha .xlsx com abas por tipo de registro</li>
                <li><span className="info-check">✓</span> Aba de resumo com contagens por tipo</li>
                <li><span className="info-check">✓</span> Datas e valores formatados automaticamente</li>
                <li><span className="info-check">✓</span> Coluna de linha original para rastreabilidade</li>
              </ul>
            </div>
            <div className="info-card info-card--muted">
              <h3>Layouts suportados</h3>
              <ul className="info-list">
                <li><span className="info-bank itau">itaú</span> CNAB 400 Cobrança</li>
                <li><span className="info-bank itau">itaú</span> CNAB 240 Cobrança</li>
                <li><span className="info-bank itau">itaú</span> CNAB 240 Pagamento</li>
                <li><span className="info-bank bradesco">B</span> Bradesco CNAB 240 Pagamento</li>
                <li><span className="info-bank protheus">P</span> Layout Protheus customizado</li>
              </ul>
            </div>
            <div className="info-tip">
              <span className="info-tip-icon">💡</span>
              <span>Quer análise executiva? Use o <button type="button" className="link-btn" onClick={() => goTo("pdf")}>Relatório PDF</button>.</span>
            </div>
          </div>
        </div>
      </div>
  );
}

function App() {
  // "home" | "excel" | "pdf"
  const [page, setPage] = useState("home");

  const goTo = (p) => { setPage(p); window.scrollTo({ top:0, behavior:"smooth" }); };

  return (
      <div className="app-shell">
        <div className="bg-orb bg-orb--1" aria-hidden="true"/>
        <div className="bg-orb bg-orb--2" aria-hidden="true"/>

        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="topbar-gradient-line" aria-hidden="true"/>
          <div className="topbar-inner">

            {/* Brand */}
            <button type="button" className="brand brand-btn" onClick={() => goTo("home")}>
              <div className="brand-whale-wrap">
                <img src={logoWhale} alt="" className="brand-whale"/>
              </div>
              <span className="brand-wordmark">Whallet</span>
            </button>

            {/* Nav central */}
            {page === "home" ? (
                <nav className="topbar-nav" aria-label="Navegação principal">
                  <div className="nav-pill">
                    <button type="button" className="nav-link" onClick={() => goTo("excel")}>
                      <span className="nav-link-icon">⚡</span>
                      <span className="nav-link-text">Ferramenta</span>
                    </button>
                    <div className="nav-divider"/>
                    <a href="#como-funciona" className="nav-link">
                      <span className="nav-link-icon">📖</span>
                      <span className="nav-link-text">Como funciona</span>
                    </a>
                  </div>
                </nav>
            ) : (
                <nav className="topbar-nav">
                  <div className="nav-pill">
                    <button type="button" className="nav-link" onClick={() => goTo("home")}>
                      <IcoBack/><span className="nav-link-text"> Home</span>
                    </button>
                    <div className="nav-divider"/>
                    <button type="button"
                            className={`nav-link ${page==="excel"?"nav-link--active":""}`}
                            onClick={() => goTo("excel")}>
                      <IcoExcel/><span className="nav-link-text"> Excel</span>
                    </button>
                    <div className="nav-divider"/>
                    <button type="button"
                            className={`nav-link ${page==="pdf"?"nav-link--active":""}`}
                            onClick={() => goTo("pdf")}>
                      <IcoPdf/><span className="nav-link-text"> PDF</span>
                    </button>
                  </div>
                </nav>
            )}

            {/* Direita */}
            <div className="topbar-actions">
            <span className="topbar-badge">
              <span className="topbar-badge-dot"/>
              4 layouts ativos
            </span>
              {page === "home" && (
                  <button type="button" className="topbar-cta" onClick={() => goTo("excel")}>
                    Começar <IcoArrow/>
                  </button>
              )}
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════════════
          PÁGINA: HOME
      ══════════════════════════════════════════════════════════════════════ */}
        {page === "home" && (
            <>
              {/* Hero */}
              <section className="hero">
                <div className="hero-content">
                  <div className="eyebrow">
                    <span className="eyebrow-dot"/>
                    Automação bancária · Portal CNAB
                  </div>

                  <h1 className="hero-title">
                    Transforme arquivos<br/>
                    <span className="gradient-text">CNAB</span>
                    <span className="hero-title">  em dados </span>
                    <span className="gradient-text">  úteis </span>
                  </h1>

                  <p className="hero-sub">
                    Faça upload da sua remessa ou retorno bancário e gere
                    planilhas Excel estruturadas ou relatórios PDF analíticos
                    com alertas, resumo executivo e distribuição de pagamentos —
                    sem instalar nada.
                  </p>

                  <div className="hero-ctas">
                    <button type="button" className="cta-primary" onClick={() => goTo("excel")}>
                      <IcoExcel/> Gerar Excel
                    </button>
                    <button type="button" className="cta-secondary" onClick={() => goTo("pdf")}>
                      <IcoPdf/> Gerar PDF analítico
                    </button>
                  </div>

                  <div className="hero-trust">
                    <span className="trust-item"><span className="trust-dot"/>Itaú CNAB 240 e 400</span>
                    <span className="trust-sep"/>
                    <span className="trust-item"><span className="trust-dot"/>Bradesco Multipag 240</span>
                    <span className="trust-sep"/>
                    <span className="trust-item"><span className="trust-dot"/>Remessa e Retorno</span>
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

              {/* Stats */}
              <section className="stats-bar">
                {[
                  { n:"4",       l:"Layouts bancários" },
                  { n:"2",       l:"Bancos integrados" },
                  { n:"240/400", l:"Versões CNAB" },
                  { n:"9",       l:"Tipos de alerta" },
                ].map(s => (
                    <div key={s.l} className="stat-item">
                      <span className="stat-n">{s.n}</span>
                      <span className="stat-l">{s.l}</span>
                    </div>
                ))}
              </section>

              {/* Ferramentas */}
              <section className="tools-section" id="ferramentas">
                <div className="tools-header">
                  <h2>Escolha sua ferramenta</h2>
                  <p>Duas saídas, uma única remessa. Sem configuração.</p>
                </div>

                <div className="tools-grid">
                  {/* Excel */}
                  <div className="tool-card-home tool-card-home--excel">
                    <div className="tool-card-icon-wrap">
                      <IcoExcel/>
                    </div>
                    <h3>Exportar para Excel</h3>
                    <p>
                      Converta sua remessa ou retorno CNAB numa planilha estruturada
                      com abas separadas por tipo de registro — Header, Segmentos,
                      Trailer — pronta para conferência e importação.
                    </p>
                    <ul className="tool-features">
                      <li>Abas por segmento (A, J, O, N, P, Q)</li>
                      <li>Formatação automática de datas e valores</li>
                      <li>Compatível com Itaú e Bradesco</li>
                      <li>CNAB 240 e 400</li>
                    </ul>
                    <button type="button" className="tool-btn tool-btn--excel" onClick={() => goTo("excel")}>
                      Gerar Excel <IcoArrow/>
                    </button>
                  </div>

                  {/* PDF */}
                  <div className="tool-card-home tool-card-home--pdf">
                    <div className="tool-card-icon-wrap tool-card-icon-wrap--pdf">
                      <IcoPdf/>
                    </div>
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
                    <button type="button" className="tool-btn tool-btn--pdf" onClick={() => goTo("pdf")}>
                      Gerar PDF <IcoArrow/>
                    </button>
                  </div>
                </div>
              </section>

              {/* Como funciona */}
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

              {/* Footer */}
              <footer className="footer">
                <img src={logoWhale} alt="" className="footer-whale"/>
                <span>Whallet · Portal CNAB</span>
              </footer>
            </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          PÁGINA: EXCEL
      ══════════════════════════════════════════════════════════════════════ */}
        {page === "excel" && (
            <ExcelPage goTo={goTo}/>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          PÁGINA: PDF
      ══════════════════════════════════════════════════════════════════════ */}
        {page === "pdf" && (
            <div className="tool-page">
              <div className="tool-page-header">
                <button type="button" className="back-btn" onClick={() => goTo("home")}>
                  <IcoBack/> Voltar
                </button>
                <div className="tool-page-title">
                  <div className="tool-page-icon tool-page-icon--pdf"><IcoPdf/></div>
                  <div>
                    <h1>Relatório PDF analítico</h1>
                    <p>Análise completa da remessa com alertas e resumo executivo</p>
                  </div>
                </div>
              </div>

              <div className="tool-page-body">
                <div className="tool-page-form">
                  <BankForm toolMode="pdf"/>
                </div>
                <div className="tool-page-info">
                  <div className="info-card">
                    <h3>Seções do relatório</h3>
                    <ul className="info-list">
                      <li><span className="info-check">✓</span> Capa com logo, empresa e metadados</li>
                      <li><span className="info-check">✓</span> Resumo executivo — valor total, médias, KPIs</li>
                      <li><span className="info-check">✓</span> Distribuição por segmento com proporção</li>
                      <li><span className="info-check">✓</span> Linha do tempo mensal</li>
                      <li><span className="info-check">✓</span> Alertas automáticos por severidade</li>
                      <li><span className="info-check">✓</span> Top favorecidos / sacados</li>
                    </ul>
                  </div>
                  <div className="info-card info-card--alerts">
                    <h3>Alertas detectados automaticamente</h3>
                    <ul className="info-list">
                      <li><span className="sev sev--critico">CRÍTICO</span> Nosso Número duplicado</li>
                      <li><span className="sev sev--critico">CRÍTICO</span> Datas inválidas</li>
                      <li><span className="sev sev--atencao">ATENÇÃO</span> Vencimentos no passado</li>
                      <li><span className="sev sev--atencao">ATENÇÃO</span> Valores discrepantes</li>
                      <li><span className="sev sev--atencao">ATENÇÃO</span> Valor zero</li>
                      <li><span className="sev sev--info">INFO</span> Ocorrências no retorno</li>
                    </ul>
                  </div>
                  <div className="info-tip">
                    <span className="info-tip-icon">💡</span>
                    <span>Prefere uma planilha para edição? Use o <button type="button" className="link-btn" onClick={() => goTo("excel")}>Exportar Excel</button>.</span>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}

export default App;
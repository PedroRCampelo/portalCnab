import { useState } from "react";
import axios from "axios";
import "./App.css";
import logoWhale from "./assets/logo.png";

// ── SVG logos dos bancos ──────────────────────────────────────────────────────
const LogoItau = () => (
    <svg viewBox="0 0 88 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
      <rect width="88" height="28" rx="5" fill="#EC7000"/>
      <text x="44" y="19" textAnchor="middle" fill="#fff"
            fontFamily="Arial,sans-serif" fontWeight="900" fontSize="14" letterSpacing="1">
        itaú
      </text>
    </svg>
);

const LogoBradesco = () => (
    <svg viewBox="0 0 100 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
      <rect width="100" height="28" rx="5" fill="#CC092F"/>
      <text x="50" y="19" textAnchor="middle" fill="#fff"
            fontFamily="Arial,sans-serif" fontWeight="900" fontSize="10" letterSpacing="0.8">
        BRADESCO
      </text>
    </svg>
);

// ── Catálogo de layouts ───────────────────────────────────────────────────────
const BANK_LAYOUTS = [
  { key:"ITAU_400_COBRANCA",      bank:"ITAU",     bankId:"itau",     bankName:"Itaú",    LogoComponent:LogoItau,     version:"400", mode:"COBRANCA",  label:"CNAB 400 — Cobrança",  desc:"Remessa e retorno de boletos (layout clássico)" },
  { key:"ITAU_240_COBRANCA",      bank:"ITAU",     bankId:"itau",     bankName:"Itaú",    LogoComponent:LogoItau,     version:"240", mode:"COBRANCA",  label:"CNAB 240 — Cobrança",  desc:"Remessa e retorno de boletos (FEBRABAN 240)" },
  { key:"ITAU_240_PAGAMENTO",     bank:"ITAU",     bankId:"itau",     bankName:"Itaú",    LogoComponent:LogoItau,     version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"SISPAG — TED, PIX, boletos, tributos" },
  { key:"BRADESCO_240_PAGAMENTO", bank:"BRADESCO", bankId:"bradesco", bankName:"Bradesco",LogoComponent:LogoBradesco, version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"Multipag — crédito conta, boletos, tributos" },
];

const BANKS = (() => {
  const map = new Map();
  for (const bl of BANK_LAYOUTS) {
    if (!map.has(bl.bankId))
      map.set(bl.bankId, { bankId:bl.bankId, bankName:bl.bankName, LogoComponent:bl.LogoComponent, layouts:[] });
    map.get(bl.bankId).layouts.push(bl);
  }
  return [...map.values()];
})();

// ── Ícones SVG simples ────────────────────────────────────────────────────────
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IconChevron = ({ open }) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IconUpload = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
);
const IconSpinner = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="spinner">
      <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
      <path d="M9 2a7 7 0 017 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [mode, setMode]             = useState("bank");
  const [openBankId, setOpenBankId] = useState("itau");
  const [bankLayout, setBankLayout] = useState(BANK_LAYOUTS[0]);
  const [bankFile, setBankFile]     = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankMsg, setBankMsg]         = useState("");

  const [layoutFile, setLayoutFile]   = useState(null);
  const [remessaFile, setRemessaFile] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState("");
  const [cnabType, setCnabType]       = useState("400");

  const downloadBlob = (data, filename) => {
    const blob = new Blob([data], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleBankExport = async (e) => {
    e.preventDefault();
    if (!bankFile) { setBankMsg("Selecione o arquivo antes de continuar."); return; }
    try {
      setBankLoading(true); setBankMsg("");
      const fd = new FormData();
      fd.append("remessaFile", bankFile);
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.post(
          `${apiUrl}/api/cnab/export-bank?bank=${bankLayout.bank}&version=${bankLayout.version}&mode=${bankLayout.mode}`,
          fd, { responseType:"blob", headers:{"Content-Type":"multipart/form-data"} }
      );
      downloadBlob(res.data, bankFile.name.replace(/\.[^/.]+$/, "") + "_resultado.xlsx");
      setBankMsg("Excel gerado com sucesso.");
    } catch (err) {
      console.error(err);
      setBankMsg("Erro ao gerar o Excel. Verifique a API.");
    } finally { setBankLoading(false); }
  };

  const handleExport = async (e) => {
    e.preventDefault();
    if (!layoutFile || !remessaFile) { setMessage("Selecione os dois arquivos."); return; }
    try {
      setLoading(true); setMessage("");
      const fd = new FormData();
      fd.append("layoutFile", layoutFile);
      fd.append("remessaFile", remessaFile);
      fd.append("cnabType", cnabType);
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiUrl}/api/cnab/export`, fd,
          { responseType:"blob", headers:{"Content-Type":"multipart/form-data"} });
      downloadBlob(res.data, "cnab-export.xlsx");
      setMessage("Excel gerado com sucesso.");
    } catch (err) {
      console.error(err);
      setMessage("Erro ao gerar o Excel. Verifique a API.");
    } finally { setLoading(false); }
  };

  const selectLayout = (bl) => { setBankLayout(bl); setBankFile(null); setBankMsg(""); };

  return (
      <div className="app-shell">

        {/* ── Orbs decorativos de fundo ── */}
        <div className="bg-orb bg-orb--1" aria-hidden="true"/>
        <div className="bg-orb bg-orb--2" aria-hidden="true"/>

        {/* ── Topbar ── */}
        <header className="topbar">
          {/* Linha gradiente decorativa no topo do menu */}
          <div className="topbar-gradient-line" aria-hidden="true"/>

          <div className="topbar-inner">

            {/* ── Brand ── */}
            <a href="/" className="brand">
              <div className="brand-whale-wrap">
                <img src={logoWhale} alt="" className="brand-whale"/>
              </div>
              <span className="brand-wordmark">Whallet</span>
            </a>

            {/* ── Nav central com pill ── */}
            <nav className="topbar-nav" aria-label="Navegação principal">
              <div className="nav-pill">
                <a href="#ferramenta" className="nav-link">
                  <span className="nav-link-icon" aria-hidden="true">⚡</span>
                  Ferramenta
                </a>
                <div className="nav-divider" aria-hidden="true"/>
                <a href="#como-funciona" className="nav-link">
                  <span className="nav-link-icon" aria-hidden="true">📖</span>
                  Como funciona
                </a>
              </div>
            </nav>

            {/* ── Direita: badge + CTA ── */}
            <div className="topbar-actions">
            <span className="topbar-badge">
              <span className="topbar-badge-dot"/>
              4 layouts ativos
            </span>
              <a href="#ferramenta" className="topbar-cta">
                Gerar Excel
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>

          </div>
        </header>

        <main className="main-layout" id="ferramenta">

          {/* ── Hero ── */}
          <section className="hero-panel">
            <div className="eyebrow">
              <span className="eyebrow-dot"/>
              Automação bancária
            </div>
            <h1>
              Transforme remessas CNAB em
              <span className="gradient-text"> Excel</span> em segundos
            </h1>
            <p className="hero-text">
              Selecione o banco, faça upload do arquivo e baixe a planilha
              estruturada — pronta para análise e conferência.
            </p>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">4</span>
                <span className="stat-label">layouts suportados</span>
              </div>
              <div className="stat-divider"/>
              <div className="stat">
                <span className="stat-number">2</span>
                <span className="stat-label">bancos integrados</span>
              </div>
              <div className="stat-divider"/>
              <div className="stat">
                <span className="stat-number">240/400</span>
                <span className="stat-label">versões CNAB</span>
              </div>
            </div>

            <div className="hero-highlights">
              <div className="hero-highlight">
                <span className="highlight-icon">✦</span>
                <div>
                  <strong>Layout embutido</strong>
                  <p>Nenhum arquivo de configuração — só enviar a remessa.</p>
                </div>
              </div>
              <div className="hero-highlight">
                <span className="highlight-icon">⚡</span>
                <div>
                  <strong>Processamento instantâneo</strong>
                  <p>Excel gerado e baixado direto no navegador.</p>
                </div>
              </div>
              <div className="hero-highlight">
                <span className="highlight-icon">🔒</span>
                <div>
                  <strong>Seus dados ficam seus</strong>
                  <p>Arquivo processado e descartado — zero armazenamento.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Tool card ── */}
          <section className="tool-card">

            {/* Seletor de modo */}
            <div className="mode-selector">
              <button type="button"
                      className={`mode-btn ${mode === "bank" ? "mode-btn--active" : ""}`}
                      onClick={() => { setMode("bank"); setBankMsg(""); }}>
                <span className="mode-btn-icon">🏦</span>
                <span className="mode-btn-label">Layout Bancário</span>
              </button>
              <button type="button"
                      className={`mode-btn ${mode === "protheus" ? "mode-btn--active" : ""}`}
                      onClick={() => { setMode("protheus"); setMessage(""); }}>
                <span className="mode-btn-icon">⚙️</span>
                <span className="mode-btn-label">Layout Protheus</span>
              </button>
            </div>

            {/* ── Formulário Bancário ── */}
            {mode === "bank" && (
                <form className="form" onSubmit={handleBankExport}>
                  <div className="field">
                    <label className="field-label">Banco e layout</label>
                    <div className="bank-accordion">
                      {BANKS.map((bank) => {
                        const isOpen = openBankId === bank.bankId;
                        return (
                            <div key={bank.bankId} className={`bank-group ${isOpen ? "bank-group--open":""}`}>
                              <button type="button" className="bank-group-header"
                                      onClick={() => setOpenBankId(isOpen ? null : bank.bankId)}>
                                <bank.LogoComponent/>
                                <span className="bank-group-count">
                            {bank.layouts.length} layout{bank.layouts.length > 1 ? "s":""}
                          </span>
                                <IconChevron open={isOpen}/>
                              </button>
                              {isOpen && (
                                  <div className="bank-group-items">
                                    {bank.layouts.map((bl) => {
                                      const isActive = bankLayout.key === bl.key;
                                      return (
                                          <button key={bl.key} type="button"
                                                  className={`bank-item ${isActive ? "bank-item--active":""}`}
                                                  onClick={() => selectLayout(bl)}>
                                            <div className="bank-item-main">
                                              <span className="bank-item-label">{bl.label}</span>
                                              {isActive && <span className="bank-item-check"><IconCheck/></span>}
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

                  {/* Info do layout ativo */}
                  <div className="bank-info-box">
                    <bankLayout.LogoComponent/>
                    <div className="bank-info-text">
                      <strong>{bankLayout.label}</strong>
                      <span>{bankLayout.desc}</span>
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="field">
                    <label className="field-label">Arquivo de remessa ou retorno</label>
                    <label className="upload-card">
                      <input type="file" accept=".rem,.ret,.txt,.cnab"
                             onChange={(e) => setBankFile(e.target.files?.[0] || null)}/>
                      <span className="upload-icon-wrap"><IconUpload/></span>
                      <span className="upload-title">
                    {bankFile ? bankFile.name : "Arraste ou clique para selecionar"}
                  </span>
                      <span className="upload-subtitle">
                    {bankFile ? "Arquivo selecionado — pronto para processar" : "Formatos: .rem .ret .txt .cnab"}
                  </span>
                    </label>
                  </div>

                  <button type="submit" className="submit-button" disabled={bankLoading}>
                    {bankLoading ? <><IconSpinner/> Gerando…</> : "↓ Gerar Excel"}
                  </button>

                  {bankMsg && (
                      <div className={`msg ${bankMsg.includes("Erro") ? "msg--error" : "msg--success"}`}>
                        {bankMsg.includes("Erro") ? "✕ " : "✓ "}{bankMsg}
                      </div>
                  )}
                </form>
            )}

            {/* ── Formulário Protheus ── */}
            {mode === "protheus" && (
                <form className="form" onSubmit={handleExport}>
                  <div className="field">
                    <label className="field-label">Versão CNAB</label>
                    <div className="cnab-toggle">
                      <button type="button"
                              className={`cnab-option ${cnabType === "400" ? "active":""}`}
                              onClick={() => setCnabType("400")}>
                        <span className="cnab-option-title">CNAB 400</span>
                        <span className="cnab-option-subtitle">Layout clássico</span>
                      </button>
                      <button type="button"
                              className={`cnab-option ${cnabType === "240" ? "active":""}`}
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
                      <span className="upload-icon-wrap"><IconUpload/></span>
                      <span className="upload-title">
                    {layoutFile ? layoutFile.name : "Arraste ou clique para selecionar"}
                  </span>
                      <span className="upload-subtitle">
                    {layoutFile ? "Layout selecionado" : "Arquivo de layout do Protheus"}
                  </span>
                    </label>
                  </div>

                  <div className="field">
                    <label className="field-label">Arquivo de remessa</label>
                    <label className="upload-card">
                      <input type="file" onChange={(e) => setRemessaFile(e.target.files?.[0] || null)}/>
                      <span className="upload-icon-wrap"><IconUpload/></span>
                      <span className="upload-title">
                    {remessaFile ? remessaFile.name : "Arraste ou clique para selecionar"}
                  </span>
                      <span className="upload-subtitle">
                    {remessaFile ? "Remessa selecionada" : "Arquivo de remessa CNAB"}
                  </span>
                    </label>
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? <><IconSpinner/> Gerando…</> : "↓ Gerar Excel"}
                  </button>

                  {message && (
                      <div className={`msg ${message.includes("Erro") ? "msg--error" : "msg--success"}`}>
                        {message.includes("Erro") ? "✕ " : "✓ "}{message}
                      </div>
                  )}
                </form>
            )}
          </section>
        </main>

        {/* ── Como funciona ── */}
        <section className="features" id="como-funciona">
          {[
            { step:"01", title:"Escolha o banco", desc:"Selecione o banco e o tipo de layout CNAB — cobrança ou pagamento." },
            { step:"02", title:"Envie o arquivo",  desc:"Upload da remessa ou retorno. Nenhum arquivo de configuração necessário." },
            { step:"03", title:"Baixe o Excel",    desc:"Planilha gerada instantaneamente com abas por tipo de registro." },
          ].map((f) => (
              <div key={f.step} className="feature-card">
                <span className="feature-step">{f.step}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
          ))}
        </section>

        <footer className="footer">
          <img src={logoWhale} alt="" className="footer-whale"/>
          <span>Whallet · Portal CNAB</span>
        </footer>
      </div>
  );
}

export default App;
import { useState } from "react";
import axios from "axios";
import "./App.css";
import logo from "./assets/vite.svg";

// ── SVG logos inline (sem dependência de CDN) ─────────────────────────────────
const LogoItau = () => (
    <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
      <rect width="120" height="40" rx="6" fill="#EC7000"/>
      <text x="60" y="26" textAnchor="middle" fill="#fff"
            fontFamily="Arial,sans-serif" fontWeight="900" fontSize="18" letterSpacing="1">
        itaú
      </text>
    </svg>
);

const LogoBradesco = () => (
    <svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
      <rect width="120" height="40" rx="6" fill="#CC092F"/>
      <text x="60" y="26" textAnchor="middle" fill="#fff"
            fontFamily="Arial,sans-serif" fontWeight="900" fontSize="13" letterSpacing="0.5">
        BRADESCO
      </text>
    </svg>
);

// ── Catálogo de layouts bancários ─────────────────────────────────────────────
// Para adicionar um novo banco basta incluir entradas aqui — o componente
// agrupa automaticamente por `bankId`.
const BANK_LAYOUTS = [
  // ── Itaú ──────────────────────────────────────────────────────────────
  {
    key: "ITAU_400_COBRANCA",
    bank: "ITAU",
    bankId: "itau",
    bankName: "Itaú",
    LogoComponent: LogoItau,
    version: "400",
    mode: "COBRANCA",
    label: "CNAB 400 — Cobrança",
    desc: "Remessa e retorno de boletos (layout clássico)",
  },
  {
    key: "ITAU_240_COBRANCA",
    bank: "ITAU",
    bankId: "itau",
    bankName: "Itaú",
    LogoComponent: LogoItau,
    version: "240",
    mode: "COBRANCA",
    label: "CNAB 240 — Cobrança",
    desc: "Remessa e retorno de boletos (FEBRABAN 240)",
  },
  {
    key: "ITAU_240_PAGAMENTO",
    bank: "ITAU",
    bankId: "itau",
    bankName: "Itaú",
    LogoComponent: LogoItau,
    version: "240",
    mode: "PAGAMENTO",
    label: "CNAB 240 — Pagamento",
    desc: "SISPAG — crédito conta, TED, PIX, boletos, tributos",
  },
  // ── Bradesco ──────────────────────────────────────────────────────────
  {
    key: "BRADESCO_240_PAGAMENTO",
    bank: "BRADESCO",
    bankId: "bradesco",
    bankName: "Bradesco",
    LogoComponent: LogoBradesco,
    version: "240",
    mode: "PAGAMENTO",
    label: "CNAB 240 — Pagamento",
    desc: "Multipag — crédito conta, boletos, tributos com código de barras",
  },
];

// Agrupa layouts por bankId preservando a ordem de inserção
const BANKS = (() => {
  const map = new Map();
  for (const bl of BANK_LAYOUTS) {
    if (!map.has(bl.bankId)) {
      map.set(bl.bankId, {
        bankId: bl.bankId,
        bankName: bl.bankName,
        LogoComponent: bl.LogoComponent,
        layouts: [],
      });
    }
    map.get(bl.bankId).layouts.push(bl);
  }
  return [...map.values()];
})();

// ── Componente principal ──────────────────────────────────────────────────────
function App() {
  // Modo principal: "bank" é o default (prioridade pedida)
  const [mode, setMode] = useState("bank");

  // ── Estado bancário ───────────────────────────────────────────────────────
  const [openBankId, setOpenBankId]   = useState("itau");         // accordion aberto
  const [bankLayout, setBankLayout]   = useState(BANK_LAYOUTS[0]);
  const [bankFile, setBankFile]       = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankMsg, setBankMsg]         = useState("");

  // ── Estado Protheus (sem alteração) ──────────────────────────────────────
  const [layoutFile, setLayoutFile]   = useState(null);
  const [remessaFile, setRemessaFile] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState("");
  const [cnabType, setCnabType]       = useState("400");

  // ── Download helper ───────────────────────────────────────────────────────
  const downloadBlob = (data, filename) => {
    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  // ── Handler bancário ──────────────────────────────────────────────────────
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
          fd,
          { responseType: "blob", headers: { "Content-Type": "multipart/form-data" } }
      );
      downloadBlob(res.data, bankFile.name.replace(/\.[^/.]+$/, "") + "_resultado.xlsx");
      setBankMsg("Excel gerado com sucesso.");
    } catch (err) {
      console.error(err);
      setBankMsg("Erro ao gerar o Excel. Verifique a API.");
    } finally { setBankLoading(false); }
  };

  // ── Handler Protheus ──────────────────────────────────────────────────────
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
      const res = await axios.post(`${apiUrl}/api/cnab/export`, fd, {
        responseType: "blob", headers: { "Content-Type": "multipart/form-data" }
      });
      downloadBlob(res.data, "cnab-export.xlsx");
      setMessage("Excel gerado com sucesso.");
    } catch (err) {
      console.error(err);
      setMessage("Erro ao gerar o Excel. Verifique a API.");
    } finally { setLoading(false); }
  };

  // ── Seleção de layout bancário ────────────────────────────────────────────
  const selectLayout = (bl) => {
    setBankLayout(bl);
    setBankFile(null);
    setBankMsg("");
  };

  return (
      <div className="app-shell">
        {/* ── Header ── */}
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <img src={logo} alt="Portal CNAB" className="brand-logo" />
              <div className="brand-text">
                <strong>Portal CNAB</strong>
                <span>Análise e exportação de remessas</span>
              </div>
            </div>
            <nav className="topbar-nav">
              <a href="#ferramenta">Ferramenta</a>
              <a href="#como-funciona">Como funciona</a>
            </nav>
          </div>
        </header>

        <main className="main-layout" id="ferramenta">
          {/* ── Hero ── */}
          <section className="hero-panel">
            <span className="eyebrow">Automação bancária</span>
            <h1>Transforme arquivos CNAB em Excel de forma simples</h1>
            <p className="hero-text">
              Envie a remessa, escolha o banco e o layout — a planilha fica pronta
              em segundos para análise e conferência.
            </p>
            <div className="hero-highlights">
              <div className="hero-highlight">
                <span className="highlight-icon">✓</span>
                <div>
                  <strong>Fluxo direto</strong>
                  <p>Upload rápido e geração imediata do arquivo Excel.</p>
                </div>
              </div>
              <div className="hero-highlight">
                <span className="highlight-icon">🏦</span>
                <div>
                  <strong>Múltiplos bancos</strong>
                  <p>Itaú e Bradesco — CNAB 240 e 400, cobrança e pagamento.</p>
                </div>
              </div>
              <div className="hero-highlight">
                <span className="highlight-icon">⬇</span>
                <div>
                  <strong>Saída pronta para conferência</strong>
                  <p>Baixe a planilha gerada para validar os dados.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Tool card ── */}
          <section className="tool-card">

            {/* Modo: Bancário primeiro */}
            <div className="mode-selector">
              <button
                  type="button"
                  className={`mode-btn ${mode === "bank" ? "mode-btn--active" : ""}`}
                  onClick={() => { setMode("bank"); setBankMsg(""); }}
              >
                <span className="mode-btn-icon">🏦</span>
                <span className="mode-btn-label">Layout Bancário</span>
                {mode === "bank" && (
                    <span className="mode-btn-badge mode-btn-badge--bank">Selecionado</span>
                )}
              </button>
              <button
                  type="button"
                  className={`mode-btn ${mode === "protheus" ? "mode-btn--active" : ""}`}
                  onClick={() => { setMode("protheus"); setMessage(""); }}
              >
                <span className="mode-btn-icon">⚙️</span>
                <span className="mode-btn-label">Layout Protheus</span>
                {mode === "protheus" && (
                    <span className="mode-btn-badge mode-btn-badge--protheus">Selecionado</span>
                )}
              </button>
            </div>

            {/* ── Formulário Bancário ── */}
            {mode === "bank" && (
                <>
                  <div className="tool-card-header">
                    <h2>Gerar Excel</h2>
                    <p>Selecione o banco e o layout, depois envie o arquivo.</p>
                  </div>

                  <form className="form" onSubmit={handleBankExport}>

                    {/* Seletor de banco — accordion compacto */}
                    <div className="field">
                      <label>Banco e layout</label>
                      <div className="bank-accordion">
                        {BANKS.map((bank) => {
                          const isOpen = openBankId === bank.bankId;
                          return (
                              <div key={bank.bankId} className={`bank-group ${isOpen ? "bank-group--open" : ""}`}>
                                {/* Cabeçalho do banco */}
                                <button
                                    type="button"
                                    className="bank-group-header"
                                    onClick={() => setOpenBankId(isOpen ? null : bank.bankId)}
                                >
                                  <bank.LogoComponent />
                                  <span className="bank-group-count">
                              {bank.layouts.length} layout{bank.layouts.length > 1 ? "s" : ""}
                            </span>
                                  <span className={`bank-group-chevron ${isOpen ? "bank-group-chevron--open" : ""}`}>
                              ▾
                            </span>
                                </button>

                                {/* Layouts do banco */}
                                {isOpen && (
                                    <div className="bank-group-items">
                                      {bank.layouts.map((bl) => {
                                        const isActive = bankLayout.key === bl.key;
                                        return (
                                            <button
                                                key={bl.key}
                                                type="button"
                                                className={`bank-item ${isActive ? "bank-item--active" : ""}`}
                                                onClick={() => selectLayout(bl)}
                                            >
                                              <div className="bank-item-main">
                                                <span className="bank-item-label">{bl.label}</span>
                                                {isActive && <span className="bank-item-check">✓</span>}
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

                    {/* Layout selecionado — info box */}
                    <div className="bank-info-box">
                      <bankLayout.LogoComponent />
                      <div className="bank-info-text">
                        <strong>{bankLayout.label}</strong>
                        <span>{bankLayout.desc}</span>
                      </div>
                    </div>

                    {/* Upload */}
                    <div className="field">
                      <label>Arquivo de remessa ou retorno</label>
                      <label className="upload-card">
                        <input
                            type="file"
                            accept=".rem,.ret,.txt,.cnab"
                            onChange={(e) => setBankFile(e.target.files?.[0] || null)}
                        />
                        <span className="upload-icon">📁</span>
                        <span className="upload-title">Selecionar arquivo</span>
                        <span className="upload-subtitle">
                      Arquivo de remessa (.rem) ou retorno (.ret) do banco.
                    </span>
                        <span className="file-name">
                      {bankFile ? bankFile.name : "Nenhum arquivo selecionado"}
                    </span>
                      </label>
                    </div>

                    <button type="submit" className="submit-button" disabled={bankLoading}>
                  <span className="submit-button-text">
                    {bankLoading ? "Gerando Excel..." : "Gerar Excel"}
                  </span>
                    </button>

                    {bankMsg && (
                        <div className={`message ${bankMsg.includes("Erro") ? "message-error" : "message-success"}`}>
                          {bankMsg}
                        </div>
                    )}
                  </form>
                </>
            )}

            {/* ── Formulário Protheus ── */}
            {mode === "protheus" && (
                <>
                  <div className="tool-card-header">
                    <h2>Gerar Excel</h2>
                    <p>Selecione os arquivos necessários para processar a remessa.</p>
                  </div>

                  <form className="form" onSubmit={handleExport}>
                    <div className="field">
                      <label>Tipo CNAB</label>
                      <div className="cnab-toggle" role="group" aria-label="Tipo CNAB">
                        <button type="button"
                                className={`cnab-option ${cnabType === "400" ? "active" : ""}`}
                                onClick={() => setCnabType("400")}>
                          <span className="cnab-option-title">CNAB 400</span>
                          <span className="cnab-option-subtitle">Layout clássico</span>
                        </button>
                        <button type="button"
                                className={`cnab-option ${cnabType === "240" ? "active" : ""}`}
                                onClick={() => setCnabType("240")}>
                          <span className="cnab-option-title">CNAB 240*</span>
                          <span className="cnab-option-subtitle">EM CONSTRUÇÃO</span>
                        </button>
                      </div>
                    </div>

                    <div className="field">
                      <label>Arquivo de layout</label>
                      <label className="upload-card">
                        <input type="file" onChange={(e) => setLayoutFile(e.target.files?.[0] || null)} />
                        <span className="upload-icon">📄</span>
                        <span className="upload-title">Selecionar layout</span>
                        <span className="upload-subtitle">
                      Envie o arquivo de layout que define as posições e campos.
                    </span>
                        <span className="file-name">
                      {layoutFile ? layoutFile.name : "Nenhum arquivo selecionado"}
                    </span>
                      </label>
                    </div>

                    <div className="field">
                      <label>Arquivo de remessa</label>
                      <label className="upload-card">
                        <input type="file" onChange={(e) => setRemessaFile(e.target.files?.[0] || null)} />
                        <span className="upload-icon">🏦</span>
                        <span className="upload-title">Selecionar remessa</span>
                        <span className="upload-subtitle">
                      Envie o arquivo que será interpretado e exportado para Excel.
                    </span>
                        <span className="file-name">
                      {remessaFile ? remessaFile.name : "Nenhum arquivo selecionado"}
                    </span>
                      </label>
                    </div>

                    <button type="submit" className="submit-button" disabled={loading}>
                  <span className="submit-button-text">
                    {loading ? "Gerando Excel..." : "Gerar Excel"}
                  </span>
                    </button>

                    {message && (
                        <div className={`message ${message.includes("Erro") ? "message-error" : "message-success"}`}>
                          {message}
                        </div>
                    )}
                  </form>
                </>
            )}
          </section>
        </main>

        {/* ── Features ── */}
        <section className="features" id="como-funciona">
          <div className="feature-card">
            <span className="feature-tag">Passo 1</span>
            <h3>Escolha o banco</h3>
            <p>Selecione o banco e o tipo de layout CNAB — cobrança ou pagamento.</p>
          </div>
          <div className="feature-card">
            <span className="feature-tag">Passo 2</span>
            <h3>Envie o arquivo</h3>
            <p>Faça upload da remessa ou retorno para preparar a análise.</p>
          </div>
          <div className="feature-card">
            <span className="feature-tag">Passo 3</span>
            <h3>Baixe o resultado</h3>
            <p>Receba o Excel estruturado para facilitar validações e conferências.</p>
          </div>
        </section>
      </div>
  );
}

export default App;
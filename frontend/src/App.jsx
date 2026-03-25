import { useState } from "react";
import axios from "axios";
import "./App.css";
import logo from "./assets/vite.svg";

// ── Catálogo de layouts bancários disponíveis ─────────────────────────────────
// Adicionar novas entradas aqui conforme novos parsers forem implementados.
const BANK_LAYOUTS = [
  {
    bank: "ITAU",
    version: "400",
    mode: "COBRANCA",
    label: "Itaú CNAB 400",
    sublabel: "Cobrança — remessa e retorno",
    icon: "🏦",
  },
  {
    bank: "ITAU",
    version: "240",
    mode: "PAGAMENTO",
    label: "Itaú CNAB 240",
    sublabel: "Pagamento SISPAG — remessa e retorno",
    icon: "💳",
  },
];

function App() {
  // ── Modo principal ────────────────────────────────────────────────────────
  const [mode, setMode] = useState("protheus"); // "protheus" | "bank"

  // ── Estado Protheus (existente, sem alteração) ────────────────────────────
  const [layoutFile, setLayoutFile] = useState(null);
  const [remessaFile, setRemessaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cnabType, setCnabType] = useState("400");

  // ── Estado Bancário ───────────────────────────────────────────────────────
  const [bankLayout, setBankLayout] = useState(BANK_LAYOUTS[0]); // layout selecionado
  const [bankRemessaFile, setBankRemessaFile] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankMessage, setBankMessage] = useState("");

  // ── Handlers Protheus (sem alteração) ─────────────────────────────────────
  const handleExport = async (event) => {
    event.preventDefault();
    if (!layoutFile || !remessaFile) {
      setMessage("Selecione os dois arquivos antes de continuar.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const formData = new FormData();
      formData.append("layoutFile", layoutFile);
      formData.append("remessaFile", remessaFile);
      formData.append("cnabType", cnabType);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/api/cnab/export`, formData, {
        responseType: "blob",
        headers: { "Content-Type": "multipart/form-data" },
      });
      downloadBlob(response.data, "cnab-export.xlsx");
      setMessage("Excel gerado com sucesso.");
    } catch (error) {
      console.error(error);
      setMessage("Erro ao gerar o Excel. Verifique a API.");
    } finally {
      setLoading(false);
    }
  };

  // ── Handler Bancário ──────────────────────────────────────────────────────
  const handleBankExport = async (event) => {
    event.preventDefault();
    if (!bankRemessaFile) {
      setBankMessage("Selecione o arquivo de remessa antes de continuar.");
      return;
    }
    try {
      setBankLoading(true);
      setBankMessage("");
      const formData = new FormData();
      formData.append("remessaFile", bankRemessaFile);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(
          `${apiUrl}/api/cnab/export-bank` +
          `?bank=${bankLayout.bank}&version=${bankLayout.version}&mode=${bankLayout.mode}`,
          formData,
          {
            responseType: "blob",
            headers: { "Content-Type": "multipart/form-data" },
          }
      );
      const outputName =
          bankRemessaFile.name.replace(/\.[^/.]+$/, "") + "_resultado.xlsx";
      downloadBlob(response.data, outputName);
      setBankMessage("Excel gerado com sucesso.");
    } catch (error) {
      console.error(error);
      setBankMessage("Erro ao gerar o Excel. Verifique a API.");
    } finally {
      setBankLoading(false);
    }
  };

  // ── Utilitário de download ────────────────────────────────────────────────
  const downloadBlob = (data, filename) => {
    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
              Envie o layout e a remessa, escolha o tipo CNAB e gere uma planilha
              estruturada em poucos segundos para análise e conferência.
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
                <span className="highlight-icon">↔</span>
                <div>
                  <strong>Compatível com 240 e 400</strong>
                  <p>Escolha o tipo CNAB antes do processamento.</p>
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

            {/* Seletor de modo Protheus vs Bancário */}
            <div className="mode-selector">
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

              <button
                  type="button"
                  className={`mode-btn ${mode === "bank" ? "mode-btn--active" : ""}`}
                  onClick={() => { setMode("bank"); setBankMessage(""); }}
              >
                <span className="mode-btn-icon">🏦</span>
                <span className="mode-btn-label">Layout Bancário</span>
                {mode === "bank" && (
                    <span className="mode-btn-badge mode-btn-badge--bank">Selecionado</span>
                )}
              </button>
            </div>

            {/* ── Formulário Protheus ── */}
            {mode === "protheus" && (
                <>
                  <div className="tool-card-header">
                    <div>
                      <h2>Gerar Excel</h2>
                      <p>Selecione os arquivos necessários para processar a remessa.</p>
                    </div>
                  </div>

                  <form className="form" onSubmit={handleExport}>
                    <div className="field">
                      <label>Tipo CNAB</label>
                      <div className="cnab-toggle" role="group" aria-label="Tipo CNAB">
                        <button
                            type="button"
                            className={`cnab-option ${cnabType === "400" ? "active" : ""}`}
                            onClick={() => setCnabType("400")}
                        >
                          <span className="cnab-option-title">CNAB 400</span>
                          <span className="cnab-option-subtitle">Layout clássico</span>
                        </button>
                        <button
                            type="button"
                            className={`cnab-option ${cnabType === "240" ? "active" : ""}`}
                            onClick={() => setCnabType("240")}
                        >
                          <span className="cnab-option-title">CNAB 240*</span>
                          <span className="cnab-option-subtitle">EM CONSTRUÇÃO</span>
                        </button>
                      </div>
                    </div>

                    <div className="field">
                      <label>Arquivo de layout</label>
                      <label className="upload-card">
                        <input
                            type="file"
                            onChange={(e) => setLayoutFile(e.target.files?.[0] || null)}
                        />
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
                        <input
                            type="file"
                            onChange={(e) => setRemessaFile(e.target.files?.[0] || null)}
                        />
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
                        <div
                            className={`message ${
                                message.toLowerCase().includes("erro")
                                    ? "message-error"
                                    : "message-success"
                            }`}
                        >
                          {message}
                        </div>
                    )}
                  </form>
                </>
            )}

            {/* ── Formulário Bancário ── */}
            {mode === "bank" && (
                <>
                  <div className="tool-card-header">
                    <div>
                      <h2>Gerar Excel</h2>
                      <p>
                        Escolha o layout do banco e envie o arquivo. Remessa e
                        retorno são detectados automaticamente.
                      </p>
                    </div>
                  </div>

                  <form className="form" onSubmit={handleBankExport}>

                    {/* Seletor de layout bancário */}
                    <div className="field">
                      <label>Layout bancário</label>
                      <div className="bank-layout-grid">
                        {BANK_LAYOUTS.map((bl) => {
                          const key = `${bl.bank}_${bl.version}_${bl.mode}`;
                          const selectedKey = `${bankLayout.bank}_${bankLayout.version}_${bankLayout.mode}`;
                          const isActive = key === selectedKey;
                          return (
                              <button
                                  key={key}
                                  type="button"
                                  className={`bank-layout-btn ${isActive ? "bank-layout-btn--active" : ""}`}
                                  onClick={() => setBankLayout(bl)}
                              >
                                <span className="bank-layout-icon">{bl.icon}</span>
                                <span className="bank-layout-label">{bl.label}</span>
                                <span className="bank-layout-sublabel">{bl.sublabel}</span>
                                {isActive && (
                                    <span className="bank-layout-check">✓</span>
                                )}
                              </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Info box com o layout selecionado */}
                    <div className="bank-info-box">
                      {bankLayout.icon}{" "}
                      <strong>
                        {bankLayout.label} — {bankLayout.sublabel}
                      </strong>
                      <br />
                      Layout embutido. Basta enviar o arquivo.
                    </div>

                    {/* Upload do arquivo */}
                    <div className="field">
                      <label>Arquivo de remessa ou retorno</label>
                      <label className="upload-card">
                        <input
                            type="file"
                            accept=".rem,.ret,.txt,.cnab"
                            onChange={(e) =>
                                setBankRemessaFile(e.target.files?.[0] || null)
                            }
                        />
                        <span className="upload-icon">📁</span>
                        <span className="upload-title">Selecionar arquivo</span>
                        <span className="upload-subtitle">
                      Arquivo de remessa (.rem) ou retorno (.ret) do banco.
                    </span>
                        <span className="file-name">
                      {bankRemessaFile
                          ? bankRemessaFile.name
                          : "Nenhum arquivo selecionado"}
                    </span>
                      </label>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={bankLoading}
                    >
                  <span className="submit-button-text">
                    {bankLoading ? "Gerando Excel..." : "Gerar Excel"}
                  </span>
                    </button>

                    {bankMessage && (
                        <div
                            className={`message ${
                                bankMessage.toLowerCase().includes("erro")
                                    ? "message-error"
                                    : "message-success"
                            }`}
                        >
                          {bankMessage}
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
            <h3>Escolha o tipo</h3>
            <p>Defina rapidamente se o processamento será CNAB 240 ou CNAB 400.</p>
          </div>
          <div className="feature-card">
            <span className="feature-tag">Passo 2</span>
            <h3>Envie os arquivos</h3>
            <p>Faça upload do layout e da remessa para preparar a análise.</p>
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
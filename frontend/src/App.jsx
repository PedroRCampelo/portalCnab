import { useState } from "react";
import axios from "axios";
import "./App.css";
import logo from "./assets/vite.svg";

function App() {
  const [layoutFile, setLayoutFile] = useState(null);
  const [remessaFile, setRemessaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cnabType, setCnabType] = useState("400");

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

      const response = await axios.post(
          `${apiUrl}/api/cnab/export`,
          formData,
          {
            responseType: "blob",
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cnab-export.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("Excel gerado com sucesso.");
    } catch (error) {
      console.error(error);
      setMessage("Erro ao gerar o Excel. Verifique a API.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="app-shell">
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

          <section className="tool-card">
            <div className="tool-card-header">
              <div>
                <h2>Gerar Excel</h2>
                <p>
                  Selecione os arquivos necessários para processar a remessa.
                </p>
              </div>
            </div>

            <form className="form" onSubmit={handleExport}>
              <div className="field">
                <label>Tipo CNAB</label>

                <div className="cnab-toggle" role="group" aria-label="Tipo CNAB">
                  <button
                      type="button"
                      className={`cnab-option ${
                          cnabType === "400" ? "active" : ""
                      }`}
                      onClick={() => setCnabType("400")}
                  >
                    <span className="cnab-option-title">CNAB 400</span>
                    <span className="cnab-option-subtitle">
                    Layout clássico
                  </span>
                  </button>

                  <button
                      type="button"
                      className={`cnab-option ${
                          cnabType === "240" ? "active" : ""
                      }`}
                      onClick={() => setCnabType("240")}
                  >
                    <span className="cnab-option-title">CNAB 240*</span>
                    <span className="cnab-option-subtitle">
                    EM CONSTRUÇÃO
                  </span>
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
                  {remessaFile
                      ? remessaFile.name
                      : "Nenhum arquivo selecionado"}
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
          </section>
        </main>

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
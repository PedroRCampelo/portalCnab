import { useState } from "react";
import axios from "axios";
import "./App.css";

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
      <div className="page">
        <div className="card">
          <h1>CNAB Portal Parser</h1>
          <p className="subtitle">
            Envie o arquivo de layout e o arquivo de remessa para gerar o Excel.
          </p>

          <form onSubmit={handleExport} className="form">
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
                  <span className="cnab-option-title">CNAB 240 (Construção)</span>
                  <span className="cnab-option-subtitle">Múltiplos segmentos</span>
                </button>
              </div>
            </div>
            
            <div className="field">
              <label>Arquivo de layout</label>
              <input
                  type="file"
                  onChange={(e) => setLayoutFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="field">
              <label>Arquivo de remessa</label>
              <input
                  type="file"
                  onChange={(e) => setRemessaFile(e.target.files?.[0] || null)}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Gerando..." : "Gerar Excel"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
  );
}

export default App;
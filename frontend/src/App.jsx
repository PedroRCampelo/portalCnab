import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [layoutFile, setLayoutFile] = useState(null);
  const [remessaFile, setRemessaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

      const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

      const response = await axios.post(
          `${apiUrl}/api/cnab/export`,
          formData,
          {
            responseType: "blob",
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
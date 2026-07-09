import { useState } from "react";
import api from "../services/api.js";
import { IcoUpload, IcoSpinner, IcoExcel } from "./icons.jsx";

export default function ProtheusForm() {
  const [layoutFile,  setLayoutFile]  = useState(null);
  const [remessaFile, setRemessaFile] = useState(null);
  const [cnabType,    setCnabType]    = useState("400");
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState("");

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
    if (!layoutFile || !remessaFile) {
      setMsg("Selecione os dois arquivos antes de continuar."); return;
    }
    try {
      setLoading(true); setMsg("");
      const fd = new FormData();
      fd.append("layoutFile",  layoutFile);
      fd.append("remessaFile", remessaFile);
      fd.append("cnabType",    cnabType);
      const res = await api.post(
          `/api/cnab/export`, fd,
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
            {/*<button type="button"*/}
            {/*  className={`cnab-option ${cnabType==="240"?"active":""}`}*/}
            {/*  onClick={() => setCnabType("240")}>*/}
            {/*  <span className="cnab-option-title">CNAB 240*</span>*/}
            {/*  <span className="cnab-option-subtitle">Em construção</span>*/}
            {/*</button>*/}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Arquivo de layout</label>
          <label className="upload-card">
            <input type="file" onChange={(e) => setLayoutFile(e.target.files?.[0] || null)}/>
            <span className="upload-icon-wrap"><IcoUpload/></span>
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
            <span className="upload-icon-wrap"><IcoUpload/></span>
            <span className="upload-title">
            {remessaFile ? remessaFile.name : "Arraste ou clique para selecionar"}
          </span>
            <span className="upload-subtitle">
            {remessaFile ? "Remessa selecionada" : "Arquivo de remessa CNAB"}
          </span>
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
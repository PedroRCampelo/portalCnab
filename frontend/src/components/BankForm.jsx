import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import CotaBadge from "./CotaBadge.jsx";
import { BANK_LAYOUTS, banks } from "./banks.jsx";
import { IcoCheck, IcoChevron, IcoUpload, IcoSpinner, IcoExcel, IcoPdf } from "./icons.jsx";

export default function BankForm({ toolMode, desabilitado = false }) {
  const { autenticado } = useAuth();
  const [openBankId, setOpenBankId] = useState("itau");
  const [bankLayout, setBankLayout] = useState(BANK_LAYOUTS[0]);
  const [bankFile,   setBankFile]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState("");
  const [cotaKey,    setCotaKey]    = useState(0);

  const isExcel = toolMode === "excel";

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
    if (desabilitado) return;
    if (!bankFile) { setMsg("Selecione o arquivo antes de continuar."); return; }
    try {
      setLoading(true); setMsg("");
      const fd = new FormData();
      fd.append("remessaFile", bankFile);
      const params   = `?bank=${bankLayout.bank}&version=${bankLayout.version}&mode=${bankLayout.mode}`;
      const endpoint = isExcel ? "export-bank" : "report-bank";
      const res = await api.post(
          `/api/cnab/${endpoint}${params}`,
          fd, { responseType: "blob", headers: { "Content-Type": "multipart/form-data" } }
      );
      const ext    = isExcel ? "xlsx" : "pdf";
      const mime   = isExcel
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      const suffix = isExcel ? "_resultado" : "_relatorio";
      downloadBlob(res.data, bankFile.name.replace(/\.[^/.]+$/, "") + suffix + "." + ext, mime);
      setMsg(isExcel ? "Excel gerado com sucesso." : "Relatório PDF gerado com sucesso.");
      setCotaKey(k => k + 1);
    } catch (err) {
      if (err.response?.status === 429) {
        setMsg("LIMITE_ANONIMO");
      } else {
        setMsg(`Erro ao gerar o ${isExcel ? "Excel" : "PDF"}. Verifique o arquivo e tente novamente.`);
      }
    } finally { setLoading(false); }
  };

  if (desabilitado || msg === "LIMITE_ANONIMO") {
    return (
        <div style={{
          background: "rgba(17,17,17,0.05)", border: "1px solid rgba(17,17,17,0.18)",
          borderRadius: 14, padding: "32px 24px", textAlign: "center"
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h3 style={{ color: "var(--text)", fontWeight: 700, margin: "0 0 8px" }}>
            Você usou suas 2 conversões gratuitas
          </h3>
          <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
            Crie uma conta gratuita e tenha <strong style={{ color: "var(--text)" }}>8 conversões por mês</strong> — sem cartão de crédito.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" style={{
              padding: "11px 24px", borderRadius: 10, border: "1px solid var(--border)",
              color: "var(--text-muted)", fontWeight: 600, fontSize: 14, textDecoration: "none"
            }}>Entrar</Link>
            <Link to="/cadastro" style={{
              padding: "11px 24px", borderRadius: 10, background: "var(--purple)",
              border: "none", color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none"
            }}>Criar conta grátis →</Link>
          </div>
        </div>
    );
  }

  return (
      <form className="form" onSubmit={handleSubmit}>
        {autenticado && <CotaBadge key={cotaKey}/>}

        <div className="field">
          <label className="field-label">Banco e layout</label>
          <div className="bank-accordion">
            {banks.map((bank) => {
              const isOpen = openBankId === bank.bankId;
              return (
                  <div key={bank.bankId} className={`bank-group ${isOpen ? "bank-group--open" : ""}`}>
                    <button type="button" className="bank-group-header"
                            onClick={() => setOpenBankId(isOpen ? null : bank.bankId)}>
                      <bank.LogoComponent/>
                      <span className="bank-group-count">
                    {bank.layouts.length} layout{bank.layouts.length > 1 ? "s" : ""}
                  </span>
                      <IcoChevron open={isOpen}/>
                    </button>
                    {isOpen && (
                        <div className="bank-group-items">
                          {bank.layouts.map((bl) => {
                            const isActive = bankLayout.key === bl.key;
                            return (
                                <button key={bl.key} type="button"
                                        className={`bank-item ${isActive ? "bank-item--active" : ""}`}
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

        {msg && msg !== "LIMITE_ANONIMO" && (
            <div className={`msg ${msg.includes("Erro") || msg.includes("Limite") ? "msg--error" : "msg--success"}`}>
              {msg.includes("Erro") || msg.includes("Limite") ? "✕ " : "✓ "}{msg}
            </div>
        )}
      </form>
  );
}
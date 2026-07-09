import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import CotaBadge from "./CotaBadge.jsx";
import { BANK_LAYOUTS, banks } from "./banks.jsx";
import { LuLock, LuCircleCheck, LuCircleX } from "react-icons/lu";
import { IcoCheck, IcoChevron, IcoUpload, IcoSpinner, IcoExcel, IcoPdf, IcoArrow } from "./icons.jsx";

const CADASTRO_URL = "https://whallet.com.br/cadastro";

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
          background: "rgba(0,201,167,0.04)", border: "1px solid rgba(0,201,167,0.2)",
          borderRadius: 16, padding: "36px 28px", textAlign: "center"
        }}>
          <div style={{ marginBottom: 14, display:"flex", justifyContent:"center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(0,201,167,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuLock size={26} color="#00C9A7"/>
            </div>
          </div>
          <h3 style={{ color: "#F0F4F8", fontWeight: 700, margin: "0 0 10px", fontSize: 18, letterSpacing: "-0.01em" }}>
            Você usou suas 2 conversões gratuitas
          </h3>
          <p style={{ color: "#7A8599", fontSize: 14, margin: "0 0 8px", lineHeight: 1.6, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
            Crie uma conta Whallet gratuita e converta arquivos CNAB <strong style={{ color: "#F0F4F8" }}>de forma ilimitada</strong>, sem cartão de crédito.
          </p>
          <p style={{ color: "#4B5568", fontSize: 12, margin: "0 0 28px", lineHeight: 1.5 }}>
            Você também vai conhecer o Whallet ERP — gestão financeira completa para PMEs.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" style={{
              padding: "11px 22px", borderRadius: 10, border: "1px solid rgba(240,244,248,0.07)",
              background: "#112240", color: "#7A8599", fontWeight: 600, fontSize: 14, textDecoration: "none"
            }}>Já tenho conta</Link>
            <a href={CADASTRO_URL} style={{
              padding: "11px 22px", borderRadius: 10, background: "#00C9A7",
              color: "#0A1628", fontWeight: 700, fontSize: 14, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8
            }}>Criar conta grátis →</a>
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
              {msg.includes("Erro") || msg.includes("Limite") ? <LuCircleX size={16}/> : <LuCircleCheck size={16}/>}<span>{msg}</span>
            </div>
        )}
      </form>
  );
}
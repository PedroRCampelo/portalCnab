import { useEffect } from "react";
import { Link } from "react-router-dom";
import BankForm from "../components/BankForm.jsx";
import { IcoPdf, IcoBack } from "../components/icons.jsx";

export default function PdfPage() {
  useEffect(() => {
    document.title = "Relatório PDF analítico CNAB — Whallet Portal CNAB";
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content",
        "Gere relatórios PDF analíticos de arquivos CNAB com resumo executivo, " +
        "alertas automáticos de inconsistências, distribuição mensal e top favorecidos.");
  }, []);

  return (
    <div className="tool-page">
      <div className="tool-page-header">
        <Link to="/" className="back-btn">
          <IcoBack/> Voltar
        </Link>
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
            <span>
              Prefere uma planilha para edição?{" "}
              <Link to="/excel" className="link-btn">Exportar Excel</Link>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

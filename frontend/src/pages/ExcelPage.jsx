import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BankForm from "../components/BankForm.jsx";
import ProtheusForm from "../components/ProtheusForm.jsx";
import { IcoExcel, IcoBack } from "../components/icons.jsx";

export default function ExcelPage() {
  const [source, setSource] = useState("bank"); // "bank" | "protheus"

  useEffect(() => {
    document.title = "Exportar CNAB para Excel — Whallet Portal CNAB";
    document.querySelector('meta[name="description"]')
        ?.setAttribute("content",
            "Converta sua remessa ou retorno CNAB do Itaú e Bradesco em planilha Excel " +
            "estruturada com abas por segmento. Suporte a CNAB 240 e 400, remessa e retorno.");
  }, []);

  return (
      <div className="tool-page">
        <div className="tool-page-header">
          <Link to="/" className="back-btn">
            <IcoBack/> Voltar
          </Link>
          <div className="tool-page-title">
            <div className="tool-page-icon tool-page-icon--excel"><IcoExcel/></div>
            <div>
              <h1>Exportar para Excel</h1>
              <p>Converta sua remessa CNAB em planilha estruturada</p>
            </div>
          </div>
        </div>

        <div className="tool-page-body">
          <div className="tool-page-form">
            {/* Seletor Bancário / Protheus */}
            <div className="source-tabs">
              <button type="button"
                      className={`source-tab ${source==="bank"?"source-tab--active":""}`}
                      onClick={() => setSource("bank")}>
                🏦 Layout Bancário
              </button>
              <button type="button"
                      className={`source-tab ${source==="protheus"?"source-tab--active":""}`}
                      onClick={() => setSource("protheus")}>
                ⚙️ Layout Protheus
              </button>
            </div>

            {source === "bank"     && <BankForm toolMode="excel"/>}
            {source === "protheus" && <ProtheusForm/>}
          </div>

          <div className="tool-page-info">
            <div className="info-card">
              <h3>O que você recebe</h3>
              <ul className="info-list">
                <li><span className="info-check">✓</span> Planilha .xlsx com abas por tipo de registro</li>
                <li><span className="info-check">✓</span> Aba de resumo com contagens por tipo</li>
                <li><span className="info-check">✓</span> Datas e valores formatados automaticamente</li>
                <li><span className="info-check">✓</span> Coluna de linha original para rastreabilidade</li>
              </ul>
            </div>
            <div className="info-card info-card--muted">
              <h3>Layouts suportados</h3>
              <ul className="info-list">
                <li><span className="info-bank itau">itaú</span> CNAB 400 Cobrança</li>
                <li><span className="info-bank itau">itaú</span> CNAB 240 Cobrança</li>
                <li><span className="info-bank itau">itaú</span> CNAB 240 Pagamento</li>
                <li><span className="info-bank bradesco">B</span> Bradesco CNAB 240 Pagamento</li>
                <li><span className="info-bank bradesco">B</span> Bradesco CNAB 400 Cobrança</li>
                <li><span className="info-bank bb">BB</span> Banco do Brasil CNAB 240 Pagamento</li>
                <li><span className="info-bank caixa">CEF</span> Caixa CNAB 240 Pagamento</li>
                <li><span className="info-bank protheus">P</span> Layout Protheus customizado</li>
              </ul>
            </div>
            <div className="info-tip">
              <span className="info-tip-icon">💡</span>
              <span>
              Quer análise executiva do arquivo?{" "}
                <Link to="/pdf" className="link-btn">Relatório PDF</Link>.
            </span>
            </div>
          </div>
        </div>
      </div>
  );
}
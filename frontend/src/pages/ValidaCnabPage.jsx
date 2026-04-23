import { useState } from "react";
import { Link } from "react-router-dom";
import BankForm from "../components/BankForm.jsx";
import ProtheusForm from "../components/ProtheusForm.jsx";
import BannerAnonimo from "../components/BannerAnonimo.jsx";
import ElvisMiniChat from "../components/ElvisMiniChat.jsx";
import { IcoExcel, IcoPdf, IcoBack } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ValidaCnabPage() {
    const [ferramenta, setFerramenta] = useState("excel");
    const [source, setSource]         = useState("bank");
    const { autenticado } = useAuth();

    return (
        <div className="tool-page">
            <div className="tool-page-header">
                <Link to="/" className="back-btn">
                    <IcoBack/> Voltar
                </Link>

                {/* Seletor de ferramenta */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    <button
                        onClick={() => setFerramenta("excel")}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                            fontWeight: 700, fontSize: 14,
                            background: ferramenta === "excel" ? "var(--grad)" : "var(--surface)",
                            border: ferramenta === "excel" ? "none" : "1px solid var(--border)",
                            color: ferramenta === "excel" ? "#0B1E36" : "var(--text-muted)",
                        }}>
                        <IcoExcel/> Exportar Excel
                    </button>
                    <button
                        onClick={() => setFerramenta("pdf")}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                            fontWeight: 700, fontSize: 14,
                            background: ferramenta === "pdf" ? "var(--grad)" : "var(--surface)",
                            border: ferramenta === "pdf" ? "none" : "1px solid var(--border)",
                            color: ferramenta === "pdf" ? "#0B1E36" : "var(--text-muted)",
                        }}>
                        <IcoPdf/> Relatório PDF
                    </button>
                </div>

                <div className="tool-page-title">
                    {ferramenta === "excel" ? (
                        <>
                            <div className="tool-page-icon tool-page-icon--excel"><IcoExcel/></div>
                            <div>
                                <h1>Exportar para Excel</h1>
                                <p>Converta sua remessa CNAB em planilha estruturada</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="tool-page-icon tool-page-icon--pdf"><IcoPdf/></div>
                            <div>
                                <h1>Relatório PDF analítico</h1>
                                <p>Análise completa da remessa com alertas e resumo executivo</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <BannerAnonimo/>

            {/* Layout principal com chat do Elvis na lateral */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }} className="valida-main-grid">

                {/* Ferramenta CNAB */}
                <div>
                    {ferramenta === "excel" ? (
                        <div className="tool-page-body" style={{ display: "block" }}>
                            <div className="tool-page-form">
                                <div className="source-tabs">
                                    <button
                                        className={`source-tab ${source === "bank" ? "source-tab--active" : ""}`}
                                        onClick={() => setSource("bank")}>
                                        🏦 Layout bancário
                                    </button>
                                    <button
                                        className={`source-tab ${source === "protheus" ? "source-tab--active" : ""}`}
                                        onClick={() => setSource("protheus")}>
                                        🔄 Protheus
                                    </button>
                                </div>
                                {source === "bank"
                                    ? <BankForm toolMode="excel" desabilitado={false}/>
                                    : <ProtheusForm mode="excel"/>
                                }
                            </div>
                            <div className="tool-page-info" style={{ marginTop: 20 }}>
                                <InfoCard/>
                            </div>
                        </div>
                    ) : (
                        <div className="tool-page-body" style={{ display: "block" }}>
                            <div className="tool-page-form">
                                <BankForm toolMode="pdf" desabilitado={false}/>
                            </div>
                            <div className="tool-page-info" style={{ marginTop: 20 }}>
                                <InfoCard pdf/>
                            </div>
                        </div>
                    )}
                </div>

                {/* Elvis Mini Chat */}
                <div style={{ position: "sticky", top: 84 }}>
                    <ElvisMiniChat/>
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .valida-main-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}

function InfoCard({ pdf }) {
    return (
        <div className="info-card">
            <h3>{pdf ? "Sobre o relatório PDF" : "Bancos suportados"}</h3>
            {pdf ? (
                <ul className="info-list">
                    {["Resumo executivo com KPIs", "9 categorias de alertas automáticos",
                        "Distribuição por segmento", "Top favorecidos e sacados",
                        "Compatível com CNAB 240 e 400"].map(i => (
                        <li key={i}><span className="info-check">✓</span>{i}</li>
                    ))}
                </ul>
            ) : (
                <ul className="info-list">
                    {["Itaú CNAB 240 e 400", "Bradesco CNAB 240 e 400",
                        "Banco do Brasil CNAB 240", "Caixa CNAB 240",
                        "Layout 400 Protheus"].map(i => (
                        <li key={i}><span className="info-check">✓</span>{i}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
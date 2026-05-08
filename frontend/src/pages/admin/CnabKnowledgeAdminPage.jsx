import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";

const BANK_OPTIONS = [
    { value: "ITAU", label: "Itaú" },
    { value: "BRADESCO", label: "Bradesco" },
    { value: "BB", label: "Banco do Brasil" },
    { value: "CAIXA", label: "Caixa" },
    { value: "SANTANDER", label: "Santander" },
    { value: "OUTRO", label: "Outro" },
];

const TYPE_OPTIONS = [
    { value: "cnab240", label: "CNAB 240" },
    { value: "cnab400", label: "CNAB 400" },
];

const SOURCE_TYPE_OPTIONS = [
    { value: "PDF_LAYOUT", label: "Layout oficial" },
    { value: "PDF_MANUAL", label: "Manual bancário" },
    { value: "PDF_RULES", label: "Regras / observações" },
    { value: "PDF_SEGMENT", label: "Segmento específico" },
];

export default function CnabKnowledgeAdminPage() {
    const [arquivo, setArquivo] = useState(null);
    const [banco, setBanco] = useState("ITAU");
    const [tipo, setTipo] = useState("cnab240");
    const [sourceType, setSourceType] = useState("PDF_LAYOUT");

    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [documents, setDocuments] = useState([]);

    const selectedFileName = useMemo(() => {
        return arquivo?.name || "Nenhum arquivo selecionado";
    }, [arquivo]);

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        try {
            setLoadingList(true);
            const { data } = await api.get("/api/cnab/knowledge/documents");
            setDocuments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar documentos:", error);
        } finally {
            setLoadingList(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setSuccessMessage("");
        setErrorMessage("");

        if (!arquivo) {
            setErrorMessage("Selecione um arquivo PDF antes de enviar.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("arquivo", arquivo);
            formData.append("banco", banco);
            formData.append("tipo", tipo);
            formData.append("sourceType", sourceType);

            await api.post("/api/cnab/knowledge/ingest", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setSuccessMessage("Documento enviado e processado com sucesso.");
            setArquivo(null);

            const fileInput = document.getElementById("cnab-knowledge-file-input");
            if (fileInput) {
                fileInput.value = "";
            }

            await loadDocuments();
        } catch (error) {
            console.error(error);

            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;

            setErrorMessage(
                backendMessage || "Não foi possível enviar o documento."
            );
        } finally {
            setLoading(false);
        }
    }

    function formatDate(value) {
        if (!value) return "-";
        return new Date(value).toLocaleString("pt-BR");
    }

    return (
        <div className="tool-page">
            <div className="tool-page-header">
                <Link to="/assistente-cnab" className="back-btn">
                    Voltar
                </Link>

                <div className="tool-page-title">
                    <div>
                        <h1>Base de Conhecimento CNAB</h1>
                        <p>
                            Área administrativa para upload e gestão dos documentos usados no Assistente CNAB.
                        </p>
                    </div>
                </div>
            </div>

            <div className="tool-page-body" style={{ gridTemplateColumns: "1fr" }}>
                <div className="tool-page-form" style={{ display: "grid", gap: 16 }}>
                    <div className="info-card">
                        <h3>Enviar documento</h3>

                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, marginTop: 16 }}>
                            <div>
                                <label>Arquivo PDF</label>
                                <input
                                    id="cnab-knowledge-file-input"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                                />
                                <small style={{ display: "block", marginTop: 8, opacity: 0.8 }}>
                                    {selectedFileName}
                                </small>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                                <div>
                                    <label>Banco</label>
                                    <select
                                        className="bank-select"
                                        value={banco}
                                        onChange={(e) => setBanco(e.target.value)}
                                    >
                                        {BANK_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Tipo</label>
                                    <select
                                        className="bank-select"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                    >
                                        {TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label>Tipo da fonte</label>
                                <select
                                    className="bank-select"
                                    value={sourceType}
                                    onChange={(e) => setSourceType(e.target.value)}
                                >
                                    {SOURCE_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {successMessage && (
                                <div style={{
                                    border: "1px solid rgba(34, 197, 94, 0.35)",
                                    background: "rgba(34, 197, 94, 0.08)",
                                    color: "#166534",
                                    padding: 12,
                                    borderRadius: 12
                                }}>
                                    {successMessage}
                                </div>
                            )}

                            {errorMessage && (
                                <div style={{
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                    background: "rgba(239, 68, 68, 0.08)",
                                    color: "#991b1b",
                                    padding: 12,
                                    borderRadius: 12,
                                    whiteSpace: "pre-wrap"
                                }}>
                                    {errorMessage}
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? "Enviando..." : "Enviar documento"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="info-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div>
                                <h3>Documentos ingeridos</h3>
                                <p style={{ marginTop: 6 }}>
                                    Lista agrupada por documento enviado para a base de conhecimento.
                                </p>
                            </div>

                            <button type="button" className="btn-secondary" onClick={loadDocuments} disabled={loadingList}>
                                {loadingList ? "Atualizando..." : "Atualizar"}
                            </button>
                        </div>

                        <div style={{ marginTop: 18, overflowX: "auto" }}>
                            <table className="knowledge-table">
                                <thead>
                                <tr>
                                    <th>Documento</th>
                                    <th>Banco</th>
                                    <th>Tipo</th>
                                    <th>Fonte</th>
                                    <th>Chunks</th>
                                    <th>Última ingestão</th>
                                </tr>
                                </thead>
                                <tbody>
                                {documents.length === 0 && !loadingList && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center", opacity: 0.7 }}>
                                            Nenhum documento ingerido até o momento.
                                        </td>
                                    </tr>
                                )}

                                {documents.map((doc, index) => (
                                    <tr key={`${doc.sourceName}-${index}`}>
                                        <td>{doc.sourceName}</td>
                                        <td>{doc.bankCode || "-"}</td>
                                        <td>{doc.cnabType || "-"}</td>
                                        <td>{doc.sourceType || "-"}</td>
                                        <td>{doc.totalChunks ?? 0}</td>
                                        <td>{formatDate(doc.lastIngestionAt)}</td>
                                    </tr>
                                ))}

                                {loadingList && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center" }}>
                                            Carregando documentos...
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
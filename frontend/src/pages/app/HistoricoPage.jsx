import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { LuFolderOpen } from "react-icons/lu";

export default function HistoricoPage() {
    const [remessas,   setRemessas]   = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro,       setErro]       = useState("");

    useEffect(() => {
        api.get("/api/usuario/historico")
            .then(({ data }) => setRemessas(data))
            .catch(() => setErro("Erro ao carregar historico"))
            .finally(() => setCarregando(false));
    }, []);

    function fmtData(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    }

    function fmtValor(valor) {
        if (!valor) return "—";
        return new Intl.NumberFormat("pt-BR", {
            style: "currency", currency: "BRL"
        }).format(valor);
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1 className="admin-title">Histórico de Remessas</h1>
                <p className="admin-subtitle">Arquivos gerados pela sua conta</p>
            </div>

            <div className="admin-card">
                {carregando && <p className="admin-loading">Carregando...</p>}
                {erro       && <p className="admin-msg admin-msg--erro">{erro}</p>}

                {!carregando && !erro && remessas.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                        <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}><LuFolderOpen size={44} color="var(--text-dim)"/></div>
                        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
                            Nenhuma remessa gerada ainda.
                        </p>
                        <Link to="/excel" style={{ color: "var(--purple)", fontWeight: 600, fontSize: 14 }}>
                            Gerar minha primeira remessa
                        </Link>
                    </div>
                )}

                {!carregando && !erro && remessas.length > 0 && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Arquivo</th>
                                <th>Banco</th>
                                <th>Layout</th>
                                <th>Tipo</th>
                                <th>Registros</th>
                                <th>Valor total</th>
                                <th>Gerado em</th>
                            </tr>
                            </thead>
                            <tbody>
                            {remessas.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {r.nomeArquivo}
                                    </td>
                                    <td>{r.banco}</td>
                                    <td>
                      <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        CNAB {r.versao} · {r.modo}
                      </span>
                                    </td>
                                    <td>
                      <span className={`perfil-badge ${r.tipoSaida === "EXCEL" ? "perfil-badge--operador" : "perfil-badge--admin"}`}>
                        {r.tipoSaida}
                      </span>
                                    </td>
                                    <td>{r.qtdRegistros ?? "—"}</td>
                                    <td>{fmtValor(r.valorTotal)}</td>
                                    <td>{fmtData(r.geradoEm)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
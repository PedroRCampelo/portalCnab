import { useState, useEffect, useCallback } from "react";
import { LuActivity, LuLandmark, LuFileText, LuRefreshCw } from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader from "../../components/shell/PageHeader.jsx";

import SaudeMesTab          from "./fluxo-caixa/SaudeMesTab.jsx";
import ContasBancariasTab   from "./fluxo-caixa/ContasBancariasTab.jsx";
import ExtratoTab           from "./fluxo-caixa/ExtratoTab.jsx";

/**
 * FluxoCaixaPage — Visão geral do fluxo de caixa
 * Sprint A3.5 · Refatoração piloto
 *
 * Este componente é APENAS o orquestrador:
 *  - Gerencia tab ativa
 *  - Carrega dados de saúde do mês e contas bancárias
 *  - Passa props pros sub-tabs
 *
 * Cada tab é um arquivo separado em ./fluxo-caixa/
 */
export default function FluxoCaixaPage() {
    const [tab, setTab] = useState("saude");

    // Estados compartilhados entre tabs
    const [saude, setSaude]                = useState(null);
    const [carregandoSaude, setCarSaude]   = useState(true);
    const [contas, setContas]              = useState([]);
    const [carregandoContas, setCarContas] = useState(true);
    const [erro, setErro]                  = useState("");

    // ── Carregamento ─────────────────────────────────────────────────────────

    const carregarSaude = useCallback(async () => {
        setCarSaude(true);
        setErro("");
        try {
            const { data } = await api.get("/api/fluxo-caixa/saude-mes");
            setSaude(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar saúde do mês");
        } finally {
            setCarSaude(false);
        }
    }, []);

    const carregarContas = useCallback(async () => {
        setCarContas(true);
        try {
            const { data } = await api.get("/api/saldos-bancarios");
            setContas(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar contas");
        } finally {
            setCarContas(false);
        }
    }, []);

    useEffect(() => {
        carregarSaude();
        carregarContas();
    }, [carregarSaude, carregarContas]);

    // ── Recarregar tudo (passado pra tabs que precisam) ──────────────────────

    const recarregarTudo = useCallback(async () => {
        await Promise.all([carregarSaude(), carregarContas()]);
    }, [carregarSaude, carregarContas]);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <PageHeader
                title="Fluxo de Caixa"
                actions={
                    <button
                        className="ph-btn ph-btn--ghost"
                        onClick={recarregarTudo}
                        disabled={carregandoSaude || carregandoContas}
                    >
                        <LuRefreshCw size={14}/>
                        Atualizar
                    </button>
                }
                tabs={[
                    { key: "saude",   icon: LuActivity, label: "Saúde do mês" },
                    { key: "contas",  icon: LuLandmark, label: "Contas bancárias", count: contas.length || null },
                    { key: "extrato", icon: LuFileText, label: "Extrato" },
                ]}
                activeTab={tab}
                onTabChange={setTab}
            />

            {/* Erro global */}
            {erro && (
                <div style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "var(--error-bg)",
                    border: "1px solid rgba(229, 72, 77, 0.2)",
                    color: "var(--error)",
                    fontSize: 13,
                    marginBottom: 16,
                }}>
                    {erro}
                </div>
            )}

            {/* Conteúdo da tab ativa */}
            {tab === "saude" && (
                <SaudeMesTab
                    saude={saude}
                    carregando={carregandoSaude}
                    onRecarregar={carregarSaude}
                    onIrPraContas={() => setTab("contas")}
                />
            )}

            {tab === "contas" && (
                <ContasBancariasTab
                    contas={contas}
                    carregando={carregandoContas}
                    onRecarregar={recarregarTudo}
                />
            )}

            {tab === "extrato" && (
                <ExtratoTab contas={contas}/>
            )}
        </>
    );
}
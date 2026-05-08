import { useState } from "react";
import { Link } from "react-router-dom";
import { LuFileSpreadsheet, LuFileText } from "react-icons/lu";
import BankForm       from "../../components/BankForm.jsx";
import ProtheusForm   from "../../components/ProtheusForm.jsx";
import BannerAnonimo  from "../../components/BannerAnonimo.jsx";
import ElvisMiniChat  from "../../components/ElvisMiniChat.jsx";
import { useAuth }    from "../../context/AuthContext.jsx";

import ToolLayout                              from "./_ToolLayout.jsx";
import { FormCard, SourceTabs, InfoCard, InfoTip } from "./_shared.jsx";
import ConversionCta                           from "./_ConversionCta.jsx";
import { useSeo, useSchemaMarkup, SCHEMA_BASE_APP } from "./_seo.jsx";

/**
 * ValidaCnabPage — Hub unificado das ferramentas (Excel + PDF)
 * Sprint A3.6.14 + A3.6.15 · Refatoração + SEO/Marketing
 *
 * É a versão "tudo num lugar só":
 *  - Tabs no topo: Excel | PDF
 *  - Form correspondente
 *  - Elvis Mini Chat na lateral (atrai pra Whallet+)
 */
export default function ValidaCnabPage() {
    const [ferramenta, setFerramenta] = useState("excel");
    const [source,     setSource]     = useState("bank");
    const { autenticado } = useAuth();

    /* ─── SEO ─────────────────────────────────────────────────────────── */

    useSeo({
        title: "Validar e converter CNAB grátis · Whallet",
        description:
            "Converta CNAB para Excel ou gere relatórios PDF analíticos. " +
            "Suporta Itaú, Bradesco, Banco do Brasil, Caixa e Layout Protheus. " +
            "Grátis, sem cadastro pra começar.",
        keywords: [
            "validar cnab",
            "converter cnab",
            "cnab 240",
            "cnab 400",
            "remessa cnab",
            "retorno cnab",
            "ferramenta cnab gratuita",
        ],
        canonical: "/valida-cnab",
    });

    useSchemaMarkup({
        ...SCHEMA_BASE_APP,
        name: "Conversor CNAB · Whallet",
        description: "Ferramenta gratuita para converter e validar arquivos CNAB",
        url: "https://whallet.com.br/valida-cnab",
        featureList: [
            "Converter CNAB para Excel",
            "Gerar relatório PDF analítico",
            "Suporte a Itaú, Bradesco, BB, Caixa",
            "CNAB 240 e CNAB 400",
            "Layout Protheus customizado",
            "Detecção automática de inconsistências",
        ],
    });

    /* ─── Render ──────────────────────────────────────────────────────── */

    const ehExcel = ferramenta === "excel";

    // Toolbar com tabs Excel/PDF
    const toolbar = (
        <div className="vcn-tool-tabs">
            <button
                type="button"
                className={`vcn-tab ${ehExcel ? "active" : ""}`}
                onClick={() => setFerramenta("excel")}
            >
                <LuFileSpreadsheet size={14}/>
                Exportar Excel
            </button>
            <button
                type="button"
                className={`vcn-tab ${!ehExcel ? "active" : ""}`}
                onClick={() => setFerramenta("pdf")}
            >
                <LuFileText size={14}/>
                Relatório PDF
            </button>
        </div>
    );

    const rightAside = <ElvisMiniChat/>;

    return (
        <ToolLayout
            icon={ehExcel ? <LuFileSpreadsheet size={26}/> : <LuFileText size={26}/>}
            iconColor={ehExcel ? "excel" : "pdf"}
            title={ehExcel ? "Exportar para Excel" : "Relatório PDF analítico"}
            subtitle={
                ehExcel
                    ? "Converta sua remessa CNAB em planilha estruturada"
                    : "Análise completa da remessa com alertas e resumo executivo"
            }
            toolbar={toolbar}
            rightAside={rightAside}
        >
            {!autenticado && <BannerAnonimo/>}

            <FormCard>
                {ehExcel ? (
                    <>
                        <SourceTabs value={source} onChange={setSource}/>
                        {source === "bank"
                            ? <BankForm toolMode="excel" desabilitado={false}/>
                            : <ProtheusForm mode="excel"/>}
                    </>
                ) : (
                    <BankForm toolMode="pdf" desabilitado={false}/>
                )}
            </FormCard>

            {/* InfoCard contextual */}
            <div className="vcn-info-wrap">
                {ehExcel ? (
                    <>
                        <InfoCard
                            title="Bancos suportados"
                            items={[
                                "Itaú CNAB 240 e 400",
                                "Bradesco CNAB 240 e 400",
                                "Banco do Brasil CNAB 240",
                                "Caixa CNAB 240",
                                "Layout 400 Protheus",
                            ]}
                        />
                        <InfoTip>
                            Quer uma análise executiva?{" "}
                            <Link to="/pdf">Gerar Relatório PDF</Link>.
                        </InfoTip>
                    </>
                ) : (
                    <>
                        <InfoCard
                            title="Sobre o relatório PDF"
                            items={[
                                "Resumo executivo com KPIs",
                                "9 categorias de alertas automáticos",
                                "Distribuição por segmento",
                                "Top favorecidos e sacados",
                                "Compatível com CNAB 240 e 400",
                            ]}
                        />
                        <InfoTip>
                            Prefere uma planilha pra edição?{" "}
                            <Link to="/excel">Exportar Excel</Link>.
                        </InfoTip>
                    </>
                )}
            </div>

            {/* CTA pós-conversão (auto-aparece após sucesso) */}
            <ConversionCta/>

            <style>{COMPONENT_CSS}</style>
        </ToolLayout>
    );
}

const COMPONENT_CSS = `
.vcn-tool-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.vcn-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid var(--hair);
    background: var(--surface);
    color: var(--text-muted);
    font-family: var(--ff-sans);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
    transition: all 0.15s;
}

.vcn-tab:hover {
    border-color: var(--text-dim);
    color: var(--navy-deep);
    background: var(--bg);
}

.vcn-tab.active {
    border-color: var(--cyan);
    background: linear-gradient(135deg, #15C3DD 0%, #0891A8 100%);
    color: white;
    box-shadow: 0 2px 12px rgba(21, 195, 221, 0.25);
}

.vcn-tab.active:hover {
    background: linear-gradient(135deg, #15C3DD 0%, #0891A8 100%);
    color: white;
}

.vcn-info-wrap {
    margin-top: 20px;
}

@media (max-width: 600px) {
    .vcn-tab {
        flex: 1;
        justify-content: center;
        padding: 10px 14px;
    }
}
`;
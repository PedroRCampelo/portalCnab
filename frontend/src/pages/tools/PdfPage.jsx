import { useState } from "react";
import { Link } from "react-router-dom";
import { LuFileText } from "react-icons/lu";
import BankForm      from "../../components/BankForm.jsx";
import BannerAnonimo from "../../components/BannerAnonimo.jsx";
import { useAuth }   from "../../context/AuthContext.jsx";

import ToolLayout                          from "./_ToolLayout.jsx";
import { FormCard, InfoCard, InfoTip }     from "./_shared.jsx";
import ConversionCta                       from "./_ConversionCta.jsx";
import { useSeo, useSchemaMarkup, SCHEMA_BASE_APP } from "./_seo.jsx";

/**
 * PdfPage — Geração de relatório PDF analítico do CNAB
 * Sprint A3.6.14 + A3.6.15 · Refatoração + SEO/Marketing
 */
export default function PdfPage() {
    const [bloqueado, setBloqueado] = useState(false);
    const { autenticado } = useAuth();

    /* ─── SEO ─────────────────────────────────────────────────────────── */

    useSeo({
        title: "Relatório PDF analítico de CNAB grátis · Whallet",
        description:
            "Gere relatórios PDF analíticos de arquivos CNAB com resumo executivo, " +
            "9 categorias de alertas automáticos, distribuição mensal, top favorecidos " +
            "e KPIs financeiros. Grátis, sem cadastro pra começar.",
        keywords: [
            "relatorio cnab",
            "analise cnab",
            "pdf cnab",
            "alertas cnab",
            "cnab 240",
            "cnab 400",
            "auditoria cnab",
        ],
        canonical: "/pdf",
    });

    useSchemaMarkup({
        ...SCHEMA_BASE_APP,
        name: "Gerador de Relatório PDF para CNAB",
        description: "Ferramenta gratuita para gerar análise PDF de arquivos CNAB",
        url: "https://whallet.com.br/pdf",
        featureList: [
            "Resumo executivo com KPIs",
            "9 categorias de alertas automáticos",
            "Distribuição por segmento",
            "Linha do tempo mensal",
            "Top favorecidos e sacados",
        ],
    });

    /* ─── Render ──────────────────────────────────────────────────────── */

    return (
        <ToolLayout
            icon={<LuFileText size={26}/>}
            iconColor="pdf"
            title="Relatório PDF analítico"
            subtitle="Análise completa da remessa com alertas automáticos e resumo executivo"
        >
            <div className="pdf-layout">

                {/* Coluna 1: Form */}
                <div>
                    {!autenticado && (
                        <BannerAnonimo onLimiteBloqueado={() => setBloqueado(true)}/>
                    )}

                    <FormCard>
                        <BankForm toolMode="pdf" desabilitado={bloqueado}/>
                    </FormCard>
                </div>

                {/* Coluna 2: Info */}
                <aside className="pdf-info">
                    <InfoCard
                        title="Seções do relatório"
                        items={[
                            "Capa com logo, empresa e metadados",
                            "Resumo executivo — valor total, médias, KPIs",
                            "Distribuição por segmento com proporção",
                            "Linha do tempo mensal",
                            "Alertas automáticos por severidade",
                            "Top favorecidos / sacados",
                        ]}
                    />

                    <InfoCard
                        title="Alertas detectados automaticamente"
                        items={[
                            { severity: "critico", severityLabel: "Crítico", text: "Nosso Número duplicado" },
                            { severity: "critico", severityLabel: "Crítico", text: "Datas inválidas" },
                            { severity: "atencao", severityLabel: "Atenção", text: "Vencimentos no passado" },
                            { severity: "atencao", severityLabel: "Atenção", text: "Valores discrepantes" },
                            { severity: "atencao", severityLabel: "Atenção", text: "Valor zero" },
                            { severity: "info",    severityLabel: "Info",    text: "Ocorrências no retorno" },
                        ]}
                    />

                    <InfoTip>
                        Prefere uma planilha para edição?{" "}
                        <Link to="/excel">Exportar para Excel</Link>.
                    </InfoTip>
                </aside>
            </div>

            {/* CTA pós-conversão (auto-aparece após sucesso) */}
            <ConversionCta/>

            <style>{COMPONENT_CSS}</style>
        </ToolLayout>
    );
}

const COMPONENT_CSS = `
.pdf-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
}

.pdf-info {
    position: sticky;
    top: 24px;
}

@media (max-width: 900px) {
    .pdf-layout {
        grid-template-columns: 1fr;
    }

    .pdf-info {
        position: static;
    }
}
`;
import { useState } from "react";
import { Link } from "react-router-dom";
import { LuFileSpreadsheet } from "react-icons/lu";
import BankForm       from "../components/BankForm.jsx";
import ProtheusForm   from "../components/ProtheusForm.jsx";
import BannerAnonimo  from "../components/BannerAnonimo.jsx";
import { useAuth }    from "../context/AuthContext.jsx";

import ToolLayout                              from "./_ToolLayout.jsx";
import { FormCard, SourceTabs, InfoCard, InfoTip } from "./_shared.jsx";
import ConversionCta                           from "./_ConversionCta.jsx";
import { useSeo, useSchemaMarkup, SCHEMA_BASE_APP } from "./_seo.jsx";

/**
 * ExcelPage — Conversão CNAB → Excel
 * Sprint A3.6.14 + A3.6.15 · Refatoração + SEO/Marketing
 *
 * Tela pública (anônimo pode usar com limite via BannerAnonimo).
 */
export default function ExcelPage() {
    const [source,    setSource]    = useState("bank");
    const [bloqueado, setBloqueado] = useState(false);
    const { autenticado } = useAuth();

    /* ─── SEO ─────────────────────────────────────────────────────────── */

    useSeo({
        title: "Converter CNAB para Excel grátis · Whallet",
        description:
            "Converta arquivos CNAB 240 e 400 (Itaú, Bradesco, Banco do Brasil, Caixa) " +
            "para Excel em segundos. Grátis, sem cadastro pra começar. " +
            "Suporta remessa, retorno e Layout Protheus.",
        keywords: [
            "converter cnab excel",
            "cnab para excel",
            "cnab 240",
            "cnab 400",
            "remessa cnab",
            "retorno cnab",
            "itau bradesco bb caixa",
        ],
        canonical: "/excel",
    });

    useSchemaMarkup({
        ...SCHEMA_BASE_APP,
        name: "Conversor CNAB para Excel",
        description: "Ferramenta gratuita para converter arquivos CNAB 240/400 em Excel",
        url: "https://whallet.com.br/excel",
        featureList: [
            "Suporta CNAB 240 e CNAB 400",
            "Itaú, Bradesco, Banco do Brasil, Caixa",
            "Remessa e retorno",
            "Layout Protheus customizado",
            "Planilha .xlsx com abas por tipo de registro",
        ],
    });

    /* ─── Render ──────────────────────────────────────────────────────── */

    return (
        <ToolLayout
            icon={<LuFileSpreadsheet size={26}/>}
            iconColor="excel"
            title="Exportar para Excel"
            subtitle="Converta sua remessa CNAB em planilha estruturada com abas por tipo de registro"
        >
            <div className="excel-layout">

                {/* Coluna 1: Form */}
                <div>
                    {!autenticado && (
                        <BannerAnonimo onLimiteBloqueado={() => setBloqueado(true)}/>
                    )}

                    <FormCard>
                        <SourceTabs value={source} onChange={setSource}/>

                        {source === "bank" ? (
                            <BankForm toolMode="excel" desabilitado={bloqueado}/>
                        ) : (
                            <ProtheusForm desabilitado={bloqueado}/>
                        )}
                    </FormCard>
                </div>

                {/* Coluna 2: Info */}
                <aside className="excel-info">
                    <InfoCard
                        title="O que você recebe"
                        items={[
                            "Planilha .xlsx com abas por tipo de registro",
                            "Aba de resumo com contagens por tipo",
                            "Datas e valores formatados automaticamente",
                            "Coluna de linha original para rastreabilidade",
                        ]}
                    />

                    <InfoCard
                        variant="muted"
                        title="Layouts suportados"
                        items={[
                            { bank: "itau",     bankLabel: "Itaú",  text: "CNAB 400 Cobrança" },
                            { bank: "itau",     bankLabel: "Itaú",  text: "CNAB 240 Cobrança" },
                            { bank: "itau",     bankLabel: "Itaú",  text: "CNAB 240 Pagamento" },
                            { bank: "bradesco", bankLabel: "Brad",  text: "Bradesco CNAB 240 Pagamento" },
                            { bank: "bradesco", bankLabel: "Brad",  text: "Bradesco CNAB 400 Cobrança" },
                            { bank: "bb",       bankLabel: "BB",    text: "Banco do Brasil CNAB 240 Pagamento" },
                            { bank: "caixa",    bankLabel: "CEF",   text: "Caixa CNAB 240 Pagamento" },
                            { bank: "protheus", bankLabel: "P",     text: "Layout Protheus customizado" },
                        ]}
                    />

                    <InfoTip>
                        Quer análise executiva do arquivo?{" "}
                        <Link to="/pdf">Gerar Relatório PDF</Link>.
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
.excel-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
}

.excel-info {
    position: sticky;
    top: 24px;
}

@media (max-width: 900px) {
    .excel-layout {
        grid-template-columns: 1fr;
    }

    .excel-info {
        position: static;
    }
}
`;
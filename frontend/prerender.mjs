/**
 * prerender.mjs — Geração de HTML estático por rota após `vite build`
 *
 * Problema: o app é uma React SPA. O Google recebe o index.html genérico
 * para todas as rotas e precisa renderizar JS para ver o conteúdo.
 * Muitas rotas ficam "Discovered - currently not indexed" por isso.
 *
 * Solução: após o build, gerar dist/<rota>/index.html com os meta tags
 * corretos embutidos no HTML estático. O Google indexa os meta tags sem JS;
 * o React hidrata normalmente no cliente.
 *
 * Rotas tratadas: /valida-cnab, /excel, /pdf, /planos
 */

import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir   = resolve(__dirname, "dist");
const template  = readFileSync(resolve(distDir, "index.html"), "utf-8");

/* ── Configuração por rota ─────────────────────────────────────────────── */

const ROUTES = [
    {
        path: "valida-cnab",
        title: "Validar e converter CNAB grátis · Whallet",
        description:
            "Converta CNAB para Excel ou gere relatórios PDF analíticos. " +
            "Suporta Itaú, Bradesco, Banco do Brasil, Caixa e Layout Protheus. " +
            "Grátis, sem cadastro pra começar.",
        keywords: "validar cnab, converter cnab, cnab 240, cnab 400, remessa cnab, retorno cnab, ferramenta cnab gratuita",
        canonical: "https://whallet.com.br/valida-cnab",
        ogImage: "https://whallet.com.br/og-default.png",
        schema: {
            "@type": "SoftwareApplication",
            name: "Conversor CNAB · Whallet",
            description: "Ferramenta gratuita para converter e validar arquivos CNAB",
            url: "https://whallet.com.br/valida-cnab",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
            featureList: [
                "Converter CNAB para Excel",
                "Gerar relatório PDF analítico",
                "Suporte a Itaú, Bradesco, BB, Caixa",
                "CNAB 240 e CNAB 400",
                "Layout Protheus customizado",
                "Detecção automática de inconsistências",
            ],
            publisher: { "@type": "Organization", name: "Whallet", url: "https://whallet.com.br" },
        },
        staticContent: `
      <h1>Validar e Converter CNAB Grátis</h1>
      <p>Ferramenta gratuita para converter e validar arquivos CNAB 240 e CNAB 400 de qualquer banco.</p>
      <ul>
        <li>Converter CNAB para Excel (.xlsx)</li>
        <li>Gerar relatório PDF analítico</li>
        <li>Suporte a Itaú, Bradesco, Banco do Brasil, Caixa Econômica Federal</li>
        <li>Compatível com Layout Protheus</li>
        <li>Sem cadastro para começar</li>
      </ul>`,
    },
    {
        path: "excel",
        title: "Converter CNAB para Excel grátis · Whallet",
        description:
            "Converta arquivos CNAB 240 e 400 (Itaú, Bradesco, Banco do Brasil, Caixa) " +
            "para Excel em segundos. Grátis, sem cadastro pra começar. " +
            "Suporta remessa, retorno e Layout Protheus.",
        keywords: "converter cnab excel, cnab para excel, cnab 240 excel, cnab 400 excel, remessa cnab, retorno cnab",
        canonical: "https://whallet.com.br/excel",
        ogImage: "https://whallet.com.br/og-default.png",
        schema: {
            "@type": "SoftwareApplication",
            name: "Conversor CNAB para Excel · Whallet",
            description: "Ferramenta gratuita para converter arquivos CNAB 240/400 em Excel",
            url: "https://whallet.com.br/excel",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
            featureList: [
                "Exportar CNAB para planilha Excel",
                "Suporte CNAB 240 e CNAB 400",
                "Itaú, Bradesco, Banco do Brasil, Caixa",
                "Remessa e retorno bancário",
                "Layout Protheus",
            ],
            publisher: { "@type": "Organization", name: "Whallet", url: "https://whallet.com.br" },
        },
        staticContent: `
      <h1>Converter CNAB para Excel Grátis</h1>
      <p>Converta arquivos CNAB 240 e CNAB 400 para planilhas Excel (.xlsx) de forma gratuita e instantânea.</p>
      <ul>
        <li>Suporte a CNAB 240 e CNAB 400</li>
        <li>Itaú, Bradesco, Banco do Brasil, Caixa Econômica Federal</li>
        <li>Arquivos de remessa e retorno bancário</li>
        <li>Layout Protheus customizado</li>
        <li>Sem cadastro para começar</li>
      </ul>`,
    },
    {
        path: "pdf",
        title: "Relatório PDF analítico de CNAB grátis · Whallet",
        description:
            "Gere relatórios PDF analíticos de arquivos CNAB com resumo executivo, " +
            "9 categorias de alertas automáticos, distribuição mensal, top favorecidos " +
            "e KPIs financeiros. Grátis, sem cadastro pra começar.",
        keywords: "relatorio cnab pdf, analise cnab, cnab para pdf, alertas cnab, cnab 240, cnab 400, auditoria cnab",
        canonical: "https://whallet.com.br/pdf",
        ogImage: "https://whallet.com.br/og-default.png",
        schema: {
            "@type": "SoftwareApplication",
            name: "Gerador de Relatório PDF para CNAB · Whallet",
            description: "Ferramenta gratuita para gerar análise PDF de arquivos CNAB",
            url: "https://whallet.com.br/pdf",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
            featureList: [
                "Resumo executivo com KPIs financeiros",
                "9 categorias de alertas automáticos",
                "Distribuição mensal de transações",
                "Top favorecidos e pagamentos",
                "Suporte CNAB 240 e CNAB 400",
            ],
            publisher: { "@type": "Organization", name: "Whallet", url: "https://whallet.com.br" },
        },
        staticContent: `
      <h1>Relatório PDF Analítico de CNAB Grátis</h1>
      <p>Gere relatórios PDF profissionais com análise completa dos seus arquivos CNAB 240 e CNAB 400.</p>
      <ul>
        <li>Resumo executivo com KPIs financeiros</li>
        <li>9 categorias de alertas automáticos de inconsistências</li>
        <li>Distribuição mensal de transações</li>
        <li>Top favorecidos e histórico de pagamentos</li>
        <li>Suporte a Itaú, Bradesco, Banco do Brasil, Caixa</li>
        <li>Sem cadastro para começar</li>
      </ul>`,
    },
    {
        path: "planos",
        title: "Planos e preços · Whallet — Gestão financeira com IA",
        description:
            "Conheça os planos do Whallet: Free com validação CNAB grátis e Whallet+ com gestão " +
            "financeira completa, Bot WhatsApp com IA e agentes inteligentes por R$ 39,90/mês. " +
            "7 dias grátis, sem cartão.",
        keywords: "whallet planos, whallet precos, gestao financeira mei, bot whatsapp financeiro, cnab gratis",
        canonical: "https://whallet.com.br/planos",
        ogImage: "https://whallet.com.br/og-default.png",
        schema: {
            "@type": "WebPage",
            name: "Planos e Preços · Whallet",
            description: "Planos Free e Whallet+ para gestão financeira com IA e Bot WhatsApp",
            url: "https://whallet.com.br/planos",
            publisher: { "@type": "Organization", name: "Whallet", url: "https://whallet.com.br" },
        },
        staticContent: `
      <h1>Planos e Preços · Whallet</h1>
      <h2>Plano Free — R$ 0/mês</h2>
      <ul>
        <li>Validação e visualização de arquivos CNAB</li>
        <li>Dashboard básico</li>
        <li>Elvis — 5 consultas de IA por mês</li>
      </ul>
      <h2>Whallet+ — R$ 39,90/mês</h2>
      <ul>
        <li>Gestão financeira completa (recebimentos, contas a pagar, fluxo de caixa)</li>
        <li>Bot WhatsApp com IA (texto e áudio)</li>
        <li>Agentes Aurora, Frank e Anne</li>
        <li>Elvis — 100 consultas por mês</li>
        <li>Relatórios avançados</li>
        <li>7 dias grátis, sem cartão de crédito</li>
      </ul>`,
    },
];

/* ── Funções de substituição de HTML ───────────────────────────────────── */

function replaceMeta(html, name, content) {
    const re = new RegExp(`(<meta\\s+name="${name}"\\s+content=")[^"]*(")`,"i");
    return re.test(html)
        ? html.replace(re, `$1${escHtml(content)}$2`)
        : html;
}

function replaceMetaProperty(html, property, content) {
    const re = new RegExp(`(<meta\\s+property="${property}"\\s+content=")[^"]*(")`,"i");
    return re.test(html)
        ? html.replace(re, `$1${escHtml(content)}$2`)
        : html;
}

function replaceTitle(html, title) {
    return html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);
}

function replaceCanonical(html, canonical) {
    const re = /(<link\s+rel="canonical"\s+href=")[^"]*(")/i;
    return re.test(html)
        ? html.replace(re, `$1${escHtml(canonical)}$2`)
        : html;
}

function injectSchema(html, schema) {
    const tag = `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", ...schema }, null, 2)}\n</script>`;
    return html.replace("</head>", `${tag}\n</head>`);
}

function injectStaticContent(html, content) {
    const noscript = `<noscript><div style="display:none">${content}</div></noscript>`;
    return html.replace('<div id="root"></div>', `<div id="root"></div>\n${noscript}`);
}

function escHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ── Gera cada rota ────────────────────────────────────────────────────── */

for (const route of ROUTES) {
    let html = template;

    html = replaceTitle(html, route.title);
    html = replaceMeta(html, "description", route.description);
    html = replaceMeta(html, "keywords", route.keywords);
    html = replaceCanonical(html, route.canonical);

    html = replaceMetaProperty(html, "og:title", route.title);
    html = replaceMetaProperty(html, "og:description", route.description);
    html = replaceMetaProperty(html, "og:url", route.canonical);
    html = replaceMetaProperty(html, "og:image", route.ogImage);

    html = replaceMeta(html, "twitter:title", route.title);
    html = replaceMeta(html, "twitter:description", route.description);
    html = replaceMeta(html, "twitter:image", route.ogImage);

    html = injectSchema(html, route.schema);
    html = injectStaticContent(html, route.staticContent);

    const outDir = resolve(distDir, route.path);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html, "utf-8");

    console.log(`✓ Pré-renderizado: /${route.path}`);
}

console.log(`\nPré-rendering concluído. ${ROUTES.length} rotas geradas.`);

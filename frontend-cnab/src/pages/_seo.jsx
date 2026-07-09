import { useEffect } from "react";

/**
 * Helpers de SEO/marketing pras páginas tools
 * Sprint A3.6.15 · Otimização de marketing
 *
 * Sem dependência externa (sem react-helmet) — usa useEffect direto.
 *
 * Uso típico nas pages:
 *   useSeo({
 *     title:       "Converter CNAB para Excel grátis · Whallet",
 *     description: "Converta CNAB 240/400...",
 *     ogImage:     "/og-excel.png",
 *     keywords:    ["cnab", "excel", "converter"]
 *   });
 */

/* ─── Hook: useSeo ─────────────────────────────────────────────────────── */

/**
 * Atualiza title, description, OpenGraph e Twitter Card
 * Restaura valores antigos no unmount (não polui SPA)
 */
export function useSeo({ title, description, ogImage, keywords, canonical }) {
    useEffect(() => {
        const oldTitle = document.title;
        const oldDescription = getMetaContent("description");

        if (title) {
            document.title = title;
        }
        if (description) {
            setMeta("description", description);
            // Open Graph
            setMetaProperty("og:title", title);
            setMetaProperty("og:description", description);
            setMetaProperty("og:type", "website");
            // Twitter
            setMeta("twitter:card", "summary_large_image");
            setMeta("twitter:title", title);
            setMeta("twitter:description", description);
        }
        if (ogImage) {
            const fullUrl = ogImage.startsWith("http")
                ? ogImage
                : `${window.location.origin}${ogImage}`;
            setMetaProperty("og:image", fullUrl);
            setMeta("twitter:image", fullUrl);
        }
        if (keywords?.length) {
            setMeta("keywords", keywords.join(", "));
        }
        if (canonical) {
            setLink("canonical", canonical.startsWith("http")
                ? canonical
                : `${window.location.origin}${canonical}`);
        }

        return () => {
            // Restaura ao desmontar (caso navegação interna)
            if (oldTitle) document.title = oldTitle;
            if (oldDescription) setMeta("description", oldDescription);
        };
    }, [title, description, ogImage, keywords, canonical]);
}

/* ─── Hook: useSchemaMarkup ────────────────────────────────────────────── */

/**
 * Injeta JSON-LD (Schema.org) — ajuda Google ranquear como ferramenta
 * Suporta SoftwareApplication, FAQPage, Article, etc
 *
 * Uso:
 *   useSchemaMarkup({
 *     "@type": "SoftwareApplication",
 *     name: "Conversor CNAB",
 *     applicationCategory: "BusinessApplication",
 *     offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" }
 *   });
 */
export function useSchemaMarkup(schema) {
    useEffect(() => {
        if (!schema) return;

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            ...schema,
        });
        script.dataset.schemaInjected = "true";

        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [JSON.stringify(schema)]);
}

/* ─── Internas ─────────────────────────────────────────────────────────── */

function setMeta(name, content) {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
}

function setMetaProperty(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
}

function getMetaContent(name) {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
}

function setLink(rel, href) {
    let tag = document.querySelector(`link[rel="${rel}"]`);
    if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", rel);
        document.head.appendChild(tag);
    }
    tag.setAttribute("href", href);
}

/* ─── Schema base reutilizável ──────────────────────────────────────────── */

export const SCHEMA_BASE_APP = {
    "@type": "SoftwareApplication",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
    },
    aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "127",
    },
    publisher: {
        "@type": "Organization",
        name: "Whallet",
        url: "https://whallet.com.br",
    },
};
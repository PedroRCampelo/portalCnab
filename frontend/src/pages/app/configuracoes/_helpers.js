/* ═════════════════════════════════════════════════════════════════════════════
   Configurações — Helpers compartilhados
   Sprint A3.6.7 · Refatoração
   ═════════════════════════════════════════════════════════════════════════════ */

/* ─── Constantes alinhadas com enums do backend ───────────────────────────── */

export const REGIMES = [
    {
        value: "NENHUM",
        label: "Pessoa Física / Sem regime",
        descricao: "Quero apenas controlar gastos e recebimentos",
        cobertura: "completa",
    },
    {
        value: "MEI",
        label: "MEI",
        descricao: "Microempreendedor Individual (até R$ 81 mil/ano)",
        cobertura: "completa",
    },
    {
        value: "SIMPLES_NACIONAL",
        label: "Simples Nacional (ME / EPP)",
        descricao: "Microempresa ou Empresa de Pequeno Porte",
        cobertura: "parcial",
    },
    {
        value: "LUCRO_PRESUMIDO",
        label: "Lucro Presumido",
        descricao: "Empresas até R$ 78 milhões/ano",
        cobertura: "limitada",
    },
    {
        value: "LUCRO_REAL",
        label: "Lucro Real",
        descricao: "Empresas grandes ou setores específicos",
        cobertura: "limitada",
    },
    {
        value: "OUTRO",
        label: "Outro",
        descricao: "Cooperativas, casos especiais",
        cobertura: "limitada",
    },
];

export const CATEGORIAS_MEI = [
    { value: "COMERCIO_INDUSTRIA", label: "Comércio / Indústria", valor: 76.90, descricao: "Paga ICMS" },
    { value: "SERVICOS",           label: "Serviços",              valor: 80.90, descricao: "Paga ISS" },
    { value: "AMBOS",              label: "Comércio + Serviços",   valor: 81.90, descricao: "Paga ICMS + ISS" },
];

/* ─── Funções de formatação ───────────────────────────────────────────────── */

export function fmtValor(v) {
    if (v == null) return "—";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(v));
}

export function mascaraMoeda(valor) {
    const nums = String(valor).replace(/\D/g, "");
    if (!nums) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(parseFloat(nums) / 100);
}

export function parseMoeda(valor) {
    if (!valor) return null;
    const num = parseFloat(String(valor).replace(/\./g, "").replace(",", "."));
    return isNaN(num) ? null : num;
}

export function formatarMoedaParaInput(valor) {
    if (valor == null) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(valor));
}

export function mascaraCnpj(valor) {
    if (!valor) return "";
    const d = String(valor).replace(/\D/g, "").slice(0, 14);
    let r = d;
    if (d.length > 2)  r = d.slice(0, 2) + "." + d.slice(2);
    if (d.length > 5)  r = r.slice(0, 6) + "." + r.slice(6);
    if (d.length > 8)  r = r.slice(0, 10) + "/" + r.slice(10);
    if (d.length > 12) r = r.slice(0, 15) + "-" + r.slice(15);
    return r;
}

/* ─── Validação CNPJ (algoritmo oficial) ──────────────────────────────────── */

export function cnpjEhValido(cnpj) {
    const d = String(cnpj).replace(/\D/g, "");
    if (d.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(d)) return false; // todos iguais

    const calcular = (digitos, pesos) => {
        let soma = 0;
        for (let i = 0; i < pesos.length; i++) {
            soma += parseInt(digitos[i]) * pesos[i];
        }
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const peso1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const peso2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    if (calcular(d, peso1) !== parseInt(d[12])) return false;
    if (calcular(d, peso2) !== parseInt(d[13])) return false;
    return true;
}
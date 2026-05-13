/* ═════════════════════════════════════════════════════════════════════════════
   Clientes — Helpers compartilhados
   Sprint F1.3 · CRM setorial
   ═════════════════════════════════════════════════════════════════════════════ */

/* ─── Máscaras ────────────────────────────────────────────────────────────── */

export function mascaraTelefone(valor) {
    const nums = (valor || "").replace(/\D/g, "").slice(0, 11);
    if (nums.length === 0) return "";
    if (nums.length <= 2)  return `(${nums}`;
    if (nums.length <= 6)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
}

export function mascaraDocumento(valor, tipoPessoa) {
    const nums = (valor || "").replace(/\D/g, "").slice(0, tipoPessoa === "PJ" ? 14 : 11);

    if (tipoPessoa === "PJ") {
        return nums.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) => {
            let r = a;
            if (b) r += "." + b;
            if (c) r += "." + c;
            if (d) r += "/" + d;
            if (e) r += "-" + e;
            return r;
        });
    }
    return nums.replace(/(\d{3})?(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) => {
        let r = a || "";
        if (b) r += "." + b;
        if (c) r += "." + c;
        if (d) r += "-" + d;
        return r;
    });
}

export function mascaraCep(valor) {
    const nums = (valor || "").replace(/\D/g, "").slice(0, 8);
    if (nums.length <= 5) return nums;
    return `${nums.slice(0, 5)}-${nums.slice(5)}`;
}

export function fmtValor(v) {
    if (v == null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(v));
}

export function iniciais(nome) {
    if (!nome) return "?";
    return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

/* ─── Constantes ──────────────────────────────────────────────────────────── */

export const TIPOS_PESSOA = [
    { value: "PF", label: "Pessoa Física" },
    { value: "PJ", label: "Pessoa Jurídica" },
];

export const SCORE_INFO = {
    BOM:          { label: "Bom pagador", variant: "success" },
    ATENCAO:      { label: "Atenção",     variant: "warning" },
    INADIMPLENTE: { label: "Inadimplente", variant: "error"  },
};

export const ESTADOS_BR = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export const ORIGENS_LEAD = [
    "Indicação", "Google", "Instagram", "Facebook", "WhatsApp",
    "Site", "Feira/Evento", "Cold call", "LinkedIn", "Outro",
];

/**
 * Estado inicial vazio — Sprint F1.3: todos os campos da aba Geral
 */
export const CLIENTE_VAZIO = {
    nome:             "",
    documento:        "",
    tipoPessoa:       "PF",
    dataNascimento:   "",
    email:            "",
    telefone:         "",
    whatsapp:         "",
    telefone2:        "",
    endereco:         "",
    cidade:           "",
    estado:           "",
    cep:              "",
    origemLead:       "",
    responsavel:      "",
    tags:             "",
    categoria:        "",
    notas:            "",
    setorId:          "",
};
/* ═════════════════════════════════════════════════════════════════════════════
   Clientes — Helpers compartilhados
   Sprint A3.6.4 · Refatoração

   Funções utilitárias e constantes da página de Clientes.
   ═════════════════════════════════════════════════════════════════════════════ */

/* ─── Máscaras ────────────────────────────────────────────────────────────── */

/**
 * Aplica máscara de telefone brasileiro
 * Ex: "11987654321" → "(11) 98765-4321"
 *     "1133334444"  → "(11) 3333-4444"
 */
export function mascaraTelefone(valor) {
    const nums = (valor || "").replace(/\D/g, "").slice(0, 11);
    if (nums.length === 0) return "";
    if (nums.length <= 2)  return `(${nums}`;
    if (nums.length <= 6)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`;
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`;
}

/**
 * Aplica máscara de CPF (11 dígitos) ou CNPJ (14 dígitos)
 * Ex CPF:  "12345678900"      → "123.456.789-00"
 * Ex CNPJ: "12345678000190"   → "12.345.678/0001-90"
 */
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

/**
 * Formata valor decimal como moeda brasileira (R$)
 */
export function fmtValor(v) {
    if (v == null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(v));
}

/**
 * Pega iniciais do nome (max 2 letras)
 */
export function iniciais(nome) {
    if (!nome) return "?";
    return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

/* ─── Constantes ──────────────────────────────────────────────────────────── */

/**
 * Tipos de pessoa (PF ou PJ)
 */
export const TIPOS_PESSOA = [
    { value: "PF", label: "Pessoa Física" },
    { value: "PJ", label: "Pessoa Jurídica" },
];

/**
 * Score do cliente (vindo do backend)
 * Mapeia para variants do kit visual (success/warning/error)
 */
export const SCORE_INFO = {
    BOM:          { label: "Bom pagador", variant: "success" },
    ATENCAO:      { label: "Atenção",     variant: "warning" },
    INADIMPLENTE: { label: "Inadimplente", variant: "error"  },
};

/**
 * Estado inicial vazio (formulário de cadastro)
 */
export const CLIENTE_VAZIO = {
    nome:       "",
    documento:  "",
    tipoPessoa: "PF",
    email:      "",
    telefone:   "",
    categoria:  "",
    notas:      "",
};
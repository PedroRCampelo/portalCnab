/* ═════════════════════════════════════════════════════════════════════════════
   Recebimentos — Helpers compartilhados
   Sprint A3.6 · Refatoração

   Funções utilitárias e constantes usadas pelos sub-componentes.
   ═════════════════════════════════════════════════════════════════════════════ */

/* ─── Funções de formatação ───────────────────────────────────────────────── */

/**
 * Retorna data ISO de hoje (yyyy-MM-dd)
 */
export function hoje() {
    return new Date().toISOString().split("T")[0];
}

/**
 * Formata data ISO (yyyy-MM-dd) para BR (dd/MM/yyyy)
 */
export function fmtData(d) {
    if (!d) return "—";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
}

/**
 * Formata número como moeda brasileira (R$ X.XXX,XX)
 */
export function fmtValor(v) {
    if (v == null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(v));
}

/**
 * Calcula dias entre hoje e a data alvo
 * Retorna número (negativo = atrasado, 0 = hoje, positivo = futuro)
 * Retorna null se data inválida
 */
export function diasAteVencer(data) {
    if (!data) return null;
    const alvo  = new Date(data + "T00:00:00");
    const hoje0 = new Date(); hoje0.setHours(0, 0, 0, 0);
    return Math.round((alvo - hoje0) / (1000 * 60 * 60 * 24));
}

/**
 * Texto contextual de vencimento ("hoje", "amanhã", "(2d atraso)")
 * Retorna { texto, variant } onde variant é "error" | "warning" | "muted"
 */
export function vencimentoContexto(dataVencimento, status) {
    const ehFinalizado = status === "RECEBIDO" || status === "CANCELADO";
    if (ehFinalizado) return null;

    const dias = diasAteVencer(dataVencimento);
    if (dias == null) return null;

    if (dias < 0)  return { texto: `${Math.abs(dias)}d atraso`, variant: "error" };
    if (dias === 0) return { texto: "hoje",                       variant: "error" };
    if (dias === 1) return { texto: "amanhã",                     variant: "warning" };
    if (dias <= 3)  return { texto: `em ${dias}d`,                variant: "warning" };
    return { texto: `em ${dias}d`, variant: "muted" };
}

/**
 * Aplica máscara de moeda em input
 */
export function mascaraMoeda(valor) {
    const nums = String(valor).replace(/\D/g, "");
    if (!nums) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(parseFloat(nums) / 100);
}

/**
 * Converte valor mascarado pra número
 */
export function parseMoeda(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;
    return parseFloat(String(valor).replace(/\./g, "").replace(",", ".")) || 0;
}

/**
 * Formata número decimal pra string com vírgula (sem R$)
 */
export function formatarMoedaParaInput(valor) {
    if (valor == null) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(valor));
}

/* ─── Constantes ──────────────────────────────────────────────────────────── */

/**
 * Mapa de status do recebimento
 * Variantes mapeiam pras cores do kit (var(--success), var(--error), etc)
 */
export const STATUS_INFO = {
    PENDENTE:  { label: "A receber", variant: "warning"  },
    PARCIAL:   { label: "Parcial",   variant: "default"  },
    RECEBIDO:  { label: "Recebido",  variant: "success"  },
    ATRASADO:  { label: "Atrasado",  variant: "error"    },
    CANCELADO: { label: "Cancelado", variant: "neutral"  },
};

/**
 * Filtros rápidos por status (para os pills no topo da listagem)
 */
export const FILTROS_STATUS = [
    { value: "",          label: "Todos"     },
    { value: "PENDENTE",  label: "A receber" },
    { value: "ATRASADO",  label: "Atrasados" },
    { value: "PARCIAL",   label: "Parciais"  },
    { value: "RECEBIDO",  label: "Recebidos" },
];

/**
 * Formas de pagamento aceitas
 */
export const FORMAS_PAGAMENTO = [
    { value: "PIX",            label: "Pix" },
    { value: "BOLETO",         label: "Boleto" },
    { value: "DINHEIRO",       label: "Dinheiro" },
    { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
    { value: "CARTAO_DEBITO",  label: "Cartão de débito" },
    { value: "TRANSFERENCIA",  label: "Transferência" },
    { value: "OUTROS",         label: "Outros" },
];

/**
 * Estado inicial vazio de um recebimento (modal de cadastro)
 */
export const RECEBIMENTO_VAZIO = {
    clienteId:       "",
    descricao:       "",
    categoria:       "",
    categoriaId:     "",
    dataVencimento:  "",
    valor:           "",
    formaPagamento:  "PIX",
    parcelaAtual:    1,
    parcelaTotal:    1,
    recorrente:      false,
    recorrenciaTipo: "",
    observacao:      "",
};

/**
 * Estado inicial vazio de um parcelado
 */
export const PARCELADO_VAZIO = {
    clienteId:              "",
    descricao:              "",
    categoria:              "",
    dataVencimentoPrimeira: "",
    valorTotal:             "",
    qtdParcelas:            2,
    formaPagamento:         "PIX",
    intervaloDias:          30,
    observacao:             "",
};
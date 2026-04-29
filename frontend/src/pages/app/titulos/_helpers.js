/* ═════════════════════════════════════════════════════════════════════════════
   Títulos a Pagar — Helpers compartilhados
   Sprint A3.6.5 · Refatoração

   Funções utilitárias e constantes da página de Títulos.
   ═════════════════════════════════════════════════════════════════════════════ */

/* ─── Funções de formatação ───────────────────────────────────────────────── */

export function hoje() {
    return new Date().toISOString().split("T")[0];
}

export function fmtData(d) {
    if (!d) return "—";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
}

export function fmtValor(v) {
    if (v == null) return "—";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(v));
}

export function diasAteVencer(data) {
    if (!data) return null;
    const alvo  = new Date(data + "T00:00:00");
    const hoje0 = new Date(); hoje0.setHours(0, 0, 0, 0);
    return Math.round((alvo - hoje0) / (1000 * 60 * 60 * 24));
}

/**
 * Texto contextual de vencimento ("hoje", "amanhã", "(2d atraso)")
 */
export function vencimentoContexto(dataVencimento, status) {
    if (status === "PAGO") return null;

    const dias = diasAteVencer(dataVencimento);
    if (dias == null) return null;

    if (dias < 0)   return { texto: `${Math.abs(dias)}d atraso`, variant: "error" };
    if (dias === 0) return { texto: "hoje",                       variant: "error" };
    if (dias === 1) return { texto: "amanhã",                     variant: "warning" };
    if (dias <= 3)  return { texto: `em ${dias}d`,                variant: "warning" };
    return { texto: `em ${dias}d`, variant: "muted" };
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
    if (valor === null || valor === undefined || valor === "") return 0;
    return parseFloat(String(valor).replace(/\./g, "").replace(",", ".")) || 0;
}

export function formatarMoedaParaInput(valor) {
    if (valor == null) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(valor));
}

/**
 * Aplica máscara de CPF (11 dígitos) ou CNPJ (14 dígitos)
 */
export function mascaraDoc(valor) {
    const nums = (valor || "").replace(/\D/g, "").slice(0, 14);
    if (nums.length <= 11) {
        return nums.replace(/(\d{3})?(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) => {
            let r = a || "";
            if (b) r += "." + b;
            if (c) r += "." + c;
            if (d) r += "-" + d;
            return r;
        });
    }
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/* ─── Constantes ──────────────────────────────────────────────────────────── */

/**
 * Mapa de status do título
 * Variantes mapeiam pras cores do kit (var(--success), var(--error), etc)
 */
export const STATUS_INFO = {
    PENDENTE: { label: "Pendente", variant: "warning" },
    VENCIDO:  { label: "Vencido",  variant: "error"   },
    PAGO:     { label: "Pago",     variant: "success" },
};

/**
 * Filtros rápidos por status (pills)
 */
export const FILTROS_STATUS = [
    { value: "",         label: "Todos"     },
    { value: "PENDENTE", label: "Pendentes" },
    { value: "VENCIDO",  label: "Vencidos"  },
    { value: "PAGO",     label: "Pagos"     },
];

/**
 * Tipos de pagamento aceitos
 */
export const TIPOS_PAGAMENTO = [
    { value: "BOLETO", label: "Boleto" },
    { value: "PIX",    label: "PIX"    },
    { value: "TED",    label: "TED"    },
];

/**
 * Status que podem ser definidos no cadastro/edição
 */
export const STATUS_OPS = [
    { value: "PENDENTE", label: "Pendente" },
    { value: "VENCIDO",  label: "Vencido"  },
    { value: "PAGO",     label: "Pago"     },
];

/**
 * Campos obrigatórios no cadastro de título
 */
export const CAMPOS_OBRIGATORIOS = ["numero", "fornecedorNome", "vencimento", "valor"];

/**
 * Estado inicial vazio (com todos os campos CNAB)
 */
export const TITULO_VAZIO = {
    // Identificação
    prefixo: "AP",
    numero: "",
    parcela: "001",
    tipo: "BOLETO",
    tipoGastoId: "",

    // Fornecedor
    fornecedorNome: "",
    fornecedorDocumento: "",

    // Datas
    emissao: hoje(),
    vencimento: "",

    // Valores
    valor: "",
    desconto: "",
    juros: "",
    multa: "",

    // Outros
    observacao: "",
    status: "PENDENTE",

    // CNAB — Boleto (Segmento J)
    codigoBarras: "",
    linhaDigitavel: "",

    // CNAB — TED/DOC/Crédito em conta (Segmento A)
    favorecidoBancoCode: "",
    favorecidoAgencia: "",
    favorecidoAgenciaDv: "",
    favorecidoConta: "",
    favorecidoContaDv: "",
    favorecidoTipoConta: "CC",
    favorecidoTipoInscricao: "2",
    finalidadeTed: "",
    finalidadeDoc: "",
    aviso: "0",

    // CNAB — PIX
    tipoChavePix: "",
    chavePix: "",

    // CNAB — Endereço favorecido (Segmento B)
    favorecidoLogradouro: "",
    favorecidoCidade: "",
    favorecidoEstado: "",
    favorecidoCep: "",

    // CNAB — Controle/Referência
    seuNumero: "",
    nossoNumero: "",
};

/**
 * Estado inicial do parcelamento
 */
export const PARCELADO_VAZIO = {
    qtdParcelas: "2",
    intervaloDias: "30",
    vencimento1: hoje(),
    diasCustomizados: "",
};
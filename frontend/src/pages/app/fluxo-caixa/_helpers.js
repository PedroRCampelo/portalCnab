import {
    LuArrowDownLeft, LuArrowUpRight, LuSettings2,
    LuPiggyBank, LuUndo2,
} from "react-icons/lu";

/* ═════════════════════════════════════════════════════════════════════════════
   Fluxo de Caixa — Helpers compartilhados
   Sprint A3.5 · Refatoração da página piloto

   Funções utilitárias usadas pelos sub-componentes (SaudeMesTab,
   ContasBancariasTab, ExtratoTab e modais).
   ═════════════════════════════════════════════════════════════════════════════ */

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
 * Formata data ISO (yyyy-MM-dd) para BR (dd/MM/yyyy)
 */
export function fmtData(d) {
    if (!d) return "—";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
}

/**
 * Formata data ISO como "Hoje", "Ontem" ou "Sexta, 26 de abril"
 * Usado nos headers de agrupamento do extrato
 */
export function fmtDataExtenso(d) {
    if (!d) return "";
    const data = new Date(d + "T00:00:00");
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);

    if (data.getTime() === hoje.getTime()) {
        return "Hoje · " + data.toLocaleDateString("pt-BR", {
            weekday: "long", day: "2-digit", month: "long",
        });
    }
    if (data.getTime() === ontem.getTime()) {
        return "Ontem · " + data.toLocaleDateString("pt-BR", {
            weekday: "long", day: "2-digit", month: "long",
        });
    }

    return data.toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
}

/**
 * Aplica máscara de moeda em input enquanto digita
 * Ex: "1234567" → "12.345,67"
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
 * Ex: "12.345,67" → 12345.67
 */
export function parseMoeda(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;
    return parseFloat(String(valor).replace(/\./g, "").replace(",", ".")) || 0;
}

/**
 * Formata número decimal pra string com vírgula (sem R$)
 * Ex: 1234.5 → "1.234,50"
 */
export function formatarMoedaParaInput(valor) {
    if (valor == null) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(valor));
}

/* ─── Constantes da página ────────────────────────────────────────────────── */

/**
 * Mapa visual das situações de saúde do mês (vindo do backend)
 * Mapeia situação → variant do badge/banner + emoji
 */
export const SITUACAO_INFO = {
    POSITIVO: { variant: "success", emoji: "🎉" },
    NEUTRO:   { variant: "default", emoji: "👍" },
    ATENCAO:  { variant: "warning", emoji: "⚠️" },
    NEGATIVO: { variant: "error",   emoji: "🚨" },
};

/**
 * Mapa visual de tipos de movimento bancário
 * Usado no ExtratoTab pra colorir/ícone das movimentações
 *
 * Variantes (mapeiam pra cores do kit):
 *   success → verde, error → vermelho, warning → âmbar
 *   default → cyan, neutral → cinza
 */
export const TIPO_MOVIMENTO_INFO = {
    RECEBIMENTO: {
        label:    "Recebimento",
        variant:  "success",
        ehEntrada: true,
        icon:     LuArrowDownLeft,
    },
    PAGAMENTO: {
        label:    "Pagamento",
        variant:  "error",
        ehEntrada: false,
        icon:     LuArrowUpRight,
    },
    AJUSTE_MANUAL: {
        label:    "Ajuste manual",
        variant:  "default",
        ehEntrada: null,
        icon:     LuSettings2,
    },
    SALDO_INICIAL: {
        label:    "Saldo inicial",
        variant:  "neutral",
        ehEntrada: true,
        icon:     LuPiggyBank,
    },
    ESTORNO_RECEBIMENTO: {
        label:    "Estorno recebimento",
        variant:  "warning",
        ehEntrada: false,
        icon:     LuUndo2,
    },
    ESTORNO_PAGAMENTO: {
        label:    "Estorno pagamento",
        variant:  "warning",
        ehEntrada: true,
        icon:     LuUndo2,
    },
};

/**
 * Períodos rápidos pré-definidos no filtro de extrato
 */
export const PERIODOS_RAPIDOS = [
    { key: "30d",  label: "30 dias",  dias: 30  },
    { key: "60d",  label: "60 dias",  dias: 60  },
    { key: "90d",  label: "90 dias",  dias: 90  },
    { key: "ano",  label: "Este ano", dias: null }, // calculado dinâmico
    { key: "tudo", label: "Tudo",     dias: -1  },
];

/**
 * Calcula data início/fim a partir de um período rápido
 * Retorna { inicio: "yyyy-MM-dd", fim: "yyyy-MM-dd" }
 */
export function calcularPeriodoRapido(key) {
    const hojeStr = new Date().toISOString().split("T")[0];
    if (key === "tudo") return { inicio: "", fim: "" };
    if (key === "ano") {
        const ano = new Date().getFullYear();
        return { inicio: `${ano}-01-01`, fim: hojeStr };
    }
    const opt = PERIODOS_RAPIDOS.find(p => p.key === key);
    if (!opt || !opt.dias) return { inicio: "", fim: hojeStr };
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - opt.dias);
    return { inicio: inicio.toISOString().split("T")[0], fim: hojeStr };
}

/**
 * Estado inicial vazio de uma conta bancária (modal de cadastro)
 */
export const CONTA_VAZIA = {
    nomeConta:    "",
    banco:        "",
    saldoInicial: "",
    principal:    false,
};
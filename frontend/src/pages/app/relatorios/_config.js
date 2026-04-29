/* ═════════════════════════════════════════════════════════════════════════════
   Central de Relatórios — Catálogo
   Sprint A3.6.8.1 · Fonte única de verdade dos relatórios disponíveis

   Adicione aqui novos relatórios conforme forem implementados.
   Status:
     - "ativo"     → tela funcional, botão habilitado
     - "em-breve"  → card cinza com badge "Em breve", botão desabilitado
   ═════════════════════════════════════════════════════════════════════════════ */

import {
    LuClock, LuTags, LuBuilding2, LuTrendingDown,
    LuUsers, LuTrendingUp, LuHistory,
    LuChartLine, LuLandmark, LuWallet,
    LuFileChartColumn,
} from "react-icons/lu";

/**
 * GRUPOS de relatórios — usado pra agrupamento visual no índice
 */
export const GRUPOS = [
    {
        key: "pagar",
        label: "A pagar",
        descricao: "Análises dos seus títulos a pagar",
    },
    {
        key: "receber",
        label: "A receber",
        descricao: "Análises dos seus recebimentos",
    },
    {
        key: "fluxo-banco",
        label: "Fluxo e banco",
        descricao: "Movimentações financeiras e saldos",
    },
    {
        key: "consolidado",
        label: "Consolidado",
        descricao: "Visões integradas do negócio",
    },
];

/**
 * RELATÓRIOS — lista completa com metadata
 *
 * Campos:
 *  key       — slug único pra URL e key React
 *  grupo     — referência ao GRUPOS.key
 *  titulo    — nome curto exibido no card
 *  descricao — 1 frase explicando o que faz
 *  icon      — componente Lucide
 *  status    — "ativo" | "em-breve"
 *  rota      — rota para navegar quando clicar (apenas se ativo)
 */
export const RELATORIOS = [
    // ── A pagar ──────────────────────────────────────────────────────────
    {
        key: "aging-pagar",
        grupo: "pagar",
        titulo: "Aging de pagar",
        descricao: "Títulos atrasados, a vencer e fluxo dos próximos 12 meses",
        icon: LuClock,
        status: "ativo",
        rota: "/relatorios/aging-pagar",
    },
    {
        key: "por-tipo-gasto",
        grupo: "pagar",
        titulo: "Por tipo de gasto",
        descricao: "Distribuição dos gastos entre as categorias cadastradas",
        icon: LuTags,
        status: "ativo",
        rota: "/relatorios/por-tipo-gasto",
    },
    {
        key: "por-fornecedor",
        grupo: "pagar",
        titulo: "Por fornecedor",
        descricao: "Top fornecedores por valor pago e em aberto",
        icon: LuBuilding2,
        status: "ativo",
        rota: "/relatorios/por-fornecedor",
    },

    // ── A receber ────────────────────────────────────────────────────────
    {
        key: "aging-receber",
        grupo: "receber",
        titulo: "Aging de receber",
        descricao: "Recebimentos atrasados, a vencer e previsão de entrada",
        icon: LuTrendingDown,
        status: "em-breve",
    },
    {
        key: "por-cliente",
        grupo: "receber",
        titulo: "Por cliente",
        descricao: "Top clientes por valor recebido e em aberto",
        icon: LuUsers,
        status: "em-breve",
    },
    {
        key: "historico-pagamentos",
        grupo: "receber",
        titulo: "Histórico de pagamentos",
        descricao: "Linha do tempo de todos os pagamentos recebidos",
        icon: LuHistory,
        status: "em-breve",
    },

    // ── Fluxo e banco ────────────────────────────────────────────────────
    {
        key: "fluxo-caixa",
        grupo: "fluxo-banco",
        titulo: "Fluxo de caixa",
        descricao: "Entradas, saídas e saldo projetado por período",
        icon: LuChartLine,
        status: "em-breve",
    },
    {
        key: "movimentos-bancarios",
        grupo: "fluxo-banco",
        titulo: "Movimentos bancários",
        descricao: "Extrato consolidado das suas contas com filtros",
        icon: LuLandmark,
        status: "em-breve",
    },
    {
        key: "saldo-por-conta",
        grupo: "fluxo-banco",
        titulo: "Saldo por conta",
        descricao: "Posição atual em cada conta bancária cadastrada",
        icon: LuWallet,
        status: "em-breve",
    },

    // ── Consolidado ──────────────────────────────────────────────────────
    {
        key: "dre-mensal",
        grupo: "consolidado",
        titulo: "DRE mensal",
        descricao: "Demonstrativo de resultados (receitas - despesas) por mês",
        icon: LuFileChartColumn,
        status: "em-breve",
    },
];

/**
 * Retorna apenas os relatórios de um grupo específico
 */
export function relatoriosDoGrupo(grupoKey) {
    return RELATORIOS.filter(r => r.grupo === grupoKey);
}

/**
 * Conta relatórios ativos (pra mostrar contador no header)
 */
export function totalAtivos() {
    return RELATORIOS.filter(r => r.status === "ativo").length;
}

/**
 * Conta relatórios em breve
 */
export function totalEmBreve() {
    return RELATORIOS.filter(r => r.status === "em-breve").length;
}
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
    LuFileChartColumn, LuChartBar, LuShoppingCart,
    LuCalendarClock,
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
    {
        key: "comercial",
        label: "Comercial",
        descricao: "Orçamentos, pedidos de venda e pipeline comercial",
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
        status: "ativo",
        rota: "/relatorios/aging-receber",
    },
    {
        key: "por-cliente",
        grupo: "receber",
        titulo: "Por cliente",
        descricao: "Top clientes por valor recebido e em aberto",
        icon: LuUsers,
        status: "ativo",
        rota: "/relatorios/por-cliente",
    },
    {
        key: "historico-pagamentos",
        grupo: "receber",
        titulo: "Histórico de pagamentos",
        descricao: "Linha do tempo de todos os pagamentos recebidos",
        icon: LuHistory,
        status: "ativo",
        rota: "/relatorios/historico-pagamentos",
    },

    // ── Fluxo e banco ────────────────────────────────────────────────────
    {
        key: "fluxo-caixa",
        grupo: "fluxo-banco",
        titulo: "Fluxo de caixa",
        descricao: "Entradas, saídas e saldo projetado por período",
        icon: LuChartLine,
        status: "ativo",
        rota: "/relatorios/fluxo-caixa",
    },
    {
        key: "movimentos-bancarios",
        grupo: "fluxo-banco",
        titulo: "Movimentos bancários",
        descricao: "Extrato consolidado das suas contas com filtros",
        icon: LuLandmark,
        status: "ativo",
        rota: "/relatorios/movimentos-bancarios",
    },
    {
        key: "saldo-por-conta",
        grupo: "fluxo-banco",
        titulo: "Saldo por conta",
        descricao: "Posição atual em cada conta bancária cadastrada",
        icon: LuWallet,
        status: "ativo",
        rota: "/relatorios/saldo-por-conta",
    },

    // ── Consolidado ──────────────────────────────────────────────────────
    {
        key: "dre-mensal",
        grupo: "consolidado",
        titulo: "DRE mensal",
        descricao: "Demonstrativo de resultados (receitas - despesas) por mês",
        icon: LuFileChartColumn,
        status: "ativo",
        rota: "/relatorios/dre-mensal",
    },

    // ── Comercial ────────────────────────────────────────────────────────
    {
        key: "faturamento-periodo",
        grupo: "comercial",
        titulo: "Faturamento por período",
        descricao: "Evolução mensal do faturamento baseado em pedidos efetivados",
        icon: LuTrendingUp,
        status: "ativo",
        rota: "/relatorios/faturamento-periodo",
    },
    {
        key: "vendas-por-cliente",
        grupo: "comercial",
        titulo: "Vendas por cliente",
        descricao: "Ranking de clientes por volume e valor de pedidos de venda",
        icon: LuUsers,
        status: "ativo",
        rota: "/relatorios/vendas-por-cliente-comercial",
    },
    {
        key: "pedidos-em-aberto",
        grupo: "comercial",
        titulo: "Pedidos em aberto",
        descricao: "Todos os pedidos aguardando efetivação com alerta de vencimento",
        icon: LuShoppingCart,
        status: "ativo",
        rota: "/relatorios/pedidos-em-aberto",
    },
    {
        key: "funil-comercial",
        grupo: "comercial",
        titulo: "Funil comercial",
        descricao: "Pipeline do orçamento ao pedido efetivado com taxa de conversão",
        icon: LuChartBar,
        status: "ativo",
        rota: "/relatorios/funil-comercial",
    },
    {
        key: "previsao-faturamento",
        grupo: "comercial",
        titulo: "Previsão de faturamento",
        descricao: "Projeção de receita nos próximos 6 meses com base em pedidos abertos",
        icon: LuCalendarClock,
        status: "ativo",
        rota: "/relatorios/previsao-faturamento",
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
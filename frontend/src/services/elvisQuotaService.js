import api from "./api.js";

/**
 * Service helper pro endpoint de quota do Elvis
 * Sprint A3.9 · Frontend
 *
 * Endpoint: GET /api/elvis/uso-mensal
 *
 * Retorna o status de uso do mês corrente:
 *   {
 *     ilimitado: false,           // true se Whallet+/Admin
 *     usadas: 3,                  // perguntas já feitas no mês
 *     limite: 5,                  // limite mensal (null se ilimitado)
 *     restantes: 2,               // limite - usadas (null se ilimitado)
 *     anoMes: "2026-04",          // mês de referência
 *     podePerguntar: true         // ainda pode fazer +1 pergunta?
 *   }
 *
 * Uso típico:
 *   const status = await getElvisQuota();
 *   if (status.podePerguntar) { ... }
 */
export async function getElvisQuota() {
    const { data } = await api.get("/api/elvis/uso-mensal");
    return data;
}

/**
 * Helper para detectar se um erro do axios é HTTP 429 (quota excedida).
 * O backend retorna 429 com payload:
 *   { codigo: "ELVIS_QUOTA_EXCEDIDA", mensagem, usadas, limite, anoMes, upgradePara }
 *
 * Uso:
 *   try {
 *     await api.post("/api/cnab/chat", ...);
 *   } catch (err) {
 *     if (isQuotaExcedidaError(err)) {
 *       // Mostrar UI de upgrade
 *     }
 *   }
 */
export function isQuotaExcedidaError(err) {
    return err?.response?.status === 429
        && err?.response?.data?.codigo === "ELVIS_QUOTA_EXCEDIDA";
}

/**
 * Extrai informações do erro de quota excedida.
 * Retorna { usadas, limite, anoMes, mensagem } ou null se não for 429.
 */
export function getQuotaErrorInfo(err) {
    if (!isQuotaExcedidaError(err)) return null;
    const data = err.response.data;
    return {
        usadas:   data.usadas,
        limite:   data.limite,
        anoMes:   data.anoMes,
        mensagem: data.mensagem,
    };
}
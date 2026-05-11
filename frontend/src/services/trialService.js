import api from "./api.js";

/**
 * Service helper pro Trial 7 dias
 *
 * Endpoints:
 *   POST /api/trial/ativar   → ativa trial
 *   GET  /api/trial/status   → consulta status
 *
 * Uso:
 *   const status = await getTrialStatus();
 *   if (!status.jaUsou) { // mostra botão "Experimentar grátis" }
 *
 *   await ativarTrial();
 *   // recarrega auth context pra refletir novo plano
 */

export async function getTrialStatus() {
    const { data } = await api.get("/api/trial/status");
    return data;
}

export async function ativarTrial() {
    const { data } = await api.post("/api/trial/ativar");
    return data;
}
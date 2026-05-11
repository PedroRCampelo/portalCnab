/* ═════════════════════════════════════════════════════════════════════════════
   Relatórios — Helpers compartilhados
   Sprint A3.6.8.2 · Refatoração

   Funções de formatação e componentes visuais usados em múltiplos relatórios.
   ═════════════════════════════════════════════════════════════════════════════ */

/* ─── Formatação ──────────────────────────────────────────────────────────── */

export function fmtValor(v) {
    if (v == null || v === "") return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(v));
}

export function fmtValorCompacto(v) {
    if (v == null) return "R$ 0";
    const n = Number(v);
    if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000)     return `R$ ${(n / 1_000).toFixed(1)}k`;
    return fmtValor(n);
}

/**
 * Converte "2026-04" pra "Abr/26"
 */
export function fmtMes(anoMes) {
    if (!anoMes) return "";
    const [ano, mes] = anoMes.split("-");
    const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${nomes[parseInt(mes) - 1]}/${ano.slice(2)}`;
}

/* ─── Componente: BarraHorizontal ─────────────────────────────────────────── */

/**
 * Barra de progresso horizontal pra visualizações de relatório.
 *
 * Props:
 *  valor   — número do valor atual
 *  max     — número do valor máximo (pra calcular %)
 *  variant — "default" (cyan), "warning" (âmbar), "error" (vermelho), "success" (verde)
 */
export function BarraHorizontal({ valor, max, variant = "default" }) {
    const pct = max > 0 ? Math.max(2, (valor / max) * 100) : 0;

    const corPorVariant = {
        default: "var(--cyan)",
        warning: "var(--warning)",
        error:   "var(--error)",
        success: "var(--success)",
    };

    return (
        <div className="rh-track">
            <div
                className="rh-fill"
                style={{
                    width: `${pct}%`,
                    background: corPorVariant[variant] || corPorVariant.default,
                }}
            />
            <style>{`
                .rh-track {
                    height: 6px;
                    background: var(--bg);
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid var(--hair);
                }
                .rh-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.4s ease;
                }
            `}</style>
        </div>
    );
}

/* ─── Cores por faixa de aging ────────────────────────────────────────────── */

export const AGING_FAIXAS = [
    { key: "0-30",  label: "Até 30 dias",       variant: "warning" },
    { key: "31-60", label: "31 a 60 dias",      variant: "warning" },
    { key: "61-90", label: "61 a 90 dias",      variant: "error"   },
    { key: "+90",   label: "Mais de 90 dias",   variant: "error"   },
];

/* ─── Hook: exportação de relatório ───────────────────────────────────────── */

import { useState } from "react";
import api from "../../../services/api.js";

/**
 * Hook genérico de exportação Excel/PDF
 * Uso:
 *   const { exportar, exportando } = useExportacao("/api/titulos/exportar", "titulos");
 *   <button onClick={() => exportar("excel")}>Exportar Excel</button>
 */
export function useExportacao(endpointBase, prefixoArquivo) {
    const [exportando, setExportando] = useState(null);

    async function exportar(tipo) {
        setExportando(tipo);
        try {
            const response = await api.get(`${endpointBase}/${tipo}`, { responseType: "blob" });

            const contentType = response.headers["content-type"] || "";
            const ehPdf = tipo === "pdf";
            const expectedType = ehPdf
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            if (!contentType.includes(expectedType)) {
                console.error(`Content-Type inesperado ao exportar ${tipo}:`, contentType);
                alert(`A resposta recebida não é um arquivo ${tipo.toUpperCase()} válido.`);
                return;
            }

            const blob = new Blob([response.data], { type: expectedType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${prefixoArquivo}_${new Date().toISOString().slice(0, 10)}.${ehPdf ? "pdf" : "xlsx"}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Erro ao exportar ${tipo}:`, err);
            let mensagem = "Tente novamente.";
            if (err.response?.data) {
                try {
                    const texto = await err.response.data.text();
                    mensagem = texto || mensagem;
                } catch { /* ignora */ }
            }
            alert(`Erro ao gerar ${tipo.toUpperCase()}. ${mensagem}`);
        } finally {
            setExportando(null);
        }
    }

    return { exportar, exportando };
}

/* ─── Hook: dados unificados do relatório de títulos ──────────────────────── */

import { useEffect } from "react";

/**
 * Hook que busca o endpoint unificado /api/titulos/relatorio
 * Retorna fluxoCaixa, porCategoria, fornecedores, aging
 *
 * Cache simples por sessão pra não refazer request entre telas
 */
let _cacheRelatorio = null;
let _cachePromise = null;

export function useRelatorioTitulos() {
    const [dados, setDados] = useState(_cacheRelatorio);
    const [carregando, setCarregando] = useState(_cacheRelatorio === null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (_cacheRelatorio) {
            setDados(_cacheRelatorio);
            setCarregando(false);
            return;
        }

        if (_cachePromise) {
            // Já tem outra chamada em voo — aguarda ela
            _cachePromise
                .then(d => { setDados(d); setCarregando(false); })
                .catch(e => { setErro(e); setCarregando(false); });
            return;
        }

        _cachePromise = api.get("/api/titulos/relatorio")
            .then(({ data }) => {
                _cacheRelatorio = data;
                _cachePromise = null;
                return data;
            });

        _cachePromise
            .then(d => { setDados(d); setCarregando(false); })
            .catch(e => {
                setErro(e?.response?.data?.mensagem ?? "Erro ao carregar relatório");
                _cachePromise = null;
                setCarregando(false);
            });
    }, []);

    function recarregar() {
        _cacheRelatorio = null;
        _cachePromise = null;
        setCarregando(true);
        api.get("/api/titulos/relatorio")
            .then(({ data }) => {
                _cacheRelatorio = data;
                setDados(data);
            })
            .catch(e => setErro(e?.response?.data?.mensagem ?? "Erro ao recarregar"))
            .finally(() => setCarregando(false));
    }

    return { dados, carregando, erro, recarregar };
}

/* ─── Hook: dados unificados do relatório de recebimentos ────────────────── */

let _cacheRelReceb = null;
let _cachePromiseReceb = null;

export function useRelatorioRecebimentos() {
    const [dados, setDados] = useState(_cacheRelReceb);
    const [carregando, setCarregando] = useState(_cacheRelReceb === null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (_cacheRelReceb) {
            setDados(_cacheRelReceb);
            setCarregando(false);
            return;
        }

        if (_cachePromiseReceb) {
            _cachePromiseReceb
                .then(d => { setDados(d); setCarregando(false); })
                .catch(e => { setErro(e); setCarregando(false); });
            return;
        }

        _cachePromiseReceb = api.get("/api/recebimentos/relatorio")
            .then(({ data }) => {
                _cacheRelReceb = data;
                _cachePromiseReceb = null;
                return data;
            });

        _cachePromiseReceb
            .then(d => { setDados(d); setCarregando(false); })
            .catch(e => {
                setErro(e?.response?.data?.mensagem ?? "Erro ao carregar relatório");
                _cachePromiseReceb = null;
                setCarregando(false);
            });
    }, []);

    function recarregar() {
        _cacheRelReceb = null;
        _cachePromiseReceb = null;
        setCarregando(true);
        api.get("/api/recebimentos/relatorio")
            .then(({ data }) => {
                _cacheRelReceb = data;
                setDados(data);
            })
            .catch(e => setErro(e?.response?.data?.mensagem ?? "Erro ao recarregar"))
            .finally(() => setCarregando(false));
    }

    return { dados, carregando, erro, recarregar };
}

/* ─── Hook: dados unificados do relatório de fluxo e banco ───────────────── */

let _cacheFluxoBanco = null;
let _cachePromiseFluxo = null;

export function useRelatorioFluxoBanco() {
    const [dados, setDados] = useState(_cacheFluxoBanco);
    const [carregando, setCarregando] = useState(_cacheFluxoBanco === null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (_cacheFluxoBanco) {
            setDados(_cacheFluxoBanco);
            setCarregando(false);
            return;
        }

        if (_cachePromiseFluxo) {
            _cachePromiseFluxo
                .then(d => { setDados(d); setCarregando(false); })
                .catch(e => { setErro(e); setCarregando(false); });
            return;
        }

        _cachePromiseFluxo = api.get("/api/fluxo-caixa/relatorio")
            .then(({ data }) => {
                _cacheFluxoBanco = data;
                _cachePromiseFluxo = null;
                return data;
            });

        _cachePromiseFluxo
            .then(d => { setDados(d); setCarregando(false); })
            .catch(e => {
                setErro(e?.response?.data?.mensagem ?? "Erro ao carregar relatório");
                _cachePromiseFluxo = null;
                setCarregando(false);
            });
    }, []);

    function recarregar() {
        _cacheFluxoBanco = null;
        _cachePromiseFluxo = null;
        setCarregando(true);
        api.get("/api/fluxo-caixa/relatorio")
            .then(({ data }) => {
                _cacheFluxoBanco = data;
                setDados(data);
            })
            .catch(e => setErro(e?.response?.data?.mensagem ?? "Erro ao recarregar"))
            .finally(() => setCarregando(false));
    }

    return { dados, carregando, erro, recarregar };
}
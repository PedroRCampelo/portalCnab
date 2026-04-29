import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LuUser, LuX, LuSearch } from "react-icons/lu";
import api from "../../../services/api.js";

/**
 * ClienteAutocomplete — Input de busca/seleção de cliente
 * Sprint A3.6.2 · Refatoração
 *
 * Comportamento:
 *  - Quando vazio: mostra input de busca com debounce 250ms
 *  - Ao focar: abre dropdown com lista de clientes (busca dinâmica)
 *  - Ao selecionar: substitui input por "card" do cliente (com X pra trocar)
 *  - Click fora fecha dropdown
 *  - Empty state mostra link pra cadastrar novo cliente
 *
 * Props:
 *  valor    — id do cliente atual (string) — controlado externamente
 *  onChange — function(id) — chamado quando seleciona/limpa
 *  disabled — bool
 */
export default function ClienteAutocomplete({ valor, onChange, disabled = false }) {
    const [termo, setTermo]               = useState("");
    const [resultados, setResultados]     = useState([]);
    const [aberto, setAberto]             = useState(false);
    const [carregando, setCarregando]     = useState(false);
    const [clienteAtual, setClienteAtual] = useState(null);
    const containerRef = useRef(null);

    // Carrega cliente atual quando o `valor` mudar de fora
    useEffect(() => {
        if (valor && (!clienteAtual || clienteAtual.id !== valor)) {
            api.get(`/api/clientes/${valor}`)
                .then(({ data }) => setClienteAtual(data))
                .catch(() => {});
        }
        if (!valor) setClienteAtual(null);
    }, [valor, clienteAtual]);

    // Busca com debounce
    useEffect(() => {
        if (!aberto) return;
        setCarregando(true);
        const t = setTimeout(async () => {
            try {
                const url = termo.trim()
                    ? `/api/clientes/buscar?termo=${encodeURIComponent(termo.trim())}`
                    : "/api/clientes/buscar";
                const { data } = await api.get(url);
                setResultados(data);
            } finally {
                setCarregando(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [termo, aberto]);

    // Click fora fecha dropdown
    useEffect(() => {
        function handleFora(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setAberto(false);
            }
        }
        document.addEventListener("mousedown", handleFora);
        return () => document.removeEventListener("mousedown", handleFora);
    }, []);

    function selecionar(c) {
        setClienteAtual(c);
        onChange(c.id);
        setAberto(false);
        setTermo("");
    }

    function limpar() {
        setClienteAtual(null);
        onChange("");
        setTermo("");
    }

    return (
        <div ref={containerRef} className="cli-autocomplete">

            {/* ── Estado: cliente já selecionado (card) ── */}
            {clienteAtual ? (
                <div className="cli-selected">
                    <div className="cli-selected-icon">
                        <LuUser size={14}/>
                    </div>
                    <div className="cli-selected-text">
                        <div className="cli-selected-name">{clienteAtual.nome}</div>
                        {clienteAtual.telefoneFormatado && (
                            <div className="cli-selected-phone">{clienteAtual.telefoneFormatado}</div>
                        )}
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            className="cli-selected-clear"
                            onClick={limpar}
                            title="Trocar cliente"
                        >
                            <LuX size={14}/>
                        </button>
                    )}
                </div>
            ) : (
                /* ── Estado: input de busca ── */
                <div className="cli-input-wrap">
                    <LuSearch size={14} className="cli-input-icon"/>
                    <input
                        type="text"
                        className="cli-input"
                        value={termo}
                        onChange={e => { setTermo(e.target.value); setAberto(true); }}
                        onFocus={() => setAberto(true)}
                        placeholder="Buscar cliente..."
                        disabled={disabled}
                    />
                </div>
            )}

            {/* ── Dropdown de resultados ── */}
            {aberto && !clienteAtual && (
                <div className="cli-dropdown">
                    {carregando && (
                        <div className="cli-dropdown-state">Buscando...</div>
                    )}

                    {!carregando && resultados.length === 0 && (
                        <div className="cli-dropdown-state">
                            <div style={{ marginBottom: 8 }}>Nenhum cliente encontrado.</div>
                            <Link to="/clientes" className="cli-dropdown-link">
                                + Cadastrar novo cliente
                            </Link>
                        </div>
                    )}

                    {!carregando && resultados.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            className="cli-dropdown-item"
                            onClick={() => selecionar(c)}
                        >
                            <LuUser size={14} className="cli-dropdown-item-icon"/>
                            <div className="cli-dropdown-item-text">
                                <div className="cli-dropdown-item-name">{c.nome}</div>
                                {c.telefoneFormatado && (
                                    <div className="cli-dropdown-item-phone">{c.telefoneFormatado}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <style>{COMPONENT_CSS}</style>
        </div>
    );
}

const COMPONENT_CSS = `
.cli-autocomplete {
    position: relative;
}

/* ─── Cliente selecionado (card compacto) ────────────────────────────── */

.cli-selected {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--cyan-soft);
    border: 1.5px solid rgba(21, 195, 221, 0.3);
    transition: border-color 0.15s;
}

.cli-selected-icon {
    color: var(--cyan-dark);
    display: inline-flex;
    line-height: 0;
    flex-shrink: 0;
}

.cli-selected-text {
    flex: 1;
    min-width: 0;
}

.cli-selected-name {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--navy-deep);
}

.cli-selected-phone {
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    margin-top: 1px;
}

.cli-selected-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-dim);
    padding: 4px;
    line-height: 0;
    border-radius: 6px;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
}

.cli-selected-clear:hover {
    background: rgba(11, 30, 54, 0.06);
    color: var(--navy-deep);
}

/* ─── Input de busca ─────────────────────────────────────────────────── */

.cli-input-wrap {
    position: relative;
}

.cli-input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    pointer-events: none;
}

.cli-input {
    width: 100%;
    padding: 10px 12px 10px 34px;
    border: 1.5px solid var(--hair);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink-2);
    font-family: var(--ff-sans);
    font-size: 14px;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
}

.cli-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.cli-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
}

/* ─── Dropdown ───────────────────────────────────────────────────────── */

.cli-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 8px;
    max-height: 280px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 12px 32px rgba(11, 30, 54, 0.10);
    overflow: hidden;
}

.cli-dropdown-state {
    padding: 16px;
    text-align: center;
    color: var(--text-dim);
    font-size: 13px;
}

.cli-dropdown-link {
    color: var(--cyan-dark);
    text-decoration: none;
    font-weight: 600;
    font-size: 13px;
}

.cli-dropdown-link:hover {
    text-decoration: underline;
}

.cli-dropdown-item {
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--hair);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.1s;
    font-family: var(--ff-sans);
}

.cli-dropdown-item:last-child {
    border-bottom: none;
}

.cli-dropdown-item:hover {
    background: var(--cyan-soft);
}

.cli-dropdown-item-icon {
    color: var(--text-dim);
    flex-shrink: 0;
}

.cli-dropdown-item:hover .cli-dropdown-item-icon {
    color: var(--cyan-dark);
}

.cli-dropdown-item-text {
    flex: 1;
    min-width: 0;
}

.cli-dropdown-item-name {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--navy-deep);
}

.cli-dropdown-item-phone {
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.04em;
    margin-top: 1px;
}
`;
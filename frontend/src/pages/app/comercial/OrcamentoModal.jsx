import { useState, useEffect, useRef, useCallback } from "react";
import Modal    from "../../../components/ui/Modal.jsx";
import ItemForm from "./ItemForm.jsx";
import api      from "../../../services/api.js";

const ITEM_VAZIO = { descricao: "", quantidade: "1", valorUnitario: "", desconto: "0" };

const FORMAS_PAG = [
    { value: "A_DEFINIR",       label: "A definir"         },
    { value: "PIX",             label: "Pix"               },
    { value: "BOLETO",          label: "Boleto"            },
    { value: "DINHEIRO",        label: "Dinheiro"          },
    { value: "CARTAO_CREDITO",  label: "Cartão de crédito" },
    { value: "CARTAO_DEBITO",   label: "Cartão de débito"  },
    { value: "TRANSFERENCIA",   label: "Transferência"     },
    { value: "CHEQUE",          label: "Cheque"            },
    { value: "OUTROS",          label: "Outros"            },
];

function emTrintaDias() {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
}

function hoje() {
    return new Date().toISOString().slice(0, 10);
}

export default function OrcamentoModal({ inicial, onSalvar, onFechar }) {
    // ── Cliente autocomplete ───────────────────────────────────────────────────
    const [clienteBusca, setClienteBusca]     = useState(inicial?.cliente?.nome ?? "");
    const [clienteId, setClienteId]           = useState(inicial?.cliente?.id ?? "");
    const [sugestoes, setSugestoes]           = useState([]);
    const [buscando, setBuscando]             = useState(false);
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef  = useRef(null);

    // ── Campos principais ─────────────────────────────────────────────────────
    const [descricao,   setDescricao]   = useState(inicial?.descricao ?? "");
    const [observacoes, setObs]         = useState(inicial?.observacoes ?? "");
    const [dataEmissao, setDataEmissao] = useState(inicial?.dataEmissao ?? hoje());
    const [validade,    setValidade]    = useState(inicial?.validade ?? emTrintaDias());
    const [descGeral,   setDescGeral]   = useState(inicial?.descontoGeral ?? "0");

    // ── Pagamento ─────────────────────────────────────────────────────────────
    const [formaPag, setFormaPag]       = useState(inicial?.formaPagamento ?? "A_DEFINIR");
    const [numParcelas, setNumParcelas] = useState(String(inicial?.numParcelas ?? "1"));
    const [intervalo, setIntervalo]     = useState(String(inicial?.intervaloDias ?? "30"));

    // ── Itens ─────────────────────────────────────────────────────────────────
    const [itens, setItens] = useState(
        inicial?.itens?.length
            ? inicial.itens.map(i => ({
                descricao:    i.descricao,
                quantidade:   String(i.quantidade),
                valorUnitario: String(i.valorUnitario),
                desconto:     String(i.desconto ?? 0),
              }))
            : [{ ...ITEM_VAZIO }]
    );

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro]         = useState("");

    // ── Fechar dropdown ao clicar fora ────────────────────────────────────────
    useEffect(() => {
        function handleClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setDropdownAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ── Busca de clientes com debounce ────────────────────────────────────────
    const buscarClientes = useCallback((termo) => {
        clearTimeout(debounceRef.current);
        if (!termo || termo.length < 2) { setSugestoes([]); setDropdownAberto(false); return; }
        debounceRef.current = setTimeout(async () => {
            setBuscando(true);
            try {
                const { data } = await api.get(`/api/clientes/buscar?termo=${encodeURIComponent(termo)}`);
                setSugestoes(data ?? []);
                setDropdownAberto(true);
            } catch {
                setSugestoes([]);
            } finally {
                setBuscando(false);
            }
        }, 300);
    }, []);

    function handleClienteInput(e) {
        const val = e.target.value;
        setClienteBusca(val);
        setClienteId("");
        buscarClientes(val);
    }

    function selecionarCliente(c) {
        setClienteId(c.id);
        setClienteBusca(c.nome);
        setSugestoes([]);
        setDropdownAberto(false);
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        if (!clienteId) { setErro("Selecione um cliente da lista."); return; }

        const itensFiltrados = itens.filter(i => i.descricao.trim());
        if (!itensFiltrados.length) { setErro("Adicione pelo menos um item."); return; }

        setSalvando(true);
        try {
            await onSalvar({
                clienteId,
                descricao: descricao.trim(),
                observacoes: observacoes.trim() || null,
                dataEmissao,
                validade,
                descontoGeral: parseFloat(descGeral) || 0,
                formaPagamento: formaPag,
                numParcelas: parseInt(numParcelas, 10) || 1,
                intervaloDias: parseInt(intervalo, 10) || 30,
                itens: itensFiltrados.map((i, idx) => ({
                    descricao:     i.descricao.trim(),
                    quantidade:    parseFloat(i.quantidade),
                    valorUnitario: parseFloat(i.valorUnitario),
                    desconto:      parseFloat(i.desconto) || 0,
                    ordem: idx,
                })),
            });
        } catch (err) {
            setErro(err?.response?.data?.erro ?? "Erro ao salvar orçamento.");
        } finally {
            setSalvando(false);
        }
    }

    const parcelado = parseInt(numParcelas, 10) > 1;

    return (
        <Modal
            open
            title={inicial ? `Editar orçamento ${inicial.numero}` : "Novo orçamento"}
            onClose={onFechar}
            size="lg"
        >
            <form onSubmit={handleSubmit}>
            <Modal.Body>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>

                    {/* Cliente autocomplete */}
                    <div style={{ gridColumn: "1 / -1", position: "relative" }} ref={wrapperRef}>
                        <label className="form-label">Cliente *</label>
                        <input
                            className="form-input"
                            value={clienteBusca}
                            onChange={handleClienteInput}
                            onFocus={() => sugestoes.length > 0 && setDropdownAberto(true)}
                            placeholder="Digite o nome ou CPF/CNPJ do cliente..."
                            autoComplete="off"
                            required
                        />
                        {buscando && (
                            <span style={{ position: "absolute", right: 10, top: 34, fontSize: 12, color: "var(--text-secondary)" }}>
                                buscando…
                            </span>
                        )}
                        {dropdownAberto && sugestoes.length > 0 && (
                            <ul style={{
                                position: "absolute", zIndex: 999, top: "100%", left: 0, right: 0,
                                background: "var(--surface)", border: "1px solid var(--border)",
                                borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                                listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 200, overflowY: "auto",
                            }}>
                                {sugestoes.map(c => (
                                    <li
                                        key={c.id}
                                        onMouseDown={() => selecionarCliente(c)}
                                        style={{
                                            padding: "8px 12px", cursor: "pointer",
                                            fontSize: 14, lineHeight: 1.4,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}
                                    >
                                        <strong>{c.nome}</strong>
                                        {c.documento && <span style={{ color: "var(--text-secondary)", marginLeft: 8, fontSize: 12 }}>{c.documento}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {dropdownAberto && sugestoes.length === 0 && !buscando && clienteBusca.length >= 2 && (
                            <div style={{
                                position: "absolute", zIndex: 999, top: "100%", left: 0, right: 0,
                                background: "var(--surface)", border: "1px solid var(--border)",
                                borderRadius: 6, padding: "10px 12px", fontSize: 13,
                                color: "var(--text-secondary)",
                            }}>
                                Nenhum cliente encontrado.
                            </div>
                        )}
                    </div>

                    {/* Descrição */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Descrição *</label>
                        <input
                            className="form-input"
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            placeholder="Ex: Consultoria de marketing"
                            required
                        />
                    </div>

                    {/* Emissão + Validade */}
                    <div>
                        <label className="form-label">Data de emissão *</label>
                        <input
                            className="form-input"
                            type="date"
                            value={dataEmissao}
                            onChange={e => setDataEmissao(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">Validade *</label>
                        <input
                            className="form-input"
                            type="date"
                            value={validade}
                            onChange={e => setValidade(e.target.value)}
                            min={hoje()}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">Desconto geral (R$)</label>
                        <input
                            className="form-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={descGeral}
                            onChange={e => setDescGeral(e.target.value)}
                        />
                    </div>

                    {/* Forma de pagamento */}
                    <div>
                        <label className="form-label">Forma de pagamento</label>
                        <select
                            className="form-input"
                            value={formaPag}
                            onChange={e => setFormaPag(e.target.value)}
                        >
                            {FORMAS_PAG.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Parcelas */}
                    <div>
                        <label className="form-label">Parcelas</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1"
                            max="360"
                            value={numParcelas}
                            onChange={e => setNumParcelas(e.target.value)}
                        />
                    </div>

                    {/* Intervalo entre parcelas — só mostra se parcelado */}
                    {parcelado && (
                        <div>
                            <label className="form-label">Intervalo entre parcelas (dias)</label>
                            <input
                                className="form-input"
                                type="number"
                                min="1"
                                value={intervalo}
                                onChange={e => setIntervalo(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Observações */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Observações</label>
                        <textarea
                            className="form-input"
                            rows={2}
                            value={observacoes}
                            onChange={e => setObs(e.target.value)}
                            style={{ resize: "vertical" }}
                        />
                    </div>
                </div>

                <ItemForm itens={itens} onChange={setItens}/>

                {erro && <p style={{ color: "var(--danger, #ef4444)", fontSize: "13px", marginTop: "8px" }}>{erro}</p>}
            </Modal.Body>

            <div className="ui-modal-footer">
                <button type="button" className="ph-btn" onClick={onFechar}>Cancelar</button>
                <button type="submit" className="ph-btn ph-btn--primary" disabled={salvando}>
                    {salvando ? "Salvando..." : inicial ? "Salvar" : "Criar orçamento"}
                </button>
            </div>
            </form>
        </Modal>

    );
}

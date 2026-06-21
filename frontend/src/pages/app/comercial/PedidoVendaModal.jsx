import { useState, useEffect, useRef, useCallback } from "react";
import Modal    from "../../../components/ui/Modal.jsx";
import ItemForm from "./ItemForm.jsx";
import api      from "../../../services/api.js";

const FORMAS_PAG = [
    { value: "PIX",             label: "Pix"               },
    { value: "BOLETO",          label: "Boleto"            },
    { value: "DINHEIRO",        label: "Dinheiro"          },
    { value: "CARTAO_CREDITO",  label: "Cartão de crédito" },
    { value: "CARTAO_DEBITO",   label: "Cartão de débito"  },
    { value: "TRANSFERENCIA",   label: "Transferência"     },
    { value: "OUTROS",          label: "Outros"            },
];

function hoje() {
    return new Date().toISOString().slice(0, 10);
}

function useClienteAutocomplete() {
    const [busca, setBusca]           = useState("");
    const [id, setId]                 = useState("");
    const [sugestoes, setSugestoes]   = useState([]);
    const [buscando, setBuscando]     = useState(false);
    const [aberto, setAberto]         = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef  = useRef(null);

    useEffect(() => {
        function onClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setAberto(false);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    function onInput(e) {
        const val = e.target.value;
        setBusca(val);
        setId("");
        clearTimeout(debounceRef.current);
        if (!val || val.length < 2) { setSugestoes([]); setAberto(false); return; }
        debounceRef.current = setTimeout(async () => {
            setBuscando(true);
            try {
                const { data } = await api.get(`/api/clientes/buscar?termo=${encodeURIComponent(val)}`);
                setSugestoes(data ?? []);
                setAberto(true);
            } catch { setSugestoes([]); }
            finally { setBuscando(false); }
        }, 300);
    }

    function selecionar(c) {
        setId(c.id);
        setBusca(c.nome);
        setSugestoes([]);
        setAberto(false);
    }

    function definir(nome, clienteId) {
        setBusca(nome ?? "");
        setId(clienteId ?? "");
    }

    return { busca, id, sugestoes, buscando, aberto, wrapperRef, onInput, selecionar, definir };
}

export default function PedidoVendaModal({ inicial, onSalvar, onFechar }) {
    // ── Orçamento ─────────────────────────────────────────────────────────────
    const [orcBusca, setOrcBusca]     = useState("");
    const [orcId, setOrcId]           = useState("");
    const [orcamentos, setOrcamentos] = useState([]);
    const [orcAberto, setOrcAberto]   = useState(false);
    const [orcBuscando, setOrcBuscando] = useState(false);
    const orcWrapperRef = useRef(null);
    const orcDebounce   = useRef(null);

    useEffect(() => {
        function onClick(e) {
            if (orcWrapperRef.current && !orcWrapperRef.current.contains(e.target)) setOrcAberto(false);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    function buscarOrcamentos(termo) {
        clearTimeout(orcDebounce.current);
        if (!termo || termo.length < 1) { setOrcamentos([]); setOrcAberto(false); return; }
        orcDebounce.current = setTimeout(async () => {
            setOrcBuscando(true);
            try {
                const { data } = await api.get(`/api/orcamentos?status=APROVADO&tamanho=50`);
                const lista = (data.content ?? []).filter(o =>
                    o.numero.toLowerCase().includes(termo.toLowerCase()) ||
                    (o.descricao ?? "").toLowerCase().includes(termo.toLowerCase()) ||
                    (o.cliente?.nome ?? "").toLowerCase().includes(termo.toLowerCase())
                );
                setOrcamentos(lista);
                setOrcAberto(true);
            } catch { setOrcamentos([]); }
            finally { setOrcBuscando(false); }
        }, 300);
    }

    function selecionarOrcamento(orc) {
        setOrcId(orc.id);
        setOrcBusca(`${orc.numero} — ${orc.cliente?.nome}`);
        setOrcamentos([]);
        setOrcAberto(false);

        // pre-fill
        cliente.definir(orc.cliente?.nome ?? "", orc.cliente?.id ?? "");
        setDescricao(orc.descricao ?? "");
        setFormaPag(orc.formaPagamento && orc.formaPagamento !== "A_DEFINIR" ? orc.formaPagamento : "PIX");
        setNumParcelas(String(orc.numParcelas ?? 1));
        setIntervalo(String(orc.intervaloDias ?? 30));
        if (orc.itens?.length) {
            setItens(orc.itens.map(i => ({
                descricao:     i.descricao,
                quantidade:    String(i.quantidade),
                valorUnitario: String(i.valorUnitario),
                desconto:      String(i.desconto ?? 0),
            })));
        }
    }

    // ── Cliente ───────────────────────────────────────────────────────────────
    const cliente = useClienteAutocomplete();

    // ── Campos ────────────────────────────────────────────────────────────────
    const [descricao, setDescricao]     = useState(inicial?.descricao ?? "");
    const [observacoes, setObs]         = useState(inicial?.observacoes ?? "");
    const [formaPag, setFormaPag]       = useState(inicial?.formaPagamento ?? "PIX");
    const [numParcelas, setNumParcelas] = useState(String(inicial?.numParcelas ?? "1"));
    const [intervalo, setIntervalo]     = useState(String(inicial?.intervaloDias ?? "30"));
    const [vencimento, setVencimento]   = useState(inicial?.primeiroVencimento ?? hoje());
    const [itens, setItens]             = useState(
        inicial?.itens?.length
            ? inicial.itens.map(i => ({
                descricao:     i.descricao,
                quantidade:    String(i.quantidade),
                valorUnitario: String(i.valorUnitario),
                desconto:      String(i.desconto ?? 0),
              }))
            : [{ descricao: "", quantidade: "1", valorUnitario: "", desconto: "0" }]
    );

    const [salvando, setSalvando] = useState(false);
    const [erro, setErro]         = useState("");

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        if (!cliente.id) { setErro("Selecione um cliente da lista."); return; }

        const itensFiltrados = itens.filter(i => i.descricao.trim());
        if (!itensFiltrados.length) { setErro("Adicione pelo menos um item."); return; }

        setSalvando(true);
        try {
            await onSalvar({
                clienteId:          cliente.id,
                orcamentoId:        orcId || null,
                descricao:          descricao.trim() || null,
                observacoes:        observacoes.trim() || null,
                formaPagamento:     formaPag,
                numParcelas:        parseInt(numParcelas, 10) || 1,
                intervaloDias:      parseInt(intervalo, 10) || 30,
                primeiroVencimento: vencimento,
                itens: itensFiltrados.map((i, idx) => ({
                    descricao:     i.descricao.trim(),
                    quantidade:    parseFloat(i.quantidade),
                    valorUnitario: parseFloat(i.valorUnitario),
                    desconto:      parseFloat(i.desconto) || 0,
                    ordem: idx,
                })),
            });
        } catch (err) {
            setErro(err?.response?.data?.erro ?? "Erro ao salvar pedido.");
        } finally {
            setSalvando(false);
        }
    }

    const parcelado = parseInt(numParcelas, 10) > 1;

    return (
        <Modal
            open
            title={inicial ? `Editar pedido ${inicial.numero}` : "Novo pedido de venda"}
            onClose={onFechar}
            size="lg"
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
            <Modal.Body>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>

                    {/* Orçamento (opcional) */}
                    <div style={{ gridColumn: "1 / -1", position: "relative" }} ref={orcWrapperRef}>
                        <label className="form-label">Orçamento aprovado (opcional)</label>
                        <input
                            className="form-input"
                            value={orcBusca}
                            onChange={e => { setOrcBusca(e.target.value); setOrcId(""); buscarOrcamentos(e.target.value); }}
                            onFocus={() => orcamentos.length > 0 && setOrcAberto(true)}
                            placeholder="Buscar por número, descrição ou cliente..."
                            autoComplete="off"
                        />
                        {orcBuscando && (
                            <span style={{ position: "absolute", right: 10, top: 34, fontSize: 12, color: "var(--text-secondary)" }}>
                                buscando…
                            </span>
                        )}
                        {orcAberto && orcamentos.length > 0 && (
                            <ul style={{
                                position: "absolute", zIndex: 999, top: "100%", left: 0, right: 0,
                                background: "var(--surface)", border: "1px solid var(--border)",
                                borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                                listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 200, overflowY: "auto",
                            }}>
                                {orcamentos.map(orc => (
                                    <li
                                        key={orc.id}
                                        onMouseDown={() => selecionarOrcamento(orc)}
                                        style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14 }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}
                                    >
                                        <strong>{orc.numero}</strong>
                                        <span style={{ color: "var(--text-secondary)", margin: "0 6px" }}>·</span>
                                        {orc.cliente?.nome}
                                        {orc.descricao && (
                                            <span style={{ color: "var(--text-secondary)", marginLeft: 6, fontSize: 12 }}>
                                                — {orc.descricao}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {orcAberto && orcamentos.length === 0 && !orcBuscando && orcBusca.length >= 1 && (
                            <div style={{
                                position: "absolute", zIndex: 999, top: "100%", left: 0, right: 0,
                                background: "var(--surface)", border: "1px solid var(--border)",
                                borderRadius: 6, padding: "10px 12px", fontSize: 13,
                                color: "var(--text-secondary)",
                            }}>
                                Nenhum orçamento aprovado encontrado.
                            </div>
                        )}
                    </div>

                    {/* Cliente autocomplete */}
                    <div style={{ gridColumn: "1 / -1", position: "relative" }} ref={cliente.wrapperRef}>
                        <label className="form-label">Cliente *</label>
                        <input
                            className="form-input"
                            value={cliente.busca}
                            onChange={cliente.onInput}
                            onFocus={() => cliente.sugestoes.length > 0 && true}
                            placeholder="Digite o nome ou CPF/CNPJ do cliente..."
                            autoComplete="off"
                            required
                        />
                        {cliente.buscando && (
                            <span style={{ position: "absolute", right: 10, top: 34, fontSize: 12, color: "var(--text-secondary)" }}>
                                buscando…
                            </span>
                        )}
                        {cliente.aberto && cliente.sugestoes.length > 0 && (
                            <ul style={{
                                position: "absolute", zIndex: 999, top: "100%", left: 0, right: 0,
                                background: "var(--surface)", border: "1px solid var(--border)",
                                borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                                listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 200, overflowY: "auto",
                            }}>
                                {cliente.sugestoes.map(c => (
                                    <li
                                        key={c.id}
                                        onMouseDown={() => cliente.selecionar(c)}
                                        style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14 }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                                        onMouseLeave={e => e.currentTarget.style.background = ""}
                                    >
                                        <strong>{c.nome}</strong>
                                        {c.documento && <span style={{ color: "var(--text-secondary)", marginLeft: 8, fontSize: 12 }}>{c.documento}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Descrição */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Descrição</label>
                        <input
                            className="form-input"
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            placeholder="Ex: Serviço de consultoria"
                        />
                    </div>

                    {/* Forma de pagamento */}
                    <div>
                        <label className="form-label">Forma de pagamento</label>
                        <select className="form-input" value={formaPag} onChange={e => setFormaPag(e.target.value)}>
                            {FORMAS_PAG.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Primeiro vencimento */}
                    <div>
                        <label className="form-label">Primeiro vencimento *</label>
                        <input
                            className="form-input"
                            type="date"
                            value={vencimento}
                            onChange={e => setVencimento(e.target.value)}
                            required
                        />
                    </div>

                    {/* Parcelas */}
                    <div>
                        <label className="form-label">Número de parcelas</label>
                        <input
                            className="form-input"
                            type="number"
                            min="1"
                            max="360"
                            value={numParcelas}
                            onChange={e => setNumParcelas(e.target.value)}
                        />
                    </div>

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
                    {salvando ? "Salvando..." : inicial ? "Salvar" : "Criar pedido"}
                </button>
            </div>
            </form>
        </Modal>
    );
}

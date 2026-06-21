import { useState, useEffect, useRef } from "react";
import {
    LuTruck, LuPlus, LuTrash2, LuPackage, LuMapPin,
    LuCircleCheck, LuRotateCcw, LuCopy, LuCheck, LuSearch,
    LuPencil, LuX,
} from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import api   from "../../../services/api.js";

function fmtValor(v) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));
}

const STATUS_INFO = {
    ABERTA:     { label: "Aberta",     color: "var(--cyan-deep)"  },
    FINALIZADA: { label: "Finalizada", color: "var(--success)"    },
};

export default function CargaDetalhes({ carga: cargaInicial, onFechar, onAtualizar }) {
    const [carga, setCarga]           = useState(cargaInicial);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro]             = useState("");

    // Aba ativa: "pedidos" | "json"
    const [aba, setAba] = useState("pedidos");

    // Adicionar pedido
    const [buscaPedido, setBuscaPedido]     = useState("");
    const [pedidosBusca, setPedidosBusca]   = useState([]);
    const [buscando, setBuscando]           = useState(false);
    const [dropAberto, setDropAberto]       = useState(false);
    const [pedidoSel, setPedidoSel]         = useState(null);  // {id, numero, clienteNome, enderecoSugerido}
    const [enderecoAdd, setEnderecoAdd]     = useState("");
    const [adicionando, setAdicionando]     = useState(false);
    const wrapRef = useRef(null);

    // Editar endereço inline
    const [editandoEndereco, setEditandoEndereco] = useState(null); // pedidoId
    const [novoEndereco, setNovoEndereco]         = useState("");

    // JSON copiado
    const [copiado, setCopiado] = useState(false);
    const [jsonTexto, setJsonTexto] = useState("");

    useEffect(() => { setCarga(cargaInicial); }, [cargaInicial]);

    useEffect(() => {
        if (aba !== "json") return;
        api.get(`/api/cargas/${carga.id}/json-roteirizacao`)
            .then(({ data }) => setJsonTexto(JSON.stringify(data, null, 2)))
            .catch(() => setJsonTexto("Erro ao gerar JSON."));
    }, [aba, carga.id]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function fn(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropAberto(false); }
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    // Busca de pedidos disponíveis (status ABERTO)
    useEffect(() => {
        if (!buscaPedido || buscaPedido.length < 1) { setPedidosBusca([]); setDropAberto(false); return; }
        const t = setTimeout(async () => {
            setBuscando(true);
            try {
                const { data } = await api.get(`/api/pedidos-venda?status=ABERTO&tamanho=50`);
                const lista = (data.content ?? []).filter(p =>
                    p.numero.toLowerCase().includes(buscaPedido.toLowerCase()) ||
                    (p.cliente?.nome ?? "").toLowerCase().includes(buscaPedido.toLowerCase())
                );
                setPedidosBusca(lista);
                setDropAberto(true);
            } catch { setPedidosBusca([]); }
            finally { setBuscando(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [buscaPedido]);

    function selecionarPedido(p) {
        setPedidoSel(p);
        setBuscaPedido(`${p.numero} — ${p.cliente?.nome ?? ""}`);
        setDropAberto(false);
        // Pre-preencher endereço do cliente
        const c = p.cliente;
        const endCliente = [c?.endereco, c?.cidade, c?.estado].filter(Boolean).join(", ");
        setEnderecoAdd(p.enderecoEntrega || endCliente || "");
    }

    async function adicionarPedido() {
        if (!pedidoSel) return;
        setAdicionando(true);
        setErro("");
        try {
            const { data } = await api.post(`/api/cargas/${carga.id}/pedidos`, {
                pedidoId:        pedidoSel.id,
                enderecoEntrega: enderecoAdd.trim() || null,
            });
            setCarga(data);
            setPedidoSel(null);
            setBuscaPedido("");
            setEnderecoAdd("");
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao adicionar pedido.");
        } finally {
            setAdicionando(false);
        }
    }

    async function removerPedido(pedidoId) {
        setErro("");
        try {
            const { data } = await api.delete(`/api/cargas/${carga.id}/pedidos/${pedidoId}`);
            setCarga(data);
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao remover pedido.");
        }
    }

    async function salvarEndereco(pedidoId) {
        try {
            const { data } = await api.patch(`/api/cargas/${carga.id}/pedidos/${pedidoId}/endereco`, {
                enderecoEntrega: novoEndereco.trim() || null,
            });
            setCarga(data);
            setEditandoEndereco(null);
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao salvar endereço.");
        }
    }

    async function finalizar() {
        if (!confirm("Finalizar esta carga? Os pedidos permanecerão com status EM_CARGA.")) return;
        setCarregando(true);
        try {
            const { data } = await api.post(`/api/cargas/${carga.id}/finalizar`);
            setCarga(data);
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao finalizar.");
        } finally { setCarregando(false); }
    }

    async function reabrir() {
        setCarregando(true);
        try {
            const { data } = await api.post(`/api/cargas/${carga.id}/reabrir`);
            setCarga(data);
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao reabrir.");
        } finally { setCarregando(false); }
    }

    function copiarJson() {
        navigator.clipboard.writeText(jsonTexto).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
    }

    const aberta = carga.status === "ABERTA";
    const st = STATUS_INFO[carga.status] ?? { label: carga.status, color: "var(--text-muted)" };

    return (
        <Modal open title={`Carga ${carga.numero}`} onClose={onFechar} size="lg"
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    {aberta ? (
                        <button className="ph-btn ph-btn--primary" onClick={finalizar} disabled={carregando || !carga.totalPedidos}>
                            <LuCircleCheck size={14}/> Finalizar
                        </button>
                    ) : (
                        <button className="ph-btn" onClick={reabrir} disabled={carregando}>
                            <LuRotateCcw size={14}/> Reabrir
                        </button>
                    )}
                </div>
            }
        >
            <Modal.Body>
                {/* Header da carga */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                        { l: "Status",       v: <span style={{ color: st.color, fontWeight: 700 }}>{st.label}</span> },
                        { l: "Pedidos",      v: carga.totalPedidos ?? carga.pedidos?.length ?? 0 },
                        { l: "Valor total",  v: fmtValor(carga.valorTotal) },
                        { l: "Origem",       v: carga.enderecoOrigem ? <span style={{ fontSize: 11 }}>{carga.enderecoOrigem}</span> : <span style={{ color: "var(--text-dim)" }}>—</span> },
                    ].map((b, i) => (
                        <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--hair)" }}>
                            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 4 }}>{b.l}</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--navy-deep)" }}>{b.v}</div>
                        </div>
                    ))}
                </div>

                {/* Abas */}
                <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--hair)", marginBottom: 16 }}>
                    {[["pedidos", "Pedidos"], ["json", "JSON de roteirização"]].map(([k, l]) => (
                        <button key={k} onClick={() => setAba(k)} style={{
                            padding: "7px 14px", fontSize: 13, fontWeight: aba === k ? 600 : 400,
                            background: "none", border: "none", cursor: "pointer",
                            color: aba === k ? "var(--cyan-dark)" : "var(--text-muted)",
                            borderBottom: aba === k ? "2px solid var(--cyan)" : "2px solid transparent",
                            marginBottom: -1,
                        }}>{l}</button>
                    ))}
                </div>

                {erro && <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 12 }}>{erro}</p>}

                {/* ── ABA: PEDIDOS ── */}
                {aba === "pedidos" && (
                    <>
                        {/* Adicionar pedido */}
                        {aberta && (
                            <div style={{ background: "var(--bg)", border: "1px solid var(--hair)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy-deep)", marginBottom: 10 }}>Adicionar pedido</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <div style={{ position: "relative" }} ref={wrapRef}>
                                        <label className="form-label">Pedido (ABERTO)</label>
                                        <input
                                            className="form-input"
                                            value={buscaPedido}
                                            onChange={e => { setBuscaPedido(e.target.value); setPedidoSel(null); }}
                                            placeholder="Buscar por número ou cliente..."
                                            autoComplete="off"
                                        />
                                        {buscando && <span style={{ position: "absolute", right: 8, top: 32, fontSize: 11, color: "var(--text-dim)" }}>buscando…</span>}
                                        {dropAberto && pedidosBusca.length > 0 && (
                                            <ul style={{ position: "absolute", zIndex: 999, top: "100%", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.15)", listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 200, overflowY: "auto" }}>
                                                {pedidosBusca.map(p => (
                                                    <li key={p.id} onMouseDown={() => selecionarPedido(p)}
                                                        style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13 }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                                                        <strong>{p.numero}</strong>
                                                        <span style={{ color: "var(--text-muted)", margin: "0 6px" }}>·</span>
                                                        {p.cliente?.nome}
                                                        <span style={{ float: "right", color: "var(--text-dim)", fontSize: 11 }}>
                                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p.valorTotal))}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div>
                                        <label className="form-label">Endereço de entrega</label>
                                        <input
                                            className="form-input"
                                            value={enderecoAdd}
                                            onChange={e => setEnderecoAdd(e.target.value)}
                                            placeholder="Pré-preenchido do cadastro do cliente"
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: 10, textAlign: "right" }}>
                                    <button className="ph-btn ph-btn--primary" onClick={adicionarPedido}
                                            disabled={!pedidoSel || adicionando}>
                                        <LuPlus size={13}/> {adicionando ? "Adicionando..." : "Adicionar"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista de pedidos na carga */}
                        {(!carga.pedidos || carga.pedidos.length === 0) ? (
                            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-dim)", fontSize: 14 }}>
                                <LuPackage size={28} style={{ marginBottom: 8, opacity: .4 }}/>
                                <div>Nenhum pedido na carga ainda.</div>
                            </div>
                        ) : (
                            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                {carga.pedidos.map((p, i) => (
                                    <li key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--hair)" }}>
                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--cyan-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                                            <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 700, color: "var(--cyan-dark)" }}>{i + 1}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)" }}>{p.numero}</span>
                                                <span style={{ fontSize: 13, color: "var(--navy-deep)", fontWeight: 500 }}>{p.clienteNome}</span>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginLeft: "auto" }}>{fmtValor(p.valorTotal)}</span>
                                            </div>
                                            {/* Endereço de entrega */}
                                            {editandoEndereco === p.id ? (
                                                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                                                    <input
                                                        className="form-input"
                                                        style={{ fontSize: 12, padding: "4px 8px" }}
                                                        value={novoEndereco}
                                                        onChange={e => setNovoEndereco(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={e => { if (e.key === "Enter") salvarEndereco(p.id); if (e.key === "Escape") setEditandoEndereco(null); }}
                                                    />
                                                    <button className="ph-btn ph-btn--primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => salvarEndereco(p.id)}>
                                                        <LuCheck size={12}/>
                                                    </button>
                                                    <button className="ph-btn" style={{ padding: "4px 8px" }} onClick={() => setEditandoEndereco(null)}>
                                                        <LuX size={12}/>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <LuMapPin size={11} style={{ color: "var(--text-dim)", flexShrink: 0 }}/>
                                                    <span style={{ fontSize: 12, color: p.enderecoEntrega ? "var(--text-muted)" : "var(--error)", fontStyle: p.enderecoEntrega ? "normal" : "italic" }}>
                                                        {p.enderecoEntrega || "Endereço não informado — necessário para roteirização"}
                                                    </span>
                                                    {aberta && (
                                                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 2 }}
                                                                onClick={() => { setEditandoEndereco(p.id); setNovoEndereco(p.enderecoEntrega ?? ""); }}>
                                                            <LuPencil size={11}/>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {aberta && (
                                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 4, marginTop: 2, flexShrink: 0 }}
                                                    title="Remover da carga"
                                                    onClick={() => removerPedido(p.id)}>
                                                <LuTrash2 size={14}/>
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {/* ── ABA: JSON ── */}
                {aba === "json" && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div>
                                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                                    JSON no formato Whallet Route. Pedidos sem endereço não são incluídos.
                                </p>
                                {carga.pedidos?.some(p => !p.enderecoEntrega) && (
                                    <p style={{ fontSize: 12, color: "var(--warning)", margin: "4px 0 0" }}>
                                        ⚠ {carga.pedidos.filter(p => !p.enderecoEntrega).length} pedido(s) sem endereço serão omitidos.
                                    </p>
                                )}
                            </div>
                            <button className="ph-btn" onClick={copiarJson}>
                                {copiado ? <><LuCheck size={13}/> Copiado!</> : <><LuCopy size={13}/> Copiar</>}
                            </button>
                        </div>
                        <pre style={{
                            background: "var(--bg)", border: "1px solid var(--hair)", borderRadius: 8,
                            padding: "14px 16px", fontSize: 12, lineHeight: 1.6, overflowX: "auto",
                            fontFamily: "var(--ff-mono)", color: "var(--ink)", maxHeight: 400, overflowY: "auto",
                        }}>
                            {jsonTexto}
                        </pre>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}

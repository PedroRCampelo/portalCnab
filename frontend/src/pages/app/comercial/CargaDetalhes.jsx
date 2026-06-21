import { useState, useEffect, useCallback } from "react";
import {
    LuTruck, LuTrash2, LuPackage, LuMapPin,
    LuCircleCheck, LuRotateCcw, LuCopy, LuCheck,
    LuPencil, LuX, LuTriangleAlert, LuBan, LuSearch,
    LuPlus, LuLoader, LuCircleAlert,
} from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import api   from "../../../services/api.js";

const fmt = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

const STATUS_CARGA = {
    ABERTA:     { label: "Aberta",     color: "var(--cyan-dark)",  bg: "var(--cyan-soft)"  },
    FINALIZADA: { label: "Finalizada", color: "var(--success)",    bg: "var(--success-bg)" },
};

export default function CargaDetalhes({ carga: cargaInicial, onFechar, onAtualizar }) {
    const [carga, setCarga]           = useState(cargaInicial);
    const [carregando, setCarregando]     = useState(false);
    const [erro, setErro]                 = useState("");
    const [aba, setAba]                   = useState("pedidos");
    const [confirmExcluir, setConfirmExcluir] = useState(false);

    // ── Pedidos disponíveis (ABERTO) ─────────────────────────────────────────
    const [disponiveis, setDisponiveis]       = useState([]);
    const [loadingDisp, setLoadingDisp]       = useState(false);
    const [busca, setBusca]                   = useState("");

    // selecionados: { [pedidoId]: { pedido, endereco } }
    const [selecionados, setSelecionados]     = useState({});
    const [adicionando, setAdicionando]       = useState(false);

    // ── Editar endereço de pedido já na carga ────────────────────────────────
    const [editandoId, setEditandoId]         = useState(null);
    const [novoEndereco, setNovoEndereco]     = useState("");

    // ── JSON ─────────────────────────────────────────────────────────────────
    const [jsonTexto, setJsonTexto]           = useState("");
    const [copiado, setCopiado]               = useState(false);

    useEffect(() => { setCarga(cargaInicial); }, [cargaInicial]);

    // Carrega pedidos ABERTO ao abrir aba de pedidos
    const carregarDisponiveis = useCallback(async () => {
        setLoadingDisp(true);
        try {
            const { data } = await api.get("/api/pedidos-venda?status=ABERTO&tamanho=200");
            // Exclui pedidos que já estão nesta carga
            const idsNaCarga = new Set((carga.pedidos ?? []).map(p => p.id));
            setDisponiveis((data.content ?? []).filter(p => !idsNaCarga.has(p.id)));
        } catch { /* silencioso */ }
        finally { setLoadingDisp(false); }
    }, [carga.pedidos]);

    useEffect(() => {
        if (aba === "pedidos" && carga.status === "ABERTA") carregarDisponiveis();
    }, [aba, carregarDisponiveis, carga.status]);

    // JSON
    useEffect(() => {
        if (aba !== "json") return;
        setJsonTexto("");
        api.get(`/api/cargas/${carga.id}/json-roteirizacao`)
            .then(({ data }) => setJsonTexto(JSON.stringify(data, null, 2)))
            .catch(() => setJsonTexto("Erro ao gerar JSON."));
    }, [aba, carga.id]);

    // ── Selecionar / desselecionar pedido ────────────────────────────────────
    function toggleSelecionado(pedido) {
        setSelecionados(prev => {
            if (prev[pedido.id]) {
                const next = { ...prev };
                delete next[pedido.id];
                return next;
            }
            const c = pedido.cliente;
            const endCliente = [c?.endereco, c?.cidade, c?.estado].filter(Boolean).join(", ");
            return { ...prev, [pedido.id]: { pedido, endereco: pedido.enderecoEntrega || endCliente || "" } };
        });
    }

    function setEnderecoSel(pedidoId, endereco) {
        setSelecionados(prev => ({ ...prev, [pedidoId]: { ...prev[pedidoId], endereco } }));
    }

    // ── Adicionar pedidos selecionados ───────────────────────────────────────
    async function adicionarSelecionados() {
        const itens = Object.values(selecionados);
        if (!itens.length) return;
        setAdicionando(true);
        setErro("");
        try {
            let ultima = carga;
            for (const { pedido, endereco } of itens) {
                const { data } = await api.post(`/api/cargas/${carga.id}/pedidos`, {
                    pedidoId:        pedido.id,
                    enderecoEntrega: endereco.trim() || null,
                });
                ultima = data;
            }
            setCarga(ultima);
            setSelecionados({});
            carregarDisponiveis();
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? e?.response?.data?.mensagem ?? "Erro ao adicionar pedidos.");
        } finally {
            setAdicionando(false);
        }
    }

    // ── Remover pedido da carga ──────────────────────────────────────────────
    async function removerPedido(pedidoId) {
        setErro("");
        try {
            const { data } = await api.delete(`/api/cargas/${carga.id}/pedidos/${pedidoId}`);
            setCarga(data);
            carregarDisponiveis();
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao remover pedido.");
        }
    }

    // ── Salvar endereço inline ───────────────────────────────────────────────
    async function salvarEndereco(pedidoId) {
        try {
            const { data } = await api.patch(`/api/cargas/${carga.id}/pedidos/${pedidoId}/endereco`, {
                enderecoEntrega: novoEndereco.trim() || null,
            });
            setCarga(data);
            setEditandoId(null);
            onAtualizar?.();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao salvar endereço.");
        }
    }

    // ── Finalizar / Reabrir ──────────────────────────────────────────────────
    async function finalizar() {
        if (!confirm("Finalizar esta carga?")) return;
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

    async function excluir() {
        setCarregando(true);
        try {
            await api.delete(`/api/cargas/${carga.id}`);
            onAtualizar?.();
            onFechar();
        } catch (e) {
            setErro(e?.response?.data?.erro ?? "Erro ao excluir carga.");
            setConfirmExcluir(false);
        } finally { setCarregando(false); }
    }

    function copiarJson() {
        navigator.clipboard.writeText(jsonTexto).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
    }

    // ── Derivados ────────────────────────────────────────────────────────────
    const aberta             = carga.status === "ABERTA";
    const st                 = STATUS_CARGA[carga.status] ?? { label: carga.status, color: "var(--text-muted)", bg: "var(--bg)" };
    const pedidosSemEndereco = (carga.pedidos ?? []).filter(p => !p.enderecoEntrega);
    const qtdSel             = Object.keys(selecionados).length;

    const dispFiltrados = busca.trim()
        ? disponiveis.filter(p =>
            p.numero.toLowerCase().includes(busca.toLowerCase()) ||
            (p.cliente?.nome ?? "").toLowerCase().includes(busca.toLowerCase()))
        : disponiveis;

    const todosComEndereco = Object.values(selecionados).every(s => s.endereco.trim());

    return (
        <Modal open title={`Carga ${carga.numero}`} onClose={onFechar} size="xl"
            actions={
                <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>

                    {/* Excluir — fica à esquerda */}
                    {!confirmExcluir ? (
                        <button className="ph-btn ph-btn--ghost" onClick={() => setConfirmExcluir(true)}
                                disabled={carregando}
                                style={{ color: "var(--error, #ef4444)", marginRight: "auto" }}>
                            <LuTrash2 size={14}/> Excluir carga
                        </button>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto",
                            padding: "6px 12px", borderRadius: 8,
                            background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)" }}>
                            <LuCircleAlert size={14} style={{ color: "#dc2626", flexShrink: 0 }}/>
                            <span style={{ fontSize: 12, color: "#b91c1c" }}>
                                {(carga.pedidos?.length ?? 0) > 0
                                    ? `${carga.pedidos.length} pedido(s) voltarão para Aberto. Confirmar?`
                                    : "Excluir esta carga?"}
                            </span>
                            <button className="ph-btn ph-btn--danger" onClick={excluir} disabled={carregando}
                                    style={{ padding: "4px 10px", fontSize: 12 }}>
                                Excluir
                            </button>
                            <button className="ph-btn" onClick={() => setConfirmExcluir(false)}
                                    style={{ padding: "4px 10px", fontSize: 12 }}>
                                Cancelar
                            </button>
                        </div>
                    )}

                    {erro && <span style={{ fontSize: 12, color: "var(--error)", maxWidth: 280 }}>{erro}</span>}

                    {aberta ? (
                        <button className="ph-btn ph-btn--primary" onClick={finalizar}
                                disabled={carregando || !carga.totalPedidos}>
                            <LuCircleCheck size={14}/> Finalizar carga
                        </button>
                    ) : (
                        <button className="ph-btn ph-btn--ghost" onClick={reabrir} disabled={carregando}>
                            <LuRotateCcw size={14}/> Reabrir
                        </button>
                    )}
                </div>
            }
        >
            <Modal.Body>

                {/* ── Stats ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                        { label: "Status", value: (
                            <span style={{ display: "inline-flex", alignItems: "center",
                                padding: "3px 10px", borderRadius: 100,
                                background: st.bg, color: st.color,
                                fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700 }}>
                                {st.label}
                            </span>
                        )},
                        { label: "Pedidos na carga", value: <span style={{ fontSize: 22, fontWeight: 700, color: "var(--navy-deep)" }}>{carga.totalPedidos ?? carga.pedidos?.length ?? 0}</span> },
                        { label: "Valor total",      value: <span style={{ fontSize: 15, fontWeight: 700, color: "var(--navy-deep)" }}>{fmt(carga.valorTotal)}</span> },
                        { label: "Origem",           value: carga.enderecoOrigem
                            ? <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{carga.enderecoOrigem}</span>
                            : <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Não informado</span> },
                    ].map((b, i) => (
                        <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--hair)" }}>
                            <div style={{ fontFamily: "var(--ff-mono)", fontSize: 9, fontWeight: 700,
                                letterSpacing: ".1em", textTransform: "uppercase",
                                color: "var(--text-dim)", marginBottom: 6 }}>{b.label}</div>
                            {b.value}
                        </div>
                    ))}
                </div>

                {/* ── Abas ── */}
                <div style={{ display: "flex", borderBottom: "2px solid var(--hair)", marginBottom: 20 }}>
                    {[["pedidos", `Pedidos na carga (${carga.pedidos?.length ?? 0})`], ["json", "JSON Roteirização"]].map(([k, l]) => (
                        <button key={k} onClick={() => setAba(k)} style={{
                            padding: "9px 18px", fontSize: 13,
                            fontWeight: aba === k ? 600 : 500,
                            background: "none", border: "none", cursor: "pointer",
                            color: aba === k ? "var(--cyan-dark)" : "var(--text-muted)",
                            borderBottom: aba === k ? "2px solid var(--cyan)" : "2px solid transparent",
                            marginBottom: -2,
                        }}>{l}</button>
                    ))}
                </div>

                {/* ══════════ ABA: PEDIDOS ══════════ */}
                {aba === "pedidos" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                        {/* ── Seletor de pedidos (só quando ABERTA) ── */}
                        {aberta && (
                            <div style={{ border: "1px solid var(--hair)", borderRadius: 12, overflow: "hidden" }}>

                                {/* Cabeçalho do seletor */}
                                <div style={{ padding: "12px 14px", background: "var(--bg)",
                                    borderBottom: "1px solid var(--hair)",
                                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy-deep)" }}>
                                            Adicionar pedidos à carga
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                            Marque os pedidos à esquerda e confirme os endereços à direita
                                        </div>
                                    </div>
                                    {qtdSel > 0 && (
                                        <button
                                            className="ph-btn ph-btn--primary"
                                            onClick={adicionarSelecionados}
                                            disabled={adicionando || !todosComEndereco}
                                            title={!todosComEndereco ? "Preencha todos os endereços antes de adicionar" : ""}
                                            style={{ flexShrink: 0 }}
                                        >
                                            <LuPlus size={13}/>
                                            {adicionando ? "Adicionando…" : `Adicionar ${qtdSel} pedido${qtdSel > 1 ? "s" : ""}`}
                                        </button>
                                    )}
                                </div>

                                {/* Dois painéis */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: 320 }}>

                                    {/* ── Painel esquerdo: lista de disponíveis ── */}
                                    <div style={{ borderRight: "1px solid var(--hair)", display: "flex", flexDirection: "column" }}>

                                        {/* Busca */}
                                        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--hair)", position: "relative" }}>
                                            <LuSearch size={13} style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", pointerEvents: "none" }}/>
                                            <input
                                                style={{ width: "100%", height: 32, paddingLeft: 28, paddingRight: 10,
                                                    border: "1px solid var(--hair)", borderRadius: 7,
                                                    background: "var(--surface)", fontSize: 13,
                                                    fontFamily: "var(--ff-sans)", color: "var(--ink)",
                                                    outline: "none", boxSizing: "border-box" }}
                                                placeholder="Filtrar por número ou cliente…"
                                                value={busca}
                                                onChange={e => setBusca(e.target.value)}
                                            />
                                        </div>

                                        {/* Lista */}
                                        <div style={{ flex: 1, overflowY: "auto", maxHeight: 320 }}>
                                            {loadingDisp ? (
                                                <div style={{ padding: 32, textAlign: "center", color: "var(--text-dim)" }}>
                                                    <LuLoader size={20} style={{ animation: "spin 1s linear infinite" }}/>
                                                </div>
                                            ) : dispFiltrados.length === 0 ? (
                                                <div style={{ padding: 32, textAlign: "center" }}>
                                                    <LuPackage size={24} style={{ color: "var(--text-dim)", marginBottom: 8 }}/>
                                                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                                        {busca ? "Nenhum pedido encontrado" : "Sem pedidos disponíveis"}
                                                    </div>
                                                </div>
                                            ) : dispFiltrados.map(p => {
                                                const sel = !!selecionados[p.id];
                                                const c = p.cliente;
                                                const temEndereco = !!(c?.endereco || c?.cidade || c?.estado);
                                                return (
                                                    <div key={p.id}
                                                        onClick={() => toggleSelecionado(p)}
                                                        style={{ display: "flex", alignItems: "center", gap: 10,
                                                            padding: "10px 14px", cursor: "pointer",
                                                            borderBottom: "1px solid var(--hair)",
                                                            background: sel ? "var(--cyan-soft)" : "transparent",
                                                            transition: "background .1s" }}
                                                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--bg)"; }}
                                                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>

                                                        {/* Checkbox */}
                                                        <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                                            border: sel ? "2px solid var(--cyan-dark)" : "2px solid var(--hair)",
                                                            background: sel ? "var(--cyan-dark)" : "var(--surface)",
                                                            display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            {sel && <LuCheck size={11} style={{ color: "#fff" }}/>}
                                                        </div>

                                                        {/* Info */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)" }}>{p.numero}</span>
                                                                <span style={{ fontSize: 13, color: "var(--navy-deep)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c?.nome}</span>
                                                            </div>
                                                            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                                                <LuMapPin size={10}/>
                                                                {temEndereco
                                                                    ? [c?.endereco, c?.cidade, c?.estado].filter(Boolean).join(", ")
                                                                    : <span style={{ color: "var(--warning)", fontStyle: "italic" }}>Sem endereço cadastrado</span>}
                                                            </div>
                                                        </div>

                                                        {/* Valor */}
                                                        <span style={{ fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>
                                                            {fmt(p.valorTotal)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Rodapé com contagem */}
                                        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--hair)",
                                            background: "var(--bg)", fontSize: 11, color: "var(--text-dim)",
                                            fontFamily: "var(--ff-mono)" }}>
                                            {dispFiltrados.length} pedido(s) disponível(is) · {qtdSel} selecionado(s)
                                        </div>
                                    </div>

                                    {/* ── Painel direito: endereços dos selecionados ── */}
                                    <div style={{ display: "flex", flexDirection: "column", background: "var(--bg)" }}>
                                        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--hair)",
                                            fontSize: 11, fontWeight: 700, color: "var(--text-dim)",
                                            textTransform: "uppercase", letterSpacing: ".06em" }}>
                                            Endereços de entrega
                                        </div>
                                        <div style={{ flex: 1, overflowY: "auto", maxHeight: 340 }}>
                                            {qtdSel === 0 ? (
                                                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                                                    ← Marque pedidos ao lado
                                                </div>
                                            ) : Object.values(selecionados).map(({ pedido, endereco }) => {
                                                const semEndereco = !endereco.trim();
                                                return (
                                                    <div key={pedido.id} style={{ padding: "12px 14px", borderBottom: "1px solid var(--hair)" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                            <div>
                                                                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)" }}>{pedido.numero}</span>
                                                                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>{pedido.cliente?.nome}</span>
                                                            </div>
                                                            <button onClick={() => toggleSelecionado(pedido)}
                                                                style={{ background: "none", border: "none", cursor: "pointer",
                                                                    color: "var(--text-dim)", padding: 2, display: "flex" }}>
                                                                <LuX size={13}/>
                                                            </button>
                                                        </div>
                                                        <input
                                                            style={{ width: "100%", height: 32, padding: "0 8px",
                                                                border: `1px solid ${semEndereco ? "var(--warning)" : "var(--hair)"}`,
                                                                borderRadius: 7, background: "var(--surface)",
                                                                fontSize: 12, fontFamily: "var(--ff-sans)",
                                                                color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
                                                            placeholder="Endereço de entrega…"
                                                            value={endereco}
                                                            onChange={e => setEnderecoSel(pedido.id, e.target.value)}
                                                        />
                                                        {semEndereco && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: 4,
                                                                marginTop: 4, fontSize: 11, color: "#92400e" }}>
                                                                <LuTriangleAlert size={11} style={{ color: "#d97706" }}/>
                                                                Preencha o endereço para incluir na rota
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Pedidos já na carga ── */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)",
                                textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                                Pedidos nesta carga
                            </div>

                            {(!carga.pedidos || carga.pedidos.length === 0) ? (
                                <div style={{ textAlign: "center", padding: "32px 20px",
                                    border: "2px dashed var(--hair)", borderRadius: 12 }}>
                                    <LuPackage size={28} style={{ color: "var(--text-dim)", marginBottom: 8 }}/>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-deep)", marginBottom: 4 }}>
                                        Nenhum pedido adicionado ainda
                                    </div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                        Selecione pedidos no painel acima.
                                    </div>
                                </div>
                            ) : (
                                <div style={{ border: "1px solid var(--hair)", borderRadius: 10, overflow: "hidden" }}>
                                    {carga.pedidos.map((p, i) => (
                                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12,
                                            padding: "11px 14px",
                                            borderBottom: i < carga.pedidos.length - 1 ? "1px solid var(--hair)" : "none",
                                            background: "var(--surface)" }}>

                                            <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--cyan-soft)",
                                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10,
                                                    fontWeight: 700, color: "var(--cyan-dark)" }}>{i + 1}</span>
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                                    <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700, color: "var(--cyan-dark)" }}>{p.numero}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-deep)" }}>{p.clienteNome}</span>
                                                    <span style={{ marginLeft: "auto", fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{fmt(p.valorTotal)}</span>
                                                </div>

                                                {editandoId === p.id ? (
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <input
                                                            style={{ flex: 1, height: 28, padding: "0 8px",
                                                                border: "1px solid var(--cyan)", borderRadius: 6,
                                                                fontSize: 12, fontFamily: "var(--ff-sans)",
                                                                color: "var(--ink)", outline: "none" }}
                                                            value={novoEndereco}
                                                            onChange={e => setNovoEndereco(e.target.value)}
                                                            autoFocus
                                                            placeholder="Endereço de entrega…"
                                                            onKeyDown={e => {
                                                                if (e.key === "Enter") salvarEndereco(p.id);
                                                                if (e.key === "Escape") setEditandoId(null);
                                                            }}
                                                        />
                                                        <button className="ph-btn ph-btn--primary"
                                                                style={{ height: 28, padding: "0 10px", fontSize: 12 }}
                                                                onClick={() => salvarEndereco(p.id)}>
                                                            <LuCheck size={12}/>
                                                        </button>
                                                        <button className="ph-btn ph-btn--ghost"
                                                                style={{ height: 28, padding: "0 8px" }}
                                                                onClick={() => setEditandoId(null)}>
                                                            <LuX size={12}/>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                        <LuMapPin size={10} style={{ color: p.enderecoEntrega ? "var(--cyan-dark)" : "var(--error)", flexShrink: 0 }}/>
                                                        <span style={{ fontSize: 12, color: p.enderecoEntrega ? "var(--text-muted)" : "var(--error)",
                                                            fontStyle: p.enderecoEntrega ? "normal" : "italic",
                                                            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {p.enderecoEntrega || "Sem endereço — clique no lápis para preencher"}
                                                        </span>
                                                        {aberta && (
                                                            <button style={{ background: "none", border: "none", cursor: "pointer",
                                                                color: "var(--text-dim)", padding: 2, display: "flex" }}
                                                                    onClick={() => { setEditandoId(p.id); setNovoEndereco(p.enderecoEntrega ?? ""); }}>
                                                                <LuPencil size={11}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {aberta && (
                                                <button style={{ background: "none", border: "none", cursor: "pointer",
                                                    color: "var(--text-dim)", padding: "4px 6px", flexShrink: 0,
                                                    display: "flex", borderRadius: 6 }}
                                                    title="Remover da carga"
                                                    onMouseEnter={e => { e.currentTarget.style.color = "var(--error)"; e.currentTarget.style.background = "var(--error-bg)"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "none"; }}
                                                    onClick={() => removerPedido(p.id)}>
                                                    <LuTrash2 size={14}/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════ ABA: JSON ══════════ */}
                {aba === "json" && (
                    <div>
                        {pedidosSemEndereco.length > 0 && (
                            <div style={{ display: "flex", gap: 12, padding: "12px 14px", marginBottom: 16,
                                borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
                                <LuBan size={18} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }}/>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", marginBottom: 4 }}>
                                        JSON bloqueado — {pedidosSemEndereco.length} pedido(s) sem endereço
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                                        {pedidosSemEndereco.map(p => (
                                            <span key={p.id} style={{ padding: "2px 8px", borderRadius: 6,
                                                background: "#fee2e2", color: "#b91c1c",
                                                fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700 }}>
                                                {p.numero}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                Formato Whallet Route. Pedidos sem endereço não são incluídos.
                            </span>
                            <button className="ph-btn ph-btn--ghost" onClick={copiarJson}
                                    disabled={pedidosSemEndereco.length > 0 || !jsonTexto}>
                                {copiado
                                    ? <><LuCheck size={13} style={{ color: "var(--success)" }}/> Copiado!</>
                                    : <><LuCopy size={13}/> Copiar JSON</>}
                            </button>
                        </div>

                        <pre style={{ background: "var(--bg)", border: "1px solid var(--hair)", borderRadius: 10,
                            padding: "14px 16px", fontSize: 12, lineHeight: 1.7, overflowX: "auto",
                            fontFamily: "var(--ff-mono)", color: "var(--ink)", maxHeight: 400, overflowY: "auto", margin: 0 }}>
                            {jsonTexto || "Carregando…"}
                        </pre>
                    </div>
                )}

            </Modal.Body>
        </Modal>
    );
}

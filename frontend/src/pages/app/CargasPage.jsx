import { useState, useCallback, useEffect } from "react";
import {
    LuPlus, LuSearch, LuTruck, LuChevronLeft, LuChevronRight,
    LuPackage, LuCircleCheck, LuX,
} from "react-icons/lu";
import api from "../../services/api.js";
import PageHeader from "../../components/shell/PageHeader.jsx";
import DataTable  from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Modal      from "../../components/ui/Modal.jsx";
import CargaModal   from "./comercial/CargaModal.jsx";
import CargaDetalhes from "./comercial/CargaDetalhes.jsx";
import "./comercial/Comercial.css";

const STATUS_INFO = {
    ABERTA:     { label: "Aberta",     variant: "default" },
    FINALIZADA: { label: "Finalizada", variant: "success" },
};

const FILTROS_STATUS = [
    { value: "",           label: "Todas"     },
    { value: "ABERTA",     label: "Aberta"    },
    { value: "FINALIZADA", label: "Finalizada" },
];

function fmtValor(v) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));
}

function fmtDataHora(dt) {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CargasPage() {
    const [cargas, setCargas]             = useState([]);
    const [carregando, setCarregando]     = useState(false);
    const [filtroStatus, setFiltroStatus] = useState("");
    const [busca, setBusca]               = useState("");
    const [pagina, setPagina]             = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [erro, setErro]                 = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [detalhes, setDetalhes]       = useState(null);

    const carregar = useCallback(async (p = 0) => {
        setCarregando(true);
        setErro("");
        try {
            const params = new URLSearchParams({ pagina: p, tamanho: 20 });
            if (filtroStatus) params.set("status", filtroStatus);
            const { data } = await api.get(`/api/cargas?${params}`);
            setCargas(data.content ?? []);
            setTotalPaginas(data.totalPages ?? 0);
            setPagina(p);
        } catch {
            setErro("Erro ao carregar cargas.");
        } finally {
            setCarregando(false);
        }
    }, [filtroStatus]);

    useEffect(() => { carregar(0); }, [carregar]);

    async function criarCarga(dados) {
        const { data: nova } = await api.post("/api/cargas", dados);
        setModalAberto(false);
        carregar(0);
        // Abre os detalhes automaticamente para o usuário já adicionar pedidos
        const { data } = await api.get(`/api/cargas/${nova.id}`);
        setDetalhes(data);
    }

    async function abrirDetalhes(carga) {
        try {
            const { data } = await api.get(`/api/cargas/${carga.id}`);
            setDetalhes(data);
        } catch {
            setErro("Erro ao abrir detalhes da carga.");
        }
    }

    const cargasFiltradas = busca.trim()
        ? cargas.filter(c =>
            c.numero.toLowerCase().includes(busca.toLowerCase()) ||
            (c.descricao ?? "").toLowerCase().includes(busca.toLowerCase())
          )
        : cargas;

    const COLUMNS = [
        {
            key: "numero",
            header: "Carga",
            render: c => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--cyan-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <LuTruck size={15} style={{ color: "var(--cyan-dark)" }}/>
                    </div>
                    <div>
                        <div style={{ fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 700, color: "var(--cyan-dark)" }}>{c.numero}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.descricao || <span style={{ fontStyle: "italic" }}>Sem descrição</span>}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            header: "Status",
            render: c => {
                const s = STATUS_INFO[c.status] ?? { label: c.status, variant: "default" };
                const colors = {
                    ABERTA:     { color: "var(--cyan-dark)",  bg: "var(--cyan-soft)"  },
                    FINALIZADA: { color: "var(--success)",    bg: "var(--success-bg)" },
                };
                const col = colors[c.status] ?? { color: "var(--text-muted)", bg: "var(--bg)" };
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px",
                        borderRadius: 100, background: col.bg, color: col.color,
                        fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".04em" }}>
                        {s.label}
                    </span>
                );
            },
        },
        {
            key: "totalPedidos",
            header: "Pedidos",
            render: c => (
                <span style={{ fontFamily: "var(--ff-mono)", fontSize: 12, color: "var(--ink)" }}>
                    {c.totalPedidos}
                </span>
            ),
        },
        {
            key: "valorTotal",
            header: "Valor total",
            render: c => <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 600 }}>{fmtValor(c.valorTotal)}</span>,
        },
        {
            key: "criadoEm",
            header: "Criado em",
            render: c => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDataHora(c.criadoEm)}</span>,
        },
    ];

    return (
        <>
            <PageHeader
                title="Cargas"
                badge={{ label: `${cargas.length} cargas`, variant: "neutral" }}
                actions={
                    <button className="ph-btn ph-btn--primary" onClick={() => setModalAberto(true)}>
                        <LuPlus size={14}/> Nova carga
                    </button>
                }
            />

            {/* Filtros */}
            <div className="com-filtros">
                <div className="com-busca-wrap">
                    <LuSearch size={14} className="com-busca-icon"/>
                    <input
                        className="com-busca"
                        placeholder="Buscar por número ou descrição..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                    {busca && <button className="com-busca-clear" onClick={() => setBusca("")}><LuX size={12}/></button>}
                </div>
                <div className="com-filtro-status">
                    {FILTROS_STATUS.map(f => (
                        <button
                            key={f.value}
                            className={`com-filtro-btn${filtroStatus === f.value ? " active" : ""}`}
                            onClick={() => { setFiltroStatus(f.value); carregar(0); }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {erro && <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 12 }}>{erro}</p>}

            <DataTable
                columns={COLUMNS}
                data={cargasFiltradas}
                loading={carregando}
                onRowClick={abrirDetalhes}
                empty={
                    <EmptyState icon={LuTruck} title="Nenhuma carga encontrada"
                                description="Crie uma carga para agrupar pedidos e gerar o JSON de roteirização."
                                action={<button className="ph-btn ph-btn--primary" onClick={() => setModalAberto(true)}><LuPlus size={14}/> Nova carga</button>}/>
                }
            />

            {totalPaginas > 1 && (
                <div className="com-paginacao">
                    <button className="ph-btn" disabled={pagina === 0} onClick={() => carregar(pagina - 1)}>
                        <LuChevronLeft size={14}/>
                    </button>
                    <span className="com-pag-info">Página {pagina + 1} de {totalPaginas}</span>
                    <button className="ph-btn" disabled={pagina >= totalPaginas - 1} onClick={() => carregar(pagina + 1)}>
                        <LuChevronRight size={14}/>
                    </button>
                </div>
            )}

            {modalAberto && (
                <CargaModal onSalvar={criarCarga} onFechar={() => setModalAberto(false)}/>
            )}

            {detalhes && (
                <CargaDetalhes
                    carga={detalhes}
                    onFechar={() => setDetalhes(null)}
                    onAtualizar={async () => {
                        const { data } = await api.get(`/api/cargas/${detalhes.id}`);
                        setDetalhes(data);
                        carregar(pagina);
                    }}
                />
            )}
        </>
    );
}

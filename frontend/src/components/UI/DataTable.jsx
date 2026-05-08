import { useState } from "react";
import { LuChevronUp, LuChevronDown, LuChevronsUpDown } from "react-icons/lu";
import EmptyState from "./EmptyState.jsx";
import "./DataTable.css";

/**
 * DataTable — Tabela densa pra listagens
 * Sprint A3.4 · Componentes base
 *
 * Recursos:
 *  - Sort por coluna (client-side)
 *  - Loading skeleton
 *  - Empty state integrado
 *  - Click em linha
 *  - Variantes de densidade
 *  - Renderers customizáveis por coluna
 *
 * Uso:
 *   <DataTable
 *     columns={[
 *       { key: "nome",     label: "Nome",     sortable: true },
 *       { key: "email",    label: "Email" },
 *       { key: "criadoEm", label: "Criado",   sortable: true,
 *         render: row => fmtData(row.criadoEm) },
 *       { key: "status",   label: "Status",   align: "center",
 *         render: row => <Badge variant={row.ativo ? "success" : "neutral"}>
 *           {row.ativo ? "Ativo" : "Inativo"}
 *         </Badge> },
 *       { key: "_actions", label: "",         align: "right",
 *         render: row => <button onClick={...}>Editar</button> },
 *     ]}
 *     data={clientes}
 *     keyField="id"
 *     loading={isLoading}
 *     empty={
 *       <EmptyState
 *         icon={LuUsers}
 *         title="Nenhum cliente"
 *         action={<button>+ Novo</button>}
 *       />
 *     }
 *     onRowClick={(row) => navigate(`/clientes/${row.id}`)}
 *   />
 *
 * Props:
 *  columns      — Array<Column> (obrigatório)
 *                 Column: { key, label, sortable?, align?, width?, render? }
 *  data         — Array de objetos (obrigatório)
 *  keyField     — string — campo único de cada row (default "id")
 *  loading      — bool — mostra skeleton de carregamento
 *  empty        — ReactNode — exibido quando data está vazia
 *  onRowClick   — function(row) — handler de click na linha
 *  density      — "default" | "compact" | "comfortable"
 *  hover        — bool (default true) — destaque ao hover
 */

export default function DataTable({
                                      columns,
                                      data = [],
                                      keyField = "id",
                                      loading = false,
                                      empty,
                                      onRowClick,
                                      density = "default",
                                      hover = true,
                                      className = "",
                                  }) {
    const [sortBy,  setSortBy]  = useState(null);
    const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

    function handleSort(col) {
        if (!col.sortable) return;
        if (sortBy === col.key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col.key);
            setSortDir("asc");
        }
    }

    // Aplica sort se ativo
    const dataOrdenada = sortBy
        ? [...data].sort((a, b) => {
            const va = a[sortBy];
            const vb = b[sortBy];
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === "number") {
                return sortDir === "asc" ? va - vb : vb - va;
            }
            const cmp = String(va).localeCompare(String(vb), "pt-BR");
            return sortDir === "asc" ? cmp : -cmp;
        })
        : data;

    /* ─── Loading ─────────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className={`ui-table-wrap ${className}`}>
                <table className={`ui-table ui-table--${density}`}>
                    <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} style={{
                                width: col.width,
                                textAlign: col.align ?? "left",
                            }}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                            {columns.map(col => (
                                <td key={col.key}>
                                    <div className="ui-table-skeleton"/>
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    /* ─── Empty ──────────────────────────────────────────────────────── */
    if (data.length === 0) {
        return (
            <div className={`ui-table-wrap ${className}`}>
                {empty ?? (
                    <EmptyState
                        title="Sem registros"
                        description="Não há nada por aqui ainda."
                    />
                )}
            </div>
        );
    }

    /* ─── Tabela com dados ───────────────────────────────────────────── */
    return (
        <div className={`ui-table-wrap ${className}`}>
            <table className={`ui-table ui-table--${density} ${hover ? "ui-table--hover" : ""}`}>
                <thead>
                <tr>
                    {columns.map(col => {
                        const ativo = sortBy === col.key;
                        return (
                            <th
                                key={col.key}
                                style={{
                                    width: col.width,
                                    textAlign: col.align ?? "left",
                                    cursor: col.sortable ? "pointer" : "default",
                                }}
                                onClick={() => handleSort(col)}
                            >
                                    <span className="ui-table-th-content">
                                        {col.label}
                                        {col.sortable && (
                                            <span className="ui-table-sort-icon">
                                                {ativo
                                                    ? (sortDir === "asc"
                                                        ? <LuChevronUp size={12}/>
                                                        : <LuChevronDown size={12}/>)
                                                    : <LuChevronsUpDown size={12}/>}
                                            </span>
                                        )}
                                    </span>
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {dataOrdenada.map(row => (
                    <tr
                        key={row[keyField]}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={onRowClick ? "ui-table-row--clickable" : ""}
                    >
                        {columns.map(col => (
                            <td
                                key={col.key}
                                style={{ textAlign: col.align ?? "left" }}
                            >
                                {col.render ? col.render(row) : row[col.key] ?? "—"}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
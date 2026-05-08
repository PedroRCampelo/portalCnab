import "./Tabs.css";

/**
 * Tabs — Tabs standalone (controlado)
 * Sprint A3.4 · Componentes base
 *
 * Para tabs do PageHeader, use as props `tabs`/`activeTab` direto no PageHeader.
 * Esse componente é pra tabs INLINE (dentro de cards, em filtros, etc).
 *
 * Uso:
 *   const [tab, setTab] = useState("aberto");
 *
 *   <Tabs
 *     items={[
 *       { key: "aberto",   label: "Em aberto",  count: 12 },
 *       { key: "pago",     label: "Pagos",      count: 48 },
 *       { key: "vencido",  label: "Vencidos",   count: 3, variant: "error" },
 *     ]}
 *     value={tab}
 *     onChange={setTab}
 *   />
 *
 * Props:
 *  items   — Array<TabItem>
 *            TabItem: { key, label, count?, icon?, variant? }
 *            variant do count: success | warning | error
 *  value   — string — key do tab ativo
 *  onChange — function(key)
 *  variant — "underline" | "pill" | "subtle"
 *  size    — "default" | "compact"
 */

export default function Tabs({
                                 items,
                                 value,
                                 onChange,
                                 variant = "underline",
                                 size = "default",
                                 className = "",
                             }) {
    return (
        <div
            className={`ui-tabs ui-tabs--${variant} ui-tabs--${size} ${className}`}
            role="tablist"
        >
            {items.map(item => {
                const Icon = item.icon;
                const ativo = item.key === value;
                return (
                    <button
                        key={item.key}
                        className={`ui-tab ${ativo ? "active" : ""}`}
                        onClick={() => onChange?.(item.key)}
                        role="tab"
                        aria-selected={ativo}
                    >
                        {Icon && (
                            <span className="ui-tab-icon">
                                <Icon size={size === "compact" ? 12 : 14}/>
                            </span>
                        )}
                        <span>{item.label}</span>
                        {item.count != null && (
                            <span className={`ui-tab-count ${item.variant ? `ui-tab-count--${item.variant}` : ""}`}>
                                {item.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
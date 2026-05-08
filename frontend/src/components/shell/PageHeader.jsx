import { useNavigate } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import "./PageHeader.css";

/**
 * PageHeader — Cabeçalho padrão das páginas do app
 * Sprint A3.3 · ERP-style layout
 *
 * Estilo: SaaS funcional limpo (Linear / Stripe Dashboard)
 *
 * Uso básico:
 *   <PageHeader title="Recebimentos" />
 *
 * Uso completo:
 *   <PageHeader
 *     title="Fluxo de Caixa"
 *     badge={{ label: "12 pendentes", variant: "warning" }}
 *     actions={
 *       <>
 *         <button className="ph-btn ph-btn--primary">+ Novo</button>
 *         <button className="ph-btn ph-btn--icon"><LuSettings size={16}/></button>
 *       </>
 *     }
 *     meta={[
 *       { label: "Atualizado", value: "agora" },
 *       { label: "Contas", value: "3" },
 *     ]}
 *     tabs={[
 *       { key: "saude",   label: "Saúde do mês", count: null },
 *       { key: "contas",  label: "Contas Bancárias", count: 3 },
 *       { key: "extrato", label: "Extrato", count: 142 },
 *     ]}
 *     activeTab="saude"
 *     onTabChange={(key) => setTab(key)}
 *   />
 *
 * Detail page (com botão voltar):
 *   <PageHeader
 *     backTo="/recebimentos"
 *     backLabel="Recebimentos"
 *     title="Recebimento #123"
 *     actions={...}
 *   />
 *
 * Props:
 *  title         — string (obrigatório)
 *  backTo        — string (opcional) — rota de "voltar"
 *  backLabel     — string (opcional) — label customizado do voltar (default "Voltar")
 *  badge         — { label, variant } (opcional) — badge ao lado do título
 *                  variants: success | warning | error | neutral | undefined (cyan)
 *  actions       — ReactNode (opcional) — botões/elementos no canto direito
 *  meta          — Array<{ label, value }> (opcional) — info contextual sob título
 *  tabs          — Array<{ key, label, icon?, count? }> (opcional)
 *  activeTab     — string (key do tab ativo)
 *  onTabChange   — function(key) — callback ao clicar tab
 */
export default function PageHeader({
                                       title,
                                       backTo,
                                       backLabel = "Voltar",
                                       badge,
                                       actions,
                                       meta,
                                       tabs,
                                       activeTab,
                                       onTabChange,
                                   }) {
    const navigate = useNavigate();

    function handleBack() {
        if (backTo) navigate(backTo);
        else navigate(-1);
    }

    return (
        <header className="ph">

            {/* Botão Voltar (só aparece se backTo definido) */}
            {backTo !== undefined && (
                <button className="ph-back" onClick={handleBack}>
                    <span className="ph-back-icon">
                        <LuArrowLeft size={13}/>
                    </span>
                    {backLabel}
                </button>
            )}

            {/* Linha principal: título + ações */}
            <div className="ph-row">
                <h1 className="ph-title">
                    {title}
                    {badge && (
                        <span className={`ph-badge ${badge.variant ? `ph-badge--${badge.variant}` : ""}`}>
                            {badge.label}
                        </span>
                    )}
                </h1>

                {actions && (
                    <div className="ph-actions">
                        {actions}
                    </div>
                )}
            </div>

            {/* Linha de metadados (opcional) */}
            {meta && meta.length > 0 && (
                <div className="ph-meta">
                    {meta.map((item, i) => (
                        <span key={i} className="ph-meta-item">
                            {i > 0 && <span className="ph-meta-divider">·</span>}
                            {item.label}: <strong>{item.value}</strong>
                        </span>
                    ))}
                </div>
            )}

            {/* Tabs (opcional) */}
            {tabs && tabs.length > 0 && (
                <nav className="ph-tabs" role="tablist">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const ativo = tab.key === activeTab;
                        return (
                            <button
                                key={tab.key}
                                className={`ph-tab ${ativo ? "active" : ""}`}
                                onClick={() => onTabChange?.(tab.key)}
                                role="tab"
                                aria-selected={ativo}
                            >
                                {Icon && (
                                    <span className="ph-tab-icon">
                                        <Icon size={14}/>
                                    </span>
                                )}
                                {tab.label}
                                {tab.count != null && (
                                    <span className="ph-tab-count">{tab.count}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            )}
        </header>
    );
}
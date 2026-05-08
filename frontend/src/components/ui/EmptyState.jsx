import "./EmptyState.css";

/**
 * EmptyState — Tela vazia com CTA pra primeira ação
 * Sprint A3.4 · Componentes base
 *
 * Crítico para experiência do Free (vê tela vazia → CTA pra Whallet+)
 * e pra clientes novos (primeira vez na tela).
 *
 * Uso básico:
 *   <EmptyState
 *     icon={LuUsers}
 *     title="Nenhum cliente cadastrado"
 *     description="Cadastre seus primeiros clientes para começar."
 *     action={
 *       <button className="ph-btn ph-btn--primary" onClick={...}>
 *         <LuPlus size={14}/> Cadastrar cliente
 *       </button>
 *     }
 *   />
 *
 * Com link auxiliar:
 *   <EmptyState
 *     icon={LuUsers}
 *     title="Nenhum cliente"
 *     description="..."
 *     action={...}
 *     hint={<Link to="/help/clientes">Como funciona →</Link>}
 *   />
 *
 * Variante de gate (Free tentando ação que requer Whallet+):
 *   <EmptyState
 *     variant="gate"
 *     icon={LuLock}
 *     title="Disponível no Whallet+"
 *     description="No plano Free você pode visualizar, mas não criar."
 *     action={
 *       <Link to="/planos" className="ph-btn ph-btn--primary">
 *         Conhecer Whallet+
 *       </Link>
 *     }
 *   />
 *
 * Props:
 *  icon         — Component de ícone (Lucide). Opcional
 *  title        — string (obrigatório)
 *  description  — string (opcional) — texto explicativo
 *  action       — ReactNode (opcional) — CTA principal
 *  hint         — ReactNode (opcional) — link/texto auxiliar
 *  variant      — "default" | "gate" | "compact"
 */

export default function EmptyState({
                                       icon: Icon,
                                       title,
                                       description,
                                       action,
                                       hint,
                                       variant = "default",
                                       className = "",
                                   }) {
    return (
        <div className={`ui-empty ui-empty--${variant} ${className}`}>
            {Icon && (
                <div className="ui-empty-icon">
                    <Icon size={variant === "compact" ? 20 : 28}/>
                </div>
            )}

            <h3 className="ui-empty-title">{title}</h3>

            {description && (
                <p className="ui-empty-description">{description}</p>
            )}

            {action && (
                <div className="ui-empty-action">
                    {action}
                </div>
            )}

            {hint && (
                <div className="ui-empty-hint">
                    {hint}
                </div>
            )}
        </div>
    );
}
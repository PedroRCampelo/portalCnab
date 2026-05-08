import "./Card.css";

/**
 * Card — Container padrão de seções
 * Sprint A3.4 · Componentes base
 *
 * Estrutura flexível:
 *   <Card>
 *     <Card.Header>
 *       <Card.Title>Título</Card.Title>
 *       <Card.Actions>...</Card.Actions>
 *     </Card.Header>
 *     <Card.Body>conteúdo</Card.Body>
 *     <Card.Footer>...</Card.Footer>
 *   </Card>
 *
 * Ou simples:
 *   <Card>conteúdo</Card>
 *
 * Variantes (prop `variant`):
 *  - default      → fundo branco, border-hair
 *  - subtle       → fundo bg (sem border)
 *  - outlined     → border mais forte
 *  - featured     → border cyan + bg cyan-soft (destaque)
 *
 * Density (prop `density`):
 *  - default → padding 24px
 *  - compact → padding 16px
 *  - dense   → padding 12px
 */

export default function Card({
                                 children,
                                 variant = "default",
                                 density = "default",
                                 className = "",
                                 ...rest
                             }) {
    return (
        <div
            className={`ui-card ui-card--${variant} ui-card--${density} ${className}`}
            {...rest}
        >
            {children}
        </div>
    );
}

// Sub-componentes (composição)

Card.Header = function CardHeader({ children, divider = true, className = "" }) {
    return (
        <div className={`ui-card-header ${divider ? "ui-card-header--divider" : ""} ${className}`}>
            {children}
        </div>
    );
};

Card.Title = function CardTitle({ children, className = "" }) {
    return <h3 className={`ui-card-title ${className}`}>{children}</h3>;
};

Card.Description = function CardDescription({ children, className = "" }) {
    return <p className={`ui-card-description ${className}`}>{children}</p>;
};

Card.Actions = function CardActions({ children, className = "" }) {
    return <div className={`ui-card-actions ${className}`}>{children}</div>;
};

Card.Body = function CardBody({ children, className = "", padded = true }) {
    return (
        <div className={`ui-card-body ${padded ? "" : "ui-card-body--no-pad"} ${className}`}>
            {children}
        </div>
    );
};

Card.Footer = function CardFooter({ children, className = "" }) {
    return (
        <div className={`ui-card-footer ${className}`}>
            {children}
        </div>
    );
};
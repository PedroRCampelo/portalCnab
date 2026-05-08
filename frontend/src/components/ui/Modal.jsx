import { useEffect } from "react";
import { LuX } from "react-icons/lu";
import "./Modal.css";

/**
 * Modal — Modal com overlay, ESC, click-outside
 * Sprint A3.4 · Componentes base
 *
 * Uso:
 *   const [open, setOpen] = useState(false);
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="Editar cliente">
 *     <Modal.Body>conteúdo</Modal.Body>
 *     <Modal.Footer>
 *       <button onClick={() => setOpen(false)}>Cancelar</button>
 *       <button onClick={save}>Salvar</button>
 *     </Modal.Footer>
 *   </Modal>
 *
 * Modal de confirmação simples:
 *   <Modal
 *     open={confirmOpen}
 *     onClose={() => setConfirmOpen(false)}
 *     title="Excluir cliente?"
 *     description="Essa ação não pode ser desfeita."
 *     size="sm"
 *     actions={
 *       <>
 *         <button className="ph-btn ph-btn--ghost" onClick={() => setConfirmOpen(false)}>
 *           Cancelar
 *         </button>
 *         <button className="ph-btn ph-btn--primary" onClick={confirm}>
 *           Excluir
 *         </button>
 *       </>
 *     }
 *   />
 *
 * Props:
 *  open          — bool (obrigatório) — controla abertura
 *  onClose       — function (obrigatório) — chamado ao fechar (ESC, click outside, X)
 *  title         — string (opcional) — título no header
 *  description   — string (opcional) — descrição abaixo do título
 *  size          — "sm" | "default" | "lg" | "xl"
 *  actions       — ReactNode (opcional) — atalho pra footer com botões
 *  showClose     — bool (default true) — exibe X no canto
 *  closeOnOverlay — bool (default true) — fecha ao clicar no overlay
 */

export default function Modal({
                                  open,
                                  onClose,
                                  title,
                                  description,
                                  children,
                                  size = "default",
                                  actions,
                                  showClose = true,
                                  closeOnOverlay = true,
                              }) {

    // ESC fecha
    useEffect(() => {
        if (!open) return;
        function onKey(e) {
            if (e.key === "Escape") onClose?.();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Body lock scroll quando aberto
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = original; };
    }, [open]);

    if (!open) return null;

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget && closeOnOverlay) {
            onClose?.();
        }
    }

    return (
        <div className="ui-modal-overlay" onClick={handleOverlayClick}>
            <div className={`ui-modal ui-modal--${size}`} role="dialog" aria-modal="true">

                {/* Header (só renderiza se houver title ou close) */}
                {(title || showClose) && (
                    <header className="ui-modal-header">
                        <div className="ui-modal-title-wrap">
                            {title && <h2 className="ui-modal-title">{title}</h2>}
                            {description && <p className="ui-modal-description">{description}</p>}
                        </div>
                        {showClose && (
                            <button
                                className="ui-modal-close"
                                onClick={onClose}
                                aria-label="Fechar"
                            >
                                <LuX size={18}/>
                            </button>
                        )}
                    </header>
                )}

                {/* Body — renderiza children direto OU via Modal.Body explicito */}
                {children}

                {/* Footer com actions (atalho) */}
                {actions && (
                    <footer className="ui-modal-footer">
                        {actions}
                    </footer>
                )}
            </div>
        </div>
    );
}

// Sub-componentes (composição)

Modal.Body = function ModalBody({ children, className = "", padded = true }) {
    return (
        <div className={`ui-modal-body ${padded ? "" : "ui-modal-body--no-pad"} ${className}`}>
            {children}
        </div>
    );
};

Modal.Footer = function ModalFooter({ children, className = "" }) {
    return (
        <footer className={`ui-modal-footer ${className}`}>
            {children}
        </footer>
    );
};
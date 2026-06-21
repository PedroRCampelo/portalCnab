import { useState } from "react";
import Modal from "../../../components/ui/Modal.jsx";

export default function CargaModal({ onSalvar, onFechar }) {
    const [descricao, setDescricao]           = useState("");
    const [enderecoOrigem, setEnderecoOrigem] = useState("");
    const [salvando, setSalvando]             = useState(false);
    const [erro, setErro]                     = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setSalvando(true);
        try {
            await onSalvar({ descricao: descricao.trim(), enderecoOrigem: enderecoOrigem.trim() || null });
        } catch (err) {
            setErro(err?.response?.data?.erro ?? "Erro ao criar carga.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Modal open title="Nova carga" onClose={onFechar} size="sm">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                <Modal.Body>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label className="form-label">Descrição *</label>
                            <input
                                className="form-input"
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Ex: Entrega Boa Viagem — 21/06"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="form-label">Endereço de origem (CD / base)</label>
                            <input
                                className="form-input"
                                value={enderecoOrigem}
                                onChange={e => setEnderecoOrigem(e.target.value)}
                                placeholder="Ex: Rua Padre Carapuceiro, 777, Recife, PE"
                            />
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                Endereço do ponto de partida da rota (Centro de Distribuição).
                            </p>
                        </div>
                    </div>
                    {erro && <p style={{ color: "var(--danger, #ef4444)", fontSize: 13, marginTop: 8 }}>{erro}</p>}
                </Modal.Body>
                <div className="ui-modal-footer">
                    <button type="button" className="ph-btn" onClick={onFechar}>Cancelar</button>
                    <button type="submit" className="ph-btn ph-btn--primary" disabled={salvando}>
                        {salvando ? "Criando..." : "Criar carga"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

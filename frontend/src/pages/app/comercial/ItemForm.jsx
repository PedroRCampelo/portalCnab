import { LuPlus, LuTrash2 } from "react-icons/lu";

function fmt(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcSubtotal(item) {
    const q = parseFloat(item.quantidade) || 0;
    const v = parseFloat(item.valorUnitario) || 0;
    const d = parseFloat(item.desconto) || 0;
    return Math.max(q * v - d, 0);
}

export default function ItemForm({ itens, onChange }) {
    function addItem() {
        onChange([...itens, { descricao: "", quantidade: "1", valorUnitario: "", desconto: "0" }]);
    }

    function removeItem(idx) {
        onChange(itens.filter((_, i) => i !== idx));
    }

    function updateItem(idx, field, value) {
        const next = itens.map((item, i) => i === idx ? { ...item, [field]: value } : item);
        onChange(next);
    }

    const total = itens.reduce((acc, i) => acc + calcSubtotal(i), 0);

    return (
        <div className="itens-section">
            <h4>Itens</h4>

            {itens.map((item, idx) => (
                <div key={idx} className="item-row">
                    <input
                        placeholder="Descrição"
                        value={item.descricao}
                        onChange={e => updateItem(idx, "descricao", e.target.value)}
                        required
                    />
                    <input
                        placeholder="Qtd"
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.quantidade}
                        onChange={e => updateItem(idx, "quantidade", e.target.value)}
                        required
                    />
                    <input
                        placeholder="Valor unit."
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.valorUnitario}
                        onChange={e => updateItem(idx, "valorUnitario", e.target.value)}
                        required
                    />
                    <input
                        placeholder="Desconto"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.desconto}
                        onChange={e => updateItem(idx, "desconto", e.target.value)}
                    />
                    <button type="button" className="btn-rem-item" onClick={() => removeItem(idx)} title="Remover item">
                        <LuTrash2 size={14}/>
                    </button>
                </div>
            ))}

            <button type="button" className="btn-add-item" onClick={addItem}>
                <LuPlus size={14}/> Adicionar item
            </button>

            <div className="total-row">
                <span>Total:</span>
                <span>{fmt(total)}</span>
            </div>
        </div>
    );
}

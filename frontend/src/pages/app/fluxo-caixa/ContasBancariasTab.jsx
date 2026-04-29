import { useState, useEffect } from "react";
import {
    LuPlus, LuPencil, LuTrash2, LuStar, LuRefreshCw,
    LuLandmark, LuLoader,
} from "react-icons/lu";
import api from "../../../services/api.js";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import {
    fmtValor, fmtData, formatarMoedaParaInput,
    mascaraMoeda, parseMoeda, CONTA_VAZIA,
} from "./_helpers.js";

/**
 * ContasBancariasTab — Lista e gerenciamento de contas bancárias
 * Sprint A3.5.2 · Refatoração piloto
 *
 * Responsabilidades:
 *  - Lista de contas em cards (grid responsivo)
 *  - Cada card mostra saldo atual + ações (ajustar, editar, inativar)
 *  - Botão "Nova conta" (primary)
 *  - EmptyState quando não há contas
 *  - Inline modais: ContaModal (cadastrar/editar) e AjustarSaldoModal
 *  - Confirmação de inativação via Modal componente (substitui window.confirm)
 *
 * Endpoints consumidos:
 *  - POST   /api/saldos-bancarios            — criar conta
 *  - PUT    /api/saldos-bancarios/{id}       — editar conta
 *  - POST   /api/saldos-bancarios/{id}/ajustar — ajustar saldo
 *  - DELETE /api/saldos-bancarios/{id}       — inativar conta
 *
 * Props:
 *  contas       — array de contas (do backend)
 *  carregando   — bool
 *  onRecarregar — function — recarrega contas + saúde do mês
 */
export default function ContasBancariasTab({ contas, carregando, onRecarregar }) {

    // Modais
    const [contaModal,    setContaModal]    = useState({ aberto: false, conta: null });
    const [ajusteModal,   setAjusteModal]   = useState({ aberto: false, conta: null });
    const [inativarConta, setInativarConta] = useState(null); // confirmação
    const [salvando,      setSalvando]      = useState(false);
    const [erro,          setErro]          = useState("");

    // ── Ações de conta ──────────────────────────────────────────────────────

    function abrirNovaConta() {
        setContaModal({ aberto: true, conta: null });
    }

    function abrirEdicaoConta(conta) {
        setContaModal({ aberto: true, conta });
    }

    async function salvarConta(payload) {
        setSalvando(true);
        try {
            if (contaModal.conta) {
                await api.put(`/api/saldos-bancarios/${contaModal.conta.id}`, payload);
            } else {
                await api.post("/api/saldos-bancarios", payload);
            }
            setContaModal({ aberto: false, conta: null });
            await onRecarregar();
        } finally {
            setSalvando(false);
        }
    }

    function abrirAjuste(conta) {
        setAjusteModal({ aberto: true, conta });
    }

    async function confirmarAjuste(payload) {
        await api.post(`/api/saldos-bancarios/${ajusteModal.conta.id}/ajustar`, payload);
        setAjusteModal({ aberto: false, conta: null });
        await onRecarregar();
    }

    async function confirmarInativacao() {
        try {
            await api.delete(`/api/saldos-bancarios/${inativarConta.id}`);
            setInativarConta(null);
            await onRecarregar();
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao inativar conta");
            setInativarConta(null);
        }
    }

    // ── Loading ──────────────────────────────────────────────────────────────

    if (carregando) {
        return (
            <div className="cbt-loading">
                <LuLoader size={20} className="cbt-spinner"/>
                <span>Carregando contas...</span>
                <style>{LOADING_CSS}</style>
            </div>
        );
    }

    // ── Empty state ──────────────────────────────────────────────────────────

    if (contas.length === 0) {
        return (
            <div className="cbt-empty-wrap">
                <EmptyState
                    icon={LuLandmark}
                    title="Nenhuma conta cadastrada"
                    description="Cadastre sua primeira conta para acompanhar saldo, receber e pagar com atualizações automáticas."
                    action={
                        <button className="ph-btn ph-btn--primary" onClick={abrirNovaConta}>
                            <LuPlus size={14}/>
                            Cadastrar primeira conta
                        </button>
                    }
                />

                {/* Modal de cadastro acessível mesmo no empty state */}
                <ContaModal
                    open={contaModal.aberto}
                    conta={contaModal.conta}
                    onSalvar={salvarConta}
                    onFechar={() => setContaModal({ aberto: false, conta: null })}
                    salvando={salvando}
                />

                <style>{COMPONENT_CSS}</style>
            </div>
        );
    }

    // ── Lista de contas ─────────────────────────────────────────────────────

    return (
        <>
            {/* Header da seção: descrição + ação primary */}
            <div className="cbt-head">
                <div className="cbt-head-text">
                    <h2 className="cbt-head-title">Contas bancárias</h2>
                    <p className="cbt-head-desc">
                        Cada baixa de recebimento ou pagamento atualiza o saldo automaticamente.
                    </p>
                </div>
                <button className="ph-btn ph-btn--primary" onClick={abrirNovaConta}>
                    <LuPlus size={14}/>
                    Nova conta
                </button>
            </div>

            {/* Erro de inativação */}
            {erro && (
                <div className="cbt-erro">{erro}</div>
            )}

            {/* Grid de cards */}
            <div className="cbt-grid">
                {contas.map(conta => (
                    <ContaCard
                        key={conta.id}
                        conta={conta}
                        onEditar={() => abrirEdicaoConta(conta)}
                        onAjustar={() => abrirAjuste(conta)}
                        onInativar={() => setInativarConta(conta)}
                    />
                ))}
            </div>

            {/* Modais */}
            <ContaModal
                open={contaModal.aberto}
                conta={contaModal.conta}
                onSalvar={salvarConta}
                onFechar={() => setContaModal({ aberto: false, conta: null })}
                salvando={salvando}
            />

            <AjustarSaldoModal
                open={ajusteModal.aberto}
                conta={ajusteModal.conta}
                onConfirmar={confirmarAjuste}
                onFechar={() => setAjusteModal({ aberto: false, conta: null })}
            />

            {/* Confirmação de inativação */}
            <Modal
                open={inativarConta !== null}
                onClose={() => setInativarConta(null)}
                size="sm"
                title="Inativar conta?"
                description={inativarConta && (
                    <>Tem certeza que deseja inativar <strong>"{inativarConta.nomeConta}"</strong>?
                        Os movimentos dela continuam visíveis no histórico.</>
                )}
                actions={
                    <>
                        <button
                            className="ph-btn ph-btn--ghost"
                            onClick={() => setInativarConta(null)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="ph-btn ph-btn--primary"
                            onClick={confirmarInativacao}
                            style={{ background: "var(--error)", borderColor: "var(--error)" }}
                        >
                            Sim, inativar
                        </button>
                    </>
                }
            />

            <style>{COMPONENT_CSS}</style>
        </>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ContaCard — card individual de conta
   ═════════════════════════════════════════════════════════════════════════════ */

function ContaCard({ conta, onEditar, onAjustar, onInativar }) {
    const variou = Number(conta.saldoAtual) !== Number(conta.saldoInicial);
    const saldoNegativo = Number(conta.saldoAtual) < 0;

    return (
        <div className="cbt-card">

            {/* Header: nome + estrela (se principal) */}
            <div className="cbt-card-head">
                <div className="cbt-card-name">
                    {conta.nomeConta}
                    {conta.principal && (
                        <span className="cbt-card-star" title="Conta principal">
                            <LuStar size={13} fill="currentColor"/>
                        </span>
                    )}
                </div>
                {conta.banco && (
                    <div className="cbt-card-bank">{conta.banco}</div>
                )}
            </div>

            {/* Saldo atual */}
            <div className="cbt-card-saldo">
                <div className="cbt-card-saldo-label">Saldo atual</div>
                <div className={`cbt-card-saldo-value ${saldoNegativo ? "negative" : ""}`}>
                    {fmtValor(conta.saldoAtual)}
                </div>
                {variou && (
                    <div className="cbt-card-saldo-meta">
                        Inicial: {fmtValor(conta.saldoInicial)}
                        {" — "}
                        {fmtData(conta.dataInicial)}
                    </div>
                )}
            </div>

            {/* Ações */}
            <div className="cbt-card-actions">
                <button
                    className="ph-btn ph-btn--ghost cbt-action-main"
                    onClick={onAjustar}
                    title="Ajustar saldo (cria movimento de ajuste)"
                >
                    <LuRefreshCw size={12}/>
                    Ajustar saldo
                </button>
                <button
                    className="ph-btn ph-btn--icon cbt-action-icon"
                    onClick={onEditar}
                    title="Editar dados"
                >
                    <LuPencil size={14}/>
                </button>
                <button
                    className="ph-btn ph-btn--icon cbt-action-icon cbt-action-danger"
                    onClick={onInativar}
                    title="Inativar conta"
                >
                    <LuTrash2 size={14}/>
                </button>
            </div>
        </div>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ContaModal — Cadastro/edição de conta
   ═════════════════════════════════════════════════════════════════════════════ */

function ContaModal({ open, conta, onSalvar, onFechar, salvando }) {
    const ehEdicao = !!conta;

    const [form, setForm] = useState({ ...CONTA_VAZIA, saldoInicial: "" });
    const [erro, setErro] = useState("");

    // Reset form quando modal abre/conta muda
    useEffect(() => {
        if (!open) return;

        if (conta) {
            setForm({
                nomeConta:    conta.nomeConta ?? "",
                banco:        conta.banco ?? "",
                saldoInicial: formatarMoedaParaInput(conta.saldoInicial),
                principal:    !!conta.principal,
            });
        } else {
            setForm({ ...CONTA_VAZIA, saldoInicial: "" });
        }
        setErro("");
    }, [open, conta]);

    function atualizar(c, v) {
        setForm(p => ({ ...p, [c]: v }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (!form.nomeConta.trim()) {
            setErro("Nome da conta é obrigatório");
            return;
        }

        try {
            if (ehEdicao) {
                // Edição: NÃO envia saldo inicial (imutável)
                await onSalvar({
                    nomeConta: form.nomeConta.trim(),
                    banco:     form.banco || null,
                    principal: !!form.principal,
                });
            } else {
                // Criação: envia saldo inicial
                const saldoNum = parseMoeda(form.saldoInicial);
                await onSalvar({
                    nomeConta:    form.nomeConta.trim(),
                    banco:        form.banco || null,
                    saldoInicial: saldoNum,
                    principal:    !!form.principal,
                });
            }
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar conta");
        }
    }

    return (
        <Modal
            open={open}
            onClose={onFechar}
            title={ehEdicao ? "Editar conta" : "Nova conta bancária"}
            size="default"
        >
            <form onSubmit={handleSubmit}>
                <Modal.Body>
                    {/* Nome da conta */}
                    <div className="cbt-field">
                        <label className="cbt-label">Nome da conta *</label>
                        <input
                            type="text"
                            className="cbt-input"
                            value={form.nomeConta}
                            onChange={e => atualizar("nomeConta", e.target.value)}
                            placeholder="Ex: Conta Inter, Caixa MEI"
                            required
                            disabled={salvando}
                            maxLength={100}
                            autoFocus
                        />
                    </div>

                    {/* Banco */}
                    <div className="cbt-field">
                        <label className="cbt-label">
                            Banco
                            <span className="cbt-label-opt">opcional</span>
                        </label>
                        <input
                            type="text"
                            className="cbt-input"
                            value={form.banco}
                            onChange={e => atualizar("banco", e.target.value)}
                            placeholder="Ex: Inter, Caixa, Itaú"
                            disabled={salvando}
                            maxLength={50}
                        />
                    </div>

                    {/* Saldo inicial (só na criação) */}
                    {!ehEdicao && (
                        <div className="cbt-field">
                            <label className="cbt-label">Saldo atual da conta (R$) *</label>
                            <input
                                type="text"
                                className="cbt-input"
                                value={form.saldoInicial}
                                onChange={e => atualizar("saldoInicial", mascaraMoeda(e.target.value))}
                                placeholder="0,00"
                                disabled={salvando}
                            />
                            <small className="cbt-hint">
                                Olhe o app do banco e digite o saldo de hoje.
                                A partir daqui, toda baixa atualiza automaticamente.
                            </small>
                        </div>
                    )}

                    {/* Aviso de edição */}
                    {ehEdicao && (
                        <div className="cbt-info-box">
                            ℹ️ Para alterar o saldo da conta, use o botão{" "}
                            <strong>"Ajustar saldo"</strong> no card da conta.
                            Edição direta do saldo inicial não é permitida pra preservar o histórico.
                        </div>
                    )}

                    {/* Conta principal */}
                    <label className="cbt-checkbox">
                        <input
                            type="checkbox"
                            checked={!!form.principal}
                            onChange={e => atualizar("principal", e.target.checked)}
                            disabled={salvando}
                        />
                        <span className="cbt-checkbox-text">
                            Conta principal
                            <span className="cbt-checkbox-hint">
                                (usada por padrão em recebimentos e pagamentos)
                            </span>
                        </span>
                    </label>

                    {erro && <div className="cbt-erro">{erro}</div>}
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        className="ph-btn ph-btn--ghost"
                        onClick={onFechar}
                        disabled={salvando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="ph-btn ph-btn--primary"
                        disabled={salvando || !form.nomeConta.trim()}
                    >
                        {salvando ? "Salvando..." : (ehEdicao ? "Salvar" : "Criar conta")}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   AjustarSaldoModal — Cria movimento de ajuste
   ═════════════════════════════════════════════════════════════════════════════ */

function AjustarSaldoModal({ open, conta, onConfirmar, onFechar }) {
    const [saldoReal, setSaldoReal] = useState("");
    const [motivo,    setMotivo]    = useState("");
    const [erro,      setErro]      = useState("");
    const [salvando,  setSalvando]  = useState(false);

    // Inicializa saldo quando modal abre
    useEffect(() => {
        if (open && conta) {
            setSaldoReal(formatarMoedaParaInput(conta.saldoAtual));
            setMotivo("");
            setErro("");
        }
    }, [open, conta]);

    if (!conta) return null;

    const saldoAtualNum = Number(conta.saldoAtual);
    const saldoRealNum  = parseMoeda(saldoReal);
    const diferenca     = saldoRealNum - saldoAtualNum;
    const haDiferenca   = Math.abs(diferenca) >= 0.01;

    async function confirmar() {
        setErro("");
        if (!haDiferenca) {
            setErro("O saldo informado é igual ao atual — sem ajuste necessário");
            return;
        }
        setSalvando(true);
        try {
            await onConfirmar({
                saldoReal: saldoRealNum,
                motivo: motivo || null,
            });
            setSaldoReal("");
            setMotivo("");
            setSalvando(false);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao ajustar saldo");
            setSalvando(false);
        }
    }

    function handleClose() {
        if (salvando) return;
        onFechar();
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={`Ajustar saldo: ${conta.nomeConta}`}
            size="sm"
        >
            <Modal.Body>
                <div className="cbt-info-box">
                    Saldo atual no Whallet: <strong>{fmtValor(conta.saldoAtual)}</strong>
                    <br/>
                    Confira o saldo real no app do seu banco e informe abaixo. O Whallet vai criar
                    um movimento de ajuste com a diferença, preservando o histórico.
                </div>

                <div className="cbt-field">
                    <label className="cbt-label">Saldo real da conta (R$)</label>
                    <input
                        type="text"
                        className="cbt-input"
                        value={saldoReal}
                        onChange={e => setSaldoReal(mascaraMoeda(e.target.value))}
                        placeholder="0,00"
                        autoFocus
                        disabled={salvando}
                    />
                </div>

                {haDiferenca && (
                    <div className={`cbt-diff cbt-diff--${diferenca > 0 ? "credit" : "debit"}`}>
                        <strong>{diferenca > 0 ? "Crédito" : "Débito"} de ajuste:</strong>{" "}
                        {fmtValor(Math.abs(diferenca))}
                    </div>
                )}

                <div className="cbt-field">
                    <label className="cbt-label">
                        Motivo
                        <span className="cbt-label-opt">opcional</span>
                    </label>
                    <input
                        type="text"
                        className="cbt-input"
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                        placeholder="Ex: Conferência com app do banco"
                        disabled={salvando}
                        maxLength={255}
                    />
                </div>

                {erro && <div className="cbt-erro">{erro}</div>}
            </Modal.Body>

            <Modal.Footer>
                <button
                    className="ph-btn ph-btn--ghost"
                    onClick={handleClose}
                    disabled={salvando}
                >
                    Cancelar
                </button>
                <button
                    className="ph-btn ph-btn--primary"
                    onClick={confirmar}
                    disabled={salvando || !haDiferenca}
                >
                    {salvando ? "Ajustando..." : "Confirmar ajuste"}
                </button>
            </Modal.Footer>
        </Modal>
    );
}

/* ═════════════════════════════════════════════════════════════════════════════
   ESTILOS LOCAIS — escopo .cbt-*
   ═════════════════════════════════════════════════════════════════════════════ */

const LOADING_CSS = `
.cbt-loading {
    padding: 60px 20px;
    text-align: center;
    color: var(--text-dim);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 14px;
}
.cbt-spinner {
    animation: cbtSpin 1s linear infinite;
    color: var(--cyan-dark);
}
@keyframes cbtSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
`;

const COMPONENT_CSS = `
/* ── Empty state wrap ─────────────────────────────────────────────────── */

.cbt-empty-wrap {
    margin: 16px auto 0;
}

/* ── Header da seção ──────────────────────────────────────────────────── */

.cbt-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.cbt-head-text {
    flex: 1;
    min-width: 0;
}

.cbt-head-title {
    margin: 0;
    font-family: var(--ff-sans);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: var(--navy-deep);
}

.cbt-head-desc {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-muted);
}

/* ── Grid de cards ────────────────────────────────────────────────────── */

.cbt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
}

/* ── Card individual ──────────────────────────────────────────────────── */

.cbt-card {
    padding: 18px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
    transition: border-color 0.15s, transform 0.15s;
}

.cbt-card:hover {
    border-color: var(--cyan);
}

.cbt-card-head {
    margin-bottom: 14px;
}

.cbt-card-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--navy-deep);
    line-height: 1.3;
}

.cbt-card-star {
    color: var(--warning);
    line-height: 0;
    display: inline-flex;
}

.cbt-card-bank {
    margin-top: 2px;
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* ── Saldo ────────────────────────────────────────────────────────────── */

.cbt-card-saldo {
    margin-bottom: 14px;
}

.cbt-card-saldo-label {
    font-family: var(--ff-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 4px;
}

.cbt-card-saldo-value {
    font-family: var(--ff-sans);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--navy-deep);
    font-variant-numeric: tabular-nums;
}

.cbt-card-saldo-value.negative {
    color: var(--error);
}

.cbt-card-saldo-meta {
    margin-top: 6px;
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--text-dim);
}

/* ── Ações do card ────────────────────────────────────────────────────── */

.cbt-card-actions {
    display: flex;
    gap: 6px;
}

.cbt-action-main {
    flex: 1;
    font-size: 12px;
    padding: 7px 12px;
    justify-content: center;
}

.cbt-action-icon {
    width: 32px;
    height: 32px;
}

.cbt-action-danger:hover:not(:disabled) {
    color: var(--error) !important;
    border-color: rgba(229, 72, 77, 0.3) !important;
    background: var(--error-bg) !important;
}

/* ── Form fields (modal) ──────────────────────────────────────────────── */

.cbt-field {
    margin-bottom: 16px;
}

.cbt-field:last-child {
    margin-bottom: 0;
}

.cbt-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink-2);
}

.cbt-label-opt {
    font-weight: 400;
    font-size: 11px;
    color: var(--text-dim);
}

.cbt-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1.5px solid var(--hair);
    background: var(--surface);
    color: var(--text);
    font-family: var(--ff-sans);
    font-size: 14px;
    letter-spacing: -0.005em;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
}

.cbt-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 0 3px rgba(21, 195, 221, 0.1);
}

.cbt-input:disabled {
    background: var(--bg);
    color: var(--text-dim);
    cursor: not-allowed;
}

.cbt-hint {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
}

/* ── Info box ─────────────────────────────────────────────────────────── */

.cbt-info-box {
    padding: 12px 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    background: var(--cyan-soft);
    border: 1px solid rgba(21, 195, 221, 0.2);
    font-size: 12px;
    line-height: 1.55;
    color: var(--ink-2);
}

.cbt-info-box strong {
    color: var(--navy-deep);
    font-weight: 600;
}

/* ── Diferença (ajuste) ───────────────────────────────────────────────── */

.cbt-diff {
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--ink-2);
    border: 1px solid;
}

.cbt-diff--credit {
    background: var(--success-bg);
    border-color: rgba(24, 178, 107, 0.25);
}

.cbt-diff--credit strong {
    color: var(--success);
    font-weight: 700;
}

.cbt-diff--debit {
    background: var(--error-bg);
    border-color: rgba(229, 72, 77, 0.20);
}

.cbt-diff--debit strong {
    color: var(--error);
    font-weight: 700;
}

/* ── Checkbox ─────────────────────────────────────────────────────────── */

.cbt-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin-top: 4px;
    padding: 4px 0;
}

.cbt-checkbox input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--cyan);
    cursor: pointer;
}

.cbt-checkbox-text {
    font-size: 13px;
    color: var(--navy-deep);
    letter-spacing: -0.005em;
}

.cbt-checkbox-hint {
    color: var(--text-dim);
    font-size: 11px;
    margin-left: 4px;
}

/* ── Erro inline ──────────────────────────────────────────────────────── */

.cbt-erro {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--error-bg);
    border: 1px solid rgba(229, 72, 77, 0.2);
    color: var(--error);
    font-size: 13px;
    line-height: 1.4;
    margin-top: 12px;
    margin-bottom: 12px;
}

/* ── Responsivo ───────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .cbt-head {
        flex-direction: column;
        align-items: stretch;
    }

    .cbt-head .ph-btn {
        width: 100%;
        justify-content: center;
    }

    .cbt-grid {
        grid-template-columns: 1fr;
    }

    .cbt-card-saldo-value {
        font-size: 22px;
    }
}
`;
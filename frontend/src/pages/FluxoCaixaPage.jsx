import { useState, useEffect, useCallback, memo } from "react";
import api from "../services/api.js";
import {
    LuActivity, LuPiggyBank, LuTrendingUp, LuTrendingDown, LuScale,
    LuPlus, LuPencil, LuTrash2, LuX, LuLoader,
    LuCircleAlert, LuCircleCheck, LuStar, LuRefreshCw, LuLandmark,
    LuArrowDownLeft, LuArrowUpRight, LuUndo2, LuSettings2, LuFileText,
    LuChevronLeft, LuChevronRight,
} from "react-icons/lu";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const SITUACAO_INFO = {
    POSITIVO: { cor: "#10B981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)", emoji: "🎉" },
    NEUTRO:   { cor: "#0EA5E9", bg: "rgba(14,165,233,0.08)",  border: "rgba(14,165,233,0.25)", emoji: "👍" },
    ATENCAO:  { cor: "#D4A017", bg: "rgba(212,160,23,0.10)",  border: "rgba(212,160,23,0.30)", emoji: "⚠️" },
    NEGATIVO: { cor: "#DC2626", bg: "rgba(220,38,38,0.06)",   border: "rgba(220,38,38,0.20)",  emoji: "🚨" },
};

const CONTA_VAZIA = {
    nomeConta: "",
    banco: "",
    saldoInicial: "",
    principal: false,
};

const TABS = [
    { key: "saude",   label: "Saúde do Mês",     icon: LuActivity },
    { key: "contas",  label: "Contas Bancárias", icon: LuLandmark },
    { key: "extrato", label: "Extrato",          icon: LuFileText },
];

// Mapa visual de tipos de movimento (cor/ícone/label)
const TIPO_INFO = {
    RECEBIMENTO:         { label: "Recebimento",        cor: "#10B981", ehEntrada: true,  icon: LuArrowDownLeft },
    PAGAMENTO:           { label: "Pagamento",          cor: "#DC2626", ehEntrada: false, icon: LuArrowUpRight },
    AJUSTE_MANUAL:       { label: "Ajuste manual",      cor: "#0EA5E9", ehEntrada: null,  icon: LuSettings2 },
    SALDO_INICIAL:       { label: "Saldo inicial",      cor: "#94A3B8", ehEntrada: true,  icon: LuPiggyBank },
    ESTORNO_RECEBIMENTO: { label: "Estorno recebimento",cor: "#D97706", ehEntrada: false, icon: LuUndo2 },
    ESTORNO_PAGAMENTO:   { label: "Estorno pagamento",  cor: "#D97706", ehEntrada: true,  icon: LuUndo2 },
};

const PERIODOS_RAPIDOS = [
    { key: "30d",  label: "Últimos 30 dias",  dias: 30 },
    { key: "60d",  label: "Últimos 60 dias",  dias: 60 },
    { key: "90d",  label: "Últimos 90 dias",  dias: 90 },
    { key: "ano",  label: "Este ano",         dias: null }, // calculado dinamicamente
    { key: "tudo", label: "Tudo",             dias: -1   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtValor(v) {
    if (v == null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function fmtData(d) {
    if (!d) return "—";
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
}

function mascaraMoeda(valor) {
    const nums = String(valor).replace(/\D/g, "");
    if (!nums) return "";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .format(parseFloat(nums) / 100);
}

function parseMoeda(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;
    return parseFloat(String(valor).replace(/\./g, "").replace(",", ".")) || 0;
}

function formatarMoedaParaInput(valor) {
    if (valor == null) return "";
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(valor));
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Saúde do Mês (cards grandes + alerta)
// ─────────────────────────────────────────────────────────────────────────────
function SaudeDoMes({ saude, carregando, onRecarregar }) {
    if (carregando) {
        return (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-dim)" }}>
                <LuLoader size={24} style={{ animation: "spin 1s linear infinite" }}/>
                <div style={{ marginTop: 8 }}>Calculando saúde do mês...</div>
            </div>
        );
    }

    if (!saude) return null;

    const sit = SITUACAO_INFO[saude.situacao] ?? SITUACAO_INFO.NEUTRO;

    return (
        <div>
            {/* Cards principais */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14, marginBottom: 20,
            }}>
                <CardNumero
                    label="Saldo atual"
                    valor={fmtValor(saude.saldoAtual)}
                    icone={<LuPiggyBank size={20}/>}
                    cor="var(--cyan-dark)"
                    sublabel={`${saude.qtdContasBancarias} ${saude.qtdContasBancarias === 1 ? "conta" : "contas"}`}
                />
                <CardNumero
                    label="A receber este mês"
                    valor={fmtValor(saude.aReceberMes)}
                    icone={<LuTrendingUp size={20}/>}
                    cor="#10B981"
                    sublabel={saude.qtdRecebimentosAtrasados > 0
                        ? `${saude.qtdRecebimentosAtrasados} atrasado(s)`
                        : "Em dia"}
                />
                <CardNumero
                    label="A pagar este mês"
                    valor={fmtValor(saude.aPagarMes)}
                    icone={<LuTrendingDown size={20}/>}
                    cor="#DC2626"
                    sublabel={saude.qtdTitulosAtrasados > 0
                        ? `${saude.qtdTitulosAtrasados} atrasado(s)`
                        : "Em dia"}
                />
                <CardNumero
                    label={saude.sobraOuFalta >= 0 ? "Sobra projetada" : "Falta projetada"}
                    valor={fmtValor(Math.abs(saude.sobraOuFalta))}
                    icone={<LuScale size={20}/>}
                    cor={sit.cor}
                    destaque={true}
                />
            </div>

            {/* Mensagem da situação */}
            <div style={{
                padding: "16px 20px", borderRadius: 12, marginBottom: 16,
                background: sit.bg,
                border: `1px solid ${sit.border}`,
                display: "flex", alignItems: "center", gap: 12,
            }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{sit.emoji}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: sit.cor, marginBottom: 2 }}>
                        Situação do mês
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>
                        {saude.mensagemSituacao}
                    </div>
                </div>
            </div>

            {/* Alerta preditivo */}
            {saude.alertaPreditivo && (
                <div style={{
                    padding: "16px 20px", borderRadius: 12, marginBottom: 16,
                    background: "rgba(220,38,38,0.06)",
                    border: "1px solid rgba(220,38,38,0.25)",
                    display: "flex", alignItems: "center", gap: 12,
                }}>
                    <LuCircleAlert size={22} style={{ color: "#DC2626", flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 2 }}>
                            Alerta preditivo
                        </div>
                        <div style={{ fontSize: 14, color: "var(--text)" }}>
                            {saude.alertaPreditivo.mensagem}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                            Em {saude.alertaPreditivo.diasAteCritico} dia(s) — {fmtData(saude.alertaPreditivo.dataCritica)}
                        </div>
                    </div>
                </div>
            )}

            {/* Mensagem se não tem conta cadastrada */}
            {saude.qtdContasBancarias === 0 && (
                <div style={{
                    padding: 24, borderRadius: 12, marginTop: 16,
                    background: "var(--surface)",
                    border: "1px dashed var(--border)",
                    textAlign: "center",
                }}>
                    <LuPiggyBank size={32} style={{ color: "var(--text-dim)", margin: "0 auto 12px", display: "block" }}/>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        Cadastre sua primeira conta bancária
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        Pra acompanhar saldo real, recebimentos e pagamentos automaticamente,
                        cadastre suas contas na aba "Contas Bancárias".
                    </div>
                </div>
            )}

            {/* Botão recarregar */}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={onRecarregar} className="btn-secondary"
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <LuRefreshCw size={12}/> Atualizar
                </button>
            </div>
        </div>
    );
}

function CardNumero({ label, valor, icone, cor, sublabel, destaque }) {
    return (
        <div style={{
            padding: "16px 18px", borderRadius: 12,
            background: destaque ? `${cor}10` : "var(--surface)",
            border: destaque ? `1.5px solid ${cor}40` : "1px solid var(--border)",
            transition: "all 0.15s",
        }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 11,
                color: "var(--text-dim)", marginBottom: 8,
                fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
                <span style={{ color: cor, lineHeight: 0 }}>{icone}</span>
                {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: destaque ? cor : "var(--text)", lineHeight: 1.1 }}>
                {valor}
            </div>
            {sublabel && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    {sublabel}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Aba Contas Bancárias
// ─────────────────────────────────────────────────────────────────────────────
function ContasBancarias({ contas, carregando, onRecarregar, onCriar, onEditar, onAjustar, onInativar }) {
    if (carregando) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>
                <LuLoader size={20} style={{ animation: "spin 1s linear infinite" }}/>
                <div style={{ marginTop: 8 }}>Carregando contas...</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
                        Contas bancárias
                    </h2>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                        Cadastre suas contas. Toda baixa de recebimento ou pagamento atualiza o saldo automaticamente.
                    </p>
                </div>
                <button onClick={onCriar} className="auth-box-btn"
                        style={{ width: "auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 6 }}>
                    <LuPlus size={16}/> Nova conta
                </button>
            </div>

            {contas.length === 0 ? (
                <div style={{
                    padding: 40, textAlign: "center", borderRadius: 12,
                    background: "var(--surface)", border: "1px dashed var(--border)",
                }}>
                    <LuLandmark size={32} style={{ color: "var(--text-dim)", margin: "0 auto 12px", display: "block" }}/>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        Nenhuma conta cadastrada
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                        Cadastre sua primeira conta para acompanhar saldo, receber e pagar.
                    </div>
                    <button onClick={onCriar} className="auth-box-btn"
                            style={{ width: "auto", padding: "10px 20px" }}>
                        <LuPlus size={14} style={{ marginRight: 6 }}/>
                        Cadastrar primeira conta
                    </button>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 12,
                }}>
                    {contas.map(c => (
                        <CardConta
                            key={c.id}
                            conta={c}
                            onEditar={() => onEditar(c)}
                            onAjustar={() => onAjustar(c)}
                            onInativar={() => onInativar(c)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CardConta({ conta, onEditar, onAjustar, onInativar }) {
    const variou = Number(conta.saldoAtual) !== Number(conta.saldoInicial);

    return (
        <div style={{
            padding: 16, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            transition: "all 0.15s",
        }} className="conta-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                            {conta.nomeConta}
                        </span>
                        {conta.principal && (
                            <span title="Conta principal" style={{
                                color: "#D4A017", lineHeight: 0, display: "inline-flex",
                            }}>
                                <LuStar size={14} style={{ fill: "#D4A017" }}/>
                            </span>
                        )}
                    </div>
                    {conta.banco && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{conta.banco}</div>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 2,
                    textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                    Saldo atual
                </div>
                <div style={{
                    fontSize: 24, fontWeight: 700, lineHeight: 1.1,
                    color: Number(conta.saldoAtual) < 0 ? "#DC2626" : "var(--text)",
                }}>
                    {fmtValor(conta.saldoAtual)}
                </div>
                {variou && (
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                        Inicial: {fmtValor(conta.saldoInicial)} ({fmtData(conta.dataInicial)})
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={onAjustar} className="btn-secondary"
                        style={{ flex: 1, fontSize: 12, padding: "7px 12px" }}
                        title="Ajustar saldo (cria movimento de ajuste)">
                    <LuRefreshCw size={12} style={{ marginRight: 4 }}/>
                    Ajustar saldo
                </button>
                <button onClick={onEditar} className="btn-secondary"
                        style={{ padding: "7px 10px" }} title="Editar dados">
                    <LuPencil size={13}/>
                </button>
                <button onClick={onInativar} className="btn-secondary"
                        style={{ padding: "7px 10px", color: "#DC2626" }} title="Inativar conta">
                    <LuTrash2 size={13}/>
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Criar/Editar Conta
// ─────────────────────────────────────────────────────────────────────────────
const ContaModal = memo(function ContaModal({ conta, onSalvar, onFechar, salvando }) {
    const ehEdicao = !!conta;

    const [form, setForm] = useState(() => {
        if (conta) {
            return {
                nomeConta: conta.nomeConta ?? "",
                banco: conta.banco ?? "",
                saldoInicial: formatarMoedaParaInput(conta.saldoInicial),
                principal: !!conta.principal,
            };
        }
        return { ...CONTA_VAZIA, saldoInicial: "" };
    });
    const [erro, setErro] = useState("");

    function atualizar(c, v) { setForm(p => ({ ...p, [c]: v })); }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (!form.nomeConta.trim()) { setErro("Nome da conta é obrigatório"); return; }

        try {
            if (ehEdicao) {
                // Edição: NÃO envia saldo inicial (imutável)
                await onSalvar({
                    nomeConta: form.nomeConta.trim(),
                    banco: form.banco || null,
                    principal: !!form.principal,
                });
            } else {
                // Criação: envia saldo inicial
                const saldoNum = parseMoeda(form.saldoInicial);
                await onSalvar({
                    nomeConta: form.nomeConta.trim(),
                    banco: form.banco || null,
                    saldoInicial: saldoNum,
                    principal: !!form.principal,
                });
            }
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao salvar conta");
        }
    }

    return (
        <div style={overlayStyle} onClick={onFechar}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        {ehEdicao ? "Editar conta" : "Nova conta bancária"}
                    </h2>
                    <button onClick={onFechar} style={closeBtn}><LuX size={20}/></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
                    <div className="field-group">
                        <label>Nome da conta *</label>
                        <input
                            type="text" value={form.nomeConta}
                            onChange={e => atualizar("nomeConta", e.target.value)}
                            placeholder="ex: Conta Inter, Caixa MEI"
                            required disabled={salvando} maxLength={100} autoFocus
                        />
                    </div>

                    <div className="field-group">
                        <label>
                            Banco{" "}
                            <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 11 }}>
                                (opcional)
                            </span>
                        </label>
                        <input
                            type="text" value={form.banco}
                            onChange={e => atualizar("banco", e.target.value)}
                            placeholder="ex: Inter, Caixa, Itaú"
                            disabled={salvando} maxLength={50}
                        />
                    </div>

                    {!ehEdicao && (
                        <>
                            <div className="field-group">
                                <label>Saldo atual da conta (R$) *</label>
                                <input
                                    type="text" value={form.saldoInicial}
                                    onChange={e => atualizar("saldoInicial", mascaraMoeda(e.target.value))}
                                    placeholder="0,00"
                                    disabled={salvando}
                                />
                                <small style={{ color: "var(--text-dim)", fontSize: 11 }}>
                                    Olhe o app do banco e digite o saldo de hoje. A partir daqui,
                                    toda baixa atualiza automaticamente.
                                </small>
                            </div>
                        </>
                    )}

                    {ehEdicao && (
                        <div style={{
                            padding: "10px 12px", borderRadius: 8, marginBottom: 12,
                            background: "rgba(212,160,23,0.08)",
                            border: "1px solid rgba(212,160,23,0.20)",
                            fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5,
                        }}>
                            ℹ️ Para alterar o saldo da conta, use o botão <strong>"Ajustar saldo"</strong>{" "}
                            no card. Edição direta do saldo inicial não é permitida pra preservar o histórico.
                        </div>
                    )}

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
                        <input
                            type="checkbox" checked={!!form.principal}
                            onChange={e => atualizar("principal", e.target.checked)}
                            disabled={salvando}
                            style={{ margin: 0 }}
                        />
                        <span style={{ fontSize: 13, color: "var(--text)" }}>
                            Conta principal{" "}
                            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>
                                (usada por padrão em recebimentos e pagamentos)
                            </span>
                        </span>
                    </label>

                    {erro && (
                        <div style={erroBoxStyle}>{erro}</div>
                    )}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
                        <button type="button" onClick={onFechar} className="btn-secondary" disabled={salvando}>
                            Cancelar
                        </button>
                        <button type="submit" className="auth-box-btn" disabled={salvando || !form.nomeConta.trim()}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            {salvando ? "Salvando..." : (ehEdicao ? "Salvar" : "Criar conta")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Ajustar Saldo (cria movimento AJUSTE_MANUAL)
// ─────────────────────────────────────────────────────────────────────────────
function AjustarSaldoModal({ conta, onConfirmar, onFechar }) {
    const [saldoReal, setSaldoReal] = useState(formatarMoedaParaInput(conta.saldoAtual));
    const [motivo, setMotivo] = useState("");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    const saldoAtualNum = Number(conta.saldoAtual);
    const saldoRealNum = parseMoeda(saldoReal);
    const diferenca = saldoRealNum - saldoAtualNum;

    async function confirmar() {
        setErro("");
        if (Math.abs(diferenca) < 0.01) {
            setErro("O saldo informado é igual ao atual — sem ajuste necessário");
            return;
        }
        setSalvando(true);
        try {
            await onConfirmar({ saldoReal: saldoRealNum, motivo: motivo || null });
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao ajustar saldo");
            setSalvando(false);
        }
    }

    return (
        <div style={overlayStyle} onClick={onFechar}>
            <div style={{ ...modalStyle, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                        Ajustar saldo: {conta.nomeConta}
                    </h2>
                    <button onClick={onFechar} style={closeBtn}><LuX size={18}/></button>
                </div>
                <div style={{ padding: "16px 24px" }}>
                    <div style={{
                        padding: "12px 14px", borderRadius: 8, marginBottom: 16,
                        background: "var(--surface)", border: "1px solid var(--border)",
                        fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
                    }}>
                        Saldo atual no Whallet: <strong style={{ color: "var(--text)" }}>{fmtValor(conta.saldoAtual)}</strong>
                        <br/>
                        Confira o saldo real no app do seu banco e informe abaixo. Vou criar
                        um movimento de ajuste com a diferença, preservando o histórico.
                    </div>

                    <div className="field-group">
                        <label>Saldo real da conta (R$)</label>
                        <input
                            type="text" value={saldoReal}
                            onChange={e => setSaldoReal(mascaraMoeda(e.target.value))}
                            placeholder="0,00"
                            autoFocus disabled={salvando}
                        />
                    </div>

                    {Math.abs(diferenca) >= 0.01 && (
                        <div style={{
                            padding: "10px 12px", borderRadius: 8, marginBottom: 12,
                            background: diferenca > 0 ? "rgba(16,185,129,0.08)" : "rgba(220,38,38,0.06)",
                            border: `1px solid ${diferenca > 0 ? "rgba(16,185,129,0.25)" : "rgba(220,38,38,0.20)"}`,
                            fontSize: 13, color: "var(--text)",
                        }}>
                            <strong>{diferenca > 0 ? "Crédito" : "Débito"} de ajuste:</strong>{" "}
                            {fmtValor(Math.abs(diferenca))}
                        </div>
                    )}

                    <div className="field-group">
                        <label>
                            Motivo{" "}
                            <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: 11 }}>
                                (opcional)
                            </span>
                        </label>
                        <input
                            type="text" value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            placeholder="ex: Conferência com app do banco"
                            disabled={salvando} maxLength={255}
                        />
                    </div>

                    {erro && <div style={erroBoxStyle}>{erro}</div>}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                        <button onClick={onFechar} className="btn-secondary" disabled={salvando}>
                            Cancelar
                        </button>
                        <button onClick={confirmar} className="auth-box-btn"
                                disabled={salvando || Math.abs(diferenca) < 0.01}
                                style={{ width: "auto", padding: "10px 20px" }}>
                            {salvando ? "Ajustando..." : "Confirmar ajuste"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Aba Extrato
// ─────────────────────────────────────────────────────────────────────────────
function ExtratoTab({ contas }) {
    const [movimentos,  setMovimentos]   = useState([]);
    const [carregando,  setCarregando]   = useState(true);
    const [erro,        setErro]         = useState("");

    // Filtros
    const [filtroConta,    setFiltroConta]    = useState("");
    const [filtroTipo,     setFiltroTipo]     = useState("");
    const [periodoRapido,  setPeriodoRapido]  = useState("30d");
    const [dataInicio,     setDataInicio]     = useState("");
    const [dataFim,        setDataFim]        = useState("");

    // Paginação
    const [pagina,         setPagina]         = useState(0);
    const [totalPaginas,   setTotalPaginas]   = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);

    // Calcula período do filtro rápido
    const calcularPeriodoRapido = useCallback((key) => {
        const hojeStr = new Date().toISOString().split("T")[0];
        if (key === "tudo") return { inicio: "", fim: "" };
        if (key === "ano") {
            const ano = new Date().getFullYear();
            return { inicio: `${ano}-01-01`, fim: hojeStr };
        }
        const opt = PERIODOS_RAPIDOS.find(p => p.key === key);
        if (!opt || !opt.dias) return { inicio: "", fim: hojeStr };
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - opt.dias);
        return { inicio: inicio.toISOString().split("T")[0], fim: hojeStr };
    }, []);

    // Aplica período rápido ao mudar
    useEffect(() => {
        if (periodoRapido) {
            const { inicio, fim } = calcularPeriodoRapido(periodoRapido);
            setDataInicio(inicio);
            setDataFim(fim);
            setPagina(0);
        }
    }, [periodoRapido, calcularPeriodoRapido]);

    // Carregamento
    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const params = new URLSearchParams();
            params.set("pagina", pagina);
            params.set("tamanho", "25");
            if (filtroConta) params.set("contaId", filtroConta);
            if (filtroTipo)  params.set("tipo", filtroTipo);
            if (dataInicio)  params.set("dataInicio", dataInicio);
            if (dataFim)     params.set("dataFim", dataFim);

            const { data } = await api.get(`/api/movimentos-bancarios?${params}`);
            setMovimentos(data.content ?? []);
            setTotalPaginas(data.totalPages ?? 0);
            setTotalElementos(data.totalElements ?? 0);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar extrato");
            setMovimentos([]);
        } finally {
            setCarregando(false);
        }
    }, [pagina, filtroConta, filtroTipo, dataInicio, dataFim]);

    useEffect(() => { carregar(); }, [carregar]);

    function aplicarPeriodoCustomizado() {
        setPeriodoRapido(""); // limpa o "rápido" pra indicar custom
        setPagina(0);
        carregar();
    }

    function limparFiltros() {
        setFiltroConta("");
        setFiltroTipo("");
        setPeriodoRapido("30d");
        setPagina(0);
    }

    // Calcular saldo do período (entradas - saídas dos movimentos visíveis)
    const totalEntradas = movimentos
        .filter(m => m.ehEntrada && !m.cancelado)
        .reduce((acc, m) => acc + Number(m.valor), 0);
    const totalSaidas = movimentos
        .filter(m => !m.ehEntrada && !m.cancelado)
        .reduce((acc, m) => acc + Number(m.valor), 0);

    // Agrupar movimentos por dia
    const grupos = movimentos.reduce((acc, m) => {
        const dia = m.dataMovimento;
        if (!acc[dia]) acc[dia] = [];
        acc[dia].push(m);
        return acc;
    }, {});
    const diasOrdenados = Object.keys(grupos).sort().reverse();

    return (
        <div>
            {/* Filtros */}
            <div style={{
                padding: 16, borderRadius: 12, marginBottom: 16,
                background: "var(--surface)", border: "1px solid var(--border)",
            }}>
                {/* Linha 1: períodos rápidos */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {PERIODOS_RAPIDOS.map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPeriodoRapido(p.key)}
                            style={{
                                padding: "6px 14px", borderRadius: 999,
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                                border: "1px solid",
                                borderColor: periodoRapido === p.key ? "var(--cyan-deep)" : "var(--border)",
                                background: periodoRapido === p.key ? "rgba(21,195,221,0.08)" : "var(--bg)",
                                color: periodoRapido === p.key ? "var(--cyan-dark)" : "var(--text-muted)",
                                transition: "all 0.15s",
                            }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Linha 2: filtros conta + tipo + datas */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                    alignItems: "end",
                }}>
                    <div>
                        <label style={filtroLabel}>Conta</label>
                        <select value={filtroConta}
                                onChange={e => { setFiltroConta(e.target.value); setPagina(0); }}
                                style={filtroInput}>
                            <option value="">Todas as contas</option>
                            {contas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nomeConta}{c.banco ? ` — ${c.banco}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={filtroLabel}>Tipo de movimento</label>
                        <select value={filtroTipo}
                                onChange={e => { setFiltroTipo(e.target.value); setPagina(0); }}
                                style={filtroInput}>
                            <option value="">Todos os tipos</option>
                            {Object.entries(TIPO_INFO).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={filtroLabel}>Data início</label>
                        <input type="date" value={dataInicio}
                               onChange={e => { setDataInicio(e.target.value); setPeriodoRapido(""); }}
                               style={filtroInput}/>
                    </div>

                    <div>
                        <label style={filtroLabel}>Data fim</label>
                        <input type="date" value={dataFim}
                               onChange={e => { setDataFim(e.target.value); setPeriodoRapido(""); }}
                               style={filtroInput}/>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                        {!periodoRapido && (dataInicio || dataFim) && (
                            <button onClick={aplicarPeriodoCustomizado} className="auth-box-btn"
                                    style={{ width: "auto", padding: "8px 16px", fontSize: 12 }}>
                                Aplicar
                            </button>
                        )}
                        <button onClick={limparFiltros} className="btn-secondary"
                                style={{ padding: "8px 12px", fontSize: 12 }} title="Limpar filtros">
                            <LuRefreshCw size={12}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Resumo do período */}
            {!carregando && movimentos.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12, marginBottom: 16,
                }}>
                    <ResumoExtratoBox
                        label="Entradas no período"
                        valor={fmtValor(totalEntradas)}
                        cor="#10B981"
                        icon={<LuArrowDownLeft size={18}/>}/>
                    <ResumoExtratoBox
                        label="Saídas no período"
                        valor={fmtValor(totalSaidas)}
                        cor="#DC2626"
                        icon={<LuArrowUpRight size={18}/>}/>
                    <ResumoExtratoBox
                        label="Saldo do período"
                        valor={fmtValor(totalEntradas - totalSaidas)}
                        cor={totalEntradas - totalSaidas >= 0 ? "#10B981" : "#DC2626"}
                        icon={<LuScale size={18}/>}/>
                    <ResumoExtratoBox
                        label="Total de lançamentos"
                        valor={String(totalElementos)}
                        cor="var(--cyan-dark)"
                        icon={<LuFileText size={18}/>}/>
                </div>
            )}

            {erro && <div style={erroBoxStyle}>{erro}</div>}

            {/* Lista de movimentos */}
            {carregando ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-dim)" }}>
                    <LuLoader size={20} style={{ animation: "spin 1s linear infinite" }}/>
                    <div style={{ marginTop: 8 }}>Carregando extrato...</div>
                </div>
            ) : movimentos.length === 0 ? (
                <div style={{
                    padding: 40, textAlign: "center", borderRadius: 12,
                    background: "var(--surface)", border: "1px dashed var(--border)",
                }}>
                    <LuFileText size={32} style={{ color: "var(--text-dim)", margin: "0 auto 12px", display: "block" }}/>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                        Nenhum lançamento no período
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        Toda baixa de recebimento ou pagamento aparece aqui automaticamente.
                    </div>
                </div>
            ) : (
                <>
                    <div>
                        {diasOrdenados.map(dia => (
                            <div key={dia} style={{ marginBottom: 16 }}>
                                <div style={diaHeaderStyle}>
                                    {fmtDataExtenso(dia)}
                                </div>
                                <div style={{
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 10,
                                    overflow: "hidden",
                                }}>
                                    {grupos[dia].map((m, idx) => (
                                        <MovimentoLinha
                                            key={m.id}
                                            movimento={m}
                                            ultima={idx === grupos[dia].length - 1}/>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginação */}
                    {totalPaginas > 1 && (
                        <div style={{
                            display: "flex", justifyContent: "center", alignItems: "center",
                            gap: 8, marginTop: 24,
                        }}>
                            <button onClick={() => setPagina(p => Math.max(0, p - 1))}
                                    disabled={pagina === 0} className="btn-secondary"
                                    style={{ padding: "8px 12px" }}>
                                <LuChevronLeft size={14}/>
                            </button>
                            <span style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-muted)" }}>
                                Página {pagina + 1} de {totalPaginas}
                            </span>
                            <button onClick={() => setPagina(p => p + 1)}
                                    disabled={pagina >= totalPaginas - 1} className="btn-secondary"
                                    style={{ padding: "8px 12px" }}>
                                <LuChevronRight size={14}/>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ResumoExtratoBox({ label, valor, cor, icon }) {
    return (
        <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "var(--surface)", border: "1px solid var(--border)",
        }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 10,
                color: "var(--text-dim)", marginBottom: 4,
                fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
            }}>
                <span style={{ color: cor, lineHeight: 0 }}>{icon}</span>
                {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: cor, lineHeight: 1.1 }}>{valor}</div>
        </div>
    );
}

function MovimentoLinha({ movimento, ultima }) {
    const info = TIPO_INFO[movimento.tipo] ?? { label: movimento.tipo, cor: "#94A3B8", icon: LuFileText };
    const Icon = info.icon;
    const ehEstorno = movimento.tipo?.startsWith("ESTORNO");

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px",
            borderBottom: ultima ? "none" : "1px solid var(--border)",
            opacity: movimento.cancelado ? 0.5 : 1,
        }}>
            {/* Ícone */}
            <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `${info.cor}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: info.cor, flexShrink: 0,
            }}>
                <Icon size={16}/>
            </div>

            {/* Descrição */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.03em", color: info.cor,
                    }}>
                        {info.label}
                    </span>
                    {movimento.cancelado && (
                        <span style={{
                            fontSize: 9, fontWeight: 700,
                            padding: "1px 6px", borderRadius: 999,
                            background: "rgba(148,163,184,0.15)",
                            color: "#94A3B8",
                        }}>
                            CANCELADO
                        </span>
                    )}
                    {ehEstorno && (
                        <span style={{
                            fontSize: 9, fontWeight: 700,
                            padding: "1px 6px", borderRadius: 999,
                            background: "rgba(217,119,6,0.10)",
                            color: "#D97706",
                        }}>
                            ↩ ESTORNO
                        </span>
                    )}
                </div>
                <div style={{
                    fontSize: 13, color: "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    textDecoration: movimento.cancelado ? "line-through" : "none",
                }}>
                    {movimento.descricao || "—"}
                </div>
                {movimento.conta?.nomeConta && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {movimento.conta.nomeConta}
                    </div>
                )}
            </div>

            {/* Valor */}
            <div style={{
                fontSize: 15, fontWeight: 700, flexShrink: 0,
                color: movimento.ehEntrada ? "#10B981" : "#DC2626",
                fontVariantNumeric: "tabular-nums",
                textDecoration: movimento.cancelado ? "line-through" : "none",
            }}>
                {movimento.ehEntrada ? "+" : "−"} {fmtValor(movimento.valor)}
            </div>
        </div>
    );
}

// Formatar data como "26 de abril, sexta-feira"
function fmtDataExtenso(d) {
    if (!d) return "";
    const data = new Date(d + "T00:00:00");
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);

    if (data.getTime() === hoje.getTime())  return "Hoje · " + data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    if (data.getTime() === ontem.getTime()) return "Ontem · " + data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

    return data.toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
}

// Estilos do filtro
const filtroLabel = {
    fontSize: 11, fontWeight: 600, color: "var(--text-dim)",
    textTransform: "uppercase", letterSpacing: "0.04em",
    display: "block", marginBottom: 4,
};
const filtroInput = {
    width: "100%", padding: "8px 10px", borderRadius: 6,
    border: "1px solid var(--border)", background: "var(--bg)",
    color: "var(--text)", fontSize: 13, boxSizing: "border-box",
};
const diaHeaderStyle = {
    fontSize: 11, fontWeight: 700, color: "var(--text-dim)",
    letterSpacing: "0.06em",
    padding: "0 4px 8px", textTransform: "capitalize",
};

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function FluxoCaixaPage() {
    const [tab, setTab] = useState("saude");

    const [saude, setSaude]               = useState(null);
    const [carregandoSaude, setCarSaude]  = useState(true);

    const [contas, setContas]             = useState([]);
    const [carregandoContas, setCarContas] = useState(true);

    const [erro, setErro] = useState("");

    // Modais
    const [contaModal, setContaModal]     = useState({ aberto: false, conta: null });
    const [ajusteModal, setAjusteModal]   = useState({ aberto: false, conta: null });
    const [salvando, setSalvando]         = useState(false);

    // ── Carregamento ─────────────────────────────────────────────────────────
    const carregarSaude = useCallback(async () => {
        setCarSaude(true);
        setErro("");
        try {
            const { data } = await api.get("/api/fluxo-caixa/saude-mes");
            setSaude(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar saúde do mês");
        } finally {
            setCarSaude(false);
        }
    }, []);

    const carregarContas = useCallback(async () => {
        setCarContas(true);
        try {
            const { data } = await api.get("/api/saldos-bancarios");
            setContas(data);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao carregar contas");
        } finally {
            setCarContas(false);
        }
    }, []);

    useEffect(() => {
        carregarSaude();
        carregarContas();
    }, [carregarSaude, carregarContas]);

    // ── Ações de contas ──────────────────────────────────────────────────────
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
            await Promise.all([carregarContas(), carregarSaude()]);
        } finally {
            setSalvando(false);
        }
    }

    async function inativarConta(conta) {
        if (!window.confirm(`Inativar a conta "${conta.nomeConta}"? Os movimentos dela continuam visíveis no histórico.`)) return;
        try {
            await api.delete(`/api/saldos-bancarios/${conta.id}`);
            await Promise.all([carregarContas(), carregarSaude()]);
        } catch (err) {
            setErro(err.response?.data?.mensagem ?? "Erro ao inativar conta");
        }
    }

    function abrirAjuste(conta) {
        setAjusteModal({ aberto: true, conta });
    }

    async function confirmarAjuste(payload) {
        await api.post(`/api/saldos-bancarios/${ajusteModal.conta.id}/ajustar`, payload);
        setAjusteModal({ aberto: false, conta: null });
        await Promise.all([carregarContas(), carregarSaude()]);
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={containerStyle}>
            {/* Cabeçalho */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{
                    margin: 0, fontSize: 26, fontWeight: 700, color: "var(--text)",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <LuActivity size={26} style={{ color: "var(--cyan-dark)" }}/>
                    Fluxo de Caixa
                </h1>
                <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
                    Saldo atual, projeções e movimentação das suas contas em um só lugar.
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: "flex", gap: 4, marginBottom: 24,
                borderBottom: "1px solid var(--border)",
                flexWrap: "wrap",
            }}>
                {TABS.map(t => {
                    const ativa = tab === t.key;
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => !t.disabled && setTab(t.key)}
                            disabled={t.disabled}
                            style={{
                                padding: "10px 18px",
                                background: "none",
                                border: "none",
                                borderBottom: `2px solid ${ativa ? "var(--cyan-deep)" : "transparent"}`,
                                color: ativa ? "var(--cyan-dark)" : t.disabled ? "var(--text-dim)" : "var(--text-muted)",
                                fontWeight: ativa ? 700 : 500,
                                fontSize: 14,
                                cursor: t.disabled ? "not-allowed" : "pointer",
                                transition: "all 0.15s",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                opacity: t.disabled ? 0.5 : 1,
                                marginBottom: -1,
                            }}>
                            {Icon && <Icon size={14}/>}
                            {t.label}
                            {t.hint && (
                                <span style={{
                                    fontSize: 9, fontWeight: 600,
                                    padding: "1px 6px", borderRadius: 999,
                                    background: "rgba(14,165,233,0.10)",
                                    color: "#0EA5E9",
                                    marginLeft: 2,
                                }}>{t.hint}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {erro && (
                <div style={erroBoxStyle}>{erro}</div>
            )}

            {/* Conteúdo das tabs */}
            {tab === "saude" && (
                <SaudeDoMes
                    saude={saude}
                    carregando={carregandoSaude}
                    onRecarregar={carregarSaude}
                />
            )}

            {tab === "contas" && (
                <ContasBancarias
                    contas={contas}
                    carregando={carregandoContas}
                    onRecarregar={carregarContas}
                    onCriar={abrirNovaConta}
                    onEditar={abrirEdicaoConta}
                    onAjustar={abrirAjuste}
                    onInativar={inativarConta}
                />
            )}

            {tab === "extrato" && (
                <ExtratoTab contas={contas}/>
            )}

            {/* Modais */}
            {contaModal.aberto && (
                <ContaModal
                    conta={contaModal.conta}
                    onSalvar={salvarConta}
                    onFechar={() => setContaModal({ aberto: false, conta: null })}
                    salvando={salvando}
                />
            )}
            {ajusteModal.aberto && (
                <AjustarSaldoModal
                    conta={ajusteModal.conta}
                    onConfirmar={confirmarAjuste}
                    onFechar={() => setAjusteModal({ aberto: false, conta: null })}
                />
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
                .conta-card:hover {
                    border-color: var(--cyan-deep) !important;
                }
                .btn-secondary {
                    padding: 8px 16px;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background: var(--surface);
                    color: var(--text);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-secondary:hover:not(:disabled) {
                    border-color: var(--cyan-deep);
                    color: var(--cyan-dark);
                }
                .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos compartilhados
// ─────────────────────────────────────────────────────────────────────────────
const containerStyle = { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" };
const overlayStyle   = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 };
const modalStyle     = { width: "100%", maxWidth: 480, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" };
const modalHeader    = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" };
const closeBtn       = { background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 4, lineHeight: 0 };
const erroBoxStyle   = { padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", color: "#DC2626", fontSize: 13 };
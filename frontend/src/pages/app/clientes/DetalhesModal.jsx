import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    LuPhone, LuMail, LuPencil, LuExternalLink, LuTriangleAlert,
    LuMapPin, LuMessageCircle, LuCalendar, LuUser, LuTag,
} from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import Tabs  from "../../../components/ui/Tabs.jsx";
import api   from "../../../services/api.js";
import {
    fmtValor, mascaraDocumento, mascaraTelefone, mascaraCep, SCORE_INFO,
} from "./_helpers.js";

export default function DetalhesModal({ cliente, onFechar, onEditar }) {
    const stats     = cliente.estatisticas;
    const scoreInfo = stats?.score ? SCORE_INFO[stats.score] : null;
    const temAtraso = stats && Number(stats.valorTotalAtrasado) > 0;

    const [camposSetor, setCamposSetor] = useState(null);
    const [dadosSetor, setDadosSetor]   = useState({});
    const [abaAtiva, setAbaAtiva]       = useState("geral");
    const [nomeSetor, setNomeSetor]     = useState("");

    useEffect(() => {
        if (!cliente.setorId) return;
        let c = false;
        Promise.all([
            api.get(`/api/setores/${cliente.setorId}/campos`).catch(() => ({ data: null })),
            api.get(`/api/clientes/${cliente.id}/setor-dados`).catch(() => ({ data: {} })),
            api.get("/api/setores").catch(() => ({ data: [] })),
        ]).then(([camposRes, dadosRes, setoresRes]) => {
            if (c) return;
            setCamposSetor(camposRes.data);
            setDadosSetor(dadosRes.data || {});
            const s = (setoresRes.data || []).find(s => s.id === cliente.setorId);
            if (s) setNomeSetor(s.nome);
        });
        return () => { c = true; };
    }, [cliente.setorId, cliente.id]);

    const abas = [{ key: "geral", label: "Geral" }];
    if (cliente.setorId && nomeSetor) abas.push({ key: "setor", label: nomeSetor });

    return (
        <Modal open={true} onClose={onFechar} size="lg" title={cliente.nome}
               description={scoreInfo && (
                   <span className={`dm-score dm-score--${scoreInfo.variant}`}>
                    <span className="dm-score-dot"/>{scoreInfo.label}
                </span>
               )}>
            <Modal.Body>
                {abas.length > 1 && (
                    <div style={{ marginBottom: 16 }}>
                        <Tabs variant="underline" value={abaAtiva} onChange={setAbaAtiva} items={abas} />
                    </div>
                )}

                {/* ════ ABA GERAL ════ */}
                <div style={{ display: abaAtiva === "geral" ? "block" : "none" }}>
                    <Section title="Contato">
                        <div className="dm-info-list">
                            {cliente.telefoneFormatado && <InfoRow icon={LuPhone} text={`Telefone: ${cliente.telefoneFormatado}`} />}
                            {(cliente.whatsappFormatado || cliente.whatsapp) && <InfoRow icon={LuMessageCircle} text={`WhatsApp: ${cliente.whatsappFormatado || mascaraTelefone(cliente.whatsapp)}`} />}
                            {cliente.email && <InfoRow icon={LuMail} text={cliente.email} />}
                            {cliente.telefone2 && <InfoRow icon={LuPhone} text={`Tel. secundário: ${mascaraTelefone(cliente.telefone2)}`} />}
                            {!cliente.telefoneFormatado && !cliente.whatsapp && !cliente.email && (
                                <div className="dm-info-empty">Sem dados de contato cadastrados</div>
                            )}
                        </div>
                    </Section>

                    {(cliente.endereco || cliente.cidade || cliente.estado || cliente.cep) && (
                        <Section title="Endereço">
                            <InfoRow icon={LuMapPin} text={[
                                cliente.endereco,
                                [cliente.cidade, cliente.estado].filter(Boolean).join(" - "),
                                cliente.cep ? `CEP ${mascaraCep(cliente.cep)}` : null,
                            ].filter(Boolean).join(", ")} />
                        </Section>
                    )}

                    <Section title="Informações">
                        <div className="dm-meta-list">
                            {cliente.documento && <MetaRow label="Documento" value={mascaraDocumento(cliente.documento, cliente.tipoPessoa)} />}
                            {cliente.tipoPessoa && <MetaRow label="Tipo" value={cliente.tipoPessoa === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"} />}
                            {cliente.dataNascimento && <MetaRow label="Nascimento" value={new Date(cliente.dataNascimento + "T00:00:00").toLocaleDateString("pt-BR")} />}
                            {cliente.origemLead && <MetaRow label="Origem" value={cliente.origemLead} />}
                            {cliente.responsavel && <MetaRow label="Responsável" value={cliente.responsavel} />}
                            {cliente.tags && (
                                <div className="dm-meta-row">
                                    <span className="dm-meta-label">Tags</span>
                                    <span className="dm-meta-value">
                                        {cliente.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                                            <span key={tag} className="dm-tag">{tag}</span>
                                        ))}
                                    </span>
                                </div>
                            )}
                            {cliente.categoria && <MetaRow label="Categoria" value={cliente.categoria} />}
                        </div>
                    </Section>

                    {cliente.notas && (
                        <Section title="Notas">
                            <div className="dm-notas-box">{cliente.notas}</div>
                        </Section>
                    )}

                    {stats && (
                        <Section title="Histórico financeiro">
                            <div className="dm-stats">
                                <StatBox label="Total de recebimentos" valor={String(stats.totalRecebimentos ?? 0)} />
                                <StatBox label="Pagos" valor={String(stats.recebimentosPagos ?? 0)} variant="success" />
                                <StatBox label="Atrasados" valor={String(stats.recebimentosAtrasados ?? 0)} variant="error" />
                                <StatBox label="Total recebido" valor={fmtValor(stats.valorTotalRecebido)} variant="success" />
                            </div>
                            {temAtraso && (
                                <div className="dm-alert">
                                    <LuTriangleAlert size={16} className="dm-alert-icon"/>
                                    <div><strong>Valor em atraso:</strong> {fmtValor(stats.valorTotalAtrasado)}</div>
                                </div>
                            )}
                            <Link to={`/recebimentos?clienteId=${cliente.id}`} className="dm-link" onClick={onFechar}>
                                Ver recebimentos deste cliente <LuExternalLink size={12}/>
                            </Link>
                        </Section>
                    )}
                </div>

                {/* ════ ABA SETOR ════ */}
                <div style={{ display: abaAtiva === "setor" ? "block" : "none" }}>
                    {!camposSetor || !camposSetor.grupos?.length ? (
                        <div className="dm-setor-empty">Nenhum dado setorial cadastrado.</div>
                    ) : (
                        camposSetor.grupos.map(grupo => {
                            const preenchidos = grupo.campos.filter(c => {
                                const v = dadosSetor[c.id];
                                return v && v !== "" && v !== "false";
                            });
                            if (preenchidos.length === 0) return null;
                            return (
                                <Section key={grupo.grupo} title={grupo.label}>
                                    <div className="dm-meta-list">
                                        {preenchidos.map(campo => {
                                            let v = dadosSetor[campo.id];
                                            if (campo.tipo === "BOOLEAN") v = v === "true" ? "Sim" : "Não";
                                            if (campo.tipo === "DATE" && v) { try { v = new Date(v + "T00:00:00").toLocaleDateString("pt-BR"); } catch {} }
                                            if (campo.tipo === "MONEY" && v) { try { v = fmtValor(parseFloat(v)); } catch {} }
                                            return <MetaRow key={campo.id} label={campo.label} value={v} />;
                                        })}
                                    </div>
                                </Section>
                            );
                        })
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button type="button" className="ph-btn ph-btn--ghost" onClick={onFechar}>Fechar</button>
                <button type="button" className="ph-btn ph-btn--primary" onClick={onEditar}><LuPencil size={14}/> Editar</button>
            </Modal.Footer>
            <style>{CSS}</style>
        </Modal>
    );
}

function Section({ title, children }) {
    return <div className="dm-section"><div className="dm-section-title">{title}</div>{children}</div>;
}
function InfoRow({ icon: Icon, text }) {
    return <div className="dm-info-row">{Icon && <Icon size={14} className="dm-info-icon"/>}<span>{text}</span></div>;
}
function MetaRow({ label, value }) {
    return <div className="dm-meta-row"><span className="dm-meta-label">{label}</span><span className="dm-meta-value">{value}</span></div>;
}
function StatBox({ label, valor, variant = "default" }) {
    return <div className={`dm-stat dm-stat--${variant}`}><div className="dm-stat-label">{label}</div><div className="dm-stat-value">{valor}</div></div>;
}

const CSS = `
.dm-score{display:inline-flex;align-items:center;gap:6px;margin-top:4px;padding:4px 10px;border-radius:100px;font-family:var(--ff-mono);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.dm-score--success{background:var(--success-bg);color:var(--success)}.dm-score--warning{background:var(--warning-bg);color:var(--warning)}.dm-score--error{background:var(--error-bg);color:var(--error)}
.dm-score-dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.dm-section{margin-bottom:24px}.dm-section:last-child{margin-bottom:0}.dm-section-title{font-family:var(--ff-mono);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:10px}
.dm-info-list{display:flex;flex-direction:column;gap:8px}.dm-info-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:var(--bg);border:1px solid var(--hair);font-size:13px;color:var(--ink-2);letter-spacing:-0.005em}
.dm-info-icon{color:var(--text-dim);flex-shrink:0}.dm-info-empty{padding:12px;border-radius:8px;background:var(--bg);border:1px dashed var(--hair);text-align:center;font-size:13px;color:var(--text-dim);font-style:italic}
.dm-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}.dm-stat{padding:12px 14px;border-radius:10px;background:var(--surface);border:1px solid var(--hair)}
.dm-stat-label{font-family:var(--ff-mono);font-size:9px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px}
.dm-stat-value{font-family:var(--ff-sans);font-size:18px;font-weight:600;letter-spacing:-0.02em;line-height:1.1;color:var(--navy-deep);font-variant-numeric:tabular-nums}
.dm-stat--success .dm-stat-value{color:var(--success)}.dm-stat--error .dm-stat-value{color:var(--error)}
.dm-alert{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;background:var(--error-bg);border:1px solid rgba(229,72,77,.25);color:var(--ink-2);font-size:13px;line-height:1.4;margin-bottom:12px}
.dm-alert-icon{color:var(--error);flex-shrink:0}.dm-alert strong{color:var(--error);font-weight:700}
.dm-link{display:inline-flex;align-items:center;gap:6px;color:var(--cyan-dark);text-decoration:none;font-size:13px;font-weight:600;letter-spacing:-0.005em;padding:6px 0;transition:gap .15s}.dm-link:hover{gap:8px;text-decoration:underline}
.dm-meta-list{display:flex;flex-direction:column;gap:10px}.dm-meta-row{display:flex;align-items:baseline;gap:14px;font-size:13px;line-height:1.5}
.dm-meta-label{flex-shrink:0;width:110px;font-family:var(--ff-mono);font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
.dm-meta-value{flex:1;color:var(--navy-deep);letter-spacing:-0.005em;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.dm-tag{display:inline-block;padding:2px 10px;border-radius:100px;background:var(--cyan-soft);color:var(--cyan-dark);font-family:var(--ff-mono);font-size:11px;font-weight:600;letter-spacing:.04em}
.dm-notas-box{white-space:pre-wrap;background:var(--bg);padding:12px 14px;border-radius:8px;border:1px solid var(--hair);font-size:13px;color:var(--ink-2);line-height:1.5}
.dm-setor-empty{padding:24px;text-align:center;color:var(--text-dim);font-size:13px}
@media(max-width:600px){.dm-stats{grid-template-columns:1fr 1fr}.dm-meta-row{flex-direction:column;align-items:flex-start;gap:4px}.dm-meta-label{width:auto}}
`;
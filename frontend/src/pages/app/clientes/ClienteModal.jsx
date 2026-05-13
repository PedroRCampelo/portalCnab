import { useState, useEffect, useRef } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import Modal from "../../../components/ui/Modal.jsx";
import Tabs  from "../../../components/ui/Tabs.jsx";
import api   from "../../../services/api.js";
import {
    mascaraTelefone, mascaraDocumento, mascaraCep,
    TIPOS_PESSOA, ESTADOS_BR, ORIGENS_LEAD, CLIENTE_VAZIO,
} from "./_helpers.js";

export default function ClienteModal({ cliente, onSalvar, onFechar, salvando }) {
    const ehEdicao = !!cliente;
    const clienteIdRef = useRef(cliente?.id);

    const [form, setForm] = useState(() => {
        if (!cliente) return { ...CLIENTE_VAZIO };
        return {
            nome:           cliente.nome ?? "",
            documento:      cliente.documento ?? "",
            tipoPessoa:     cliente.tipoPessoa ?? "PF",
            dataNascimento: cliente.dataNascimento ?? "",
            email:          cliente.email ?? "",
            telefone:       cliente.telefone ?? "",
            whatsapp:       cliente.whatsapp ?? "",
            telefone2:      cliente.telefone2 ?? "",
            endereco:       cliente.endereco ?? "",
            cidade:         cliente.cidade ?? "",
            estado:         cliente.estado ?? "",
            cep:            cliente.cep ?? "",
            origemLead:     cliente.origemLead ?? "",
            responsavel:    cliente.responsavel ?? "",
            tags:           cliente.tags ?? "",
            categoria:      cliente.categoria ?? "",
            notas:          cliente.notas ?? "",
            setorId:        cliente.setorId ?? "",
        };
    });

    const [abaAtiva, setAbaAtiva] = useState("geral");
    const [setores, setSetores] = useState([]);
    const [camposSetor, setCamposSetor] = useState(null);
    const [dadosSetor, setDadosSetor] = useState({});
    const [carregandoCampos, setCarregandoCampos] = useState(false);
    const [camposCarregados, setCamposCarregados] = useState(false);
    const [maisDetalhes, setMaisDetalhes] = useState(() => {
        return !!(cliente && (cliente.endereco || cliente.origemLead || cliente.tags));
    });
    const [erro, setErro] = useState("");

    useEffect(() => {
        let c = false;
        api.get("/api/setores").then(({ data }) => { if (!c) setSetores(data); }).catch(() => {});
        return () => { c = true; };
    }, []);

    useEffect(() => {
        if (!form.setorId) { setCamposSetor(null); if (!camposCarregados) setDadosSetor({}); return; }
        let c = false;
        setCarregandoCampos(true);
        const promises = [api.get(`/api/setores/${form.setorId}/campos`).catch(() => ({ data: null }))];
        if (ehEdicao && clienteIdRef.current && !camposCarregados) {
            promises.push(api.get(`/api/clientes/${clienteIdRef.current}/setor-dados`).catch(() => ({ data: {} })));
        }
        Promise.all(promises).then(([camposRes, dadosRes]) => {
            if (c) return;
            setCamposSetor(camposRes.data);
            if (dadosRes) setDadosSetor(prev => ({ ...prev, ...dadosRes.data }));
            setCamposCarregados(true);
        }).finally(() => { if (!c) setCarregandoCampos(false); });
        return () => { c = true; };
    }, [form.setorId]);

    function atualizar(campo, valor) { setForm(p => ({ ...p, [campo]: valor })); }
    function atualizarDadoSetor(campoId, valor) { setDadosSetor(p => ({ ...p, [campoId]: valor })); }

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        if (!form.nome.trim()) { setErro("Nome é obrigatório"); setAbaAtiva("geral"); return; }
        try {
            const payload = {
                ...form,
                documento: form.documento ? form.documento.replace(/\D/g, "") : null,
                telefone:  form.telefone  ? form.telefone.replace(/\D/g, "")  : null,
                whatsapp:  form.whatsapp  ? form.whatsapp.replace(/\D/g, "")  : null,
                telefone2: form.telefone2 ? form.telefone2.replace(/\D/g, "") : null,
                cep:       form.cep       ? form.cep.replace(/\D/g, "")       : null,
                setorId:   form.setorId || null,
                dataNascimento: form.dataNascimento || null,
            };
            const clienteSalvo = await onSalvar(payload);
            const id = clienteSalvo?.id || cliente?.id;
            if (id && form.setorId && Object.keys(dadosSetor).length > 0) {
                try { await api.put(`/api/clientes/${id}/setor-dados`, dadosSetor); } catch (err) { console.warn("Erro ao salvar dados setoriais:", err); }
            }
        } catch (err) { setErro(err.response?.data?.mensagem ?? "Erro ao salvar cliente"); }
    }

    const setorSelecionado = setores.find(s => s.id === form.setorId);
    const nomeSetor = setorSelecionado?.nome || "Setor";
    const abas = [{ key: "geral", label: "Geral" }];
    if (form.setorId) abas.push({ key: "setor", label: nomeSetor });

    return (
        <Modal open={true} onClose={onFechar} size="default" title={ehEdicao ? "Editar cliente" : "Novo cliente"}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1, minHeight: 0 }}>
                <Modal.Body>
                    {abas.length > 1 && (
                        <div className="cm-tabs-wrap">
                            <Tabs variant="underline" value={abaAtiva} onChange={setAbaAtiva} items={abas} />
                        </div>
                    )}

                    {/* ════ ABA GERAL ════ */}
                    <div style={{ display: abaAtiva === "geral" ? "block" : "none" }}>
                        <div className="cm-field">
                            <label className="cm-label">Nome *</label>
                            <input type="text" className="cm-input" value={form.nome} onChange={e => atualizar("nome", e.target.value)} placeholder="Nome completo do cliente" required disabled={salvando} autoFocus maxLength={150} />
                        </div>
                        <div className="cm-grid-doc">
                            <div className="cm-field">
                                <label className="cm-label">Tipo</label>
                                <select className="cm-input" value={form.tipoPessoa} onChange={e => atualizar("tipoPessoa", e.target.value)} disabled={salvando}>
                                    {TIPOS_PESSOA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="cm-field">
                                <label className="cm-label">{form.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}</label>
                                <input type="text" className="cm-input" value={mascaraDocumento(form.documento, form.tipoPessoa)} onChange={e => atualizar("documento", e.target.value)} placeholder={form.tipoPessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"} disabled={salvando} maxLength={form.tipoPessoa === "PJ" ? 18 : 14} />
                            </div>
                        </div>
                        <div className="cm-field">
                            <label className="cm-label">Data de nascimento <span className="cm-label-opt">opcional</span></label>
                            <input type="date" className="cm-input" value={form.dataNascimento} onChange={e => atualizar("dataNascimento", e.target.value)} disabled={salvando} />
                        </div>
                        <div className="cm-grid-2">
                            <div className="cm-field">
                                <label className="cm-label">Telefone</label>
                                <input type="tel" className="cm-input" value={mascaraTelefone(form.telefone)} onChange={e => atualizar("telefone", e.target.value)} placeholder="(11) 98765-4321" disabled={salvando} maxLength={16} />
                            </div>
                            <div className="cm-field">
                                <label className="cm-label">WhatsApp</label>
                                <input type="tel" className="cm-input" value={mascaraTelefone(form.whatsapp)} onChange={e => atualizar("whatsapp", e.target.value)} placeholder="(11) 98765-4321" disabled={salvando} maxLength={16} />
                            </div>
                        </div>
                        <div className="cm-field">
                            <label className="cm-label">E-mail <span className="cm-label-opt">opcional</span></label>
                            <input type="email" className="cm-input" value={form.email} onChange={e => atualizar("email", e.target.value)} placeholder="cliente@email.com" disabled={salvando} />
                        </div>
                        <div className="cm-field">
                            <label className="cm-label">Setor <span className="cm-label-opt">define os campos extras</span></label>
                            <select className="cm-input" value={form.setorId} onChange={e => { atualizar("setorId", e.target.value); setCamposCarregados(false); }} disabled={salvando}>
                                <option value="">— Sem setor —</option>
                                {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                            </select>
                        </div>
                        <button type="button" className="cm-toggle" onClick={() => setMaisDetalhes(m => !m)}>
                            {maisDetalhes ? <LuChevronUp size={14}/> : <LuChevronDown size={14}/>}
                            {maisDetalhes ? "Esconder detalhes" : "Mais detalhes"}
                        </button>
                        {maisDetalhes && (
                            <div className="cm-extras">
                                <div className="cm-field">
                                    <label className="cm-label">Endereço</label>
                                    <input type="text" className="cm-input" value={form.endereco} onChange={e => atualizar("endereco", e.target.value)} placeholder="Rua, número, bairro" disabled={salvando} maxLength={200} />
                                </div>
                                <div className="cm-grid-3">
                                    <div className="cm-field"><label className="cm-label">Cidade</label><input type="text" className="cm-input" value={form.cidade} onChange={e => atualizar("cidade", e.target.value)} disabled={salvando} maxLength={100} /></div>
                                    <div className="cm-field"><label className="cm-label">Estado</label><select className="cm-input" value={form.estado} onChange={e => atualizar("estado", e.target.value)} disabled={salvando}><option value="">UF</option>{ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select></div>
                                    <div className="cm-field"><label className="cm-label">CEP</label><input type="text" className="cm-input" value={mascaraCep(form.cep)} onChange={e => atualizar("cep", e.target.value)} placeholder="00000-000" disabled={salvando} maxLength={9} /></div>
                                </div>
                                <div className="cm-grid-2">
                                    <div className="cm-field"><label className="cm-label">Origem do lead</label><select className="cm-input" value={form.origemLead} onChange={e => atualizar("origemLead", e.target.value)} disabled={salvando}><option value="">— Selecione —</option>{ORIGENS_LEAD.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                                    <div className="cm-field"><label className="cm-label">Responsável</label><input type="text" className="cm-input" value={form.responsavel} onChange={e => atualizar("responsavel", e.target.value)} disabled={salvando} maxLength={100} /></div>
                                </div>
                                <div className="cm-field"><label className="cm-label">Tags <span className="cm-label-opt">separadas por vírgula</span></label><input type="text" className="cm-input" value={form.tags} onChange={e => atualizar("tags", e.target.value)} placeholder="vip, recorrente, indicação" disabled={salvando} maxLength={255} /></div>
                                <div className="cm-field"><label className="cm-label">Telefone secundário</label><input type="tel" className="cm-input" value={mascaraTelefone(form.telefone2)} onChange={e => atualizar("telefone2", e.target.value)} placeholder="(11) 3333-4444" disabled={salvando} maxLength={16} /></div>
                                <div className="cm-field"><label className="cm-label">Notas internas <span className="cm-label-opt">opcional</span></label><textarea className="cm-input cm-textarea" value={form.notas} onChange={e => atualizar("notas", e.target.value)} placeholder="Observações sobre o cliente..." disabled={salvando} rows={3} /></div>
                            </div>
                        )}
                    </div>

                    {/* ════ ABA SETOR ════ */}
                    <div style={{ display: abaAtiva === "setor" ? "block" : "none" }}>
                        {carregandoCampos ? (
                            <div className="cm-setor-loading">Carregando campos...</div>
                        ) : !camposSetor || !camposSetor.grupos?.length ? (
                            <div className="cm-setor-empty">Nenhum campo configurado para este setor.</div>
                        ) : (
                            camposSetor.grupos.map(grupo => (
                                <div key={grupo.grupo} className="cm-setor-grupo">
                                    <div className="cm-setor-grupo-label">{grupo.label}</div>
                                    <div className="cm-setor-grupo-campos">
                                        {grupo.campos.map(campo => (
                                            <CampoDinamico key={campo.id} campo={campo} valor={dadosSetor[campo.id] ?? ""} onChange={v => atualizarDadoSetor(campo.id, v)} disabled={salvando} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {erro && <div className="cm-erro">{erro}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="ph-btn ph-btn--ghost" onClick={onFechar} disabled={salvando}>Cancelar</button>
                    <button type="submit" className="ph-btn ph-btn--primary" disabled={salvando || !form.nome.trim()}>{salvando ? "Salvando..." : (ehEdicao ? "Salvar alterações" : "Criar cliente")}</button>
                </Modal.Footer>
            </form>
            <style>{CSS}</style>
        </Modal>
    );
}

function CampoDinamico({ campo, valor, onChange, disabled }) {
    const { label, tipo, opcoes, obrigatorio } = campo;
    const bp = { className: "cm-input", disabled, value: valor, onChange: e => onChange(e.target.value) };
    switch (tipo) {
        case "TEXTAREA": return <div className="cm-field cm-field-wide"><label className="cm-label">{label}{obrigatorio && " *"}</label><textarea {...bp} rows={2} className="cm-input cm-textarea" /></div>;
        case "SELECT": return <div className="cm-field"><label className="cm-label">{label}{obrigatorio && " *"}</label><select {...bp}><option value="">— Selecione —</option>{(opcoes||[]).map(op => <option key={op} value={op}>{op}</option>)}</select></div>;
        case "DATE": return <div className="cm-field"><label className="cm-label">{label}{obrigatorio && " *"}</label><input {...bp} type="date" /></div>;
        case "NUMBER": return <div className="cm-field"><label className="cm-label">{label}{obrigatorio && " *"}</label><input {...bp} type="number" step="1" /></div>;
        case "MONEY":
            return (<div className="cm-field"><label className="cm-label">{label}{obrigatorio && " *"}</label>
                <input className="cm-input" disabled={disabled} type="text" inputMode="decimal"
                       value={valor ? `R$ ${String(valor).replace(".", ",")}` : ""}
                       onChange={e => {
                           const raw = e.target.value.replace(/[^\d,]/g, "").replace(",", ".");
                           onChange(raw);
                       }}
                       placeholder="R$ 0,00" /></div>);
        case "BOOLEAN": return <div className="cm-field cm-field-bool"><label className="cm-checkbox-wrap"><input type="checkbox" checked={valor === "true" || valor === true} onChange={e => onChange(e.target.checked ? "true" : "false")} disabled={disabled} /><span>{label}</span></label></div>;
        default: return <div className="cm-field"><label className="cm-label">{label}{obrigatorio && " *"}</label><input {...bp} type="text" maxLength={200} /></div>;
    }
}

const CSS = `
.cm-tabs-wrap{margin-bottom:16px}.cm-field{margin-bottom:14px}.cm-field:last-child{margin-bottom:0}.cm-field-bool{margin-bottom:10px}.cm-field-wide{grid-column:1/-1}
.cm-grid-doc{display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-bottom:14px}.cm-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}.cm-grid-3{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-bottom:14px}
.cm-grid-doc .cm-field,.cm-grid-2 .cm-field,.cm-grid-3 .cm-field{margin-bottom:0}
.cm-label{display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:12px;font-weight:600;letter-spacing:-0.005em;color:var(--ink-2)}.cm-label-opt{font-weight:400;font-size:11px;color:var(--text-dim)}
.cm-input{width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid var(--hair);background:var(--surface);color:var(--text);font-family:var(--ff-sans);font-size:14px;letter-spacing:-0.005em;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
.cm-input:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(21,195,221,.1)}.cm-input:disabled{background:var(--bg);color:var(--text-dim);cursor:not-allowed}.cm-textarea{resize:vertical;font-family:inherit;line-height:1.5}
.cm-checkbox-wrap{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);cursor:pointer;padding:6px 0}.cm-checkbox-wrap input[type="checkbox"]{width:16px;height:16px;accent-color:var(--cyan);cursor:pointer}
.cm-toggle{background:none;border:none;cursor:pointer;color:var(--cyan-dark);font-family:var(--ff-sans);font-size:13px;font-weight:600;letter-spacing:-0.005em;padding:8px 0;display:inline-flex;align-items:center;gap:6px;margin:4px 0 12px;transition:opacity .15s}.cm-toggle:hover{opacity:.7}
.cm-extras{padding:16px;border-radius:10px;margin-bottom:12px;background:var(--bg);border:1px solid var(--hair)}.cm-extras .cm-field:last-child{margin-bottom:0}
.cm-setor-loading,.cm-setor-empty{padding:24px;text-align:center;color:var(--text-dim);font-size:13px}
.cm-setor-grupo{margin-bottom:20px}.cm-setor-grupo:last-child{margin-bottom:0}.cm-setor-grupo-label{font-family:var(--ff-mono);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--hair)}
.cm-setor-grupo-campos{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}.cm-setor-grupo-campos .cm-field{margin-bottom:0}
.cm-erro{padding:10px 12px;border-radius:8px;background:var(--error-bg);border:1px solid rgba(229,72,77,.2);color:var(--error);font-size:13px;line-height:1.4;margin-top:12px;margin-bottom:4px}
@media(max-width:600px){.cm-grid-doc,.cm-grid-2{grid-template-columns:1fr;gap:14px}.cm-grid-3{grid-template-columns:1fr;gap:14px}.cm-setor-grupo-campos{grid-template-columns:1fr}}
`;
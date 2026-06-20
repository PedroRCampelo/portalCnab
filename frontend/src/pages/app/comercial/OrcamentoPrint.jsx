/**
 * OrcamentoPrint — abre uma nova janela com o documento e dispara window.print()
 * Não renderiza nada no DOM principal — evita conflito com o @media print do app.
 */

const FORMA_PAG_LABELS = {
    A_DEFINIR:      "A definir",
    PIX:            "Pix",
    BOLETO:         "Boleto",
    DINHEIRO:       "Dinheiro",
    CARTAO_CREDITO: "Cartão de crédito",
    CARTAO_DEBITO:  "Cartão de débito",
    TRANSFERENCIA:  "Transferência",
    CHEQUE:         "Cheque",
    OUTROS:         "Outros",
};

function fmtBrl(valor) {
    return Number(valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(str) {
    if (!str) return "—";
    const [ano, mes, dia] = String(str).split("-");
    return `${dia}/${mes}/${ano}`;
}

export function imprimirOrcamento(orc, empresa) {
    const subtotalBruto = orc.itens?.reduce(
        (s, it) => s + Number(it.valorUnitario ?? 0) * Number(it.quantidade ?? 1), 0
    ) ?? 0;
    const descontoTotal =
        (orc.itens?.reduce((s, it) => s + Number(it.desconto ?? 0), 0) ?? 0) +
        Number(orc.descontoGeral ?? 0);
    const total = Number(orc.valorTotal ?? 0);

    const condicao =
        orc.numParcelas === 1
            ? "À vista"
            : `${orc.numParcelas}x a cada ${orc.intervaloDias} dias`;

    const logoHtml = empresa?.logoBase64
        ? `<img src="${empresa.logoBase64}" class="orc-logo" alt="Logo"/>`
        : "";

    const cnpjHtml   = orc.empresa?.cnpj       ? `<span class="emp-det">CNPJ: ${orc.empresa.cnpj}</span>` : "";
    const telHtml    = orc.empresa?.telefone    ? `<span class="emp-det">${orc.empresa.telefone}</span>` : "";
    const emailHtml  = orc.empresa?.emailEmpresa? `<span class="emp-det">${orc.empresa.emailEmpresa}</span>` : "";

    const clienteDocHtml = orc.cliente?.documento
        ? `<div class="cli-det">CPF/CNPJ: ${orc.cliente.documento}</div>` : "";
    const clienteEmailHtml = orc.cliente?.email
        ? `<div class="cli-det">${orc.cliente.email}</div>` : "";
    const clienteTelHtml = orc.cliente?.telefone
        ? `<div class="cli-det">${orc.cliente.telefone}</div>` : "";

    const descricaoHtml = orc.descricao
        ? `<section class="sec">
             <div class="sec-label">OBJETO</div>
             <p class="desc-text">${orc.descricao}</p>
           </section>` : "";

    const itensHtml = (orc.itens ?? []).map((item, i) => `
        <tr class="${i % 2 === 0 ? "tr-even" : ""}">
            <td>${item.descricao}</td>
            <td class="td-r">${item.quantidade}</td>
            <td class="td-r">${fmtBrl(item.valorUnitario)}</td>
            <td class="td-r">${Number(item.desconto) > 0 ? fmtBrl(item.desconto) : "—"}</td>
            <td class="td-r td-bold">${fmtBrl(item.subtotal)}</td>
        </tr>
    `).join("");

    const descontoRowHtml = descontoTotal > 0 ? `
        <div class="tot-row">
            <span>Subtotal</span><span>${fmtBrl(subtotalBruto)}</span>
        </div>
        <div class="tot-row tot-desc">
            <span>Descontos</span><span>- ${fmtBrl(descontoTotal)}</span>
        </div>
    ` : "";

    const obsHtml = orc.observacoes ? `
        <section class="sec obs-box">
            <div class="sec-label">OBSERVAÇÕES</div>
            <p class="obs-text">${orc.observacoes.replace(/\n/g, "<br>")}</p>
        </section>
    ` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Orçamento ${orc.numero}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    color: #111827;
    font-size: 13px;
    line-height: 1.55;
    background: #f3f4f6;
    padding: 32px 16px;
  }

  .doc {
    background: white;
    max-width: 760px;
    margin: 0 auto;
    padding: 52px 56px;
    box-shadow: 0 4px 32px rgba(0,0,0,.12);
    border-radius: 4px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 24px;
  }
  .header-emp {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }
  .orc-logo {
    width: 56px;
    height: 56px;
    object-fit: contain;
    border-radius: 6px;
    flex-shrink: 0;
  }
  .header-info { display: flex; flex-direction: column; gap: 2px; }
  .emp-nome {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0a1628;
    margin-bottom: 2px;
  }
  .emp-det { font-size: 11px; color: #6b7280; display: block; line-height: 1.4; }

  .header-doc { text-align: right; flex-shrink: 0; }
  .doc-badge {
    display: inline-block;
    padding: 4px 12px;
    background: #0a1628;
    color: #15c3dd;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .doc-num {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0a1628;
    margin-bottom: 6px;
  }
  .doc-meta { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: #6b7280; }

  .divider {
    height: 2px;
    background: linear-gradient(90deg, #15c3dd 0%, #0a1628 100%);
    border-radius: 2px;
    margin-bottom: 24px;
  }

  /* ── Section label ── */
  .sec-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #15c3dd;
    margin-bottom: 8px;
  }

  .sec { margin-bottom: 20px; }

  /* ── Cliente ── */
  .cli-box {
    padding: 14px 16px;
    background: #f9fafb;
    border-radius: 8px;
    border-left: 3px solid #15c3dd;
  }
  .cli-nome { font-size: 15px; font-weight: 700; color: #0a1628; letter-spacing: -0.02em; margin-bottom: 2px; }
  .cli-det  { font-size: 11px; color: #6b7280; }

  /* ── Objeto ── */
  .desc-text { color: #374151; font-size: 13px; line-height: 1.6; }

  /* ── Tabela ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  thead tr { background: #0a1628; color: white; }
  th {
    padding: 9px 12px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  th:first-child { text-align: left; }
  th:not(:first-child) { text-align: right; min-width: 80px; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody td { padding: 9px 12px; font-size: 12.5px; color: #374151; vertical-align: top; }
  .tr-even td { background: #fafafa; }
  .td-r    { text-align: right; white-space: nowrap; }
  .td-bold { font-weight: 700; color: #0a1628; }

  /* ── Totais ── */
  .totais {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 16px 12px 0;
    gap: 6px;
    margin-bottom: 24px;
    border-top: 2px solid #f3f4f6;
  }
  .tot-row {
    display: flex;
    gap: 40px;
    justify-content: space-between;
    min-width: 260px;
    font-size: 13px;
    color: #6b7280;
  }
  .tot-desc { color: #e54848; }
  .tot-total {
    font-size: 16px;
    font-weight: 800;
    color: #0a1628;
    padding-top: 8px;
    border-top: 2px solid #0a1628;
    margin-top: 4px;
  }

  /* ── Pagamento ── */
  .pag-box {
    padding: 14px 16px;
    background: #f0fdfe;
    border-radius: 8px;
    border: 1px solid rgba(21,195,221,.2);
  }
  .pag-grid { display: flex; gap: 24px; flex-wrap: wrap; }
  .pag-item { display: flex; flex-direction: column; gap: 2px; }
  .pag-key  { font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #6b7280; }
  .pag-val  { font-size: 13px; font-weight: 600; color: #0a1628; }

  /* ── Obs ── */
  .obs-box { padding: 12px 14px; background: #fffbeb; border-radius: 6px; border-left: 3px solid #f59e0b; }
  .obs-text { font-size: 12px; color: #78350f; line-height: 1.6; }

  /* ── Assinaturas ── */
  .footer {
    display: flex;
    justify-content: space-around;
    gap: 40px;
    margin-top: 48px;
    padding-top: 16px;
  }
  .ass { flex: 1; text-align: center; }
  .ass-linha { border-bottom: 1.5px solid #374151; width: 80%; margin: 0 auto 6px; }
  .ass-label { font-size: 11px; color: #6b7280; }

  @media print {
    body { background: white; padding: 0; }
    .doc { box-shadow: none; border-radius: 0; padding: 20mm 18mm; max-width: none; width: 100%; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
<div class="doc">

  <!-- Header -->
  <div class="header">
    <div class="header-emp">
      ${logoHtml}
      <div class="header-info">
        <div class="emp-nome">${empresa?.nome ?? "Minha Empresa"}</div>
        ${cnpjHtml}${telHtml}${emailHtml}
      </div>
    </div>
    <div class="header-doc">
      <div class="doc-badge">Orçamento</div>
      <div class="doc-num">Nº ${orc.numero}</div>
      <div class="doc-meta">
        <span>Emissão: ${fmtData(orc.dataEmissao)}</span>
        <span>Validade: ${fmtData(orc.validade)}</span>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Cliente -->
  <section class="sec">
    <div class="sec-label">Destinatário</div>
    <div class="cli-box">
      <div class="cli-nome">${orc.cliente?.nome ?? "—"}</div>
      ${clienteDocHtml}${clienteEmailHtml}${clienteTelHtml}
    </div>
  </section>

  ${descricaoHtml}

  <!-- Itens -->
  <section class="sec">
    <div class="sec-label">Itens</div>
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th style="text-align:right">Qtd.</th>
          <th style="text-align:right">Valor Unit.</th>
          <th style="text-align:right">Desconto</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itensHtml}
      </tbody>
    </table>
  </section>

  <!-- Totais -->
  <div class="totais">
    ${descontoRowHtml}
    <div class="tot-row tot-total">
      <span>Total</span><span>${fmtBrl(total)}</span>
    </div>
  </div>

  <!-- Condições de pagamento -->
  <section class="sec">
    <div class="sec-label">Condições de pagamento</div>
    <div class="pag-box">
      <div class="pag-grid">
        <div class="pag-item">
          <span class="pag-key">Forma</span>
          <span class="pag-val">${FORMA_PAG_LABELS[orc.formaPagamento] ?? orc.formaPagamento ?? "—"}</span>
        </div>
        <div class="pag-item">
          <span class="pag-key">Condição</span>
          <span class="pag-val">${condicao}</span>
        </div>
        <div class="pag-item">
          <span class="pag-key">Validade da proposta</span>
          <span class="pag-val">${fmtData(orc.validade)}</span>
        </div>
      </div>
    </div>
  </section>

  ${obsHtml}

  <!-- Assinaturas -->
  <div class="footer">
    <div class="ass">
      <div class="ass-linha"></div>
      <div class="ass-label">${empresa?.nome ?? "Fornecedor"}</div>
    </div>
    <div class="ass">
      <div class="ass-linha"></div>
      <div class="ass-label">${orc.cliente?.nome ?? "Cliente"}</div>
    </div>
  </div>

</div>
<script>
  window.onload = function() {
    window.print();
  };
</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
        alert("Permita pop-ups para imprimir o orçamento.");
        return;
    }
    win.document.write(html);
    win.document.close();
}

/**
 * OrcamentoPrint — abre uma nova janela com documento profissional e dispara window.print()
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
    if (!str) return "___/___/______";
    const [ano, mes, dia] = String(str).split("-");
    return `${dia}/${mes}/${ano}`;
}

function cell(label, value, opts = {}) {
    const { bold = false, colspan = 1 } = opts;
    return `<td colspan="${colspan}">
        <span class="cell-label">${label}</span>
        <span class="cell-val${bold ? " cell-bold" : ""}">${value ?? ""}</span>
    </td>`;
}

const LINHAS_MINIMAS = 10;

export function imprimirOrcamento(orc, empresa) {
    const subtotalBruto = orc.itens?.reduce(
        (s, it) => s + Number(it.valorUnitario ?? 0) * Number(it.quantidade ?? 1), 0
    ) ?? 0;
    const descontoTotal =
        (orc.itens?.reduce((s, it) => s + Number(it.desconto ?? 0), 0) ?? 0) +
        Number(orc.descontoGeral ?? 0);
    const frete = Number(orc.valorFrete ?? 0);
    const total = Number(orc.valorTotal ?? 0);

    const condicao =
        orc.numParcelas === 1
            ? "À vista"
            : `${orc.numParcelas}x a cada ${orc.intervaloDias} dias`;

    const logoHtml = empresa?.logoBase64
        ? `<img src="${empresa.logoBase64}" class="logo-img" alt=""/>`
        : `<div class="logo-placeholder"></div>`;

    // ── itens da tabela ─────────────────────────────────────────────────────
    const numItens = orc.itens?.length ?? 0;
    const linhasVazias = Math.max(0, LINHAS_MINIMAS - numItens);

    const itensHtml = (orc.itens ?? []).map((item, i) => `
        <tr>
            <td class="td-center td-num">${i + 1}</td>
            <td class="td-desc">${item.descricao ?? ""}</td>
            <td class="td-center">${Number(item.quantidade ?? 1).toLocaleString("pt-BR")}</td>
            <td class="td-right">${fmtBrl(item.subtotal ?? (Number(item.valorUnitario ?? 0) * Number(item.quantidade ?? 1)))}</td>
        </tr>
    `).join("");

    const vaziosHtml = Array.from({ length: linhasVazias }, () => `
        <tr class="tr-vazio">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    `).join("");

    // ── observações ─────────────────────────────────────────────────────────
    const obsLines = [];
    if (orc.formaPagamento && orc.formaPagamento !== "A_DEFINIR") {
        const fp = FORMA_PAG_LABELS[orc.formaPagamento] ?? orc.formaPagamento;
        obsLines.push(`<p><strong>Forma de Pagamento:</strong> ${fp}${condicao !== "À vista" ? " — " + condicao : ""}.</p>`);
    }
    if (frete > 0) {
        obsLines.push(`<p><strong>Frete / Acréscimo:</strong> ${fmtBrl(frete)}.</p>`);
    }
    if (descontoTotal > 0) {
        obsLines.push(`<p><strong>Desconto:</strong> ${fmtBrl(descontoTotal)}.</p>`);
    }
    if (orc.prazoEntrega) {
        obsLines.push(`<p><strong>Prazo de entrega:</strong> ${orc.prazoEntrega}.</p>`);
    }
    if (orc.observacoes) {
        obsLines.push(`<p><strong>Obs:</strong> ${orc.observacoes.replace(/\n/g, "<br>")}</p>`);
    }
    const obsContent = obsLines.length ? obsLines.join("") : "<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>";

    // ── empresa info ────────────────────────────────────────────────────────
    const cnpjLine  = orc.empresa?.cnpj          ? `CPF/CNPJ: ${orc.empresa.cnpj}` : "";
    const telLine   = orc.empresa?.telefone       ? `Tel: ${orc.empresa.telefone}` : "";
    const emailLine = orc.empresa?.emailEmpresa   ? `E-mail: ${orc.empresa.emailEmpresa}` : "";
    const empDetails = [cnpjLine, telLine, emailLine].filter(Boolean).join(" &nbsp;·&nbsp; ");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento ${orc.numero}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #111;
    background: #e0e0e0;
    padding: 20px;
  }

  .page {
    background: #fff;
    max-width: 800px;
    margin: 0 auto;
    padding: 22px 28px 32px;
    box-shadow: 0 2px 16px rgba(0,0,0,.2);
  }

  /* ── Header ───────────────────────────────── */
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
    border-bottom: 2px solid #333;
    padding-bottom: 10px;
  }
  .logo-img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .logo-placeholder {
    width: 80px;
    height: 80px;
    border: 1px dashed #bbb;
    flex-shrink: 0;
  }
  .header-text { flex: 1; text-align: center; }
  .emp-nome {
    font-size: 17px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .emp-details { font-size: 10px; color: #444; line-height: 1.7; }

  /* ── Tabelas base ──────────────────────────── */
  table { width: 100%; border-collapse: collapse; }
  td, th {
    border: 1px solid #444;
    padding: 4px 7px;
    vertical-align: middle;
    font-size: 11px;
  }
  .gap { margin-top: 7px; }

  /* ── Barra orçamento nº / datas ─────────────── */
  .bar-orc td { padding: 5px 10px; }
  .bar-num { width: 28%; }
  .bar-emissao { width: 36%; text-align: center; }
  .bar-validade { width: 36%; text-align: center; }

  /* ── Seção título ────────────────────────────── */
  .sec-title td {
    background: #e8e8e8;
    text-align: center;
    font-weight: 700;
    letter-spacing: 0.14em;
    font-size: 11px;
    padding: 5px;
    border: 1px solid #444;
  }

  /* ── Células com label em cima ───────────────── */
  .cell-label {
    display: block;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 1px;
  }
  .cell-val { font-size: 11px; }
  .cell-bold { font-weight: 700; }

  /* ── Cabeçalho da tabela de itens ────────────── */
  .th-item {
    background: #e8e8e8;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.07em;
    text-align: center;
    border: 1px solid #444;
  }
  .td-num   { width: 8%;  text-align: center; }
  .td-desc  { width: 58%; }
  .td-center { text-align: center; }
  .td-right  { text-align: right; white-space: nowrap; }
  .tr-vazio td { height: 19px; }

  /* ── Rodapé de totais ────────────────────────── */
  .row-totais td {
    text-align: center;
    padding: 6px 8px;
    background: #f4f4f4;
    font-size: 11px;
  }
  .tot-label { display: block; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 2px; }
  .tot-val   { display: block; font-size: 13px; font-weight: 700; }
  .tot-grand td { background: #e8e8e8; }
  .tot-grand .tot-val { font-size: 15px; }

  /* ── Observações ─────────────────────────────── */
  .obs-body td {
    padding: 7px 10px;
    line-height: 1.75;
    font-size: 10.5px;
    vertical-align: top;
    min-height: 60px;
  }
  .obs-body p { margin-bottom: 2px; }

  /* ── Assinaturas ─────────────────────────────── */
  .footer {
    display: flex;
    justify-content: space-around;
    margin-top: 40px;
    gap: 60px;
  }
  .ass {
    flex: 1;
    text-align: center;
    border-top: 1px solid #333;
    padding-top: 5px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }

  @media print {
    body { background: white; padding: 0; }
    .page { box-shadow: none; max-width: none; width: 100%; padding: 10mm 14mm; }
    @page { size: A4 portrait; margin: 0; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    ${logoHtml}
    <div class="header-text">
      <div class="emp-nome">${empresa?.nome ?? "Minha Empresa"}</div>
      <div class="emp-details">${empDetails}</div>
    </div>
  </div>

  <!-- Barra nº / datas -->
  <table class="bar-orc gap">
    <tr>
      <td class="bar-num">Orçamento n°: <strong>${orc.numero}</strong></td>
      <td class="bar-emissao">Emitido em: <strong>${fmtData(orc.dataEmissao)}</strong></td>
      <td class="bar-validade">Válido até: <strong>${fmtData(orc.validade)}</strong></td>
    </tr>
  </table>

  <!-- Cliente -->
  <table class="gap">
    <tr class="sec-title"><td colspan="4">C L I E N T E</td></tr>
    <tr>
      ${cell("Nome", orc.cliente?.nome, { colspan: 4, bold: true })}
    </tr>
    <tr>
      ${cell("Telefone", orc.cliente?.telefone, { colspan: 2 })}
      ${cell("E-mail",   orc.cliente?.email,    { colspan: 2 })}
    </tr>
    <tr>
      ${cell("CPF/CNPJ", orc.cliente?.documento, { colspan: 2 })}
    </tr>
  </table>

  <!-- Itens -->
  <table class="gap">
    <tr class="sec-title"><td colspan="4">O R Ç A M E N T O</td></tr>
    <tr>
      <th class="th-item" style="width:8%">Item</th>
      <th class="th-item" style="width:58%">Produto / Serviço</th>
      <th class="th-item" style="width:17%">Quant.</th>
      <th class="th-item" style="width:17%">Valor</th>
    </tr>
    ${itensHtml}
    ${vaziosHtml}
  </table>

  <!-- Totais -->
  <table>
    <tr class="row-totais">
      <td style="width:25%">
        <span class="tot-label">Subtotal</span>
        <span class="tot-val">${fmtBrl(subtotalBruto)}</span>
      </td>
      <td style="width:25%">
        <span class="tot-label">Desconto</span>
        <span class="tot-val">${fmtBrl(descontoTotal)}</span>
      </td>
      <td style="width:25%">
        <span class="tot-label">Frete / Acréscimo</span>
        <span class="tot-val">${fmtBrl(frete)}</span>
      </td>
      <td style="width:25%" class="tot-grand">
        <span class="tot-label">Total</span>
        <span class="tot-val">${fmtBrl(total)}</span>
      </td>
    </tr>
  </table>

  <!-- Observações -->
  <table class="gap">
    <tr class="sec-title"><td>O B S E R V A Ç Õ E S</td></tr>
    <tr class="obs-body"><td>${obsContent}</td></tr>
  </table>

  <!-- Assinaturas -->
  <div class="footer">
    <div class="ass">${empresa?.nome ?? "Fornecedor"}</div>
    <div class="ass">${orc.cliente?.nome ?? "Cliente"}</div>
  </div>

</div>
<script>
  window.onload = function() { window.print(); };
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

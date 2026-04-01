// ── Logos dos bancos ──────────────────────────────────────────────────────────
export const LogoItau = () => (
    <svg viewBox="0 0 88 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
        <rect width="88" height="28" rx="5" fill="#EC7000"/>
        <text x="44" y="19" textAnchor="middle" fill="#fff"
              fontFamily="Arial,sans-serif" fontWeight="900" fontSize="14" letterSpacing="1">itaú</text>
    </svg>
);

export const LogoBradesco = () => (
    <svg viewBox="0 0 100 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
        <rect width="100" height="28" rx="5" fill="#CC092F"/>
        <text x="50" y="19" textAnchor="middle" fill="#fff"
              fontFamily="Arial,sans-serif" fontWeight="900" fontSize="10" letterSpacing="0.8">BRADESCO</text>
    </svg>
);

export const LogoBB = () => (
    <svg viewBox="0 0 100 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
        <rect width="100" height="28" rx="5" fill="#F8C400"/>
        <text x="50" y="19" textAnchor="middle" fill="#003882"
              fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" letterSpacing="0.5">BB</text>
    </svg>
);

export const LogoCaixa = () => (
    <svg viewBox="0 0 100 28" xmlns="http://www.w3.org/2000/svg" className="bank-logo">
        <rect width="100" height="28" rx="5" fill="#005CA9"/>
        <text x="50" y="19" textAnchor="middle" fill="#fff"
              fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" letterSpacing="0.3">CAIXA</text>
    </svg>
);

// ── Catálogo de layouts ───────────────────────────────────────────────────────
export const BANK_LAYOUTS = [
    { key:"ITAU_400_COBRANCA",      bank:"ITAU",     bankId:"itau",     LogoComponent:LogoItau,     version:"400", mode:"COBRANCA",  label:"CNAB 400 — Cobrança",  desc:"Remessa e retorno de boletos (layout clássico)" },
    { key:"ITAU_240_COBRANCA",      bank:"ITAU",     bankId:"itau",     LogoComponent:LogoItau,     version:"240", mode:"COBRANCA",  label:"CNAB 240 — Cobrança",  desc:"Remessa e retorno de boletos (FEBRABAN 240)" },
    { key:"ITAU_240_PAGAMENTO",     bank:"ITAU",     bankId:"itau",     LogoComponent:LogoItau,     version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"SISPAG — TED, PIX, boletos, tributos" },
    { key:"BRADESCO_240_PAGAMENTO", bank:"BRADESCO", bankId:"bradesco", LogoComponent:LogoBradesco, version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"Multipag — crédito conta, boletos, tributos" },
    { key:"BRADESCO_400_COBRANCA",  bank:"BRADESCO", bankId:"bradesco", LogoComponent:LogoBradesco, version:"400", mode:"COBRANCA",  label:"CNAB 400 — Cobrança",  desc:"Remessa e retorno de boletos (layout 400)" },
    { key:"BB_240_PAGAMENTO",       bank:"BB",       bankId:"bb",       LogoComponent:LogoBB,       version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"CC, Poupança, TED, PIX, Boletos, DARF, GPS, GARE" },
    { key:"CAIXA_240_PAGAMENTO",    bank:"CAIXA",    bankId:"caixa",    LogoComponent:LogoCaixa,    version:"240", mode:"PAGAMENTO", label:"CNAB 240 — Pagamento", desc:"CC, TED, DOC, Boletos, Tributos, FGTS" },
];

export const Banks = (() => {
    const map = new Map();
    for (const bl of BANK_LAYOUTS) {
        if (!map.has(bl.bankId))
            map.set(bl.bankId, { bankId:bl.bankId, LogoComponent:bl.LogoComponent, layouts:[] });
        map.get(bl.bankId).layouts.push(bl);
    }
    return [...map.values()];
})();
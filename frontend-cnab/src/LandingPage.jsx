import { useState } from 'react'
import { Link } from 'react-router-dom'

const CADASTRO_URL = 'https://whallet.com.br/cadastro'

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const BG       = '#0A1628'
const SURFACE  = '#112240'
const BORDER   = 'rgba(240,244,248,0.07)'
const TEXT      = '#F0F4F8'
const MUTED     = '#7A8599'
const TEAL      = '#00C9A7'
const TEAL_DIM  = 'rgba(0,201,167,0.12)'
const TEAL_RING = 'rgba(0,201,167,0.3)'
const BLUE      = '#3B82F6'
const MONO      = { fontFamily: 'ui-monospace, "Cascadia Code", monospace' }

const card = (extra = {}) => ({
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  ...extra,
})

/* ── Data ──────────────────────────────────────────────────────────────────── */
const TABS = [
  { key: 'header', label: 'Header', rows: [
    { field: 'Código do Banco',  value: '341'        },
    { field: 'Nome da Empresa',  value: 'ACME LTDA'  },
    { field: 'Data de Geração',  value: '07/07/2026' },
    { field: 'Qtd Lotes',        value: '3'          },
  ]},
  { key: 'sega', label: 'Seg A', rows: [
    { field: 'Favorecido',       value: 'Fornecedor A' },
    { field: 'Valor',            value: 'R$ 4.230,00'  },
    { field: 'Data Pagamento',   value: '08/07/2026'   },
    { field: 'Forma',            value: 'TED'          },
  ]},
  { key: 'segj', label: 'Seg J', rows: [
    { field: 'Cód. de Barras',   value: '34191...02'   },
    { field: 'Cedente',          value: 'Fornecedor B' },
    { field: 'Vencimento',       value: '10/07/2026'   },
    { field: 'Valor',            value: 'R$ 1.980,50'  },
  ]},
  { key: 'trailer', label: 'Trailer', rows: [
    { field: 'Qtd Registros',    value: '1.284'            },
    { field: 'Valor Total',      value: 'R$ 842.310,00'    },
    { field: 'Lotes',            value: '6'                },
    { field: 'Retorno',          value: '00 - OK'          },
  ]},
]

const BANKS = [
  { name: 'Itaú',            color: '#FF6F00' },
  { name: 'Bradesco',        color: '#EC1C24' },
  { name: 'Banco do Brasil', color: '#FFCC00' },
  { name: 'Caixa',           color: '#009EE3' },
]

const STEPS = [
  {
    n: '01',
    title: 'Selecione o banco e layout',
    desc: 'Itaú, Bradesco, BB, Caixa ou layout Protheus. CNAB 240 e CNAB 400.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="2" y="8" width="32" height="22" rx="3" stroke={TEAL} strokeWidth="1.8"/>
        <path d="M8 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" stroke={TEAL} strokeWidth="1.8"/>
        <line x1="2" y1="15" x2="34" y2="15" stroke={TEAL} strokeWidth="1.5" strokeDasharray="3 2"/>
        <circle cx="18" cy="22" r="4" stroke={TEAL} strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Faça upload do arquivo',
    desc: 'Arraste ou selecione seu .REM, .RET ou .TXT. Processamento em segundos.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 28V10" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M10 18l8-8 8 8" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 30h24" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Baixe Excel ou PDF',
    desc: 'Planilha estruturada por tipo de registro ou relatório executivo com alertas.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="6" y="2" width="20" height="26" rx="3" stroke={TEAL} strokeWidth="1.8"/>
        <path d="M20 2v6h6" stroke={TEAL} strokeWidth="1.8"/>
        <path d="M12 16h10M12 21h6" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M22 28v6m0 0l-3-3m3 3l3-3" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const ALERTS = [
  { sev: 'CRÍTICO', color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  msg: '3 registros com valor divergente do total do lote' },
  { sev: 'ATENÇÃO', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', msg: 'Vencimento próximo em 12 títulos' },
  { sev: 'OK',      color: TEAL,      bg: TEAL_DIM,               border: TEAL_RING,               msg: 'Arquivo processado sem erros de layout' },
]

const FAQ = [
  {
    q: 'Quais bancos são suportados?',
    a: 'Itaú, Bradesco, Banco do Brasil e Caixa Econômica Federal, além do layout Protheus customizado. Novos layouts são adicionados conforme demanda.',
  },
  {
    q: 'Preciso criar conta para converter?',
    a: 'Não. Você converte até 2 arquivos por sessão sem criar conta. Para conversões ilimitadas e acesso ao layout Protheus, crie uma conta gratuita.',
  },
  {
    q: 'O que é o layout Protheus?',
    a: 'Layout de exportação específico para empresas que integram CNAB ao ERP Protheus (TOTVS), com campos e formatação para importação direta no sistema.',
  },
  {
    q: 'Qual a diferença entre CNAB 240 e CNAB 400?',
    a: 'CNAB 240 é o padrão moderno com registros de 240 posições e múltiplos segmentos (A, J, O, B). CNAB 400 é o formato legado com registros de 400 posições, ainda em uso por alguns sistemas.',
  },
  {
    q: 'Meus arquivos ficam armazenados?',
    a: 'Conversões sem login não são armazenadas — processamento em memória, sem persistência. Com conta, você pode optar por manter um histórico cifrado.',
  },
]

/* ── Landing Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [tab,    setTab]    = useState('header')
  const [faqIdx, setFaqIdx] = useState(0)

  const rows = TABS.find(t => t.key === tab)?.rows ?? TABS[0].rows

  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,22,40,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${TEAL},${BLUE})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="rgba(10,22,40,0.9)" strokeWidth="1.5"/>
                <line x1="1" y1="5" x2="13" y2="5" stroke="rgba(10,22,40,0.9)" strokeWidth="1.2"/>
                <line x1="1" y1="8" x2="13" y2="8" stroke="rgba(10,22,40,0.9)" strokeWidth="1.2"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: TEXT }}>CNAB Portal</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#como-funciona" style={{ color: MUTED, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Como funciona</a>
            <a href="#recursos"      style={{ color: MUTED, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Recursos</a>
            <a href="#planos"        style={{ color: MUTED, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Planos</a>
            <a href="#faq"           style={{ color: MUTED, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>FAQ</a>
            <Link to="/valida-cnab" style={{ textDecoration: 'none' }}>
              <button style={{ background: TEAL, color: BG, border: 'none', padding: '9px 18px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '-0.01em' }}>
                Converter agora
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 32px 100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: TEAL_DIM, border: `1px solid ${TEAL_RING}`, borderRadius: 999, padding: '5px 14px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, animation: 'cnabPulse 2s infinite' }}/>
            <span style={{ ...MONO, fontSize: 12, color: TEAL, fontWeight: 600 }}>2 conversões gratuitas · sem login</span>
          </div>

          <h1 style={{ fontSize: 54, lineHeight: 1.06, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 22px' }}>
            Converta arquivos{' '}
            <span style={{ color: TEAL }}>CNAB</span>
            {' '}em segundos
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.65, color: MUTED, margin: '0 0 40px', maxWidth: 460 }}>
            CNAB 240 e 400 para Excel estruturado ou PDF analítico. Itaú, Bradesco, BB, Caixa e layout Protheus. Sem instalação, sem complicação.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/valida-cnab" style={{ textDecoration: 'none' }}>
              <button style={{ background: TEAL, color: BG, border: 'none', padding: '15px 28px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 0 0 1px ${TEAL_RING}, 0 8px 28px rgba(0,201,167,0.28)`, letterSpacing: '-0.01em' }}>
                Converter arquivo grátis →
              </button>
            </Link>
            <a href="#planos" style={{ textDecoration: 'none' }}>
              <button style={{ background: 'transparent', color: TEXT, border: `1px solid ${BORDER}`, padding: '15px 28px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 600, fontSize: 15, cursor: 'pointer', letterSpacing: '-0.01em' }}>
                Ver planos
              </button>
            </a>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            {['.REM', '.RET', '.TXT', '.CNAB'].map(ext => (
              <span key={ext} style={{ ...MONO, fontSize: 11, color: BLUE, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '3px 9px', borderRadius: 5 }}>{ext}</span>
            ))}
          </div>
        </div>

        {/* Mockup animado */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: -60, background: `radial-gradient(ellipse at 55% 45%, rgba(0,201,167,0.13), transparent 65%)`, pointerEvents: 'none' }}/>
          <div style={{ ...card({ padding: 22, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'cnabFloat 5s ease-in-out infinite' }), width: '100%', maxWidth: 440, position: 'relative' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: BORDER }}/>)}
              </div>
              <span style={{ ...MONO, fontSize: 11, color: MUTED }}>remessa_itau_240.REM</span>
            </div>

            <div style={{ background: BG, borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ height: 5, background: 'rgba(0,201,167,0.12)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', background: TEAL, borderRadius: 3, animation: 'cnabProgress 3s ease-in-out infinite' }}/>
              </div>
              <div style={{ ...MONO, fontSize: 11, color: TEAL }}>Processando Seg A / Seg J / Trailer…</div>
            </div>

            <div style={{ background: BG, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
                {['Favorecido', 'Valor', 'Data'].map(h => (
                  <div key={h} style={{ flex: 1, padding: '8px 10px', ...MONO, fontSize: 10, color: MUTED }}>{h}</div>
                ))}
              </div>
              {[
                ['Fornecedor A', 'R$ 4.230,00', '07/07'],
                ['Fornecedor B', 'R$ 1.980,50', '08/07'],
                ['Tributo GPS',  'R$ 890,00',   '08/07'],
              ].map(([n, v, d], i) => (
                <div key={i} style={{ display: 'flex', padding: '8px 10px', ...MONO, fontSize: 11, color: TEXT, background: i % 2 ? `rgba(240,244,248,0.02)` : 'transparent', animation: i === 0 ? 'cnabRowIn 0.5s ease' : undefined }}>
                  <div style={{ flex: 1 }}>{n}</div>
                  <div style={{ flex: 1, color: TEAL }}>{v}</div>
                  <div style={{ flex: 1 }}>{d}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {['Header', 'Seg A', 'Seg J', 'Trailer'].map((l, i) => (
                <div key={l} style={{ padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: i === 0 ? TEAL : TEAL_DIM, color: i === 0 ? BG : TEAL, ...MONO }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.012)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <span style={{ fontSize: 13, color: MUTED }}>Compatível com os principais bancos:</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {BANKS.map(({ name, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 999, padding: '7px 16px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }}/>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{name}</span>
              </div>
            ))}
          </div>
          <span style={{ ...MONO, fontSize: 12, color: MUTED }}>CNAB 240 · CNAB 400 · Protheus</span>
        </div>
      </div>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section id="como-funciona" style={{ maxWidth: 1160, margin: '0 auto', padding: '96px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ ...MONO, fontSize: 12, color: TEAL, fontWeight: 600, marginBottom: 12, letterSpacing: '0.08em' }}>COMO FUNCIONA</div>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Três passos. Sem instalação.</h2>
          <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>Do arquivo bruto ao relatório organizado em menos de 30 segundos.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ ...card({ padding: '32px 28px' }) }}>
              <div style={{ ...MONO, fontSize: 13, color: TEAL, fontWeight: 700, marginBottom: 24 }}>{s.n}</div>
              <div style={{ marginBottom: 20 }}>{s.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.01em' }}>{s.title}</h3>
              <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RECURSOS ──────────────────────────────────────────────────────── */}
      <section id="recursos" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px 100px', display: 'flex', flexDirection: 'column', gap: 100 }}>

        {/* Feature 1 — Excel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ ...MONO, fontSize: 11, color: TEAL, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14 }}>RECURSO 01 · EXCEL</div>
            <h3 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 18px', lineHeight: 1.2 }}>Planilha estruturada por tipo de registro</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                'Cada segmento em sua própria aba — Header, Seg A, Seg J, Seg O, Trailer',
                'Datas, valores e códigos formatados automaticamente',
                'Compatível com Itaú, Bradesco, BB, Caixa e layout Protheus',
              ].map(t => (
                <li key={t} style={{ display: 'flex', gap: 10, color: TEXT, fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ color: TEAL, flexShrink: 0, marginTop: 2 }}>→</span>{t}
                </li>
              ))}
            </ul>
            <Link to="/excel" style={{ textDecoration: 'none' }}>
              <button style={{ background: TEAL_DIM, color: TEAL, border: `1px solid ${TEAL_RING}`, padding: '11px 22px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Converter para Excel →
              </button>
            </Link>
          </div>
          <div style={{ ...card({ overflow: 'hidden' }) }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', color: t.key === tab ? BG : MUTED, background: t.key === tab ? TEAL : 'transparent', transition: 'all 0.15s', fontFamily: 'inherit', ...MONO }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ flex: 1.4, ...MONO, fontSize: 10, color: MUTED }}>CAMPO</div>
                <div style={{ flex: 1,   ...MONO, fontSize: 10, color: MUTED }}>VALOR</div>
              </div>
              {rows.map(r => (
                <div key={r.field} style={{ display: 'flex', padding: '7px 0' }}>
                  <div style={{ flex: 1.4, ...MONO, fontSize: 12, color: TEXT }}>{r.field}</div>
                  <div style={{ flex: 1,   ...MONO, fontSize: 12, color: TEAL }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature 2 — PDF */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div style={{ ...card({ padding: 24 }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <rect x="1" y="1" width="12" height="14" rx="2" stroke={MUTED} strokeWidth="1.4"/>
                <path d="M9 1v4h4" stroke={MUTED} strokeWidth="1.4"/>
              </svg>
              <span style={{ ...MONO, fontSize: 11, color: MUTED }}>relatorio_analitico.pdf</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
              {[{ l: 'Registros', v: '1.284', c: TEXT }, { l: 'Lotes', v: '6', c: TEXT }, { l: 'Total', v: 'R$ 842k', c: TEAL }].map(item => (
                <div key={item.l} style={{ background: BG, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 6 }}>{item.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.c }}>{item.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ALERTS.map(a => (
                <div key={a.sev} style={{ display: 'flex', alignItems: 'center', gap: 8, background: a.bg, border: `1px solid ${a.border}`, borderRadius: 6, padding: '8px 12px' }}>
                  <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: a.color }}>{a.sev}</span>
                  <span style={{ fontSize: 12, color: TEXT }}>{a.msg}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ ...MONO, fontSize: 11, color: TEAL, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14 }}>RECURSO 02 · PDF</div>
            <h3 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 18px', lineHeight: 1.2 }}>Relatório analítico com alertas automáticos</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                'Resumo executivo com total de registros, lotes e valores',
                'Alertas CRÍTICO / ATENÇÃO / OK para cada inconsistência encontrada',
                'Ranking de favorecidos e linha do tempo de vencimentos',
              ].map(t => (
                <li key={t} style={{ display: 'flex', gap: 10, color: TEXT, fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ color: TEAL, flexShrink: 0, marginTop: 2 }}>→</span>{t}
                </li>
              ))}
            </ul>
            <Link to="/pdf" style={{ textDecoration: 'none' }}>
              <button style={{ background: TEAL_DIM, color: TEAL, border: `1px solid ${TEAL_RING}`, padding: '11px 22px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Gerar relatório PDF →
              </button>
            </Link>
          </div>
        </div>

        {/* Feature 3 — Elvis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ ...MONO, fontSize: 11, color: TEAL, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14 }}>RECURSO 03 · IA</div>
            <h3 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 18px', lineHeight: 1.2 }}>Elvis — Assistente IA para CNAB</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                'Pergunte sobre layouts, campos e regras de cada banco',
                'Análise contextualizada do seu arquivo carregado',
                'Base de conhecimento com documentação oficial dos bancos',
              ].map(t => (
                <li key={t} style={{ display: 'flex', gap: 10, color: TEXT, fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ color: TEAL, flexShrink: 0, marginTop: 2 }}>→</span>{t}
                </li>
              ))}
            </ul>
            <Link to="/assistente-cnab" style={{ textDecoration: 'none' }}>
              <button style={{ background: TEAL_DIM, color: TEAL, border: `1px solid ${TEAL_RING}`, padding: '11px 22px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Falar com Elvis →
              </button>
            </Link>
          </div>
          <div style={{ ...card({ padding: 22 }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${TEAL},${BLUE})`, flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Elvis</div>
                <div style={{ ...MONO, fontSize: 10, color: MUTED }}>assistente CNAB · online</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ alignSelf: 'flex-end', background: BLUE, color: '#fff', padding: '10px 14px', borderRadius: '12px 12px 2px 12px', fontSize: 13, maxWidth: '78%', lineHeight: 1.5 }}>
                O que é o Segmento A no CNAB 240?
              </div>
              <div style={{ alignSelf: 'flex-start', background: BG, color: TEXT, padding: '10px 14px', borderRadius: '12px 12px 12px 2px', fontSize: 13, maxWidth: '88%', lineHeight: 1.6 }}>
                O Segmento A contém os dados principais do pagamento: banco favorecido, agência, conta, valor, data e forma de pagamento (TED, DOC, crédito em conta). É o registro de detalhe mais usado no CNAB 240.
              </div>
              <div style={{ alignSelf: 'flex-end', background: BLUE, color: '#fff', padding: '10px 14px', borderRadius: '12px 12px 2px 12px', fontSize: 13, maxWidth: '78%' }}>
                E o Segmento J?
              </div>
              <div style={{ ...MONO, alignSelf: 'flex-start', fontSize: 11, color: MUTED }}>Elvis está digitando…</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ────────────────────────────────────────────────────────── */}
      <section id="planos" style={{ background: 'rgba(255,255,255,0.015)', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '96px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ ...MONO, fontSize: 12, color: TEAL, fontWeight: 600, marginBottom: 12, letterSpacing: '0.08em' }}>PLANOS</div>
            <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px' }}>Simples e transparente</h2>
            <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>Comece grátis, sem cartão de crédito.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* Free */}
            <div style={{ ...card({ padding: 36 }) }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: '0.08em', marginBottom: 10 }}>FREE · SEM LOGIN</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Grátis</div>
              <p style={{ color: MUTED, fontSize: 14, margin: '0 0 28px', lineHeight: 1.5 }}>Para testar rapidamente sem criar conta.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['2 conversões por sessão', 'Excel e PDF disponíveis', 'Layouts bancários padrão'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: TEXT }}>
                    <span style={{ color: TEAL, fontWeight: 700 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link to="/valida-cnab" style={{ textDecoration: 'none', display: 'block' }}>
                <button style={{ width: '100%', background: 'transparent', color: TEXT, border: `1px solid ${BORDER}`, padding: 14, borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  Converter agora
                </button>
              </Link>
            </div>

            {/* Conta Grátis */}
            <div style={{ ...card({ padding: 36, border: `1px solid ${TEAL}`, boxShadow: `0 0 0 1px ${TEAL_RING}, 0 20px 50px rgba(0,201,167,0.1)`, position: 'relative' }) }}>
              <div style={{ position: 'absolute', top: -13, left: 32, background: TEAL, color: BG, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, letterSpacing: '0.04em' }}>RECOMENDADO</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, letterSpacing: '0.08em', marginBottom: 10 }}>CONTA GRÁTIS</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Crie uma conta</div>
              <p style={{ color: MUTED, fontSize: 14, margin: '0 0 28px', lineHeight: 1.5 }}>Para quem processa arquivos com frequência.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Conversões ilimitadas', 'Layout Protheus customizado', 'Histórico de arquivos processados', 'Elvis — assistente IA incluído'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: TEXT }}>
                    <span style={{ color: TEAL, fontWeight: 700 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href={CADASTRO_URL} style={{ textDecoration: 'none', display: 'block' }}>
                <button style={{ width: '100%', background: TEAL, color: BG, border: 'none', padding: 14, borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,201,167,0.25)' }}>
                  Criar conta grátis →
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: 760, margin: '0 auto', padding: '96px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ ...MONO, fontSize: 12, color: TEAL, fontWeight: 600, marginBottom: 12, letterSpacing: '0.08em' }}>FAQ</div>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Perguntas frequentes</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <button
                onClick={() => setFaqIdx(faqIdx === i ? -1 : i)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left' }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: TEXT, letterSpacing: '-0.01em' }}>{item.q}</span>
                <span style={{ fontSize: 18, color: TEAL, fontWeight: 400, flexShrink: 0, lineHeight: 1 }}>{faqIdx === i ? '−' : '+'}</span>
              </button>
              {faqIdx === i && (
                <div style={{ padding: '0 0 20px', color: MUTED, fontSize: 14, lineHeight: 1.7 }}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px 100px' }}>
        <div style={{ ...card({ padding: '56px 48px', textAlign: 'center', background: `linear-gradient(135deg, rgba(0,201,167,0.06), rgba(59,130,246,0.04))`, border: `1px solid ${TEAL_RING}` }) }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 16px' }}>
            Pronto pra deixar o CNAB<br/>de lado?
          </h2>
          <p style={{ color: MUTED, fontSize: 16, margin: '0 0 36px' }}>
            Sem instalação, sem conta obrigatória. Faça sua primeira conversão agora.
          </p>
          <Link to="/valida-cnab" style={{ textDecoration: 'none' }}>
            <button style={{ background: TEAL, color: BG, border: 'none', padding: '16px 36px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: `0 8px 28px rgba(0,201,167,0.3)`, letterSpacing: '-0.01em' }}>
              Converter arquivo grátis →
            </button>
          </Link>
        </div>
      </section>

      {/* ── CSS ANIMATIONS ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes cnabPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes cnabFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes cnabProgress {
          0% { width: 0%; }
          60%, 100% { width: 100%; }
        }
        @keyframes cnabRowIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg,${TEAL},${BLUE})` }}/>
            <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>CNAB Portal</span>
            <span style={{ color: MUTED, fontSize: 13, marginLeft: 4 }}>· uma ferramenta{' '}
              <a href="https://whallet.com.br" style={{ color: BLUE, textDecoration: 'none' }}>Whallet</a>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="https://whallet.com.br/termos"      style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>Termos</a>
            <a href="https://whallet.com.br/privacidade" style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>Privacidade</a>
            <a href="mailto:usewhallet@gmail.com"        style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>Suporte</a>
          </div>
          <span style={{ color: MUTED, fontSize: 13 }}>© 2026 Whallet</span>
        </div>
      </footer>

    </div>
  )
}

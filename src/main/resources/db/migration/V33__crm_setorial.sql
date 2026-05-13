-- V33: Sprint F1.3 — CRM setorial com campos dinâmicos
--
-- 1. Novos campos fixos na tabela clientes (endereço, data nascimento, whatsapp, etc)
-- 2. Tabela setores (configuração dos setores disponíveis)
-- 3. Tabela setor_campos (definição dos campos de cada setor, agrupados)
-- 4. Tabela cliente_setor_dados (valores preenchidos pelo usuário — EAV)
-- 5. Seed dos setores e campos

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. NOVOS CAMPOS EM CLIENTES
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_nascimento    DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS whatsapp           VARCHAR(20);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone2          VARCHAR(20);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco           VARCHAR(200);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cidade             VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado             VARCHAR(2);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cep                VARCHAR(9);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS origem_lead        VARCHAR(50);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS responsavel        VARCHAR(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tags               VARCHAR(255);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS score              VARCHAR(20);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_ultimo_contato TIMESTAMP;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS setor_id           VARCHAR(30);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. TABELA SETORES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS setores (
                                       id          VARCHAR(30)     PRIMARY KEY,
    nome        VARCHAR(100)    NOT NULL,
    descricao   VARCHAR(255),
    icone       VARCHAR(30),
    ordem       INT             NOT NULL DEFAULT 0,
    ativo       BOOLEAN         NOT NULL DEFAULT TRUE
    );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TABELA SETOR_CAMPOS (definição dos campos dinâmicos)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS setor_campos (
                                            id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id    VARCHAR(30)     NOT NULL REFERENCES setores(id),
    grupo       VARCHAR(50)     NOT NULL,
    campo       VARCHAR(50)     NOT NULL,
    label       VARCHAR(100)    NOT NULL,
    tipo        VARCHAR(20)     NOT NULL DEFAULT 'TEXT',
    opcoes      TEXT,
    obrigatorio BOOLEAN         NOT NULL DEFAULT FALSE,
    ordem       INT             NOT NULL DEFAULT 0,

    CONSTRAINT chk_setor_campo_tipo CHECK (
                                              tipo IN ('TEXT', 'TEXTAREA', 'NUMBER', 'MONEY', 'DATE', 'SELECT', 'BOOLEAN')
    )
    );

CREATE INDEX IF NOT EXISTS idx_setor_campos_setor ON setor_campos(setor_id, grupo, ordem);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TABELA CLIENTE_SETOR_DADOS (valores preenchidos — EAV)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cliente_setor_dados (
                                                   id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id  UUID            NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    campo_id    UUID            NOT NULL REFERENCES setor_campos(id) ON DELETE CASCADE,
    valor       TEXT,
    criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cliente_campo UNIQUE (cliente_id, campo_id)
    );

CREATE INDEX IF NOT EXISTS idx_csd_cliente ON cliente_setor_dados(cliente_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SEED — SETORES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO setores (id, nome, descricao, icone, ordem) VALUES
                                                            ('seguros',     'Seguros',      'Corretores de seguros, apólices e sinistros',   'LuShield',    1),
                                                            ('clinicas',    'Clínicas / Saúde', 'Consultórios, clínicas e profissionais de saúde', 'LuHeart', 2),
                                                            ('imobiliario', 'Imobiliário',  'Corretores de imóveis, contratos de locação',   'LuHome',      3),
                                                            ('varejo',      'Varejo',       'Lojas, comércios e distribuidores',             'LuShoppingBag', 4),
                                                            ('servicos',    'Serviços',     'Prestadores de serviço em geral',               'LuBriefcase', 5)
    ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5b. SEED — CAMPOS POR SETOR
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── SEGUROS: Dados da Apólice ───────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, opcoes, ordem) VALUES
                                                                                  ('seguros', 'apolice', 'seguradora',         'Seguradora',            'TEXT',    NULL, 1),
                                                                                  ('seguros', 'apolice', 'numero_apolice',     'Número da apólice',     'TEXT',    NULL, 2),
                                                                                  ('seguros', 'apolice', 'tipo_seguro',        'Tipo de seguro',        'SELECT',  'Auto,Residencial,Vida,Saúde,Empresarial,Viagem,Outros', 3),
                                                                                  ('seguros', 'apolice', 'vigencia_inicio',    'Vigência início',       'DATE',    NULL, 4),
                                                                                  ('seguros', 'apolice', 'vigencia_fim',       'Vigência fim',          'DATE',    NULL, 5),
                                                                                  ('seguros', 'apolice', 'valor_segurado',     'Valor segurado',        'MONEY',   NULL, 6),
                                                                                  ('seguros', 'apolice', 'valor_premio',       'Valor prêmio',          'MONEY',   NULL, 7),
                                                                                  ('seguros', 'apolice', 'parcelas',           'Parcelas',              'NUMBER',  NULL, 8),
                                                                                  ('seguros', 'apolice', 'situacao_apolice',   'Situação da apólice',   'SELECT',  'Ativa,Cancelada,Vencida,Em análise', 9),
                                                                                  ('seguros', 'apolice', 'renovacao_auto',     'Renovação automática',  'BOOLEAN', NULL, 10)
    ON CONFLICT DO NOTHING;

-- ─── SEGUROS: Veículo ────────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, ordem) VALUES
                                                                          ('seguros', 'veiculo', 'placa',    'Placa',   'TEXT',   1),
                                                                          ('seguros', 'veiculo', 'modelo',   'Modelo',  'TEXT',   2),
                                                                          ('seguros', 'veiculo', 'ano',      'Ano',     'NUMBER', 3),
                                                                          ('seguros', 'veiculo', 'fipe',     'FIPE',    'TEXT',   4),
                                                                          ('seguros', 'veiculo', 'chassi',   'Chassi',  'TEXT',   5)
    ON CONFLICT DO NOTHING;

-- ─── SEGUROS: Residencial ────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, ordem) VALUES
                                                                          ('seguros', 'residencial', 'tipo_imovel',      'Tipo do imóvel',      'SELECT', 1),
                                                                          ('seguros', 'residencial', 'endereco_segurado', 'Endereço segurado',   'TEXT',   2),
                                                                          ('seguros', 'residencial', 'cobertura',         'Cobertura',           'TEXTAREA', 3)
    ON CONFLICT DO NOTHING;

-- ─── SEGUROS: Vida ───────────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, ordem) VALUES
                                                                          ('seguros', 'vida', 'beneficiarios',   'Beneficiários',    'TEXTAREA', 1),
                                                                          ('seguros', 'vida', 'valor_cobertura', 'Valor cobertura',  'MONEY',    2),
                                                                          ('seguros', 'vida', 'profissao',       'Profissão',        'TEXT',     3),
                                                                          ('seguros', 'vida', 'risco',           'Risco',            'SELECT',   4)
    ON CONFLICT DO NOTHING;

-- ─── SEGUROS: Saúde ──────────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, ordem) VALUES
                                                                          ('seguros', 'saude', 'plano',              'Plano',              'TEXT',   1),
                                                                          ('seguros', 'saude', 'operadora',          'Operadora',          'TEXT',   2),
                                                                          ('seguros', 'saude', 'numero_carteirinha', 'Número carteirinha', 'TEXT',   3),
                                                                          ('seguros', 'saude', 'dependentes',        'Dependentes',        'TEXTAREA', 4)
    ON CONFLICT DO NOTHING;

-- ─── SEGUROS: Financeiro ─────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, ordem) VALUES
                                                                          ('seguros', 'financeiro', 'comissao',           'Comissão',          'MONEY',   1),
                                                                          ('seguros', 'financeiro', 'comissao_recebida',  'Comissão recebida', 'MONEY',   2),
                                                                          ('seguros', 'financeiro', 'parcelas_pendentes', 'Parcelas pendentes','NUMBER',  3),
                                                                          ('seguros', 'financeiro', 'inadimplencia',      'Inadimplência',     'BOOLEAN', 4)
    ON CONFLICT DO NOTHING;

-- ─── SEGUROS: Relacionamento ─────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, ordem) VALUES
                                                                          ('seguros', 'relacionamento', 'ultima_renovacao',    'Última renovação',       'DATE',    1),
                                                                          ('seguros', 'relacionamento', 'sinistro_aberto',     'Sinistro aberto?',       'BOOLEAN', 2),
                                                                          ('seguros', 'relacionamento', 'historico_sinistros',  'Histórico de sinistros', 'TEXTAREA', 3),
                                                                          ('seguros', 'relacionamento', 'satisfacao',          'Satisfação cliente',      'SELECT',  4)
    ON CONFLICT DO NOTHING;

-- Opções pra campos SELECT que faltaram
UPDATE setor_campos SET opcoes = 'Casa,Apartamento,Comercial,Rural' WHERE setor_id = 'seguros' AND campo = 'tipo_imovel' AND opcoes IS NULL;
UPDATE setor_campos SET opcoes = 'Baixo,Médio,Alto' WHERE setor_id = 'seguros' AND campo = 'risco' AND opcoes IS NULL;
UPDATE setor_campos SET opcoes = 'Muito satisfeito,Satisfeito,Neutro,Insatisfeito' WHERE setor_id = 'seguros' AND campo = 'satisfacao' AND opcoes IS NULL;

-- ─── CLÍNICAS / SAÚDE ───────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, opcoes, ordem) VALUES
                                                                                  ('clinicas', 'paciente', 'convenio',             'Convênio',              'TEXT',   NULL, 1),
                                                                                  ('clinicas', 'paciente', 'numero_carteirinha',   'Número carteirinha',    'TEXT',   NULL, 2),
                                                                                  ('clinicas', 'paciente', 'tipo_plano',           'Tipo de plano',         'SELECT', 'Particular,Convênio,SUS', 3),
                                                                                  ('clinicas', 'paciente', 'procedimento_principal','Procedimento principal','TEXT',   NULL, 4),
                                                                                  ('clinicas', 'paciente', 'data_ultima_consulta', 'Data última consulta',  'DATE',   NULL, 5),
                                                                                  ('clinicas', 'paciente', 'alergias',             'Alergias',              'TEXTAREA', NULL, 6),
                                                                                  ('clinicas', 'paciente', 'medicamentos',         'Medicamentos em uso',   'TEXTAREA', NULL, 7),
                                                                                  ('clinicas', 'paciente', 'observacoes_medicas',  'Observações médicas',   'TEXTAREA', NULL, 8)
    ON CONFLICT DO NOTHING;

-- ─── IMOBILIÁRIO ─────────────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, opcoes, ordem) VALUES
                                                                                  ('imobiliario', 'imovel',   'tipo_imovel',     'Tipo de imóvel',      'SELECT', 'Casa,Apartamento,Terreno,Comercial,Rural', 1),
                                                                                  ('imobiliario', 'imovel',   'endereco_imovel', 'Endereço do imóvel',  'TEXT',    NULL, 2),
                                                                                  ('imobiliario', 'imovel',   'area_m2',         'Área (m²)',           'NUMBER',  NULL, 3),
                                                                                  ('imobiliario', 'imovel',   'quartos',         'Quartos',             'NUMBER',  NULL, 4),
                                                                                  ('imobiliario', 'contrato', 'tipo_contrato',   'Tipo de contrato',    'SELECT', 'Venda,Locação,Temporada', 5),
                                                                                  ('imobiliario', 'contrato', 'valor_contrato',  'Valor do contrato',   'MONEY',   NULL, 6),
                                                                                  ('imobiliario', 'contrato', 'data_contrato',   'Data do contrato',    'DATE',    NULL, 7),
                                                                                  ('imobiliario', 'contrato', 'data_vencimento', 'Vencimento contrato', 'DATE',    NULL, 8),
                                                                                  ('imobiliario', 'contrato', 'comissao',        'Comissão',            'MONEY',   NULL, 9)
    ON CONFLICT DO NOTHING;

-- ─── VAREJO ──────────────────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, opcoes, ordem) VALUES
                                                                                  ('varejo', 'comercial', 'limite_credito',       'Limite de crédito',         'MONEY',  NULL, 1),
                                                                                  ('varejo', 'comercial', 'condicao_pagamento',   'Condição de pagamento',     'SELECT', 'À vista,7 dias,14 dias,21 dias,28 dias,30 dias,45 dias,60 dias', 2),
                                                                                  ('varejo', 'comercial', 'dia_preferencial',     'Dia preferencial de compra','NUMBER',  NULL, 3),
                                                                                  ('varejo', 'comercial', 'tabela_preco',         'Tabela de preço',           'SELECT', 'Padrão,Atacado,VIP', 4),
                                                                                  ('varejo', 'comercial', 'vendedor_responsavel', 'Vendedor responsável',      'TEXT',    NULL, 5)
    ON CONFLICT DO NOTHING;

-- ─── SERVIÇOS ────────────────────────────────────────────────────────────────
INSERT INTO setor_campos (setor_id, grupo, campo, label, tipo, opcoes, ordem) VALUES
                                                                                  ('servicos', 'contrato', 'tipo_servico',     'Tipo de serviço',       'TEXT',   NULL, 1),
                                                                                  ('servicos', 'contrato', 'valor_mensal',     'Valor mensal',          'MONEY',  NULL, 2),
                                                                                  ('servicos', 'contrato', 'data_inicio',      'Data início contrato',  'DATE',   NULL, 3),
                                                                                  ('servicos', 'contrato', 'data_fim',         'Data fim contrato',     'DATE',   NULL, 4),
                                                                                  ('servicos', 'contrato', 'recorrencia',      'Recorrência',           'SELECT', 'Mensal,Trimestral,Semestral,Anual,Avulso', 5),
                                                                                  ('servicos', 'contrato', 'sla',              'SLA / Nível de serviço','TEXT',   NULL, 6)
    ON CONFLICT DO NOTHING;
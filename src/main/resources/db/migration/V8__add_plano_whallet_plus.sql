-- V8: Adiciona plano Whallet+ (gestão financeira)
-- ID fixo para facilitar verificação no frontend/backend

INSERT INTO planos (id, nome, limite_mensal)
VALUES (
           '10000000-0000-0000-0000-000000000003',
           'Whallet+',
           -1  -- ilimitado
       ) ON CONFLICT (id) DO NOTHING;
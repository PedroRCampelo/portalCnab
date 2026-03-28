# Portal CNAB

[![Screenshot-2026-03-28-at-12-02-17.png](https://i.postimg.cc/9M9NJm9v/Screenshot-2026-03-28-at-12-02-17.png)](https://postimg.cc/MMWDG8dD)

# [whallet.com.br](whallet.com.br)

API desenvolvida em Java + Spring Boot para interpretar arquivos de
remessa CNAB a partir de um arquivo de layout/configuração e gerar uma
planilha Excel estruturada com os dados extraídos.

O objetivo do projeto é facilitar a análise de arquivos CNAB, permitindo
que usuários transformem arquivos de remessa bancária em um formato
tabular fácil de analisar.

## FUNCIONALIDADES

-   Upload de arquivo de layout CNAB
-   Upload de arquivo de remessa CNAB
-   Interpretação automática baseada no layout
-   Identificação de tipos de registro
-   Extração automática dos campos
-   Geração de Excel (.xlsx) com abas separadas

## PRÓXIMOS PASSOS
- Não necessidade de arquivo layout
```
Validação de LAYOUTS do Protheus

Se você precisa validar arquivos de layout do Protheus, será possível:

Enviar o layout desejado
Gerar automaticamente um arquivo Excel com base nesse layout
Utilizar o Excel como apoio para conferência e validação dos dados

Essa opção é ideal para quem trabalha diretamente com estruturas personalizadas de layout.
``` 
```
Validação de arquivos de REMESSA

Caso sua necessidade seja apenas validar arquivos de remessa:

Não será necessário enviar um layout personalizado
O sistema utilizará como base os layouts padrão dos bancos
A validação será feita automaticamente seguindo essas estruturas já conhecidas

Essa opção é recomendada para validações mais rápidas e padronizadas.
``` 

- Suporte a layout 240 posições
- Dashboard de análise de remessas
- Validação de inconsistências
- Integração com sistemas ERP

## Autor

- [Pedro Campelo](https://github.com/PedroRCampelo)
# Portal CNAB

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
-   Identificação de tipos de registro:
    -   Header (0)
    -   Detalhe (1)
    -   Complemento (2)
    -   Trailer (9)
-   Extração automática dos campos
-   Geração de Excel (.xlsx) com abas separadas

## ESTRUTURA DO EXCEL GERADO

Aba: Resumo Descrição: Informações gerais do processamento

Aba: Header Descrição: Dados do registro tipo 0

Aba: Detalhe Descrição: Dados dos registros tipo 1

Aba: Complemento Descrição: Dados dos registros tipo 2

Aba: Trailer Descrição: Dados do registro tipo 9

## TECNOLOGIAS UTILIZADAS

-   Java 17+
-   Spring Boot
-   Maven
-   Apache POI (geração de Excel)
-   REST API

## ENDPOINT PRINCIPAL

Exportar Excel a partir de CNAB

Endpoint: POST /api/cnab/export

Tipo de requisição: multipart/form-data

Parâmetros:

layoutFile -> Arquivo de layout CNAB remessaFile -> Arquivo de remessa
CNAB

Retorno: Arquivo Excel contendo os dados interpretados.

## POSSÍVEIS EVOLUÇÕES

-   Não necessidade de arquivo layout (Utilizar o layout universal dos bancos)
-   Interface Web para upload de arquivos
-   Suporte a múltiplos layouts CNAB
-   Validação de inconsistências
-   Conversão automática de datas e valores
-   Dashboard de análise de remessas
-   Integração com sistemas ERP

AUTOR:
Pedro Campêlo

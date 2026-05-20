# Portal CNAB (Whallet)

[![Screenshot-2026-05-20-at-07-55-34.png](https://i.postimg.cc/YS2HXG68/Screenshot-2026-05-20-at-07-55-34.png)](https://postimg.cc/bZ5WrvF2)

https://whallet.com.br/

API desenvolvida em Java + Spring Boot para interpretar arquivos de
remessa CNAB a partir de um arquivo de layout/configuração e gerar PDF ou planilha Excel estruturada com os dados extraídos.

O objetivo do projeto é facilitar a análise de arquivos CNAB, permitindo que usuários transformem arquivos de remessa bancária em um formato tabular fácil de analisar.

## Atualização

Com o passar do tempo o portal CNAB ganhou o nome de **Whallet** e evoluiu de uma ferramenta de validação CNAB para uma **plataforma completa de gestão financeira** voltada para MEIs e autônomos.

### Funcionalidades Adicionadas

**🏦 Gestão Financeira Completa**
- **Contas a Pagar**: Cadastro e controle de títulos com suporte a CNAB (Boleto, PIX, TED)
- **Contas a Receber**: Gestão de recebimentos com vínculo a clientes e categorias
- **Fluxo de Caixa**: Visualização consolidada de entradas, saídas e saldo projetado
- **Saldos Bancários**: Controle multi-conta com histórico de movimentações

**💬 Automação e Integrações**
- **Bot WhatsApp**: Integração com Evolution API para lançamentos via mensagem
- **Transcrição de Áudio**: Criação de lançamentos a partir de notas de voz

**📊 Relatórios e Inteligência**
- **DRE (Demonstração do Resultado)**: Análise de receitas, despesas e margem mensal
- **Relatórios por Categoria**: Visualização de gastos e receitas categorizados
- **Aurora IA**: Assistente financeira que gera insights narrativos sobre a saúde financeira


**📱 App Mobile (Em desenvolvimento)**
- **React Native + Expo**: Aplicativo nativo para iOS e Android
- **Interface redesenhada**: Dashboard, lançamento rápido, relatórios e mais
- **Sincronização em tempo real** com backend

### Stack Tecnológica

**Backend**
- Java 17 + Spring Boot 3.x
- PostgreSQL
- JWT Authentication
- Render (hospedagem)

**Frontend Web**
- React + Vite
- Tailwind CSS
- Cloudflare DNS

**Mobile**
- React Native
- Expo
- Auto-detect IP (dev)

**Integrações**
- Evolution API (WhatsApp)
- DigitalOcean (Evolution hosting)

## Autor
- [Pedro Campelo](https://github.com/PedroRCampelo)
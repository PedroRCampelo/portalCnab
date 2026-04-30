import { useEffect } from "react";
import LegalLayout from "./_LegalLayout.jsx";
import { Section, ContactBlock, BackToHome } from "./_legalShared.jsx";

/**
 * PrivacidadePage — Política de Privacidade
 * Sprint A3.7.1 · Conteúdo LGPD-compliant base
 *
 * ⚠️ DISCLAIMER:
 * Este conteúdo é template base seguindo padrões LGPD comuns.
 * NÃO é assessoria jurídica. Recomenda-se revisão por advogado antes
 * de operar com volume relevante de usuários ou dados sensíveis.
 *
 * Estrutura (8 seções LGPD):
 *  1. Introdução e escopo
 *  2. Dados que coletamos
 *  3. Como usamos os dados
 *  4. Base legal (art. 7 LGPD)
 *  5. Compartilhamento com terceiros
 *  6. Direitos do titular
 *  7. Segurança e retenção
 *  8. Atualizações desta política
 *  + Contato do DPO
 */
export default function PrivacidadePage() {
    useEffect(() => {
        document.title = "Política de Privacidade · Whallet";
        document.querySelector('meta[name="description"]')?.setAttribute(
            "content",
            "Política de Privacidade do Whallet — como coletamos, usamos e protegemos seus dados, em conformidade com a LGPD."
        );
    }, []);

    return (
        <LegalLayout
            kicker="Documentação legal"
            title="Política de Privacidade"
            ultimaAt="30 de abril, 2026"
        >
            <p>
                Esta Política de Privacidade descreve como o <strong>Whallet</strong> coleta,
                usa, armazena e compartilha informações pessoais dos usuários da plataforma.
                Operamos em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>,
                respeitando seus direitos e garantindo transparência no tratamento de dados.
            </p>

            <p>
                Ao utilizar o Whallet, você concorda com as práticas descritas neste documento.
                Recomendamos a leitura completa para entender como suas informações são tratadas.
            </p>

            {/* ── 1. Introdução e escopo ─────────────────────────────── */}
            <Section id="introducao" numero="1" titulo="Introdução e escopo">
                <p>
                    O Whallet é uma plataforma de gestão financeira voltada para empresas e
                    profissionais autônomos no Brasil, oferecendo conversão de arquivos CNAB,
                    controle de recebimentos e contas a pagar, fluxo de caixa, alertas
                    automáticos e ferramentas de inteligência artificial aplicada a finanças.
                </p>
                <p>
                    Esta política se aplica a todos os usuários que acessam:
                </p>
                <ul>
                    <li>O site <code>whallet.com.br</code> e suas subpáginas</li>
                    <li>O painel administrativo do Whallet</li>
                    <li>As ferramentas públicas (conversor CNAB para Excel/PDF, validador)</li>
                    <li>Os agentes de IA (Elvis, Aurora, Frank, Anne)</li>
                </ul>
                <p>
                    O Whallet é operado como pessoa física no Brasil. As informações de contato
                    do controlador de dados estão ao final deste documento.
                </p>
            </Section>

            {/* ── 2. Dados coletados ─────────────────────────────────── */}
            <Section id="dados-coletados" numero="2" titulo="Dados que coletamos">
                <p>Coletamos diferentes categorias de dados para operar a plataforma:</p>

                <h3>2.1 Dados de cadastro</h3>
                <p>
                    Quando você cria uma conta no Whallet, coletamos:
                </p>
                <ul>
                    <li>Nome completo</li>
                    <li>Endereço de e-mail</li>
                    <li>Senha (armazenada com criptografia <code>bcrypt</code>, nunca em texto plano)</li>
                    <li>Dados opcionais informados no perfil (CNPJ/CPF, razão social, telefone)</li>
                </ul>

                <h3>2.2 Dados de uso</h3>
                <p>
                    Conforme você utiliza a plataforma, coletamos automaticamente:
                </p>
                <ul>
                    <li>Histórico de conversões CNAB (banco, tipo, data, sem armazenar conteúdo dos arquivos)</li>
                    <li>Recebimentos, títulos e clientes que você cadastra</li>
                    <li>Interações com os agentes de IA (perguntas e respostas)</li>
                    <li>Preferências de configuração e alertas</li>
                </ul>

                <h3>2.3 Dados técnicos</h3>
                <p>
                    Para segurança e funcionamento, coletamos:
                </p>
                <ul>
                    <li>Endereço IP de acesso</li>
                    <li>Tipo e versão do navegador</li>
                    <li>Sistema operacional</li>
                    <li>Cookies essenciais para sessão e autenticação</li>
                    <li>Dados de uso anônimo via Google Analytics (estatísticas agregadas)</li>
                </ul>

                <h3>2.4 Dados de pagamento</h3>
                <p>
                    Pagamentos são processados pelo <strong>Stripe</strong> (provedor PCI-DSS compliant).
                    O Whallet <strong>não armazena dados de cartão de crédito</strong>. Recebemos do
                    Stripe apenas: status da assinatura, plano contratado e identificador de cliente.
                </p>

                <h3>2.5 Arquivos CNAB</h3>
                <p>
                    Quando você usa o conversor CNAB, os arquivos enviados são processados em memória
                    e <strong>não são armazenados em disco no servidor</strong>. Apenas metadados
                    (banco, tipo, número de registros, data) ficam no histórico para sua referência.
                </p>
            </Section>

            {/* ── 3. Como usamos os dados ────────────────────────────── */}
            <Section id="como-usamos" numero="3" titulo="Como usamos seus dados">
                <p>Utilizamos os dados coletados para:</p>
                <ul>
                    <li>
                        <strong>Operar a plataforma</strong>: autenticar seu acesso, fornecer as
                        funcionalidades contratadas, processar pagamentos
                    </li>
                    <li>
                        <strong>Melhorar o produto</strong>: identificar bugs, otimizar performance,
                        priorizar features baseadas em uso real
                    </li>
                    <li>
                        <strong>Comunicar com você</strong>: enviar alertas configurados, notificações
                        de cobrança, atualizações importantes do serviço
                    </li>
                    <li>
                        <strong>Garantir segurança</strong>: prevenir fraudes, monitorar tentativas
                        de acesso indevido, manter logs de auditoria
                    </li>
                    <li>
                        <strong>Cumprir obrigações legais</strong>: manter registros conforme exigido
                        por legislação fiscal e de proteção ao consumidor
                    </li>
                </ul>

                <div className="legal-callout legal-callout--info">
                    <div className="legal-callout-title">Importante</div>
                    <p style={{ margin: 0 }}>
                        <strong>Não vendemos seus dados</strong> para terceiros e
                        <strong> não usamos suas informações para publicidade</strong>.
                        Seu histórico financeiro é confidencial.
                    </p>
                </div>
            </Section>

            {/* ── 4. Base legal LGPD ─────────────────────────────────── */}
            <Section id="base-legal" numero="4" titulo="Base legal para tratamento">
                <p>
                    De acordo com o <strong>artigo 7º da LGPD</strong>, tratamos seus dados com as
                    seguintes bases legais:
                </p>
                <ul>
                    <li>
                        <strong>Execução de contrato</strong> (art. 7º, V): para fornecer os serviços
                        que você contratou
                    </li>
                    <li>
                        <strong>Cumprimento de obrigação legal</strong> (art. 7º, II): para atender
                        legislação fiscal, tributária e de defesa do consumidor
                    </li>
                    <li>
                        <strong>Consentimento</strong> (art. 7º, I): para envio de comunicações
                        de marketing (que você pode revogar a qualquer momento)
                    </li>
                    <li>
                        <strong>Legítimo interesse</strong> (art. 7º, IX): para segurança da
                        plataforma e prevenção de fraudes
                    </li>
                </ul>
            </Section>

            {/* ── 5. Compartilhamento ────────────────────────────────── */}
            <Section id="compartilhamento" numero="5" titulo="Compartilhamento de dados">
                <p>
                    Compartilhamos dados estritamente necessários com os seguintes provedores
                    contratados, todos com obrigação contratual de proteção:
                </p>

                <h3>5.1 Provedores de infraestrutura</h3>
                <ul>
                    <li>
                        <strong>Render</strong> — hospedagem do servidor e banco de dados (PostgreSQL).
                        Servidores localizados em região configurável.
                    </li>
                    <li>
                        <strong>Google Analytics</strong> — estatísticas agregadas de uso, com
                        anonimização de IP habilitada
                    </li>
                </ul>

                <h3>5.2 Provedores de pagamento</h3>
                <ul>
                    <li>
                        <strong>Stripe</strong> — processamento de pagamentos. Apenas dados necessários
                        para a transação são compartilhados. Política do Stripe:
                        {" "}<a href="https://stripe.com/br/privacy" target="_blank" rel="noreferrer">
                        stripe.com/br/privacy
                    </a>
                    </li>
                </ul>

                <h3>5.3 Provedores de IA</h3>
                <p>
                    Os agentes de IA do Whallet utilizam modelos de linguagem fornecidos por
                    terceiros (Anthropic). Quando você interage com os agentes:
                </p>
                <ul>
                    <li>O texto da sua pergunta é enviado ao provedor para processamento</li>
                    <li>Não compartilhamos seu nome, e-mail ou identificadores pessoais junto</li>
                    <li>O provedor não utiliza essas conversas para treinar modelos (configuração contratual)</li>
                </ul>

                <h3>5.4 Autoridades públicas</h3>
                <p>
                    Podemos compartilhar dados quando exigido por ordem judicial, requisição de
                    autoridade competente ou quando necessário para cumprir obrigações legais.
                </p>
            </Section>

            {/* ── 6. Direitos do titular ─────────────────────────────── */}
            <Section id="direitos" numero="6" titulo="Seus direitos como titular">
                <p>
                    A LGPD garante a você os seguintes direitos sobre seus dados pessoais
                    (art. 18). Você pode exercê-los a qualquer momento entrando em contato:
                </p>

                <ul>
                    <li>
                        <strong>Acesso</strong>: confirmar a existência de tratamento e acessar
                        os dados que temos sobre você
                    </li>
                    <li>
                        <strong>Correção</strong>: solicitar correção de dados incompletos,
                        inexatos ou desatualizados
                    </li>
                    <li>
                        <strong>Anonimização ou eliminação</strong>: pedir a anonimização ou
                        exclusão de dados desnecessários ou tratados em desconformidade com a LGPD
                    </li>
                    <li>
                        <strong>Portabilidade</strong>: receber seus dados em formato estruturado
                        (CSV/JSON) para transferir a outro fornecedor
                    </li>
                    <li>
                        <strong>Eliminação</strong>: solicitar a exclusão de dados tratados com
                        base em consentimento (exceto quando houver outras bases legais)
                    </li>
                    <li>
                        <strong>Informação</strong>: saber com quais entidades públicas e privadas
                        compartilhamos seus dados
                    </li>
                    <li>
                        <strong>Revogação do consentimento</strong>: retirar consentimento dado
                        anteriormente, ciente das consequências
                    </li>
                </ul>

                <p>
                    Para exercer qualquer desses direitos, entre em contato pelo e-mail abaixo.
                    Atendemos solicitações em até <strong>15 dias úteis</strong>.
                </p>
            </Section>

            {/* ── 7. Segurança e retenção ────────────────────────────── */}
            <Section id="seguranca" numero="7" titulo="Segurança e retenção">
                <h3>7.1 Medidas de segurança</h3>
                <p>Aplicamos medidas técnicas e administrativas adequadas:</p>
                <ul>
                    <li>Conexões HTTPS/TLS em todas as comunicações</li>
                    <li>Senhas armazenadas com hash <code>bcrypt</code> (irreversível)</li>
                    <li>Banco de dados em ambiente protegido com acesso restrito</li>
                    <li>Logs de auditoria de acessos administrativos</li>
                    <li>Backup automático com retenção configurada</li>
                    <li>Tokens de sessão com expiração e renovação</li>
                </ul>

                <h3>7.2 Tempo de retenção</h3>
                <p>Mantemos seus dados pelo tempo necessário para:</p>
                <ul>
                    <li>
                        <strong>Conta ativa</strong>: enquanto sua conta estiver em uso ou em
                        contrato vigente
                    </li>
                    <li>
                        <strong>Conta inativa</strong>: por até 6 meses após inatividade, depois
                        anonimizamos ou excluímos
                    </li>
                    <li>
                        <strong>Dados fiscais</strong>: pelo prazo exigido pela legislação
                        tributária (até 5 anos)
                    </li>
                    <li>
                        <strong>Logs de segurança</strong>: por até 12 meses, conforme Marco Civil
                        da Internet
                    </li>
                </ul>

                <p>
                    Você pode solicitar a exclusão antecipada dos seus dados a qualquer momento,
                    respeitadas as obrigações legais de retenção.
                </p>

                <div className="legal-callout legal-callout--warning">
                    <div className="legal-callout-title">Importante</div>
                    <p style={{ margin: 0 }}>
                        Nenhum sistema é 100% imune a violações. Em caso de incidente de segurança
                        que possa afetar seus dados, comunicaremos você e a ANPD em conformidade
                        com a LGPD.
                    </p>
                </div>
            </Section>

            {/* ── 8. Atualizações ────────────────────────────────────── */}
            <Section id="atualizacoes" numero="8" titulo="Atualizações desta política">
                <p>
                    Esta política pode ser atualizada periodicamente para refletir mudanças no
                    serviço, na legislação ou em melhores práticas. Mudanças significativas serão
                    comunicadas:
                </p>
                <ul>
                    <li>Por e-mail aos usuários cadastrados</li>
                    <li>Com aviso destacado no painel administrativo</li>
                    <li>Atualização da data de "Última atualização" no topo deste documento</li>
                </ul>
                <p>
                    O uso continuado da plataforma após mudanças constitui aceitação da política
                    atualizada. Se você discordar das mudanças, pode cancelar sua conta.
                </p>
            </Section>

            <hr/>

            {/* ── Contato do DPO ─────────────────────────────────────── */}
            <Section id="contato" numero="9" titulo="Contato do encarregado">
                <p>
                    Para qualquer dúvida sobre esta política ou para exercer seus direitos como
                    titular dos dados, entre em contato:
                </p>

                <ContactBlock
                    label="Encarregado de proteção de dados (DPO)"
                    email="usewhallet@gmail.com"
                    descricao="Respondemos em até 15 dias úteis, conforme estabelecido pela LGPD."
                />

                <p>
                    Você também tem o direito de apresentar reclamação à <strong>Autoridade Nacional
                    de Proteção de Dados (ANPD)</strong>, caso entenda que seus dados estão sendo
                    tratados de forma inadequada.
                </p>
            </Section>

            <BackToHome/>
        </LegalLayout>
    );
}
import { useEffect } from "react";
import LegalLayout from "./_LegalLayout.jsx";
import { Section, ContactBlock, BackToHome } from "./_legalShared.jsx";

/**
 * TermosPage — Termos de Uso
 * Sprint A3.7.1 · Conteúdo base SaaS B2B
 *
 * ⚠️ DISCLAIMER:
 * Este conteúdo é template base seguindo padrões de SaaS B2B brasileiros.
 * NÃO é assessoria jurídica. Recomenda-se revisão por advogado antes
 * de operar com volume relevante de receita.
 *
 * Estrutura (10 seções):
 *  1. Aceitação dos termos
 *  2. Descrição do serviço
 *  3. Cadastro e conta
 *  4. Planos e pagamentos
 *  5. Uso permitido
 *  6. Uso proibido
 *  7. Propriedade intelectual
 *  8. Responsabilidades e limitações
 *  9. Suspensão e encerramento
 *  10. Disposições gerais
 */
export default function TermosPage() {
    useEffect(() => {
        document.title = "Termos de Uso · Whallet";
        document.querySelector('meta[name="description"]')?.setAttribute(
            "content",
            "Termos de Uso do Whallet — condições de uso da plataforma de gestão financeira."
        );
    }, []);

    return (
        <LegalLayout
            kicker="Documentação legal"
            title="Termos de Uso"
            ultimaAt="30 de abril, 2026"
        >
            <p>
                Estes Termos de Uso regulam a utilização da plataforma <strong>Whallet</strong>,
                incluindo o site, ferramentas e serviços disponibilizados em
                {" "}<a href="https://whallet.com.br" target="_blank" rel="noreferrer">whallet.com.br</a>.
            </p>

            <p>
                Ao acessar ou utilizar o Whallet, você concorda integralmente com estes termos.
                Se você não concordar com qualquer parte, deve interromper o uso da plataforma.
            </p>

            {/* ── 1. Aceitação ───────────────────────────────────────── */}
            <Section id="aceitacao" numero="1" titulo="Aceitação dos termos">
                <p>
                    Ao criar uma conta, fazer login ou utilizar qualquer funcionalidade do
                    Whallet (incluindo ferramentas públicas como o conversor CNAB), você
                    declara que:
                </p>
                <ul>
                    <li>Leu, compreendeu e aceita estes Termos de Uso</li>
                    <li>Tem capacidade legal para contratar (18+ anos ou empresa regularmente constituída)</li>
                    <li>As informações fornecidas no cadastro são verdadeiras e completas</li>
                    <li>Concorda também com a <a href="/privacidade">Política de Privacidade</a></li>
                </ul>
                <p>
                    Se você está aceitando estes termos em nome de uma empresa, declara ter
                    autoridade para vincular essa empresa.
                </p>
            </Section>

            {/* ── 2. Descrição do serviço ────────────────────────────── */}
            <Section id="servico" numero="2" titulo="Descrição do serviço">
                <p>
                    O Whallet é uma plataforma de gestão financeira que oferece:
                </p>
                <ul>
                    <li>
                        <strong>Conversor CNAB</strong>: ferramenta para converter arquivos CNAB
                        240/400 em planilhas Excel ou relatórios PDF
                    </li>
                    <li>
                        <strong>Gestão financeira</strong>: cadastro e controle de recebimentos,
                        títulos a pagar, clientes, fornecedores, fluxo de caixa
                    </li>
                    <li>
                        <strong>Agentes de IA</strong>: assistentes inteligentes (Elvis, Aurora,
                        Frank, Anne) para análise e suporte financeiro
                    </li>
                    <li>
                        <strong>Alertas e automações</strong>: notificações de vencimentos,
                        cobrança via canais integrados, relatórios automáticos
                    </li>
                </ul>
                <p>
                    O Whallet pode adicionar, modificar ou descontinuar funcionalidades a
                    qualquer momento, com aviso prévio razoável quando aplicável.
                </p>
            </Section>

            {/* ── 3. Cadastro e conta ────────────────────────────────── */}
            <Section id="cadastro" numero="3" titulo="Cadastro e conta">
                <h3>3.1 Criação de conta</h3>
                <p>
                    Para utilizar todas as funcionalidades, você deve criar uma conta gratuita
                    fornecendo nome, e-mail e senha. Algumas ferramentas (como o conversor CNAB)
                    permitem uso anônimo limitado antes do cadastro.
                </p>

                <h3>3.2 Segurança da conta</h3>
                <p>Você é responsável por:</p>
                <ul>
                    <li>Manter a confidencialidade da sua senha</li>
                    <li>Notificar imediatamente em caso de uso não autorizado</li>
                    <li>Manter dados de cadastro atualizados</li>
                    <li>Todas as atividades realizadas com sua conta</li>
                </ul>

                <h3>3.3 Múltiplas contas</h3>
                <p>
                    Cada pessoa ou empresa deve ter <strong>apenas uma conta</strong>. Contas
                    duplicadas podem ser suspensas a critério do Whallet.
                </p>
            </Section>

            {/* ── 4. Planos e pagamentos ─────────────────────────────── */}
            <Section id="planos" numero="4" titulo="Planos, pagamentos e cancelamento">
                <h3>4.1 Plano Gratuito</h3>
                <p>
                    O plano gratuito oferece funcionalidades limitadas (8 conversões CNAB/mês,
                    Elvis com 5 perguntas/mês). Não há cobrança e não exige cartão de crédito.
                    Sujeito a alterações com aviso prévio.
                </p>

                <h3>4.2 Plano Whallet+</h3>
                <p>
                    O plano Whallet+ é uma assinatura mensal com cobrança recorrente. O preço
                    vigente é exibido na página de planos
                    {" "}(<a href="/planos">whallet.com.br/planos</a>) e pode ser alterado
                    com aviso de 30 dias aos assinantes ativos.
                </p>

                <h3>4.3 Período de teste gratuito</h3>
                <p>
                    Oferecemos teste gratuito de 7 dias do plano Whallet+, sem necessidade de
                    cartão de crédito. Após o período, sua conta retorna automaticamente ao
                    plano gratuito (a menos que você confirme a assinatura).
                </p>

                <h3>4.4 Cancelamento</h3>
                <p>
                    Você pode cancelar a assinatura a qualquer momento pelo painel administrativo.
                    Não há fidelidade nem multa de cancelamento. Após o cancelamento:
                </p>
                <ul>
                    <li>O acesso ao plano pago continua até o fim do período pago</li>
                    <li>Não há reembolso proporcional do mês corrente</li>
                    <li>Seus dados ficam preservados caso queira reativar depois</li>
                </ul>

                <h3>4.5 Reembolsos</h3>
                <p>
                    Reembolsos podem ser solicitados em até <strong>7 dias</strong> após a
                    primeira cobrança, conforme o Código de Defesa do Consumidor
                    (Art. 49, Lei 8.078/90). Após esse prazo, não há reembolsos automáticos,
                    mas casos excepcionais podem ser avaliados.
                </p>

                <h3>4.6 Inadimplência</h3>
                <p>
                    Em caso de não pagamento, sua conta pode ser temporariamente suspensa ou
                    rebaixada para o plano gratuito. Notificações serão enviadas antes da
                    suspensão.
                </p>
            </Section>

            {/* ── 5. Uso permitido ───────────────────────────────────── */}
            <Section id="uso-permitido" numero="5" titulo="Uso permitido">
                <p>Você pode utilizar o Whallet para:</p>
                <ul>
                    <li>Gestão financeira do seu negócio ou atividade profissional</li>
                    <li>Conversão de arquivos CNAB legítimos da sua empresa</li>
                    <li>Automação de cobranças e alertas para clientes próprios</li>
                    <li>Consultas e análises com os agentes de IA dentro dos limites do plano</li>
                </ul>
                <p>
                    Você mantém todos os direitos sobre os dados que insere na plataforma. O
                    Whallet apenas processa esses dados para fornecer as funcionalidades
                    contratadas.
                </p>
            </Section>

            {/* ── 6. Uso proibido ────────────────────────────────────── */}
            <Section id="uso-proibido" numero="6" titulo="Uso proibido">
                <p>É expressamente proibido utilizar o Whallet para:</p>
                <ul>
                    <li>Atividades ilegais, fraudulentas ou que violem direitos de terceiros</li>
                    <li>
                        Tentar obter acesso não autorizado a sistemas, contas ou dados de
                        outros usuários
                    </li>
                    <li>
                        Realizar engenharia reversa, descompilar ou extrair código-fonte
                    </li>
                    <li>
                        Inserir vírus, malware ou código malicioso na plataforma
                    </li>
                    <li>
                        Sobrecarregar intencionalmente os servidores (DoS, scraping abusivo)
                    </li>
                    <li>
                        Revender, sublicenciar ou disponibilizar a plataforma a terceiros sem
                        autorização
                    </li>
                    <li>
                        Usar bots, scripts ou automações para contornar limites do plano
                    </li>
                    <li>
                        Enviar conteúdo ofensivo, discriminatório ou ilegal através das
                        funcionalidades de cobrança
                    </li>
                </ul>

                <div className="legal-callout legal-callout--warning">
                    <div className="legal-callout-title">Consequência</div>
                    <p style={{ margin: 0 }}>
                        Violações podem resultar em suspensão imediata, encerramento da conta
                        sem reembolso e ações legais cabíveis.
                    </p>
                </div>
            </Section>

            {/* ── 7. Propriedade intelectual ─────────────────────────── */}
            <Section id="propriedade" numero="7" titulo="Propriedade intelectual">
                <h3>7.1 Direitos do Whallet</h3>
                <p>
                    O Whallet (incluindo nome, logo, design, código-fonte, textos, agentes de
                    IA e funcionalidades) é propriedade do operador e está protegido por leis
                    de direitos autorais e marcas.
                </p>

                <h3>7.2 Direitos sobre seus dados</h3>
                <p>
                    Você mantém <strong>todos os direitos</strong> sobre os dados financeiros,
                    arquivos e informações que insere na plataforma. O Whallet recebe apenas
                    licença não-exclusiva para processar esses dados conforme necessário para
                    fornecer o serviço.
                </p>

                <h3>7.3 Conteúdo gerado por IA</h3>
                <p>
                    Respostas dos agentes de IA são geradas baseadas em modelos de linguagem
                    e na documentação treinada. Embora façamos esforços para garantir precisão:
                </p>
                <ul>
                    <li>Respostas são informativas, não substituem consultoria profissional</li>
                    <li>Você não deve tomar decisões críticas (fiscais, jurídicas) baseadas apenas em respostas da IA</li>
                    <li>O conteúdo gerado pertence ao usuário, mas o modelo subjacente continua sendo do provedor</li>
                </ul>
            </Section>

            {/* ── 8. Responsabilidades ───────────────────────────────── */}
            <Section id="responsabilidades" numero="8" titulo="Responsabilidades e limitações">
                <h3>8.1 Disponibilidade</h3>
                <p>
                    Trabalhamos para manter a plataforma sempre disponível, mas não garantimos
                    disponibilidade ininterrupta. Pode haver janelas de manutenção, atualizações
                    ou indisponibilidades por causas externas.
                </p>

                <h3>8.2 Precisão dos dados</h3>
                <p>
                    O Whallet processa os dados que você insere. <strong>Não somos responsáveis</strong>
                    {" "}por:
                </p>
                <ul>
                    <li>Erros nos dados que você inserir</li>
                    <li>Decisões financeiras tomadas com base nas análises geradas</li>
                    <li>Inconsistências em arquivos CNAB que não estejam em conformidade com a documentação oficial</li>
                </ul>

                <h3>8.3 Backup</h3>
                <p>
                    Mantemos backups regulares, mas <strong>recomendamos</strong> que você
                    exporte periodicamente seus dados importantes (recibos fiscais, relatórios)
                    para arquivamento próprio.
                </p>

                <h3>8.4 Limitação de responsabilidade</h3>
                <p>
                    Na máxima extensão permitida pela lei brasileira, a responsabilidade do
                    Whallet limita-se ao valor pago pelo usuário nos últimos 12 meses. Não nos
                    responsabilizamos por danos indiretos, lucros cessantes ou perdas de
                    oportunidade.
                </p>
            </Section>

            {/* ── 9. Suspensão e encerramento ────────────────────────── */}
            <Section id="encerramento" numero="9" titulo="Suspensão e encerramento">
                <h3>9.1 Suspensão pelo Whallet</h3>
                <p>Podemos suspender ou encerrar sua conta caso identifiquemos:</p>
                <ul>
                    <li>Violação destes Termos ou da Política de Privacidade</li>
                    <li>Uso fraudulento ou ilegal</li>
                    <li>Inadimplência prolongada</li>
                    <li>Risco à segurança da plataforma ou outros usuários</li>
                </ul>
                <p>
                    Faremos esforço razoável para notificar você antes da suspensão, exceto em
                    casos urgentes de segurança.
                </p>

                <h3>9.2 Encerramento por você</h3>
                <p>
                    Você pode encerrar sua conta a qualquer momento. Após o encerramento:
                </p>
                <ul>
                    <li>Acesso à plataforma é cessado</li>
                    <li>Seus dados são tratados conforme a Política de Privacidade</li>
                    <li>Você pode solicitar exportação dos dados antes de encerrar</li>
                </ul>
            </Section>

            {/* ── 10. Disposições gerais ─────────────────────────────── */}
            <Section id="gerais" numero="10" titulo="Disposições gerais">
                <h3>10.1 Alterações dos termos</h3>
                <p>
                    Podemos atualizar estes Termos periodicamente. Mudanças significativas
                    serão comunicadas com pelo menos 30 dias de antecedência. O uso continuado
                    após o prazo constitui aceitação.
                </p>

                <h3>10.2 Lei aplicável e foro</h3>
                <p>
                    Estes Termos são regidos pela legislação brasileira. Fica eleito o foro
                    da comarca do domicílio do consumidor para dirimir quaisquer controvérsias,
                    nos termos do Código de Defesa do Consumidor.
                </p>

                <h3>10.3 Comunicações oficiais</h3>
                <p>
                    Comunicações oficiais devem ser enviadas para o e-mail abaixo. Notificações
                    do Whallet para o usuário serão enviadas para o e-mail cadastrado.
                </p>

                <h3>10.4 Independência das cláusulas</h3>
                <p>
                    Se qualquer cláusula destes Termos for considerada inválida, as demais
                    permanecem em pleno vigor.
                </p>
            </Section>

            <hr/>

            {/* ── Contato ────────────────────────────────────────────── */}
            <Section id="contato" titulo="Dúvidas sobre os termos?">
                <p>
                    Para questões sobre estes Termos de Uso, entre em contato:
                </p>

                <ContactBlock
                    label="Contato legal"
                    email="usewhallet@gmail.com"
                />
            </Section>

            <BackToHome/>
        </LegalLayout>
    );
}
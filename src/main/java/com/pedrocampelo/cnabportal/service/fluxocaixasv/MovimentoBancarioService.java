package com.pedrocampelo.cnabportal.service.fluxocaixasv;

import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.MovimentoResponse;
import com.pedrocampelo.cnabportal.model.MovimentoBancario;
import com.pedrocampelo.cnabportal.model.SaldoBancario;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.MovimentoBancarioRepository;
import com.pedrocampelo.cnabportal.repository.SaldoBancarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Serviço central de movimentos bancários (razão auxiliar / livro caixa).
 *
 * RESPONSABILIDADES:
 *   1. Criar movimentos quando outros módulos solicitam
 *      (ex: RecebimentoService chama criarRecebimento ao dar baixa)
 *   2. Estornar movimentos (criar movimento de compensação)
 *   3. Listar extratos (consolidado ou por conta)
 *   4. Ajuste manual de saldo
 *
 * REGRA DE OURO: movimentos NUNCA são apagados.
 *   - Estornar = marcar cancelado=true + criar movimento inverso
 *   - Modificar valor = não pode (estornar e recriar)
 *
 * USO POR OUTROS SERVICES:
 *   - RecebimentoService.receber()       → criarRecebimento()
 *   - RecebimentoService.estornarBaixa() → estornarPorOrigem()
 *   - TituloService (operação pagar)     → criarPagamento()
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MovimentoBancarioService {

    private final MovimentoBancarioRepository movimentoRepository;
    private final SaldoBancarioRepository      saldoRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CRIAÇÃO DE MOVIMENTOS (chamados por outros services)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Cria movimento SALDO_INICIAL ao cadastrar nova conta bancária.
     * NOTA: Não é mais usado — o saldo inicial está no campo `saldoInicial`
     * de SaldoBancario. Mantido aqui caso queira evoluir pra modelo full-event-sourced.
     */
    // (intencionalmente vazio — saldo_inicial é registrado direto na conta)

    /**
     * Cria movimento de RECEBIMENTO (entrada).
     *
     * Chamado por RecebimentoService.receber() após validar a baixa.
     *
     * @param usuario        usuário que está dando a baixa
     * @param conta          conta bancária onde o dinheiro entrou
     * @param dataMovimento  data efetiva do recebimento
     * @param valor          valor recebido (sempre positivo)
     * @param descricao      texto livre — "Recebimento de João Silva (consultoria abril)"
     * @param recebimentoId  ID do recebimento que originou este movimento
     */
    @Transactional
    public MovimentoBancario criarRecebimento(Usuario usuario, SaldoBancario conta,
                                              LocalDate dataMovimento, BigDecimal valor,
                                              String descricao, UUID recebimentoId) {
        validarValorPositivo(valor);

        MovimentoBancario mov = MovimentoBancario.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .conta(conta)
                .dataMovimento(dataMovimento != null ? dataMovimento : LocalDate.now())
                .tipo("RECEBIMENTO")
                .ehEntrada(true)
                .valor(valor)
                .descricao(descricao)
                .origemTipo("RECEBIMENTO")
                .origemId(recebimentoId)
                .cancelado(false)
                .build();

        MovimentoBancario salvo = movimentoRepository.save(mov);
        log.info("Movimento RECEBIMENTO criado: conta={}, valor={}, recebimento={}",
                conta.getNomeConta(), valor, recebimentoId);
        return salvo;
    }

    /**
     * Cria movimento de PAGAMENTO (saída).
     * Chamado por TituloService quando MEI paga um título.
     */
    @Transactional
    public MovimentoBancario criarPagamento(Usuario usuario, SaldoBancario conta,
                                            LocalDate dataMovimento, BigDecimal valor,
                                            String descricao, UUID tituloId) {
        validarValorPositivo(valor);

        MovimentoBancario mov = MovimentoBancario.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .conta(conta)
                .dataMovimento(dataMovimento != null ? dataMovimento : LocalDate.now())
                .tipo("PAGAMENTO")
                .ehEntrada(false)
                .valor(valor)
                .descricao(descricao)
                .origemTipo("TITULO")
                .origemId(tituloId)
                .cancelado(false)
                .build();

        MovimentoBancario salvo = movimentoRepository.save(mov);
        log.info("Movimento PAGAMENTO criado: conta={}, valor={}, titulo={}",
                conta.getNomeConta(), valor, tituloId);
        return salvo;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ESTORNO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Estorna TODOS os movimentos ativos de uma origem específica.
     *
     * Usado quando MEI estorna a baixa de um recebimento que tinha múltiplas
     * baixas parciais — todos os movimentos relacionados são estornados de uma vez.
     *
     * Estratégia:
     *   1. Busca todos movimentos ATIVOS dessa origem
     *   2. Pra cada um:
     *      - Marca cancelado=true (mas não deleta)
     *      - Cria movimento de compensação (estorno)
     *
     * @return lista de movimentos de estorno criados
     */
    @Transactional
    public List<MovimentoBancario> estornarPorOrigem(Usuario usuario, String origemTipo, UUID origemId,
                                                     String motivo) {
        List<MovimentoBancario> ativos = movimentoRepository.buscarPorOrigem(
                        origemTipo, origemId, usuario.getEmpresa().getId()
                ).stream()
                .filter(m -> !Boolean.TRUE.equals(m.getCancelado()))
                .toList();

        if (ativos.isEmpty()) {
            log.warn("Tentativa de estornar origem sem movimentos ativos: tipo={}, id={}",
                    origemTipo, origemId);
            return List.of();
        }

        return ativos.stream()
                .map(m -> estornarMovimento(usuario, m, motivo))
                .toList();
    }

    /**
     * Estorna UM movimento específico:
     *   1. Marca o original como cancelado
     *   2. Cria movimento inverso apontando pro original
     */
    @Transactional
    public MovimentoBancario estornarMovimento(Usuario usuario, MovimentoBancario original,
                                               String motivo) {
        if (Boolean.TRUE.equals(original.getCancelado())) {
            throw new IllegalStateException("Movimento já está cancelado");
        }

        // Marca o original como cancelado
        original.setCancelado(true);
        original.setMotivoCancelamento(motivo != null ? motivo : "Estorno");
        movimentoRepository.save(original);

        // Cria movimento inverso (compensação)
        String tipoEstorno = "RECEBIMENTO".equals(original.getTipo())
                ? "ESTORNO_RECEBIMENTO"
                : "PAGAMENTO".equals(original.getTipo())
                ? "ESTORNO_PAGAMENTO"
                : "AJUSTE_MANUAL";  // fallback

        MovimentoBancario estorno = MovimentoBancario.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .conta(original.getConta())
                .dataMovimento(LocalDate.now())
                .tipo(tipoEstorno)
                .ehEntrada(!original.getEhEntrada())  // INVERTE a direção
                .valor(original.getValor())
                .descricao("Estorno: " + original.getDescricao())
                .origemTipo(original.getOrigemTipo())
                .origemId(original.getOrigemId())
                .movimentoEstornado(original)
                .cancelado(false)
                .build();

        MovimentoBancario salvo = movimentoRepository.save(estorno);
        log.info("Movimento estornado: original={}, estorno={}", original.getId(), salvo.getId());
        return salvo;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AJUSTE MANUAL DE SALDO
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Cria movimento AJUSTE_MANUAL para corrigir o saldo de uma conta.
     *
     * Calcula a diferença entre o saldo informado pelo MEI e o saldo atual
     * calculado, e cria movimento com o delta.
     *
     * Exemplos:
     *   Saldo atual = R$ 5.000, MEI informa saldo real = R$ 4.800
     *     → cria movimento AJUSTE_MANUAL, ehEntrada=false, valor=200
     *   Saldo atual = R$ 5.000, MEI informa saldo real = R$ 5.300
     *     → cria movimento AJUSTE_MANUAL, ehEntrada=true, valor=300
     *   Sem diferença → não cria nada
     */
    @Transactional
    public MovimentoBancario ajustarSaldo(Usuario usuario, SaldoBancario conta,
                                          BigDecimal saldoReal, String motivo) {
        BigDecimal saldoAtual = saldoRepository.calcularSaldoAtual(conta.getId())
                .orElse(BigDecimal.ZERO);

        BigDecimal diferenca = saldoReal.subtract(saldoAtual);

        if (diferenca.compareTo(BigDecimal.ZERO) == 0) {
            log.info("Ajuste de saldo sem diferença para conta {}", conta.getNomeConta());
            return null;
        }

        boolean ehEntrada = diferenca.compareTo(BigDecimal.ZERO) > 0;
        BigDecimal valorAbs = diferenca.abs();

        MovimentoBancario mov = MovimentoBancario.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .conta(conta)
                .dataMovimento(LocalDate.now())
                .tipo("AJUSTE_MANUAL")
                .ehEntrada(ehEntrada)
                .valor(valorAbs)
                .descricao(motivo != null && !motivo.isBlank()
                        ? "Ajuste de saldo: " + motivo
                        : "Ajuste de saldo manual")
                .cancelado(false)
                .build();

        MovimentoBancario salvo = movimentoRepository.save(mov);
        log.info("Saldo ajustado: conta={}, antes={}, depois={}, diferenca={}",
                conta.getNomeConta(), saldoAtual, saldoReal, diferenca);
        return salvo;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONSULTA / EXTRATO
    // ─────────────────────────────────────────────────────────────────────────

    public Page<MovimentoResponse> extratoPorConta(Usuario usuario, UUID contaId,
                                                   int pagina, int tamanho) {
        // Validação de tenant: conta deve pertencer à empresa
        saldoRepository.findByIdAndEmpresaId(contaId, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Conta não encontrada"));

        return movimentoRepository.extratoPorConta(
                contaId, usuario.getEmpresa().getId(),
                PageRequest.of(pagina, Math.min(tamanho, 100))
        ).map(MovimentoResponse::from);
    }

    public Page<MovimentoResponse> extratoConsolidado(Usuario usuario, int pagina, int tamanho) {
        return movimentoRepository.extratoConsolidado(
                usuario.getEmpresa().getId(),
                PageRequest.of(pagina, Math.min(tamanho, 100))
        ).map(MovimentoResponse::from);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private void validarValorPositivo(BigDecimal valor) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor do movimento deve ser maior que zero");
        }
    }
}
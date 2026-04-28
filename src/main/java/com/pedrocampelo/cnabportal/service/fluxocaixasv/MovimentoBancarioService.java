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
 * REGRAS DE OURO:
 *   - Movimentos NUNCA são apagados.
 *   - Estornar = criar movimento INVERSO de compensação. O original permanece ativo.
 *   - Cancelar (cancelado=true) = uso reservado pra ERROS ADMINISTRATIVOS, não estornos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MovimentoBancarioService {

    private final MovimentoBancarioRepository movimentoRepository;
    private final SaldoBancarioRepository      saldoRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CRIAÇÃO DE MOVIMENTOS
    // ─────────────────────────────────────────────────────────────────────────

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

    @Transactional
    public List<MovimentoBancario> estornarPorOrigem(Usuario usuario, String origemTipo, UUID origemId,
                                                     String motivo) {
        List<MovimentoBancario> daOrigem = movimentoRepository.buscarPorOrigem(
                origemTipo, origemId, usuario.getEmpresa().getId()
        );

        var idsJaEstornados = daOrigem.stream()
                .filter(m -> m.getMovimentoEstornado() != null)
                .map(m -> m.getMovimentoEstornado().getId())
                .toList();

        List<MovimentoBancario> aEstornar = daOrigem.stream()
                .filter(m -> m.getMovimentoEstornado() == null)
                .filter(m -> !idsJaEstornados.contains(m.getId()))
                .filter(m -> !Boolean.TRUE.equals(m.getCancelado()))
                .toList();

        if (aEstornar.isEmpty()) {
            log.warn("Tentativa de estornar origem sem movimentos válidos: tipo={}, id={}",
                    origemTipo, origemId);
            return List.of();
        }

        return aEstornar.stream()
                .map(m -> estornarMovimento(usuario, m, motivo))
                .toList();
    }

    @Transactional
    public MovimentoBancario estornarMovimento(Usuario usuario, MovimentoBancario original,
                                               String motivo) {
        if (Boolean.TRUE.equals(original.getCancelado())) {
            throw new IllegalStateException("Movimento foi cancelado por erro administrativo e não pode ser estornado");
        }

        boolean jaEstornado = movimentoRepository.findAll().stream()
                .anyMatch(m -> m.getMovimentoEstornado() != null
                        && m.getMovimentoEstornado().getId().equals(original.getId()));
        if (jaEstornado) {
            throw new IllegalStateException("Este movimento já foi estornado anteriormente");
        }

        String tipoEstorno = "RECEBIMENTO".equals(original.getTipo())
                ? "ESTORNO_RECEBIMENTO"
                : "PAGAMENTO".equals(original.getTipo())
                ? "ESTORNO_PAGAMENTO"
                : "AJUSTE_MANUAL";

        MovimentoBancario estorno = MovimentoBancario.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .conta(original.getConta())
                .dataMovimento(LocalDate.now())
                .tipo(tipoEstorno)
                .ehEntrada(!original.getEhEntrada())
                .valor(original.getValor())
                .descricao(motivo != null && !motivo.isBlank()
                        ? "Estorno (" + motivo + "): " + original.getDescricao()
                        : "Estorno: " + original.getDescricao())
                .origemTipo(original.getOrigemTipo())
                .origemId(original.getOrigemId())
                .movimentoEstornado(original)
                .cancelado(false)
                .build();

        MovimentoBancario salvo = movimentoRepository.save(estorno);
        log.info("Movimento estornado: original={} (continua ativo), estorno={} criado",
                original.getId(), salvo.getId());
        return salvo;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AJUSTE MANUAL
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public MovimentoBancario ajustarSaldo(Usuario usuario, SaldoBancario conta,
                                          BigDecimal saldoReal, String motivo) {
        BigDecimal saldoInicial = conta.getSaldoInicial() != null
                ? conta.getSaldoInicial()
                : BigDecimal.ZERO;
        BigDecimal somaMovimentos = saldoRepository.somarMovimentosDaConta(conta.getId());
        BigDecimal saldoAtual = saldoInicial.add(
                somaMovimentos != null ? somaMovimentos : BigDecimal.ZERO
        );

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
    //
    // IMPORTANTE: @Transactional(readOnly = true) mantém a sessão Hibernate aberta
    // durante o `.map()`, evitando LazyInitializationException ao acessar
    // movimento.getConta().getNomeConta() no DTO.
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<MovimentoResponse> extratoPorConta(Usuario usuario, UUID contaId,
                                                   int pagina, int tamanho) {
        saldoRepository.findByIdAndEmpresaId(contaId, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Conta não encontrada"));

        return movimentoRepository.extratoPorConta(
                contaId, usuario.getEmpresa().getId(),
                PageRequest.of(pagina, Math.min(tamanho, 100))
        ).map(MovimentoResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<MovimentoResponse> extratoConsolidado(Usuario usuario, int pagina, int tamanho) {
        return movimentoRepository.extratoConsolidado(
                usuario.getEmpresa().getId(),
                PageRequest.of(pagina, Math.min(tamanho, 100))
        ).map(MovimentoResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<MovimentoResponse> extratoFiltrado(Usuario usuario,
                                                   UUID contaId,
                                                   String tipo,
                                                   LocalDate dataInicio,
                                                   LocalDate dataFim,
                                                   int pagina, int tamanho) {
        return movimentoRepository.extratoFiltrado(
                usuario.getEmpresa().getId(),
                contaId, tipo, dataInicio, dataFim,
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
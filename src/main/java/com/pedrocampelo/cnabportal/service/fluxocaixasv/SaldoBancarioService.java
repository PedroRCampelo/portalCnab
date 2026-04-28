package com.pedrocampelo.cnabportal.service.fluxocaixasv;

import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.AjusteSaldoRequest;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaldoRequest;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaldoResponse;
import com.pedrocampelo.cnabportal.dto.FluxoCaixaDtos.SaldoUpdateRequest;
import com.pedrocampelo.cnabportal.model.SaldoBancario;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.SaldoBancarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Service de gestão de contas bancárias.
 *
 * MUDANÇA IMPORTANTE no cálculo de saldo (corrigindo bug de duplicação):
 *   - calcularSaldoAtual(conta) = conta.saldoInicial + somarMovimentosDaConta(id)
 *   - calcularSaldoTotalEmpresa() = somarSaldosIniciais() + somarMovimentos()
 *
 * Antes: query única com LEFT JOIN multiplicava saldoInicial pelo nº de movimentos.
 * Agora: queries separadas + soma em código.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SaldoBancarioService {

    private final SaldoBancarioRepository      saldoRepository;
    private final MovimentoBancarioService     movimentoService;

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD básico
    // ─────────────────────────────────────────────────────────────────────────

    public List<SaldoResponse> listar(Usuario usuario) {
        return saldoRepository.listarAtivas(usuario.getEmpresa().getId())
                .stream()
                .map(s -> SaldoResponse.from(s, calcularSaldoAtualEntidade(s)))
                .toList();
    }

    public SaldoResponse buscarPorId(Usuario usuario, UUID id) {
        SaldoBancario s = buscarEntidadePorId(usuario, id);
        return SaldoResponse.from(s, calcularSaldoAtualEntidade(s));
    }

    @Transactional
    public SaldoResponse criar(Usuario usuario, SaldoRequest request) {
        boolean principal = Boolean.TRUE.equals(request.principal());

        if (principal) {
            saldoRepository.findByEmpresaIdAndPrincipalTrueAndAtivoTrue(
                    usuario.getEmpresa().getId()
            ).ifPresent(antiga -> {
                antiga.setPrincipal(false);
                saldoRepository.save(antiga);
            });
        }

        if (saldoRepository.countByEmpresaIdAndAtivoTrue(usuario.getEmpresa().getId()) == 0) {
            principal = true;
        }

        SaldoBancario nova = SaldoBancario.builder()
                .empresa(usuario.getEmpresa())
                .usuario(usuario)
                .nomeConta(request.nomeConta().trim())
                .banco(request.banco())
                .saldoInicial(request.saldoInicial())
                .dataInicial(request.dataInicial() != null ? request.dataInicial() : LocalDate.now())
                .principal(principal)
                .ativo(true)
                .build();

        SaldoBancario salvo = saldoRepository.save(nova);
        log.info("Conta criada: {} (saldo inicial={})", salvo.getNomeConta(), salvo.getSaldoInicial());

        return SaldoResponse.from(salvo, salvo.getSaldoInicial());
    }

    @Transactional
    public SaldoResponse atualizar(Usuario usuario, UUID id, SaldoUpdateRequest request) {
        SaldoBancario s = buscarEntidadePorId(usuario, id);

        boolean queremPrincipal = Boolean.TRUE.equals(request.principal());
        if (queremPrincipal && !s.getPrincipal()) {
            saldoRepository.findByEmpresaIdAndPrincipalTrueAndAtivoTrue(
                    usuario.getEmpresa().getId()
            ).ifPresent(antiga -> {
                antiga.setPrincipal(false);
                saldoRepository.save(antiga);
            });
        }

        s.setNomeConta(request.nomeConta().trim());
        s.setBanco(request.banco());
        s.setPrincipal(queremPrincipal);

        SaldoBancario salvo = saldoRepository.save(s);
        log.info("Conta atualizada (cadastro): {}", salvo.getId());
        return SaldoResponse.from(salvo, calcularSaldoAtualEntidade(salvo));
    }

    @Transactional
    public SaldoResponse ajustarSaldo(Usuario usuario, UUID id, AjusteSaldoRequest request) {
        SaldoBancario s = buscarEntidadePorId(usuario, id);
        movimentoService.ajustarSaldo(usuario, s, request.saldoReal(), request.motivo());
        return SaldoResponse.from(s, calcularSaldoAtualEntidade(s));
    }

    @Transactional
    public void inativar(Usuario usuario, UUID id) {
        SaldoBancario s = buscarEntidadePorId(usuario, id);
        s.setAtivo(false);
        s.setPrincipal(false);
        saldoRepository.save(s);
        log.info("Conta inativada: {}", id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cálculo de saldo (CORRIGIDO — sem bug de duplicação)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calcula saldo atual de UMA conta a partir da entidade já carregada.
     * Preferir esse quando já temos a entidade (1 query a menos).
     */
    public BigDecimal calcularSaldoAtualEntidade(SaldoBancario conta) {
        BigDecimal somaMovimentos = saldoRepository.somarMovimentosDaConta(conta.getId());
        BigDecimal saldoInicial = conta.getSaldoInicial() != null
                ? conta.getSaldoInicial()
                : BigDecimal.ZERO;
        return saldoInicial.add(somaMovimentos != null ? somaMovimentos : BigDecimal.ZERO);
    }

    /**
     * Calcula saldo atual de UMA conta a partir do ID (busca a conta primeiro).
     */
    public BigDecimal calcularSaldoAtual(UUID contaId) {
        SaldoBancario conta = saldoRepository.findById(contaId)
                .orElseThrow(() -> new NoSuchElementException("Conta não encontrada"));
        return calcularSaldoAtualEntidade(conta);
    }

    /**
     * Calcula saldo TOTAL de todas as contas ativas da empresa.
     * Usado pelo Fluxo de Caixa.
     */
    public BigDecimal calcularSaldoTotalEmpresa(UUID empresaId) {
        BigDecimal somaIniciais = saldoRepository.somarSaldosIniciaisAtivos(empresaId);
        BigDecimal somaMovimentos = saldoRepository.somarMovimentosDaEmpresa(empresaId);
        return (somaIniciais != null ? somaIniciais : BigDecimal.ZERO)
                .add(somaMovimentos != null ? somaMovimentos : BigDecimal.ZERO);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public SaldoBancario buscarEntidadePorId(Usuario usuario, UUID id) {
        return saldoRepository
                .findByIdAndEmpresaId(id, usuario.getEmpresa().getId())
                .orElseThrow(() -> new NoSuchElementException("Conta não encontrada"));
    }

    /**
     * Retorna a conta principal da empresa (ou a primeira disponível).
     * Usado pelos services que dão baixa quando MEI não especifica conta.
     */
    public SaldoBancario buscarContaPadrao(Usuario usuario) {
        UUID empresaId = usuario.getEmpresa().getId();

        var principal = saldoRepository.findByEmpresaIdAndPrincipalTrueAndAtivoTrue(empresaId);
        if (principal.isPresent()) return principal.get();

        var contas = saldoRepository.listarAtivas(empresaId);
        if (!contas.isEmpty()) return contas.get(0);

        throw new IllegalStateException(
                "Nenhuma conta bancária cadastrada. Cadastre uma conta antes de registrar movimentos."
        );
    }
}
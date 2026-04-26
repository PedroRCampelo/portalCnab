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
 * MUDANÇAS vs versão anterior:
 *   - saldo_inicial é IMUTÁVEL após criação
 *   - Saldo "atual" é calculado via SaldoBancarioRepository.calcularSaldoAtual()
 *   - Ajuste de saldo NÃO mexe direto no campo — cria movimento AJUSTE_MANUAL
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
                .map(s -> SaldoResponse.from(s, calcularSaldoAtual(s.getId())))
                .toList();
    }

    public SaldoResponse buscarPorId(Usuario usuario, UUID id) {
        SaldoBancario s = buscarEntidadePorId(usuario, id);
        return SaldoResponse.from(s, calcularSaldoAtual(s.getId()));
    }

    @Transactional
    public SaldoResponse criar(Usuario usuario, SaldoRequest request) {
        boolean principal = Boolean.TRUE.equals(request.principal());

        // Se está marcando como principal, desmarca a anterior
        if (principal) {
            saldoRepository.findByEmpresaIdAndPrincipalTrueAndAtivoTrue(
                    usuario.getEmpresa().getId()
            ).ifPresent(antiga -> {
                antiga.setPrincipal(false);
                saldoRepository.save(antiga);
            });
        }

        // Primeira conta da empresa? Vira principal por default.
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

        // Saldo atual = saldo inicial (sem movimentos ainda)
        return SaldoResponse.from(salvo, salvo.getSaldoInicial());
    }

    /**
     * Atualiza dados de cadastro (nome/banco/principal).
     * NÃO permite alterar saldo_inicial — usa endpoint /ajustar pra isso.
     */
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
        return SaldoResponse.from(salvo, calcularSaldoAtual(salvo.getId()));
    }

    /**
     * Ajusta o saldo da conta criando movimento AJUSTE_MANUAL.
     * MEI informa o saldo "real" (ex: olhou o app do banco e viu R$ 4.800).
     * Sistema calcula a diferença e cria movimento com o delta.
     */
    @Transactional
    public SaldoResponse ajustarSaldo(Usuario usuario, UUID id, AjusteSaldoRequest request) {
        SaldoBancario s = buscarEntidadePorId(usuario, id);

        movimentoService.ajustarSaldo(usuario, s, request.saldoReal(), request.motivo());

        return SaldoResponse.from(s, calcularSaldoAtual(s.getId()));
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
    // Helpers — também usados por outros services
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

        // Prioridade 1: conta principal
        var principal = saldoRepository.findByEmpresaIdAndPrincipalTrueAndAtivoTrue(empresaId);
        if (principal.isPresent()) return principal.get();

        // Prioridade 2: primeira conta ativa
        var contas = saldoRepository.listarAtivas(empresaId);
        if (!contas.isEmpty()) return contas.get(0);

        throw new IllegalStateException(
                "Nenhuma conta bancária cadastrada. Cadastre uma conta antes de registrar movimentos."
        );
    }

    public BigDecimal calcularSaldoAtual(UUID contaId) {
        return saldoRepository.calcularSaldoAtual(contaId)
                .orElse(BigDecimal.ZERO);
    }
}
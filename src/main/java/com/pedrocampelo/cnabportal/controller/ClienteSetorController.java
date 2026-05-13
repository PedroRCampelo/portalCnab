package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.ClienteSetorDado;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.ClienteRepository;
import com.pedrocampelo.cnabportal.repository.ClienteSetorDadoRepository;
import com.pedrocampelo.cnabportal.repository.SetorCampoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clientes/{clienteId}/setor-dados")
@RequiredArgsConstructor
@Slf4j
public class ClienteSetorController {

    private final ClienteRepository clienteRepository;
    private final ClienteSetorDadoRepository dadoRepository;
    private final SetorCampoRepository campoRepository;

    @GetMapping
    public ResponseEntity<?> listar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID clienteId) {

        if (!clienteRepository.existsByIdAndEmpresaId(clienteId, usuario.getEmpresa().getId())) {
            return ResponseEntity.notFound().build();
        }

        List<ClienteSetorDado> dados = dadoRepository.findByClienteId(clienteId);

        Map<String, String> resultado = dados.stream()
                .collect(Collectors.toMap(
                        d -> d.getCampoId().toString(),
                        d -> d.getValor() != null ? d.getValor() : "",
                        (a, b) -> b
                ));

        return ResponseEntity.ok(resultado);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<?> salvar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID clienteId,
            @RequestBody Map<String, String> dados) {

        if (!clienteRepository.existsByIdAndEmpresaId(clienteId, usuario.getEmpresa().getId())) {
            return ResponseEntity.notFound().build();
        }

        int salvos = 0;
        int removidos = 0;

        for (Map.Entry<String, String> entry : dados.entrySet()) {
            UUID campoId;
            try {
                campoId = UUID.fromString(entry.getKey());
            } catch (IllegalArgumentException e) {
                continue;
            }

            String valor = entry.getValue();
            Optional<ClienteSetorDado> existente = dadoRepository.findByClienteIdAndCampoId(clienteId, campoId);

            if (valor == null || valor.isBlank()) {
                existente.ifPresent(dadoRepository::delete);
                if (existente.isPresent()) removidos++;
            } else {
                ClienteSetorDado dado = existente.orElseGet(() ->
                        ClienteSetorDado.builder()
                                .clienteId(clienteId)
                                .campoId(campoId)
                                .build()
                );
                dado.setValor(valor.trim());
                dadoRepository.save(dado);
                salvos++;
            }
        }

        log.info("Dados setoriais salvos: clienteId={}, salvos={}, removidos={}, por={}",
                clienteId, salvos, removidos, usuario.getNome());

        return ResponseEntity.ok(Map.of("salvos", salvos, "removidos", removidos));
    }
}
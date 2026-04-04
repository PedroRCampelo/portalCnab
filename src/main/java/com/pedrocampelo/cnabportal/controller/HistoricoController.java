package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Remessa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.RemessaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class HistoricoController {

    private final RemessaRepository remessaRepository;

    // Lista as ultimas 50 remessas do usuario logado
    @GetMapping("/historico")
    public List<RemessaResumo> listar(@AuthenticationPrincipal Usuario usuario) {
        return remessaRepository
                .findByUsuarioIdOrderByGeradoEmDesc(usuario.getId(), PageRequest.of(0, 50))
                .stream()
                .map(RemessaResumo::from)
                .toList();
    }

    // Registra uma remessa gerada — chamado internamente pelo CnabController
    // Exposto como endpoint para simplificar a integração
    @PostMapping("/historico")
    public ResponseEntity<Void> registrar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody RegistrarRequest req) {

        Remessa remessa = Remessa.builder()
                .usuario(usuario)
                .empresa(usuario.getEmpresa())
                .nomeArquivo(req.nomeArquivo())
                .banco(req.banco())
                .versao(req.versao())
                .modo(req.modo())
                .tipoSaida(req.tipoSaida())
                .qtdRegistros(req.qtdRegistros())
                .valorTotal(req.valorTotal())
                .build();

        remessaRepository.save(remessa);
        return ResponseEntity.ok().build();
    }

    record RegistrarRequest(
            String nomeArquivo,
            String banco,
            String versao,
            String modo,
            String tipoSaida,
            Integer qtdRegistros,
            BigDecimal valorTotal
    ) {}

    record RemessaResumo(
            UUID id,
            String nomeArquivo,
            String banco,
            String versao,
            String modo,
            String tipoSaida,
            Integer qtdRegistros,
            BigDecimal valorTotal,
            LocalDateTime geradoEm
    ) {
        static RemessaResumo from(Remessa r) {
            return new RemessaResumo(
                    r.getId(),
                    r.getNomeArquivo(),
                    r.getBanco(),
                    r.getVersao(),
                    r.getModo(),
                    r.getTipoSaida(),
                    r.getQtdRegistros(),
                    r.getValorTotal(),
                    r.getGeradoEm()
            );
        }
    }
}
package com.pedrocampelo.cnabportal.controller;

import com.pedrocampelo.cnabportal.model.Setor;
import com.pedrocampelo.cnabportal.model.SetorCampo;
import com.pedrocampelo.cnabportal.repository.SetorCampoRepository;
import com.pedrocampelo.cnabportal.repository.SetorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/setores")
@RequiredArgsConstructor
public class SetorController {

    private final SetorRepository setorRepository;
    private final SetorCampoRepository setorCampoRepository;

    @GetMapping
    public List<Setor> listar() {
        return setorRepository.findByAtivoTrueOrderByOrdemAsc();
    }

    @GetMapping("/{id}/campos")
    public ResponseEntity<?> camposPorSetor(@PathVariable String id) {
        if (!setorRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        List<SetorCampo> campos = setorCampoRepository.findBySetorIdOrderByGrupoAscOrdemAsc(id);

        Map<String, List<Map<String, Object>>> gruposMap = new LinkedHashMap<>();
        for (SetorCampo c : campos) {
            gruposMap.computeIfAbsent(c.getGrupo(), k -> new ArrayList<>());
            Map<String, Object> campoMap = new LinkedHashMap<>();
            campoMap.put("id", c.getId());
            campoMap.put("campo", c.getCampo());
            campoMap.put("label", c.getLabel());
            campoMap.put("tipo", c.getTipo());
            campoMap.put("opcoes", c.getOpcoes() != null
                    ? Arrays.asList(c.getOpcoes().split(","))
                    : null);
            campoMap.put("obrigatorio", c.getObrigatorio());
            campoMap.put("ordem", c.getOrdem());
            gruposMap.get(c.getGrupo()).add(campoMap);
        }

        List<Map<String, Object>> grupos = gruposMap.entrySet().stream().map(entry -> {
            Map<String, Object> g = new LinkedHashMap<>();
            g.put("grupo", entry.getKey());
            g.put("label", formatarLabelGrupo(entry.getKey()));
            g.put("campos", entry.getValue());
            return g;
        }).toList();

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("setorId", id);
        resposta.put("grupos", grupos);

        return ResponseEntity.ok(resposta);
    }

    private String formatarLabelGrupo(String grupo) {
        return switch (grupo) {
            case "apolice"        -> "Dados da Apólice";
            case "veiculo"        -> "Veículo (Auto)";
            case "residencial"    -> "Residencial";
            case "vida"           -> "Vida";
            case "saude"          -> "Saúde";
            case "financeiro"     -> "Financeiro";
            case "relacionamento" -> "Relacionamento";
            case "paciente"       -> "Dados do Paciente";
            case "imovel"         -> "Imóvel";
            case "contrato"       -> "Contrato";
            case "comercial"      -> "Comercial";
            default -> grupo.substring(0, 1).toUpperCase() + grupo.substring(1);
        };
    }
}
package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.model.NumeradorEmpresa;
import com.pedrocampelo.cnabportal.repository.NumeradorEmpresaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Emite o próximo número sequencial por empresa e tipo de documento.
 * Usa REQUIRES_NEW para que o incremento seja committed imediatamente,
 * liberando o lock e evitando concorrência mesmo que a transação externa falhe.
 */
@Service
@RequiredArgsConstructor
public class NumeradorEmpresaService {

    private final NumeradorEmpresaRepository repo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public long proximoNumero(UUID empresaId, String tipo) {
        NumeradorEmpresa num = repo.findByEmpresaIdAndTipoWithLock(empresaId, tipo)
                .orElseGet(() -> new NumeradorEmpresa(empresaId, tipo));
        num.setUltimo(num.getUltimo() + 1);
        return repo.saveAndFlush(num).getUltimo();
    }
}

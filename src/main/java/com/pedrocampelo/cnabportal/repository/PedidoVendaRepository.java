package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.PedidoVenda;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface PedidoVendaRepository extends JpaRepository<PedidoVenda, UUID> {

    Page<PedidoVenda> findByEmpresaId(UUID empresaId, Pageable pageable);

    Page<PedidoVenda> findByEmpresaIdAndStatus(UUID empresaId, String status, Pageable pageable);

    Page<PedidoVenda> findByEmpresaIdAndClienteId(UUID empresaId, UUID clienteId, Pageable pageable);

    Optional<PedidoVenda> findByIdAndEmpresaId(UUID id, UUID empresaId);

    @Query(value = "SELECT NEXTVAL('pedido_venda_numero_seq')", nativeQuery = true)
    Long proximoNumeroSequencia();
}

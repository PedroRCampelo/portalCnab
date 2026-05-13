package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.WhatsappMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface WhatsappMensagemRepository extends JpaRepository<WhatsappMensagem, UUID> {

    List<WhatsappMensagem> findBySessaoIdOrderByCriadoEmAsc(UUID sessaoId);

    long countBySessaoId(UUID sessaoId);
    @Modifying
    @Transactional
    void deleteBySessaoId(UUID sessaoId);
}
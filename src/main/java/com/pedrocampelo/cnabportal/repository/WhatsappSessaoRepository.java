package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.WhatsappSessao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WhatsappSessaoRepository extends JpaRepository<WhatsappSessao, UUID> {

    Optional<WhatsappSessao> findByLidAndAtivaTrue(String lid);

    Optional<WhatsappSessao> findByTelefoneAndAtivaTrue(String telefone);

    /** Busca sessão pendente de verificação pelo telefone */
    Optional<WhatsappSessao> findByTelefoneAndVerificadaFalseAndAtivaTrue(String telefone);

    /** Busca sessão verificada pelo LID */
    Optional<WhatsappSessao> findByLidAndVerificadaTrueAndAtivaTrue(String lid);
}
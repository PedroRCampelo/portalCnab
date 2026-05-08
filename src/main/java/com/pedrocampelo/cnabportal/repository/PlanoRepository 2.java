package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Plano;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanoRepository extends JpaRepository<Plano, UUID> {

    Optional<Plano> findBySlug(String slug);

    Optional<Plano> findByNome(String nome);
}
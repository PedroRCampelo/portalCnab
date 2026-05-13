package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.SetorCampo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SetorCampoRepository extends JpaRepository<SetorCampo, UUID> {

    List<SetorCampo> findBySetorIdOrderByGrupoAscOrdemAsc(String setorId);
}
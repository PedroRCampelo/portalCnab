package com.pedrocampelo.cnabportal.repository;

import com.pedrocampelo.cnabportal.model.Setor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SetorRepository extends JpaRepository<Setor, String> {

    List<Setor> findByAtivoTrueOrderByOrdemAsc();
}
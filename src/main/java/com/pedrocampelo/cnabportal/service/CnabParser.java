package com.pedrocampelo.cnabportal.service;

import com.pedrocampelo.cnabportal.model.ParsedRecord;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Contrato comum para todos os parsers de layout bancário embutido.
 * Cada banco × versão × modalidade tem sua própria implementação.
 */
public interface CnabParser {
    List<ParsedRecord> parse(MultipartFile file) throws IOException;
}
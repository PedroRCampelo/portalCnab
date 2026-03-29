package com.pedrocampelo.cnabportal.service.bradsv;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;
import com.pedrocampelo.cnabportal.layout.bradesco.Bradesco400CobrancaLayout;
import com.pedrocampelo.cnabportal.model.ParsedRecord;
import com.pedrocampelo.cnabportal.service.CnabParser;
import com.pedrocampelo.cnabportal.util.CnabValueExtractor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Parser para Bradesco CNAB 400 — Cobrança (Remessa e Retorno).
 *
 * No CNAB 400 o tipo de registro fica na posição 1 (index 0):
 *   0 = Header
 *   1 = Detalhe (transação/boleto)
 *   2 = Mensagem (opcional)
 *   3 = Rateio de Crédito (opcional)
 *   9 = Trailer
 *
 * Não existe conceito de lote no CNAB 400.
 */
@Service
public class Bradesco400CobrancaParser implements CnabParser {

    @Override
    public List<ParsedRecord> parse(MultipartFile file) throws IOException {
        List<String> lines = readLines(file);

        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio.");
        }

        String headerArquivo = lines.get(0);
        if (headerArquivo.isEmpty()) {
            throw new IllegalArgumentException(
                    "Arquivo CNAB 400 Bradesco inválido: primeira linha vazia.");
        }

        // No CNAB 400 Bradesco: posição 2 do header é '1' para remessa
        System.out.println("[Bradesco400Cobranca] iniciando parse de " + lines.size() + " linhas");

        List<ParsedRecord> records = new ArrayList<>();
        int lineNumber = 0;

        for (String line : lines) {
            lineNumber++;
            if (line.isBlank()) continue;

            String recordType = Bradesco400CobrancaLayout.getRecordType(line);
            List<BankLayoutField> fields = Bradesco400CobrancaLayout.getFieldsForLine(line);

            ParsedRecord record = new ParsedRecord();
            record.setLineNumber(lineNumber);
            record.setRecordType(recordType);
            record.setRawLine(line);

            for (BankLayoutField field : fields) {
                String value = CnabValueExtractor.extract(
                        line, field.getStartPosition(), field.getEndPosition());
                record.getFields().put(field.getFieldName(), value);
            }

            records.add(record);
        }

        return records;
    }

    private List<String> readLines(MultipartFile file) throws IOException {
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.ISO_8859_1))) {
            String line;
            while ((line = reader.readLine()) != null) lines.add(line);
        }
        return lines;
    }
}
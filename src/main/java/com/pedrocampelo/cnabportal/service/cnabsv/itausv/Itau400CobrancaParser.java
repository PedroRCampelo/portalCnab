package com.pedrocampelo.cnabportal.service.cnabsv.itausv;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;
import com.pedrocampelo.cnabportal.layout.itau.Itau400RetornoLayout;
import com.pedrocampelo.cnabportal.layout.itau.Itau400RemessaLayout;
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
 * Parser para Itaú CNAB 400 Cobrança (remessa e retorno).
 *
 * Detecta automaticamente remessa vs retorno pelo caractere na posição 2
 * do header:  '1' = remessa  |  '2' = retorno
 *
 * Anteriormente chamado de BankRemessaParserService.
 */
@Service
public class Itau400CobrancaParser implements CnabParser {

    @Override
    public List<ParsedRecord> parse(MultipartFile file) throws IOException {
        List<String> lines = readLines(file);

        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio.");
        }

        String firstLine = lines.get(0);
        if (firstLine.length() < 2) {
            throw new IllegalArgumentException(
                    "Arquivo CNAB 400 inválido: header muito curto.");
        }

        // Posição 2 (index 1): '1' = remessa, '2' = retorno
        boolean isRetorno = firstLine.charAt(1) == '2';

        List<ParsedRecord> records = new ArrayList<>();
        int lineNumber = 0;

        for (String line : lines) {
            lineNumber++;
            if (line.isBlank()) continue;

            String recordType = String.valueOf(line.charAt(0));

            List<BankLayoutField> fields = isRetorno
                    ? Itau400RetornoLayout.getFieldsForLine(line)
                    : Itau400RemessaLayout.getFieldsForLine(line);

            ParsedRecord record = new ParsedRecord();
            record.setLineNumber(lineNumber);
            record.setRecordType(recordType);
            record.setRawLine(line);

            for (BankLayoutField field : fields) {
                String value = CnabValueExtractor.extract(
                        line,
                        field.getStartPosition(),
                        field.getEndPosition()
                );
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
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        }
        return lines;
    }
}
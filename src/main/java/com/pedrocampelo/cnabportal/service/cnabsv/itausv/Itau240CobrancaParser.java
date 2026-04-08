package com.pedrocampelo.cnabportal.service.cnabsv.itausv;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;
import com.pedrocampelo.cnabportal.layout.itau.Itau240CobrancaLayout;
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
 * Parser para Itaú CNAB 240 Cobrança (FEBRABAN 240, Janeiro 2017).
 *
 * Tipo de registro: pos 8 (index 7).
 * Segmento no detalhe (tipo 3): pos 14 (index 13).
 * Remessa/Retorno: pos 143 (index 142) do Header de Arquivo — '1'=remessa '2'=retorno.
 */
@Service
public class Itau240CobrancaParser implements CnabParser {

    @Override
    public List<ParsedRecord> parse(MultipartFile file) throws IOException {
        List<String> lines = readLines(file);

        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio.");
        }

        String headerArquivo = lines.get(0);
        if (headerArquivo.length() < 143) {
            throw new IllegalArgumentException(
                    "Arquivo CNAB 240 Cobrança inválido: header de arquivo muito curto (" +
                            headerArquivo.length() + " bytes, esperado ≥ 143).");
        }

        // pos 143 → index 142: '1'=remessa '2'=retorno
        // (usamos para log, o layout cobre ambos)
        char tipoArquivo = headerArquivo.charAt(142);
        System.out.println("[Itau240Cobranca] tipo=" +
                (tipoArquivo == '2' ? "RETORNO" : "REMESSA"));

        List<ParsedRecord> records = new ArrayList<>();
        int lineNumber = 0;

        for (String line : lines) {
            lineNumber++;
            if (line.isBlank() || line.length() < 8) continue;

            String recordType = Itau240CobrancaLayout.getRecordType(line);
            List<BankLayoutField> fields = Itau240CobrancaLayout.getFieldsForLine(line);

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
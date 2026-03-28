package com.pedrocampelo.cnabportal.service.itausv;

import com.pedrocampelo.cnabportal.layout.BankLayoutField;
import com.pedrocampelo.cnabportal.layout.itau.Itau240PagamentoLayout;
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
 * Parser para Itaú CNAB 240 — SISPAG Pagamento.
 *
 * Diferente do CNAB 400 (onde cada linha é independente), o CNAB 240
 * tem estrutura hierárquica: Arquivo → Lotes → Detalhes.
 *
 * O tipo de registro fica na posição 8 (index 7) de cada linha de 240 bytes:
 *   0 = Header Arquivo
 *   1 = Header Lote
 *   3 = Detalhe  (segmento na posição 14 / index 13: A, J, O, N, ...)
 *   5 = Trailer Lote
 *   9 = Trailer Arquivo
 *
 * Remessa vs Retorno: posição 143 (index 142) do Header Arquivo.
 *   '1' = remessa  |  '2' = retorno
 */
@Service
public class Itau240PagamentoParser implements CnabParser {

    @Override
    public List<ParsedRecord> parse(MultipartFile file) throws IOException {
        List<String> lines = readLines(file);

        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio.");
        }

        // Detecta remessa/retorno pelo header do arquivo (primeira linha, pos 143)
        String headerArquivo = lines.get(0);
        if (headerArquivo.length() < 143) {
            throw new IllegalArgumentException(
                    "Arquivo CNAB 240 inválido: header de arquivo muito curto (" +
                            headerArquivo.length() + " bytes, esperado ≥ 143).");
        }

        char tipoArquivo = headerArquivo.charAt(142); // pos 143, 1-based
        boolean isRetorno = (tipoArquivo == '2');

        List<ParsedRecord> records = new ArrayList<>();
        int lineNumber = 0;

        for (String line : lines) {
            lineNumber++;
            if (line.isBlank()) continue;

            // Linhas curtas demais não fazem parte de um arquivo CNAB 240 válido
            if (line.length() < 8) continue;

            String recordType = Itau240PagamentoLayout.getRecordType(line);
            List<BankLayoutField> fields = Itau240PagamentoLayout.getFieldsForLine(line);

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
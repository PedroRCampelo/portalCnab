package com.pedrocampelo.cnabportal.service.cnabsv.protheussv;

import com.pedrocampelo.cnabportal.model.LayoutField;
import com.pedrocampelo.cnabportal.model.ParsedRecord;
import com.pedrocampelo.cnabportal.util.CnabValueExtractor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RemessaParserService {

    public List<ParsedRecord> parseRemessa(MultipartFile remessaFile, List<LayoutField> layoutFields) throws IOException {
        Map<String, List<LayoutField>> fieldsByRecordType = layoutFields.stream()
                .collect(Collectors.groupingBy(LayoutField::getRecordType));

        List<ParsedRecord> parsedRecords = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(remessaFile.getInputStream(), StandardCharsets.ISO_8859_1))) {

            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;

                if (line.isBlank()) {
                    continue;
                }

                String recordType = String.valueOf(line.charAt(0));
                List<LayoutField> layoutForType = fieldsByRecordType.get(recordType);

                ParsedRecord parsedRecord = new ParsedRecord();
                parsedRecord.setLineNumber(lineNumber);
                parsedRecord.setRecordType(recordType);
                parsedRecord.setRawLine(line);

                if (layoutForType != null) {
                    for (LayoutField field : layoutForType) {
                        String value = CnabValueExtractor.extract(
                                line,
                                field.getStartPosition(),
                                field.getEndPosition()
                        );

                        parsedRecord.getFields().put(field.getFieldName(), value);
                    }
                }

                parsedRecords.add(parsedRecord);
            }
        }

        return parsedRecords;
    }
}
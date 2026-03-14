package com.pedrocampelo.cnabportal.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class ParsedRecord {

    private int lineNumber;
    private String recordType;
    private String rawLine;
    private Map<String, String> fields = new LinkedHashMap<>();

    public ParsedRecord() {
    }

    public ParsedRecord(int lineNumber, String recordType, String rawLine, Map<String, String> fields) {
        this.lineNumber = lineNumber;
        this.recordType = recordType;
        this.rawLine = rawLine;
        this.fields = fields;
    }

    public int getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(int lineNumber) {
        this.lineNumber = lineNumber;
    }

    public String getRecordType() {
        return recordType;
    }

    public void setRecordType(String recordType) {
        this.recordType = recordType;
    }

    public String getRawLine() {
        return rawLine;
    }

    public void setRawLine(String rawLine) {
        this.rawLine = rawLine;
    }

    public Map<String, String> getFields() {
        return fields;
    }

    public void setFields(Map<String, String> fields) {
        this.fields = fields;
    }
}
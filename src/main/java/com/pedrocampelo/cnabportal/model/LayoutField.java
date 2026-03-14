package com.pedrocampelo.cnabportal.model;

public class LayoutField {

    private String recordType;
    private String fieldName;
    private int startPosition;
    private int endPosition;
    private int length;
    private String rawConfigLine;

    public LayoutField() {
    }

    public LayoutField(String recordType, String fieldName, int startPosition, int endPosition, int length, String rawConfigLine) {
        this.recordType = recordType;
        this.fieldName = fieldName;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.length = length;
        this.rawConfigLine = rawConfigLine;
    }

    public String getRecordType() {
        return recordType;
    }

    public void setRecordType(String recordType) {
        this.recordType = recordType;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public int getStartPosition() {
        return startPosition;
    }

    public void setStartPosition(int startPosition) {
        this.startPosition = startPosition;
    }

    public int getEndPosition() {
        return endPosition;
    }

    public void setEndPosition(int endPosition) {
        this.endPosition = endPosition;
    }

    public int getLength() {
        return length;
    }

    public void setLength(int length) {
        this.length = length;
    }

    public String getRawConfigLine() {
        return rawConfigLine;
    }

    public void setRawConfigLine(String rawConfigLine) {
        this.rawConfigLine = rawConfigLine;
    }
}
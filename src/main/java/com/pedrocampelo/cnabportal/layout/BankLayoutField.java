package com.pedrocampelo.cnabportal.layout;

public class BankLayoutField {

    private final String recordType;
    private final String fieldName;
    private final int startPosition; // 1-based, igual ao manual do banco
    private final int endPosition;

    public BankLayoutField(String recordType, String fieldName,
                           int startPosition, int endPosition) {
        this.recordType = recordType;
        this.fieldName = fieldName;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
    }

    public String getRecordType()  { return recordType; }
    public String getFieldName()   { return fieldName; }
    public int getStartPosition()  { return startPosition; }
    public int getEndPosition()    { return endPosition; }
    public int getLength()         { return endPosition - startPosition + 1; }
}
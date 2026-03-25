package com.pedrocampelo.cnabportal.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class CnabFormatUtils {

    private CnabFormatUtils() {
    }

    public static boolean isDateField(String fieldName) {
        if (fieldName == null) {
            return false;
        }

        String upper = fieldName.toUpperCase();

        return upper.contains("DATA")
                || upper.contains("VENCIMENTO")
                || upper.contains("VENCTO");
    }

    public static boolean isMoneyField(String fieldName) {
        if (fieldName == null) {
            return false;
        }

        String upper = fieldName.toUpperCase();

        return upper.contains("VALOR")
                || upper.contains("IOF")
                || upper.contains("MORA")
                || upper.contains("MULTA")
                || upper.contains("DESCONTO")
                || upper.contains("ABATIMENTO")
                || upper.contains("SALDO");
    }

    public static LocalDate tryParseCnabDate(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        if (!trimmed.matches("\\d{6}")) {
            return null;
        }

        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("ddMMyy");
            return LocalDate.parse(trimmed, formatter);
        } catch (Exception e) {
            return null;
        }
    }

    public static BigDecimal tryParseCnabMoney(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        if (!trimmed.matches("\\d+")) {
            return null;
        }

        try {
            return new BigDecimal(trimmed).movePointLeft(2);
        } catch (Exception e) {
            return null;
        }
    }
}
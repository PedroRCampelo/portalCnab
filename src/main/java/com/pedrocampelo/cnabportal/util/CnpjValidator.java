package com.pedrocampelo.cnabportal.util;

/**
 * Validador e formatador de CNPJ.
 *
 * Algoritmo de validação:
 *   - 14 dígitos numéricos
 *   - Não pode ser sequência repetida (00000000000000, 11111111111111, ...)
 *   - Os 2 últimos dígitos são verificadores calculados via módulo 11
 *
 * Uso:
 *   String formatado = CnpjValidator.normalizar("12.345.678/0001-90");
 *   // → "12.345.678/0001-90" se válido, ou lança IllegalArgumentException
 */
public final class CnpjValidator {

    private static final int[] PESO_PRIMEIRO_DIGITO  = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] PESO_SEGUNDO_DIGITO   = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

    private CnpjValidator() {}

    /**
     * Remove tudo que não é dígito do CNPJ.
     * Ex: "12.345.678/0001-90" → "12345678000190"
     */
    public static String apenasDigitos(String cnpj) {
        if (cnpj == null) return "";
        return cnpj.replaceAll("\\D", "");
    }

    /**
     * Formata um CNPJ de 14 dígitos para o padrão visual.
     * Ex: "12345678000190" → "12.345.678/0001-90"
     */
    public static String formatar(String digitos) {
        if (digitos == null || digitos.length() != 14) {
            throw new IllegalArgumentException("CNPJ deve ter 14 dígitos para formatar");
        }
        return digitos.substring(0, 2) + "." +
                digitos.substring(2, 5) + "." +
                digitos.substring(5, 8) + "/" +
                digitos.substring(8, 12) + "-" +
                digitos.substring(12, 14);
    }

    /**
     * Verifica se um CNPJ é válido (formato + dígitos verificadores).
     * Aceita com ou sem máscara.
     */
    public static boolean isValido(String cnpj) {
        if (cnpj == null) return false;

        String d = apenasDigitos(cnpj);

        // 14 dígitos
        if (d.length() != 14) return false;

        // Não pode ser sequência repetida
        if (d.matches("(\\d)\\1{13}")) return false;

        // Calcula primeiro dígito verificador
        int soma1 = 0;
        for (int i = 0; i < 12; i++) {
            soma1 += Character.getNumericValue(d.charAt(i)) * PESO_PRIMEIRO_DIGITO[i];
        }
        int resto1 = soma1 % 11;
        int dv1 = resto1 < 2 ? 0 : 11 - resto1;
        if (dv1 != Character.getNumericValue(d.charAt(12))) return false;

        // Calcula segundo dígito verificador
        int soma2 = 0;
        for (int i = 0; i < 13; i++) {
            soma2 += Character.getNumericValue(d.charAt(i)) * PESO_SEGUNDO_DIGITO[i];
        }
        int resto2 = soma2 % 11;
        int dv2 = resto2 < 2 ? 0 : 11 - resto2;
        return dv2 == Character.getNumericValue(d.charAt(13));
    }

    /**
     * Normaliza um CNPJ: valida e retorna no formato padrão.
     * Lança IllegalArgumentException com mensagem amigável se inválido.
     *
     * Ex: "12345678000190" → "12.345.678/0001-90"
     */
    public static String normalizar(String cnpj) {
        if (cnpj == null || cnpj.isBlank()) {
            throw new IllegalArgumentException("CNPJ não informado");
        }

        String d = apenasDigitos(cnpj);

        if (d.length() != 14) {
            throw new IllegalArgumentException("CNPJ deve ter 14 dígitos");
        }

        if (d.matches("(\\d)\\1{13}")) {
            throw new IllegalArgumentException("CNPJ inválido (sequência repetida)");
        }

        if (!isValido(d)) {
            throw new IllegalArgumentException("CNPJ inválido — verifique os números");
        }

        return formatar(d);
    }
}
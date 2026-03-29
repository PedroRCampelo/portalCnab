package com.pedrocampelo.cnabportal.layout;

public enum BankLayout {

    ITAU_400_COBRANCA,
    ITAU_240_COBRANCA,
    ITAU_240_PAGAMENTO,
    BRADESCO_240_PAGAMENTO,
    BB_240_PAGAMENTO;

    /**
     * Resolve o enum a partir dos 3 parâmetros vindos da request.
     * bank    → "ITAU" | "BRADESCO" | "BB"
     * version → "400" | "240"
     * mode    → "COBRANCA" | "PAGAMENTO"
     */
    public static BankLayout of(String bank, String version, String mode) {
        String key = (bank + "_" + version + "_" + mode).toUpperCase();
        try {
            return BankLayout.valueOf(key);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Layout bancário não suportado: " + key +
                            ". Combinações válidas: ITAU_400_COBRANCA, ITAU_240_COBRANCA, " +
                            "ITAU_240_PAGAMENTO, BRADESCO_240_PAGAMENTO, BB_240_PAGAMENTO"
            );
        }
    }
}
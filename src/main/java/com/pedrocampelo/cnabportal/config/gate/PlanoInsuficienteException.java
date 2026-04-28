package com.pedrocampelo.cnabportal.config.gate;

/**
 * Exceção lançada quando usuário tenta acessar feature que exige plano superior.
 *
 * O ExceptionHandler converte em HTTP 402 Payment Required com payload:
 *   {
 *     "mensagem": "Esta feature requer o plano Whallet+",
 *     "codigo": "PLANO_INSUFICIENTE",
 *     "planoExigido": "whallet-plus",
 *     "planoAtual": "gratuito"
 *   }
 */
public class PlanoInsuficienteException extends RuntimeException {

    private final String planoExigido;
    private final String planoAtual;

    public PlanoInsuficienteException(String planoExigido, String planoAtual) {
        super("Esta feature requer o plano " + planoExigido + ". Plano atual: " + planoAtual);
        this.planoExigido = planoExigido;
        this.planoAtual = planoAtual;
    }

    public String getPlanoExigido() {
        return planoExigido;
    }

    public String getPlanoAtual() {
        return planoAtual;
    }
}
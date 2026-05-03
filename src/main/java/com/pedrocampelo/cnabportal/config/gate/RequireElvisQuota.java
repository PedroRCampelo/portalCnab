package com.pedrocampelo.cnabportal.config.gate;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca um método de controller que consome quota mensal do Elvis (IA do CNAB).
 *
 * Quando aplicada, o {@link ElvisQuotaAspect}:
 *   1. ANTES do método: verifica se o usuário pode fazer mais 1 pergunta
 *      → Se atingiu o limite, retorna HTTP 429 Too Many Requests
 *   2. APÓS o método executar com sucesso: incrementa o contador
 *      → Se o método lançar exception, NÃO incrementa
 *
 * Política de plano:
 *   - Admin     → ilimitado (sem incrementar)
 *   - Whallet+  → ilimitado (sem incrementar)
 *   - Free      → limite vem de Plano.elvisQuotaMensal (5 por padrão)
 *
 * Reset: automático no início de cada mês (via chave usuario_id+ano_mes).
 *
 * Uso:
 *   @PostMapping("/chat")
 *   @RequireElvisQuota
 *   public CnabChatResponseDTO chat(...) { ... }
 *
 * Sprint A3.9.2
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireElvisQuota {
}
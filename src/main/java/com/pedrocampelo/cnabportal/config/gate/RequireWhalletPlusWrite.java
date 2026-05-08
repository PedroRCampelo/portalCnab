package com.pedrocampelo.cnabportal.config.gate;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca um controller cujos endpoints de ESCRITA exigem plano Whallet+ ativo.
 *
 * Diferença pra @RequireWhalletPlus:
 *   - @RequireWhalletPlus      → bloqueia TUDO (leitura + escrita)
 *   - @RequireWhalletPlusWrite → bloqueia só escrita (POST/PUT/PATCH/DELETE)
 *                                Free pode acessar GETs (read-only)
 *
 * Comportamento:
 *   - GET  → permitido pra todos (Free também vê dados)
 *   - POST/PUT/PATCH/DELETE → exige Whallet+ ou retorna 402
 *
 * Cenário típico:
 *   - Usuário cancela Whallet+
 *   - Cai pro Free
 *   - Continua VENDO recebimentos, títulos, contas que tinha
 *   - Mas não consegue criar/editar/excluir mais nada
 *   - Dados ficam preservados pra quando reassinar
 *
 * Uso:
 *
 *   @RestController
 *   @RequestMapping("/api/recebimentos")
 *   @RequireWhalletPlusWrite
 *   public class RecebimentoController { ... }
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireWhalletPlusWrite {
}
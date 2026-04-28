package com.pedrocampelo.cnabportal.config.gate;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/*
  Marca um método de controller (ou classe inteira) que exige
  plano Whallet+ ativo.
 
  Quando aplicada, o {@link PlanoGuardAspect} intercepta a chamada
  antes de executar e retorna 402 Payment Required se o usuário
  não tiver Whallet+.
 
  Uso em controller inteiro:
 
    @RestController
    @RequestMapping("/api/recebimentos")
    @RequireWhalletPlus
    public class RecebimentoController { ... }
 
  Uso em método específico:
 
    @PostMapping
    @RequireWhalletPlus
    public Recebimento criar(...) { ... }
 */

@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireWhalletPlus {
}
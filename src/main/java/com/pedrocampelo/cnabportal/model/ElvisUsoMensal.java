package com.pedrocampelo.cnabportal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Contador mensal de perguntas ao Elvis (IA do CNAB)
 * Sprint A3.9.1 · Gate de uso por plano
 *
 * Cada usuário tem no máximo 1 linha por mês.
 * Reset automático: novo mês = nova linha (sem precisar de cron job).
 *
 * Quando o user faz uma pergunta:
 *   1. Service procura linha (usuarioId, anoMes atual)
 *   2. Se não existe → cria com contador=1
 *   3. Se existe → incrementa contador
 *
 * Limite mensal vem de Plano.elvisQuotaMensal:
 *   - NULL    = ilimitado (Whallet+)
 *   - INTEGER = limite (Free: 5)
 */
@Entity
@Table(
        name = "elvis_uso_mensal",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_elvis_uso_usuario_mes",
                columnNames = {"usuario_id", "ano_mes"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElvisUsoMensal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    /**
     * Mês de referência no formato 'YYYY-MM' (ex: "2026-04").
     * Permite reset automático sem job cron.
     */
    @Column(name = "ano_mes", nullable = false, length = 7)
    private String anoMes;

    /**
     * Quantidade de perguntas feitas no mês.
     * Constraint check no banco garante >= 0.
     */
    @Column(nullable = false)
    private Integer contador;

    @Column(name = "primeira_em", nullable = false, updatable = false)
    @CreationTimestamp
    private OffsetDateTime primeiraEm;

    @Column(name = "ultima_em", nullable = false)
    @UpdateTimestamp
    private OffsetDateTime ultimaEm;

    /**
     * Helper estático pra gerar o anoMes do momento atual.
     * Usado pra criar/buscar a linha do mês corrente.
     */
    public static String anoMesAtual() {
        return YearMonth.now().toString();  // Formato: "2026-04"
    }

    /**
     * Incrementa o contador em 1.
     * Atualiza ultimaEm via @UpdateTimestamp ao salvar.
     */
    public void incrementar() {
        this.contador = (this.contador == null ? 0 : this.contador) + 1;
    }
}
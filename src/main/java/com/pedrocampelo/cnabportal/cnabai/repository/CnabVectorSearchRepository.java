package com.pedrocampelo.cnabportal.cnabai.repository;

import com.pedrocampelo.cnabportal.cnabai.dto.RetrievedChunkDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.StringJoiner;

@Repository
@RequiredArgsConstructor
public class CnabVectorSearchRepository {

    private final JdbcTemplate jdbcTemplate;

    public void insertChunkWithEmbedding(
            String sourceName,
            String bankCode,
            String cnabType,
            String segmentCode,
            String recordType,
            String sourceType,
            int chunkIndex,
            String content,
            Integer contentTokensEstimate,
            String metadataJson,
            List<Float> embedding
    ) {
        String sql = """
            INSERT INTO cnab_knowledge_chunk (
                source_name, bank_code, cnab_type, segment_code, record_type,
                source_type, chunk_index, content, content_tokens_estimate,
                metadata_json, embedding
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?::vector)
            """;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql);
            ps.setString(1, sourceName);
            ps.setString(2, bankCode);
            ps.setString(3, cnabType);
            ps.setString(4, segmentCode);
            ps.setString(5, recordType);
            ps.setString(6, sourceType);
            ps.setInt(7, chunkIndex);
            ps.setString(8, content);
            ps.setObject(9, contentTokensEstimate);
            ps.setString(10, metadataJson);
            ps.setString(11, toPgVectorLiteral(embedding));
            return ps;
        });
    }

    /**
     * Busca puramente por similaridade semântica — sem filtro de banco ou tipo.
     * Os metadados (bank_code, cnab_type, source_name) são retornados para
     * contexto, mas não restringem os resultados.
     */
    public List<RetrievedChunkDTO> searchSimilar(
            List<Float> queryEmbedding,
            int limit
    ) {
        String sql = """
            SELECT
                id,
                source_name,
                bank_code,
                cnab_type,
                segment_code,
                record_type,
                content,
                1 - (embedding <=> ?::vector) AS similarity
            FROM cnab_knowledge_chunk
            ORDER BY embedding <=> ?::vector
            LIMIT ?
            """;

        String vector = toPgVectorLiteral(queryEmbedding);

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> RetrievedChunkDTO.builder()
                        .id(rs.getLong("id"))
                        .sourceName(rs.getString("source_name"))
                        .bankCode(rs.getString("bank_code"))
                        .cnabType(rs.getString("cnab_type"))
                        .segmentCode(rs.getString("segment_code"))
                        .recordType(rs.getString("record_type"))
                        .content(rs.getString("content"))
                        .similarity(rs.getDouble("similarity"))
                        .build(),
                vector,
                vector,
                limit
        );
    }

    private String toPgVectorLiteral(List<Float> values) {
        StringJoiner joiner = new StringJoiner(",", "[", "]");
        for (Float value : values) {
            joiner.add(String.valueOf(value));
        }
        return joiner.toString();
    }
}
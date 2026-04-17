CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS cnab_knowledge_chunk (
                                                    id BIGSERIAL PRIMARY KEY,
                                                    source_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(50),
    cnab_type VARCHAR(20),
    segment_code VARCHAR(20),
    record_type VARCHAR(20),
    source_type VARCHAR(50) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    content_tokens_estimate INT,
    metadata_json JSONB,
    embedding vector(1536),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_cnab_knowledge_chunk_bank_type
    ON cnab_knowledge_chunk (bank_code, cnab_type);

CREATE INDEX IF NOT EXISTS idx_cnab_knowledge_chunk_source_type
    ON cnab_knowledge_chunk (source_type);

CREATE INDEX IF NOT EXISTS idx_cnab_knowledge_chunk_segment
    ON cnab_knowledge_chunk (segment_code);

CREATE INDEX IF NOT EXISTS idx_cnab_knowledge_chunk_embedding
    ON cnab_knowledge_chunk
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
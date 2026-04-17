package com.pedrocampelo.cnabportal.cnabai.service;

import java.util.List;

public interface EmbeddingService {
    List<Float> generateEmbedding(String text);
}
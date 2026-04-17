package com.pedrocampelo.cnabportal.cnabai.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@Slf4j
public class PdfTextExtractorService {

    public String extractText(MultipartFile file) {
        try (var document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        } catch (IOException e) {
            throw new IllegalStateException("Nao foi possivel extrair texto do PDF: " + file.getOriginalFilename(), e);
        }
    }
}
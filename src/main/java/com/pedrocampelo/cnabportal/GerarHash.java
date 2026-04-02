package com.pedrocampelo.cnabportal;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

// Rode este main temporariamente para gerar o hash correto
// Delete depois de usar
public class GerarHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String senha = "Admin@Portal2026";
        String hash  = encoder.encode(senha);
        System.out.println("Senha: " + senha);
        System.out.println("Hash:  " + hash);
        System.out.println();
        System.out.println("SQL:");
        System.out.println("UPDATE usuarios SET senha_hash = '" + hash + "' WHERE email = 'admin@portalcnab.local';");
    }
}
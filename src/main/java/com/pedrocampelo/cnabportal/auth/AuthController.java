package com.pedrocampelo.cnabportal.auth;

import com.pedrocampelo.cnabportal.auth.dto.AuthRequest;
import com.pedrocampelo.cnabportal.auth.dto.AuthResponse;
import com.pedrocampelo.cnabportal.auth.dto.RegisterRequest;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository     usuarioRepository;
    private final EmpresaRepository     empresaRepository;
    private final JwtService            jwtService;
    private final PasswordEncoder       passwordEncoder;

    // ── Login ─────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.senha())
            );

            Usuario usuario = (Usuario) auth.getPrincipal();

            // Atualiza ultimo acesso sem precisar de query extra
            usuarioRepository.atualizarUltimoAcesso(usuario.getId(), LocalDateTime.now());

            String token   = jwtService.generateToken(usuario);
            long   expiraEm = jwtService.extractExpiration(token).getTime();

            log.info("Login: {}", usuario.getEmail());

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    "Bearer",
                    usuario.getId(),
                    usuario.getNome(),
                    usuario.getEmail(),
                    usuario.getPerfil(),
                    usuario.getEmpresa() != null ? usuario.getEmpresa().getId() : null,
                    expiraEm
            ));

        } catch (BadCredentialsException e) {
            // Mensagem generica — nao revela se o email existe ou nao
            log.warn("Tentativa de login falhou: {}", request.email());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErroResponse("Credenciais invalidas"));
        }
    }

    // ── Register ──────────────────────────────────────────────────────────────

    // Apenas ADMIN pode criar novos usuarios
    // Isso evita que qualquer pessoa crie conta e acesse dados financeiros reais
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        if (usuarioRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErroResponse("Email ja cadastrado"));
        }

        Empresa empresa = empresaRepository.findById(request.empresaId())
                .orElseThrow(() -> new IllegalArgumentException("Empresa nao encontrada"));

        PerfilUsuario perfil = request.perfil() != null
                ? request.perfil()
                : PerfilUsuario.OPERADOR;

        Usuario novoUsuario = Usuario.builder()
                .empresa(empresa)
                .nome(request.nome())
                .email(request.email().toLowerCase().trim())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .perfil(perfil)
                .ativo(true)
                .build();

        usuarioRepository.save(novoUsuario);

        log.info("Usuario criado: {} ({})", novoUsuario.getEmail(), perfil);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ErroResponse("Usuario criado com sucesso"));
    }

    // ── DTO interno de erro ───────────────────────────────────────────────────

    record ErroResponse(String mensagem) {}
}
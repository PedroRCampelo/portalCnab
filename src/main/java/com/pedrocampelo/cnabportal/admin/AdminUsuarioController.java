package com.pedrocampelo.cnabportal.admin;

import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/usuarios")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminUsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final PasswordEncoder   passwordEncoder;

    @Value("${app.env:dev}")
    private String appEnv;

    // ── Listar com filtros ────────────────────────────────────────────────────
    // Suporta: ?ativo=true|false, ?perfil=ADMIN|OPERADOR|VISUALIZADOR, ?busca=texto

    @GetMapping
    public List<UsuarioResumo> listar(
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) String perfil,
            @RequestParam(required = false) String busca) {

        return usuarioRepository.findAll().stream()
                .filter(u -> ativo == null || u.getAtivo().equals(ativo))
                .filter(u -> perfil == null || perfil.isBlank()
                        || u.getPerfil().name().equalsIgnoreCase(perfil))
                .filter(u -> busca == null || busca.isBlank()
                        || u.getNome().toLowerCase().contains(busca.toLowerCase())
                        || u.getEmail().toLowerCase().contains(busca.toLowerCase()))
                .map(UsuarioResumo::from)
                .toList();
    }

    // ── Criar novo usuario ────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> criar(
            @Valid @RequestBody CriarUsuarioRequest req,
            @AuthenticationPrincipal Usuario admin) {

        if (usuarioRepository.existsByEmail(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new Resposta("Email ja cadastrado"));
        }

        Empresa empresa = empresaRepository.findById(req.empresaId())
                .orElseThrow(() -> new IllegalArgumentException("Empresa nao encontrada"));

        Usuario novo = Usuario.builder()
                .empresa(empresa)
                .nome(req.nome())
                .email(req.email().toLowerCase().trim())
                .senhaHash(passwordEncoder.encode(req.senha()))
                .perfil(req.perfil() != null ? req.perfil() : PerfilUsuario.OPERADOR)
                .ativo(true)
                .emailVerificado(true) // admin cria ja verificado
                .build();

        usuarioRepository.save(novo);
        log.info("Admin {} criou usuario: {}", admin.getEmail(), novo.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UsuarioResumo.from(novo));
    }

    // ── Ativar / Desativar ────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> alterarStatus(
            @PathVariable UUID id,
            @RequestBody StatusRequest req,
            @AuthenticationPrincipal Usuario admin) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado"));

        if (usuario.getId().equals(admin.getId()) && !req.ativo()) {
            return ResponseEntity.badRequest()
                    .body(new Resposta("Você não pode desativar sua própria conta"));
        }

        usuario.setAtivo(req.ativo());
        usuario.setAtualizadoEm(LocalDateTime.now());
        usuarioRepository.save(usuario);

        log.info("Admin {} {} usuario: {}",
                admin.getEmail(),
                req.ativo() ? "ativou" : "desativou",
                usuario.getEmail());

        return ResponseEntity.ok(new Resposta(
                req.ativo() ? "Usuario ativado" : "Usuario desativado"));
    }

    // ── Redefinir senha ───────────────────────────────────────────────────────

    @PatchMapping("/{id}/senha")
    public ResponseEntity<?> redefinirSenha(
            @PathVariable UUID id,
            @Valid @RequestBody SenhaRequest req,
            @AuthenticationPrincipal Usuario admin) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado"));

        usuario.setSenhaHash(passwordEncoder.encode(req.novaSenha()));
        usuario.setAtualizadoEm(LocalDateTime.now());
        usuarioRepository.save(usuario);

        log.info("Admin {} redefiniu senha de: {}", admin.getEmail(), usuario.getEmail());

        return ResponseEntity.ok(new Resposta("Senha redefinida com sucesso"));
    }

    // ── Excluir (apenas em ambiente dev) ─────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(
            @PathVariable UUID id,
            @AuthenticationPrincipal Usuario admin) {

        if (!"dev".equals(appEnv)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Resposta("Exclusao disponivel apenas em ambiente de desenvolvimento"));
        }

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado"));

        if (usuario.getId().equals(admin.getId())) {
            return ResponseEntity.badRequest()
                    .body(new Resposta("Você não pode excluir sua própria conta"));
        }

        usuarioRepository.delete(usuario);
        log.warn("Admin {} EXCLUIU usuario: {}", admin.getEmail(), usuario.getEmail());

        return ResponseEntity.ok(new Resposta("Usuario excluido permanentemente"));
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    record CriarUsuarioRequest(
            UUID empresaId,
            @NotBlank String nome,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8) String senha,
            PerfilUsuario perfil
    ) {}

    record StatusRequest(boolean ativo) {}

    record SenhaRequest(
            @NotBlank @Size(min = 8, message = "Senha deve ter no minimo 8 caracteres")
            String novaSenha
    ) {}

    record Resposta(String mensagem) {}

    record UsuarioResumo(
            UUID id,
            String nome,
            String email,
            PerfilUsuario perfil,
            boolean ativo,
            boolean emailVerificado,
            LocalDateTime criadoEm,
            LocalDateTime ultimoAcesso
    ) {
        static UsuarioResumo from(Usuario u) {
            return new UsuarioResumo(
                    u.getId(), u.getNome(), u.getEmail(),
                    u.getPerfil(), u.getAtivo(),
                    Boolean.TRUE.equals(u.getEmailVerificado()),
                    u.getCriadoEm(), u.getUltimoAcesso()
            );
        }
    }
}
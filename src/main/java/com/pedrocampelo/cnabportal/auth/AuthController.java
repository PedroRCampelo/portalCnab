package com.pedrocampelo.cnabportal.auth;

import com.pedrocampelo.cnabportal.auth.dto.AuthRequest;
import com.pedrocampelo.cnabportal.auth.dto.AuthResponse;
import com.pedrocampelo.cnabportal.auth.dto.CadastroRequest;
import com.pedrocampelo.cnabportal.auth.dto.RegisterRequest;
import com.pedrocampelo.cnabportal.config.LoginRateLimiter;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import com.pedrocampelo.cnabportal.service.resendsv.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

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
    private final EmailService          emailService;
    private final LoginRateLimiter      rateLimiter;

    // UUID fixo da empresa padrao — todos os auto-cadastros pertencem a ela
    @Value("${app.empresa-padrao-id:00000000-0000-0000-0000-000000000001}")
    private String empresaPadraoId;

    // ── Login ─────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request,
                                   HttpServletRequest httpRequest) {
        String ip = obterIp(httpRequest);

        if (!rateLimiter.permitir(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ErroResponse("Muitas tentativas. Aguarde 1 minuto e tente novamente."));
        }

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.senha())
            );

            Usuario usuario = (Usuario) auth.getPrincipal();

            rateLimiter.registrarSucesso(ip); // reseta o contador apos sucesso
            usuarioRepository.atualizarUltimoAcesso(usuario.getId(), LocalDateTime.now());

            String token    = jwtService.generateToken(usuario);
            long   expiraEm = jwtService.extractExpiration(token).getTime();

            log.info("Login: {}", usuario.getEmail());

            return ResponseEntity.ok(new AuthResponse(
                    token, "Bearer",
                    usuario.getId(), usuario.getNome(), usuario.getEmail(),
                    usuario.getPerfil(),
                    usuario.getEmpresa() != null ? usuario.getEmpresa().getId() : null,
                    expiraEm,
                    usuario.getPlanoId(),
                    Boolean.TRUE.equals(usuario.getEmailVerificado()),
                    usuario.getAssinaturaStatus(),
                    usuario.getAssinaturaExpiraEm()
            ));

        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErroResponse("Conta desativada. Entre em contato com o suporte."));
        } catch (BadCredentialsException e) {
            log.warn("Login falhou: {}", request.email());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErroResponse("Credenciais inválidas"));
        }
    }

    // ── Auto-cadastro publico ─────────────────────────────────────────────────

    @PostMapping("/cadastro")
    public ResponseEntity<?> cadastro(@Valid @RequestBody CadastroRequest request) {

        if (usuarioRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErroResponse("Email ja cadastrado"));
        }

        Empresa empresa = empresaRepository.findById(UUID.fromString(empresaPadraoId))
                .orElseThrow(() -> new IllegalStateException("Empresa padrão não encontrada"));

        String tokenVerificacao = UUID.randomUUID().toString();

        Usuario novo = Usuario.builder()
                .empresa(empresa)
                .nome(request.nome())
                .email(request.email().toLowerCase().trim())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .perfil(PerfilUsuario.OPERADOR)
                .ativo(true)
                .emailVerificado(false)
                .tokenVerificacao(tokenVerificacao)
                .tokenExpiracao(LocalDateTime.now().plusHours(24))
                .telefone(request.telefone())
                .build();

        usuarioRepository.save(novo);

        // Envia email de confirmacao — erro no envio nao bloqueia o cadastro
        emailService.enviarConfirmacaoEmail(novo.getEmail(), novo.getNome(), tokenVerificacao);

        log.info("Novo cadastro: {}", novo.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ErroResponse("Cadastro realizado! Verifique seu email para ativar a conta."));
    }

    // ── Verificacao de email ──────────────────────────────────────────────────

    @GetMapping("/verificar")
    public ResponseEntity<?> verificarEmail(@RequestParam String token) {

        var usuario = usuarioRepository.findByTokenVerificacao(token)
                .orElse(null);

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErroResponse("Link inválido ou já utilizado"));
        }

        if (usuario.getTokenExpiracao().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErroResponse("Link expirado. Solicite um novo email de confirmação."));
        }

        usuario.setEmailVerificado(true);
        usuario.setTokenVerificacao(null);  // invalida o token apos uso
        usuario.setTokenExpiracao(null);
        usuarioRepository.save(usuario);

        log.info("Email verificado: {}", usuario.getEmail());

        // Retorna JWT para auto-login direto no frontend
        String jwtToken = jwtService.generateToken(usuario);
        long   expiraEm = jwtService.extractExpiration(jwtToken).getTime();

        return ResponseEntity.ok(new AuthResponse(
                jwtToken, "Bearer",
                usuario.getId(), usuario.getNome(), usuario.getEmail(),
                usuario.getPerfil(),
                usuario.getEmpresa() != null ? usuario.getEmpresa().getId() : null,
                expiraEm,
                usuario.getPlanoId(),
                Boolean.TRUE.equals(usuario.getEmailVerificado()),
                usuario.getAssinaturaStatus(),
                usuario.getAssinaturaExpiraEm()
        ));
    }

    // ── Reenviar email de confirmacao ─────────────────────────────────────────

    @PostMapping("/reenviar-verificacao")
    public ResponseEntity<?> reenviarVerificacao(@RequestBody EmailRequest request) {

        var usuario = usuarioRepository.findByEmail(request.email()).orElse(null);

        // Resposta generica — nao revela se o email existe
        if (usuario == null || Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            return ResponseEntity.ok(new ErroResponse(
                    "Se o email estiver cadastrado e pendente de verificação, você receberá um novo link."));
        }

        String novoToken = UUID.randomUUID().toString();
        usuario.setTokenVerificacao(novoToken);
        usuario.setTokenExpiracao(LocalDateTime.now().plusHours(24));
        usuarioRepository.save(usuario);

        emailService.enviarConfirmacaoEmail(usuario.getEmail(), usuario.getNome(), novoToken);

        return ResponseEntity.ok(new ErroResponse(
                "Se o email estiver cadastrado e pendente de verificação, você receberá um novo link."));
    }

    // ── Register (admin cria usuario manualmente) ─────────────────────────────

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        if (usuarioRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErroResponse("Email ja cadastrado"));
        }

        Empresa empresa = empresaRepository.findById(request.empresaId())
                .orElseThrow(() -> new IllegalArgumentException("Empresa não encontrada"));

        Usuario novoUsuario = Usuario.builder()
                .empresa(empresa)
                .nome(request.nome())
                .email(request.email().toLowerCase().trim())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .perfil(request.perfil() != null ? request.perfil() : PerfilUsuario.OPERADOR)
                .ativo(true)
                .emailVerificado(true)  // admin cria ja verificado
                .build();

        usuarioRepository.save(novoUsuario);
        log.info("Usuário criado pelo admin: {} ({})", novoUsuario.getEmail(), novoUsuario.getPerfil());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ErroResponse("Usuário criado com sucesso"));
    }

    // ── Esqueci minha senha ───────────────────────────────────────────────────

    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> esqueciSenha(@RequestBody EmailRequest request) {
        // Resposta genérica — nunca revela se o email existe
        String respostaGenerica = "Se o email estiver cadastrado, você receberá um link para redefinir sua senha.";

        var usuario = usuarioRepository.findByEmailAndAtivoTrue(request.email()).orElse(null);
        if (usuario == null) {
            return ResponseEntity.ok(new ErroResponse(respostaGenerica));
        }

        String token = UUID.randomUUID().toString();
        usuario.setTokenRedefinicao(token);
        usuario.setTokenRedefinicaoExpiracao(LocalDateTime.now().plusHours(1));
        usuarioRepository.save(usuario);

        emailService.enviarEmailRedefinicaoSenha(usuario.getEmail(), usuario.getNome(), token);

        log.info("Redefinição de senha solicitada: {}", usuario.getEmail());
        return ResponseEntity.ok(new ErroResponse(respostaGenerica));
    }

    // ── Redefinir senha ───────────────────────────────────────────────────────

    @PostMapping("/redefinir-senha")
    public ResponseEntity<?> redefinirSenha(@RequestBody RedefinirSenhaRequest request) {
        if (request.token() == null || request.token().isBlank()) {
            return ResponseEntity.badRequest().body(new ErroResponse("Token inválido."));
        }
        if (request.novaSenha() == null || request.novaSenha().length() < 6) {
            return ResponseEntity.badRequest().body(new ErroResponse("A senha deve ter pelo menos 6 caracteres."));
        }

        var usuario = usuarioRepository.findByTokenRedefinicao(request.token()).orElse(null);

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErroResponse("Link inválido ou já utilizado."));
        }
        if (usuario.getTokenRedefinicaoExpiracao().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErroResponse("Link expirado. Solicite um novo."));
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuario.setTokenRedefinicao(null);
        usuario.setTokenRedefinicaoExpiracao(null);
        usuarioRepository.save(usuario);

        log.info("Senha redefinida: {}", usuario.getEmail());
        return ResponseEntity.ok(new ErroResponse("Senha redefinida com sucesso! Você já pode fazer login."));
    }

    // ── DTOs internos ─────────────────────────────────────────────────────────

    record ErroResponse(String mensagem) {}
    record EmailRequest(String email) {}
    record RedefinirSenhaRequest(String token, String novaSenha) {}

    // Extrai o IP real do cliente — considera proxies reversos (Render, Cloudflare)
    private String obterIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
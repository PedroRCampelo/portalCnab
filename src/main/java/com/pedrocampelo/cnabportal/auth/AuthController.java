package com.pedrocampelo.cnabportal.auth;

import com.pedrocampelo.cnabportal.auth.dto.AuthRequest;
import com.pedrocampelo.cnabportal.auth.dto.AuthResponse;
import com.pedrocampelo.cnabportal.auth.dto.CadastroRequest;
import com.pedrocampelo.cnabportal.auth.dto.GoogleAuthRequest;
import com.pedrocampelo.cnabportal.auth.dto.RegisterRequest;
import com.pedrocampelo.cnabportal.config.LoginRateLimiter;
import com.pedrocampelo.cnabportal.dto.EmpresaDtos.EmpresaResumo;
import com.pedrocampelo.cnabportal.model.Empresa;
import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.model.Usuario.PapelEmpresa;
import com.pedrocampelo.cnabportal.model.Usuario.PerfilUsuario;
import com.pedrocampelo.cnabportal.repository.EmpresaRepository;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import com.pedrocampelo.cnabportal.service.resendsv.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
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
    private final GoogleTokenVerifier   googleTokenVerifier;

    // ── Login (email/senha) ───────────────────────────────────────────────────

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

            rateLimiter.registrarSucesso(ip);
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
                    usuario.getAssinaturaExpiraEm(),
                    resolverEmpresaResumo(usuario)
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

    // ── Login com Google ──────────────────────────────────────────────────────

    @PostMapping("/google")
    public ResponseEntity<?> loginGoogle(@Valid @RequestBody GoogleAuthRequest request,
                                         HttpServletRequest httpRequest) {
        String ip = obterIp(httpRequest);

        if (!rateLimiter.permitir(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ErroResponse("Muitas tentativas. Aguarde 1 minuto e tente novamente."));
        }

        // 1. Valida o ID Token com o Google
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload;
        try {
            payload = googleTokenVerifier.verificar(request.idToken());
        } catch (GoogleTokenVerifier.InvalidGoogleTokenException e) {
            log.warn("Tentativa de login Google com token inválido: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErroResponse("Token Google inválido"));
        }

        String googleId = payload.getSubject();
        String email    = payload.getEmail().toLowerCase().trim();
        String nome     = (String) payload.get("name");
        String fotoUrl  = (String) payload.get("picture");

        // 2. Resolve usuário: por google_id, depois email; cria se não existir
        Usuario usuario = usuarioRepository.findByGoogleId(googleId)
                .or(() -> usuarioRepository.findByEmail(email))
                .map(existente -> vincularGoogle(existente, googleId, fotoUrl))
                .orElseGet(() -> criarUsuarioGoogle(googleId, email, nome, fotoUrl));

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErroResponse("Conta desativada. Entre em contato com o suporte."));
        }

        rateLimiter.registrarSucesso(ip);
        usuarioRepository.atualizarUltimoAcesso(usuario.getId(), LocalDateTime.now());

        String token    = jwtService.generateToken(usuario);
        long   expiraEm = jwtService.extractExpiration(token).getTime();

        log.info("Login Google: {} (provedor={})", usuario.getEmail(), usuario.getProvedorAuth());

        return ResponseEntity.ok(new AuthResponse(
                token, "Bearer",
                usuario.getId(), usuario.getNome(), usuario.getEmail(),
                usuario.getPerfil(),
                usuario.getEmpresa() != null ? usuario.getEmpresa().getId() : null,
                expiraEm,
                usuario.getPlanoId(),
                Boolean.TRUE.equals(usuario.getEmailVerificado()),
                usuario.getAssinaturaStatus(),
                usuario.getAssinaturaExpiraEm(),
                resolverEmpresaResumo(usuario)
        ));
    }

    private Usuario vincularGoogle(Usuario existente, String googleId, String fotoUrl) {
        boolean precisaSalvar = false;

        if (existente.getGoogleId() == null) {
            existente.setGoogleId(googleId);
            if (existente.getSenhaHash() == null) {
                existente.setProvedorAuth("GOOGLE");
            }
            if (!Boolean.TRUE.equals(existente.getEmailVerificado())) {
                existente.setEmailVerificado(true);
                existente.setTokenVerificacao(null);
                existente.setTokenExpiracao(null);
            }
            precisaSalvar = true;
        }

        if (fotoUrl != null && !fotoUrl.equals(existente.getFotoUrl())) {
            existente.setFotoUrl(fotoUrl);
            precisaSalvar = true;
        }

        return precisaSalvar ? usuarioRepository.save(existente) : existente;
    }

    /**
     * Cria novo usuário a partir de login Google (auto-cadastro silencioso).
     *
     * MUDANÇA Sprint 2.2-A1: Cria EMPRESA NOVA automaticamente.
     * MEI vira DONO da própria empresa, isolado dos outros.
     */
    @Transactional
    public Usuario criarUsuarioGoogle(String googleId, String email, String nome, String fotoUrl) {
        // 1. Cria a empresa primeiro (sem criadorUsuarioId — preenche depois)
        Empresa empresa = Empresa.builder()
                .nome("Minha Empresa")
                .cnpj(null)                  // opcional no plano gratuito
                .ativa(true)
                .build();
        empresa = empresaRepository.save(empresa);

        // 2. Cria o usuário vinculado à empresa, como DONO
        Usuario novo = Usuario.builder()
                .empresa(empresa)
                .nome(nome != null ? nome : email.split("@")[0])
                .email(email)
                .senhaHash(null)
                .googleId(googleId)
                .provedorAuth("GOOGLE")
                .fotoUrl(fotoUrl)
                .perfil(PerfilUsuario.OPERADOR)
                .papelEmpresa(PapelEmpresa.DONO)
                .ativo(true)
                .emailVerificado(true)
                .build();

        Usuario salvo = usuarioRepository.save(novo);

        // 3. Atualiza a empresa com o criador (após salvar usuário pra ter o ID)
        empresa.setCriadorUsuarioId(salvo.getId());
        empresaRepository.save(empresa);

        log.info("Auto-cadastro via Google: {} (empresa {} criada)", salvo.getEmail(), empresa.getId());
        return salvo;
    }

    // ── Auto-cadastro publico (email/senha) ──────────────────────────────────

    /**
     * MUDANÇA Sprint 2.2-A1: Cria EMPRESA NOVA automaticamente.
     */
    @PostMapping("/cadastro")
    @Transactional
    public ResponseEntity<?> cadastro(@Valid @RequestBody CadastroRequest request) {

        if (usuarioRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErroResponse("Email ja cadastrado"));
        }

        // 1. Cria empresa nova
        Empresa empresa = Empresa.builder()
                .nome("Minha Empresa")
                .cnpj(null)
                .ativa(true)
                .build();
        empresa = empresaRepository.save(empresa);

        String tokenVerificacao = UUID.randomUUID().toString();

        // 2. Cria usuário como DONO da empresa
        Usuario novo = Usuario.builder()
                .empresa(empresa)
                .nome(request.nome())
                .email(request.email().toLowerCase().trim())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .perfil(PerfilUsuario.OPERADOR)
                .papelEmpresa(PapelEmpresa.DONO)
                .ativo(true)
                .emailVerificado(false)
                .tokenVerificacao(tokenVerificacao)
                .tokenExpiracao(LocalDateTime.now().plusHours(24))
                .telefone(request.telefone())
                .build();

        Usuario salvo = usuarioRepository.save(novo);

        // 3. Atualiza empresa com o criador
        empresa.setCriadorUsuarioId(salvo.getId());
        empresaRepository.save(empresa);

        emailService.enviarConfirmacaoEmail(salvo.getEmail(), salvo.getNome(), tokenVerificacao);

        log.info("Novo cadastro: {} (empresa {} criada)", salvo.getEmail(), empresa.getId());

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
        usuario.setTokenVerificacao(null);
        usuario.setTokenExpiracao(null);
        usuarioRepository.save(usuario);

        log.info("Email verificado: {}", usuario.getEmail());

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
                usuario.getAssinaturaExpiraEm(),
                resolverEmpresaResumo(usuario)
        ));
    }

    // ── Reenviar email de confirmacao ─────────────────────────────────────────

    @PostMapping("/reenviar-verificacao")
    public ResponseEntity<?> reenviarVerificacao(@RequestBody EmailRequest request) {

        var usuario = usuarioRepository.findByEmail(request.email()).orElse(null);

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
    //
    // Este endpoint é diferente: admin escolhe a empresa onde adicionar o usuário.
    // Usado pra:
    //   - Admin do sistema (você) criando usuários
    //   - Futuro: convidar MEMBRO pra uma empresa existente
    // Por isso aceita empresaId no request e NÃO cria empresa nova.

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
                .papelEmpresa(PapelEmpresa.MEMBRO)  // adicionado por admin = MEMBRO
                .ativo(true)
                .emailVerificado(true)
                .build();

        usuarioRepository.save(novoUsuario);
        log.info("Usuário criado pelo admin: {} ({})", novoUsuario.getEmail(), novoUsuario.getPerfil());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ErroResponse("Usuário criado com sucesso"));
    }

    // ── Esqueci minha senha ───────────────────────────────────────────────────

    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> esqueciSenha(@RequestBody EmailRequest request) {
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

    private EmpresaResumo resolverEmpresaResumo(Usuario usuario) {
        if (usuario.getEmpresa() == null) return null;
        return empresaRepository.findById(usuario.getEmpresa().getId())
                .map(EmpresaResumo::from)
                .orElse(null);
    }

    private String obterIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
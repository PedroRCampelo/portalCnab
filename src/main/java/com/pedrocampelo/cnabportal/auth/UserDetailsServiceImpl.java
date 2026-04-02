package com.pedrocampelo.cnabportal.auth;

import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        var usuario = usuarioRepository.findByEmailAndAtivoTrue(email)
                .orElseThrow(() -> {
                    log.warn("Usuario nao encontrado ou inativo: {}", email);
                    return new UsernameNotFoundException("Usuario nao encontrado: " + email);
                });

        log.debug("Usuario carregado: {} | ativo={} | hash={}",
                usuario.getEmail(),
                usuario.getAtivo(),
                usuario.getSenhaHash().substring(0, 10) + "...");

        return usuario;
    }
}
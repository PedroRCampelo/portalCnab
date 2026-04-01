package com.pedrocampelo.cnabportal.auth;

import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementacao do UserDetailsService do Spring Security.
 *
 * O Spring Security chama loadUserByUsername() em dois momentos:
 *   1. Durante o login: para buscar o usuario e comparar a senha
 *   2. Durante cada requisicao autenticada: para reconstruir
 *      o contexto de seguranca a partir do token JWT
 *
 * Usamos o email como "username" — e o identificador de login.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    /**
     * Busca o usuario pelo email.
     *
     * @Transactional necessario porque Usuario.empresa usa FetchType.LAZY —
     * sem a transacao aberta, acessar empresa.getNome() fora deste metodo
     * lancaria LazyInitializationException.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        return usuarioRepository.findByEmailAndAtivoTrue(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario nao encontrado ou inativo: " + email
                ));
    }
}

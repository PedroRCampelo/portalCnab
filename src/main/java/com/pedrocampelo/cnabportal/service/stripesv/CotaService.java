package com.pedrocampelo.cnabportal.service.stripesv;

import com.pedrocampelo.cnabportal.model.Usuario;
import com.pedrocampelo.cnabportal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class CotaService {

    private final UsuarioRepository usuarioRepository;

    private static final DateTimeFormatter MES_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    public boolean temCotaDisponivel(Usuario usuario) {
        int limite = getLimiteDoPlano(usuario);
        if (limite == -1) return true;
        resetarSeNecessario(usuario);
        return usuario.getUsosMesAtual() < limite;
    }

    @Transactional
    public void registrarUso(Usuario usuario) {
        resetarSeNecessario(usuario);
        usuario.setUsosMesAtual(usuario.getUsosMesAtual() + 1);
        usuarioRepository.save(usuario);
        log.info("Uso registrado: {} — {}/{} este mes",
                usuario.getEmail(), usuario.getUsosMesAtual(), getLimiteDoPlano(usuario));
    }

    public CotaResumo getResumo(Usuario usuario) {
        int limite     = getLimiteDoPlano(usuario);
        boolean ilimitado = (limite == -1);
        resetarSeNecessario(usuario);
        int usados    = usuario.getUsosMesAtual();
        boolean pode  = ilimitado || usados < limite;
        String plano  = ilimitado ? "pro" : "gratuito";
        return new CotaResumo(usados, limite, ilimitado, pode, plano);
    }

    public int getLimiteDoPlano(Usuario usuario) {
        if (usuario.getPlanoId() == null) return 8;
        String id = usuario.getPlanoId().toString();
        // Pro E Whallet+ têm conversões ilimitadas
        if ("10000000-0000-0000-0000-000000000002".equals(id)) return -1;
        if ("10000000-0000-0000-0000-000000000003".equals(id)) return -1;
        return 8;
    }

    private void resetarSeNecessario(Usuario usuario) {
        String mesAtual = LocalDate.now().format(MES_FMT);
        if (!mesAtual.equals(usuario.getMesReferencia())) {
            usuario.setUsosMesAtual(0);
            usuario.setMesReferencia(mesAtual);
        }
    }

    public record CotaResumo(
            int usados,
            int limite,
            boolean ilimitado,
            boolean podeGerar,
            String plano
    ) {}
}
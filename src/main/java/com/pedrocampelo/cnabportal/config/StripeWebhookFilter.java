package com.pedrocampelo.cnabportal.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.stereotype.Component;

import java.io.*;

// O Stripe valida a assinatura do webhook usando o body raw da requisicao
// O Spring por padrao consome o body antes de chegarmos no controller
// Este filtro preserva o body para que a validacao funcione corretamente
@Component
public class StripeWebhookFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        if (httpRequest.getRequestURI().contains("/api/stripe/webhook")) {
            byte[] body = httpRequest.getInputStream().readAllBytes();
            chain.doFilter(new CachedBodyHttpServletRequest(httpRequest, body), response);
        } else {
            chain.doFilter(request, response);
        }
    }

    // Wrapper que permite ler o body multiplas vezes
    private static class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        CachedBodyHttpServletRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream stream = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                public int read() { return stream.read(); }
                public boolean isFinished() { return stream.available() == 0; }
                public boolean isReady() { return true; }
                public void setReadListener(ReadListener l) {}
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream()));
        }
    }
}
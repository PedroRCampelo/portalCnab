import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Headers customizados pro dev server
  // Sem isso, o Vite por padrão envia Cross-Origin-Opener-Policy: same-origin,
  // o que bloqueia a comunicação postMessage do Google Identity Services
  // (popup de login Google → janela pai).
  // Em produção (Render Static Site), esse header não é enviado por padrão,
  // então essa config só afeta o `npm run dev`.
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
})
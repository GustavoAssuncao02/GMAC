import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// Build da página /OfertarServico, separado do build da home (vite.config.ts) para que os arquivos da home
// não mudem em nada: roda depois dele e só acrescenta dist/OfertarServico/ (HTML, JS e CSS próprios).
// Em desenvolvimento: npx vite --config vite.ofertar.config.ts e abra http://localhost:5173/OfertarServico/

// A versão da política enviada no aceite é a data "Atualizada em" de public/privacidade.html: um lugar só.
const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const updated = readFileSync('public/privacidade.html', 'utf8').match(/Atualizada em (\d{1,2}) de (\S+) de (\d{4})/)
const month = updated ? months.indexOf(updated[2].toLowerCase()) + 1 : 0
if (!updated || !month) throw new Error('public/privacidade.html precisa da data no formato "Atualizada em 11 de novembro de 2026".')
const policyVersion = `${updated[3]}-${String(month).padStart(2, '0')}-${updated[1].padStart(2, '0')}`

export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __POLICY_VERSION__: JSON.stringify(policyVersion) },
  build: {
    emptyOutDir: false,
    copyPublicDir: false,
    assetsDir: 'OfertarServico/assets',
    rolldownOptions: { input: 'OfertarServico/index.html' },
  },
})

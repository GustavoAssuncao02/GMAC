import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const design2EntryPlugin = () => ({
  name: 'design2-entry',
  closeBundle() {
    const dist = resolve('dist')
    const rootEntry = readFileSync(resolve(dist, 'index.html'), 'utf8')
    const nestedEntry = rootEntry.replaceAll('./assets/', '../assets/')
    mkdirSync(resolve(dist, 'design2'), { recursive: true })
    writeFileSync(resolve(dist, 'design2', 'index.html'), nestedEntry)
  },
})

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), design2EntryPlugin()],
})

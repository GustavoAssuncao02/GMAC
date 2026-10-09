import { readFile, writeFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

// Render the same page that visitors use; no browser or separate SEO copy needed.
const vite = await createServer({
  mode: 'production',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx')
  const markup = renderToString(createElement(App))
  const path = new URL('../dist/index.html', import.meta.url)
  const template = await readFile(path, 'utf8')
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('Expected an empty React root in the production HTML.')
  }
  await writeFile(path, template.replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`))
  console.log('SEO: page content rendered into dist/index.html.')
} finally {
  await vite.close()
}

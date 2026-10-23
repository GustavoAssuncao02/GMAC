import { readdir, readFile, writeFile } from 'node:fs/promises'
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
  // The first paint and React's render must use the same font, or the redrawn
  // headline counts as a new, later Largest Contentful Paint.
  const font = (await readdir(new URL('../dist/assets/', import.meta.url)))
    .find(name => /^inter-latin-wght-normal-.+\.woff2$/.test(name))
  if (!font) throw new Error('Expected the Inter latin font in dist/assets.')
  const fontPreload = `<link rel="preload" href="./assets/${font}" as="font" type="font/woff2" crossorigin>`
  await writeFile(path, template
    .replace('<link rel="stylesheet"', () => `${fontPreload}\n    <link rel="stylesheet"`)
    .replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`))
  console.log('SEO: page content rendered into dist/index.html.')
} finally {
  await vite.close()
}

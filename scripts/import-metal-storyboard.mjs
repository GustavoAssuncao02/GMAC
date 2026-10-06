import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'

// Convert the supplied canonical storyboard, retaining every animated target.
const source = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const fields = ['frame', 'progress', 'stage', 'camera', 'primary_object', 'continuity_layers', 'tools_and_overlays', 'effects', 'lighting', 'copy_blocks', 'ui', 'transition_to_next']
mkdirSync('src/metal', { recursive: true })
writeFileSync('src/metal/storyboard.json', JSON.stringify(source.frames.map(frame => Object.fromEntries(fields.map(key => [key, frame[key]])))))

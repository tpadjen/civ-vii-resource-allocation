import { build } from 'bun'
import { readFileSync } from 'fs'
import { dirname } from 'path'

// Read rollup.config.js and find all imports from './utils'
const rollupConfig = readFileSync('./rollup.config.js', 'utf-8')
const importRegex = /from ['"]\.\/utils\/([^'"]+)['"]/g
const entrypoints: string[] = []
let match

while ((match = importRegex.exec(rollupConfig)) !== null) {
    const importPath = match[1]
    // Convert the import path to a TypeScript file path
    const tsPath = `./utils/${importPath.replace(/\.js$/, '')}.ts`
    entrypoints.push(tsPath)
}

// Compile each TypeScript file next to its source
for (const entrypoint of entrypoints) {
    await build({
        entrypoints: [entrypoint],
        outdir: dirname(entrypoint),
        target: 'node',
        format: 'esm',
        sourcemap: 'external',
        minify: false,
    })
}

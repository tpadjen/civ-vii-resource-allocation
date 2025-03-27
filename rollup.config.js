import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'
import autoprefixer from 'autoprefixer'
import { readFileSync } from 'fs'
import path, { basename, extname, relative } from 'path'
import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'

// Import compiled JavaScript files
import { getScriptHash } from './utils/hashing.js'
import { validate } from './utils/modinfo/validate.js'
import { replaceRelativeImports } from './utils/rollup/replace-relative-imports.js'
import { styleInjectFixer } from './utils/rollup/style-inject-fixer.js'

const config = JSON.parse(readFileSync('./mod.config.json', 'utf-8'))

validate(config)

let inputs = {}

Object.entries(config.entries).forEach(([_key, script]) => {
    const base = basename(script, extname(script))
    const input = script.replace(/\.[^/.]+$/, '')
    const out = input.replace(
        new RegExp(`${base}$`),
        `${base}${getScriptHash(script, config.id)}`
    )
    inputs[`entries/${out}`] = `./src/${script}`
})

Object.entries(config.replacements).forEach(([_key, script]) => {
    const cleaned = script.replace(/\.[^/.]+$/, '')
    inputs[`replacements/${cleaned}`] = `./src/${script}`
})

export default {
    input: inputs,
    output: {
        format: 'es',
        dir: 'build',
        entryFileNames: '[name].js',
        chunkFileNames: (chunk) => {
            if (chunk.name.startsWith('shared/vendor')) return chunk.name

            const firstJsModuleId = chunk.moduleIds.find(
                (id) => id.endsWith('.js') || id.endsWith('.ts')
            )
            const filepath = relative(
                path.join(process.cwd(), 'src'),
                firstJsModuleId ?? chunk.name
            )
            const ext = extname(filepath)
            const filename = path.basename(filepath, ext)
            return `shared/${filename}${getScriptHash(filepath, config.id)}.js`
        },
        minifyInternalExports: false,
        manualChunks: (id) => {
            if (id.includes('node_modules')) {
                return `shared/vendor.${config.id}.js`
            }

            return null
        },
    },
    onwarn: (warning, warn) => {
        if (
            warning.message.match(
                /Module level directives cause errors when bundled/
            )
        )
            return
        warn(warning)
    },
    external: [
        /(^|\/)lib\//, // start with 'lib/' or '/lib/'
        /^\/core\//, // core modules
        /^\/.*/, // Starts with '/', absolute paths
    ],
    plugins: [
        replace({
            // react and other libraries rely on process.env.NODE_ENV
            'process.env.NODE_ENV': JSON.stringify('production'),
            preventAssignment: true,
        }),
        peerDepsExternal(),
        commonjs(),
        nodeResolve({
            browser: true,
            preferBuiltins: false,
        }),
        typescript({
            tsconfig: 'tsconfig.json',
            compilerOptions: {
                // remove paths so the compiler does not try to
                // compile core modules
                paths: undefined,
            },
        }),
        postcss({
            plugins: [postcssImport(), postcssNesting(), autoprefixer()],
            extract: false,
            inject: true,
            modules: false,
            minimize: false,
            sourceMap: true,
            autoModules: false,
            namedExports: false,
        }),
        styleInjectFixer(),
        json(),
        replaceRelativeImports(),
    ],
}

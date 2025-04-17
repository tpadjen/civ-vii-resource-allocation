import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import path, { basename, extname, relative } from 'path'
import { defineConfig } from 'vite'
import config from './mod.config.json' with { type: 'json' }
import { getScriptHash } from './utils/hashing'
import type { ModConfig } from './utils/modinfo/types'
import { validate } from './utils/modinfo/validate'
import cssInjectorPlugin from './utils/vite/css-injector-plugin'
import { getPackageVersion } from './utils/vite/vendor-utils'

const modConfig = config as ModConfig

validate(modConfig)

const entries = Object.entries(modConfig.entries).reduce(
    (acc, [_key, script]) => {
        const input = script.replace(/\.[^/.]+$/, '')
        const base = basename(script, extname(script))
        const out = input.replace(
            `${base}`,
            `${base}${getScriptHash(script, config.id)}`
        )
        acc[`entries/${out}`] =
            `./src/${relative(process.cwd(), script).replace(/^.*?[\/\\]src[\/\\]/, '')}`
        return acc
    },
    {}
)

const replacements = Object.entries(modConfig.replacements).reduce(
    (acc, [_key, script]) => {
        const cleaned = script.replace(/\.[^/.]+$/, '')
        acc[`replacements/${cleaned}`] = `./src/${script}`
        return acc
    },
    {}
)

const inputs = {
    ...entries,
    ...replacements,
}

export default defineConfig({
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false,
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
            preventAssignment: true,
        }),
        cssInjectorPlugin(),
    ],
    build: {
        outDir: 'build',
        emptyOutDir: false,
        manifest: true,
        modulePreload: {
            polyfill: false,
            resolveDependencies: (filename, deps) => {
                return deps.filter((dep) => dep.includes('node_modules'))
            },
        },
        cssCodeSplit: false,
        minify: false,
        rollupOptions: {
            input: inputs,
            external: (id) => {
                // Handle lib and core modules
                if (/(^|\/)lib\//.test(id)) return true
                if (/^\/core\//.test(id)) return true

                // Handle absolute paths
                if (/^\/.*/.test(id)) return true

                return false
            },
            output: {
                format: 'es',
                entryFileNames: '[name].js',
                chunkFileNames: (chunk) => {
                    // Handle vendor chunks specially
                    if (chunk.name.startsWith('shared')) {
                        // Clean the chunk name of any problematic characters
                        const cleanName = chunk.name.replace(
                            /[^\w\-\.\/]/g,
                            '_'
                        )
                        return cleanName
                    }

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
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        // Clean the ID by removing null bytes and query parameters
                        const cleanId = id.replace(/\x00/g, '').split('?')[0]

                        // Extract package name using a more robust approach
                        const parts = cleanId.split('node_modules/')
                        if (parts.length > 1) {
                            const packagePath = parts[1].split(/[\\/]/)[0]
                            if (packagePath) {
                                const version = getPackageVersion(packagePath)
                                return `shared/${packagePath}-${version}.js`
                            }
                        }
                        return `shared/unknown.${config.id}.js`
                    }
                    return null
                },
            },
        },
    },
})

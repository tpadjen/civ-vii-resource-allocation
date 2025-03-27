import { dirname, normalize, relative } from 'path'
import type { Plugin } from 'rollup'

/**
 * This plugin fixes an issue where PostCSS generates absolute paths in styleInject imports.
 *
 * When PostCSS processes CSS files, it generates JavaScript code that imports styleInject
 * using absolute paths (e.g., 'C:/Users/.../node_modules/style-inject/dist/style-inject.es.js').
 * This causes issues with module resolution and bundling when
 * the absolute path contains an apostrophe.
 *
 * The plugin transforms these absolute paths into relative paths by:
 * 1. Finding all lines containing styleInject imports
 * 2. Extracting the absolute path between quotes
 * 3. Converting it to a relative path from the workspace root
 * 4. Adding the correct number of '../' to get back to the project root
 */
export function styleInjectFixer(): Plugin {
    return {
        name: 'style-inject-path-transform',
        transform(code, id) {
            if (!id.endsWith('.css')) return null

            const workspaceRoot = normalize(process.cwd())
            const lines = code.split('\n')
            const fileDir = dirname(id)
            const depthToRoot = relative(workspaceRoot, fileDir).split(
                /[/\\]/
            ).length
            const rootPath = '../'.repeat(depthToRoot)

            const modifiedLines = lines.map((line) => {
                if (!line.includes('styleInject')) return line

                const firstQuoteIndex = line.indexOf("'")
                if (firstQuoteIndex === -1) return line

                const lastQuoteIndex = line.lastIndexOf("'")
                if (lastQuoteIndex === -1 || lastQuoteIndex <= firstQuoteIndex)
                    return line

                const absolutePath = normalize(
                    line.slice(firstQuoteIndex + 1, lastQuoteIndex)
                )

                try {
                    const relativePath = relative(
                        workspaceRoot,
                        absolutePath
                    ).replace(/\\/g, '/')
                    return (
                        line.slice(0, firstQuoteIndex + 1) +
                        rootPath +
                        relativePath +
                        line.slice(lastQuoteIndex)
                    )
                } catch (error) {
                    return line
                }
            })

            return modifiedLines.some((line, i) => line !== lines[i])
                ? modifiedLines.join('\n')
                : null
        },
    }
}

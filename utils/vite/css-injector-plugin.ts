import fs from 'fs'
import path from 'path'
import postcss from 'postcss'
import postcssPresetEnv from 'postcss-preset-env'
import type { Plugin } from 'vite'

export default function cssInjectorPlugin(): Plugin {
    return {
        name: 'css-injector',
        enforce: 'pre',
        async transform(code, id) {
            let cssContent
            let cssImportMatch
            let fullPath

            // Handle CSS files
            if (id.endsWith('.css')) {
                cssContent = fs.readFileSync(id, 'utf-8')
            } else {
                // Handle CSS imports with { type: 'css' }
                cssImportMatch = code.match(
                    /import\s+['"](.+\.css)['"]\s+with\s*{\s*type:\s*['"]css['"]\s*}/
                )
                if (cssImportMatch) {
                    const cssPath = cssImportMatch[1]
                    fullPath = path.resolve(path.dirname(id), cssPath)
                    cssContent = fs.readFileSync(fullPath, 'utf-8')
                }
            }

            if (cssContent) {
                // Process CSS with PostCSS
                const result = await postcss([
                    postcssPresetEnv({
                        stage: 3,
                        features: {
                            'nesting-rules': true,
                            'custom-media-queries': true,
                            'media-query-ranges': true,
                            'custom-selectors': true,
                            'logical-properties-and-values': true,
                        },
                    }),
                ]).process(cssContent, {
                    from: id.endsWith('.css') ? id : fullPath,
                })

                const styleInjectionCode = `
                    const style = document.createElement('style');
                    style.textContent = ${JSON.stringify(result.css)};
                    document.head.appendChild(style);
                `

                if (id.endsWith('.css')) {
                    return {
                        code: `${styleInjectionCode} export default {};`,
                        map: null,
                    }
                } else if (cssImportMatch) {
                    const newCode = code.replace(
                        cssImportMatch[0],
                        styleInjectionCode
                    )
                    return {
                        code: newCode,
                        map: null,
                    }
                }
            }

            return null
        },
        generateBundle() {
            // Remove any CSS files from the bundle
            const cssFiles = Object.keys(this.getModuleIds()).filter((id) =>
                id.endsWith('.css')
            )
            cssFiles.forEach((id) => {
                this.getModuleInfo(id).isExternal = true
            })
        },
    }
}

import { writeFileSync } from 'fs'
import { resolve } from 'path'

export function replaceRelativeImports() {
    return {
        name: 'replace-relative-imports',
        writeBundle(options: any, bundle: any) {
            for (const fileName in bundle) {
                const file = bundle[fileName]
                if (file.type === 'chunk' && file.code) {
                    let updatedCode = file.code

                    // Loop through each filename in the imports array
                    file.imports.forEach((filename: string) => {
                        // Create a regex to match the import statement with the filename at the end
                        const regex = new RegExp(
                            `import\\s+.*?\\s+from\\s+['"]([^'"]*)(/${filename})['"]`,
                            'g'
                        )

                        updatedCode = updatedCode.replace(
                            regex,
                            (match: string, path: string, name: string) => {
                                // Check if there is anything before the filename
                                if (path.trim()) {
                                    // Determine if we need to add a slash after 'build'
                                    const buildPath = path.endsWith('/')
                                        ? 'build/'
                                        : 'build'
                                    // Replace everything before the filename with 'build/' or 'build' as appropriate
                                    return match.replace(path, buildPath)
                                }
                                // If nothing before the filename, return the original match
                                return match
                            }
                        )
                    })

                    // Write the updated code back to the file
                    writeFileSync(resolve(options.dir, fileName), updatedCode)
                }
            }
        },
    }
}

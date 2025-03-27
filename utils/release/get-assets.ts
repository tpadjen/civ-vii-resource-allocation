import { readFileSync } from 'fs'
import pc from 'picocolors'

try {
    const modConfig = JSON.parse(readFileSync('mod.config.json', 'utf8'))
    // Output just the array with the pattern, which release-it will parse
    console.log(JSON.stringify([`${modConfig.name}-v\${version}.zip`]))
} catch (error: any) {
    console.error(pc.red(`Error reading mod.config.json: ${error.message}`))
    process.exit(1)
}

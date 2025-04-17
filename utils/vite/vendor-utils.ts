import { readFileSync } from 'fs'
import { resolve } from 'path'

export function getPackageVersion(packageName: string): string {
    try {
        const packageJsonPath = resolve(
            process.cwd(),
            'node_modules',
            packageName,
            'package.json'
        )
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        return packageJson.version
    } catch (error) {
        return 'unknown'
    }
}

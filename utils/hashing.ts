import { hash } from 'node:crypto'

// generate a consistent, limited length hash of a string
export function hashString(str: string, size = 12) {
    return hash('md5', str, 'hex').slice(0, size)
}

export function getScriptHash(script: string, modId: string) {
    return `.${hashString(script)}.${modId}`
}

import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import pc from 'picocolors'
import { getScriptHash } from '../hashing'
import { ActionGroup, ModConfig, ModConfigScriptKey } from './types'

export function getScriptsForGroup(
    modConfig: ModConfig,
    group: ActionGroup,
    key: ModConfigScriptKey = 'entries'
) {
    return group[key]
        ? group[key].map((entry) => {
              const script = modConfig[key][entry]
              if (!script) {
                  console.error(
                      pc.red(`Warning: Could not read script ${key}/${entry}`)
                  )
                  return null
              }
              const base = script.replace(/\.(js|ts|jsx|tsx)$/, '')
              return `${key}/${base}${key === 'entries' ? getScriptHash(script, modConfig.id) : ''}.js`
          })
        : []
}

export function getSharedFilesForScripts(entries: string[]): string[] {
    // Read the shared directory
    const sharedFiles = new Set<string>()
    try {
        const sharedDir = path.join('build', 'shared')
        const files = readdirSync(sharedDir)

        // For each entry, check its imports
        entries.forEach((entry) => {
            const entryPath = path.join('build', entry)
            try {
                const content = readFileSync(entryPath, 'utf-8')
                // Look for imports from shared directory
                files.forEach((sharedFile) => {
                    if (content.includes(`/shared/${sharedFile}`)) {
                        sharedFiles.add(`shared/${sharedFile}`)
                    }
                })
            } catch (error) {
                console.warn(
                    pc.yellow(`Warning: Could not read entry file ${entryPath}`)
                )
            }
        })
    } catch (_error) {
        // Probably no shared directory necessary
        // console.warn('Warning: Could not read shared directory')
    }

    return Array.from(sharedFiles)
}

export function getLibraryFilesForScripts(entries: string[]): string[] {
    const libFiles = new Set<string>()
    try {
        const libDir = path.join('build', 'lib')
        const files = readdirSync(libDir)

        // For each entry, check its imports
        entries.forEach((entry) => {
            const entryPath = path.join('build', entry)
            try {
                const content = readFileSync(entryPath, 'utf-8')
                // Look for imports from lib directory (both relative and absolute paths)
                files.forEach((libFile) => {
                    if (content.includes(`"build/lib/${libFile}`)) {
                        libFiles.add(`lib/${libFile}`)
                    }
                })
            } catch (error) {
                console.warn(
                    pc.yellow(`Warning: Could not read entry file ${entryPath}`)
                )
            }
        })
    } catch (error) {
        // Probably no lib directory necessary
        console.error(error)
        console.warn(pc.yellow('Warning: Could not read lib directory'))
    }

    return Array.from(libFiles)
}

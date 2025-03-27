import { existsSync } from 'fs'
import pc from 'picocolors'
import type { ActionGroup, ModConfig } from './types'

const requiredSections: (keyof ModConfig)[] = [
    'entries',
    'replacements',
    'actionGroups',
]
const fileLists: (keyof ModConfig)[] = ['entries', 'replacements']

function assertCondition(condition: boolean, message: string) {
    if (!condition) {
        console.error(pc.red(`Error: ${message}`))
        process.exit(1)
    }
}

function fileMustExist(filepath: string, type: string) {
    assertCondition(
        existsSync(filepath),
        `${type} file "${filepath}" does not exist`
    )
}

function validateRequiredSection(config: ModConfig, section: keyof ModConfig) {
    assertCondition(
        config[section] !== undefined,
        `Missing "${section}" in mod.config.json`
    )
}

function validateActionGroupReferences(
    config: ModConfig,
    groupName: string,
    group: ActionGroup
) {
    if (group.entries) {
        group.entries.forEach((entry) => {
            assertCondition(
                config.entries[entry] !== undefined,
                `Action group "${groupName}" references entry "${entry}" which does not exist in top-level entries`
            )
        })
    }

    if (group.replacements) {
        group.replacements.forEach((replacement) => {
            assertCondition(
                config.replacements[replacement] !== undefined,
                `Action group "${groupName}" references replacement "${replacement}" which does not exist in top-level replacements`
            )
        })
    }
}

export function validate(config: ModConfig) {
    // Validate required sections exist
    requiredSections.forEach((key) => validateRequiredSection(config, key))

    // Validate files exist
    fileLists.forEach((key) => {
        Object.values(config[key]).forEach((script) =>
            fileMustExist(`./src/${script}`, key)
        )
    })

    // Validate action group references
    Object.entries(config.actionGroups).forEach(([groupName, group]) => {
        validateActionGroupReferences(config, groupName, group)
    })
}

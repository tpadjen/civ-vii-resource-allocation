export type Scope = 'shell' | 'game' | 'editor'

export type ModConfigScriptKey = 'entries' | 'replacements'

export type ActionGroup = {
    scope: Scope
    criteria?: 'always' | 'gameLoaded' | 'editorLoaded'
    entries: string[]
    replacements?: string[]
    loadOrder?: number
}

export interface ModConfig {
    name: string
    id: string
    visibleName: string
    description: string
    authors: string[]
    entries: Record<string, string>
    replacements: Record<string, string>
    texts: string[]
    actionGroups: Record<string, ActionGroup>
    affectsSavedGames?: boolean
}

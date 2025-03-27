/** @jsxRuntime classic */
/** @jsxFrag Fragment */
/** @jsx h */

import { Fragment, h } from 'jsx-xml'
import { ActionGroup as ActionGroupType, ModConfig } from './types'
import { getScriptsForGroup, getSharedFilesForScripts } from './utils'

const createTag =
    (name: string) =>
    ({ children, ...attrs }: { children?: any; [key: string]: any }) =>
        h(name, attrs, children)

const Name = createTag('Name')
const Authors = createTag('Authors')
const Description = createTag('Description')
const Properties = createTag('Properties')
const Mod = createTag('Mod')
const Package = createTag('Package')
const Version = createTag('Version')
const AffectsSavedGames = createTag('AffectsSavedGames')
const ActionCriteria = createTag('ActionCriteria')
const Criteria = createTag('Criteria')
const AlwaysMet = createTag('AlwaysMet')
const ActionGroup = createTag('ActionGroup')
const ActionGroups = createTag('ActionGroups')
const Actions = createTag('Actions')
const UpdateText = createTag('UpdateText')
const Item = createTag('Item')
const UIScripts = createTag('UIScripts')
const ImportFiles = createTag('ImportFiles')
const LoadOrder = createTag('LoadOrder')

const UpdateTextComponent = ({ texts }: { texts: string[] }) => {
    return texts && texts.length > 0 ? (
        <UpdateText>
            {texts.map((text) => (
                <Item>text/{text}</Item>
            ))}
        </UpdateText>
    ) : null
}

const UIScriptsComponent = ({ entries }: { entries: string[] }) => {
    return entries && entries.length > 0 ? (
        <UIScripts>
            {entries.map((entry) => (
                <Item>build/{entry}</Item>
            ))}
        </UIScripts>
    ) : null
}

const ImportFilesComponent = ({ files }: { files: string[] }) => {
    return files && files.length > 0 ? (
        <ImportFiles>
            {files.map((file) => (
                <Item>build/{file}</Item>
            ))}
        </ImportFiles>
    ) : null
}

const ActionGroupComponent = ({
    group,
    modConfig,
}: {
    group: ActionGroupType
    modConfig: ModConfig
}) => {
    const { scope, criteria } = group

    const id = `${modConfig.name}-${scope}`
    const entries = getScriptsForGroup(modConfig, group, 'entries')
    const replacements = getScriptsForGroup(modConfig, group, 'replacements')

    const allFiles: string[] = [...entries, ...replacements]
    const sharedFiles: string[] = getSharedFilesForScripts(allFiles)
    const allImportFiles: string[] = [...replacements, ...sharedFiles]

    return (
        <ActionGroup
            id={id}
            scope={scope ?? 'shell'}
            criteria={criteria ?? 'always'}
        >
            {group.loadOrder && (
                <Properties>
                    <LoadOrder>{group.loadOrder}</LoadOrder>
                </Properties>
            )}
            <Actions>
                <UpdateTextComponent texts={modConfig.texts} />
                <UIScriptsComponent entries={entries} />
                <ImportFilesComponent files={allImportFiles} />
            </Actions>
        </ActionGroup>
    )
}

export const ModInfo = ({
    modInfo,
    version,
}: {
    modInfo: ModConfig
    version: string
}) => {
    const {
        name,
        authors,
        description,
        affectsSavedGames,
        visibleName,
        actionGroups,
    } = modInfo

    const orderedActionGroups = Object.entries(actionGroups).sort(
        ([_id, groupA], [_id2, groupB]) =>
            (groupA.loadOrder ?? 0) - (groupB.loadOrder ?? 0)
    )

    return (
        <Mod id={name} version={version} xmlns="ModInfo">
            <Properties>
                <Name>{visibleName ?? name}</Name>
                <Description>{description ?? ''}</Description>
                <Authors>{authors ? authors.join(', ') : ''}</Authors>
                <Package>Mod</Package>
                <Version>{version}</Version>
                <AffectsSavedGames>
                    {affectsSavedGames ? 1 : 0}
                </AffectsSavedGames>
            </Properties>
            <ActionCriteria>
                <Criteria id="always">
                    <AlwaysMet></AlwaysMet>
                </Criteria>
            </ActionCriteria>
            <ActionGroups>
                {orderedActionGroups.map(([id, group]) => (
                    <ActionGroupComponent group={group} modConfig={modInfo} />
                ))}
            </ActionGroups>
        </Mod>
    )
}

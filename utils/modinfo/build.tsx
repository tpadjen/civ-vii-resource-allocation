/** @jsxRuntime classic */
/** @jsxFrag Fragment */
/** @jsx h */

import * as fs from 'fs/promises'
import { prettify } from 'htmlfy'
import { Fragment, h, render } from 'jsx-xml' // necessary for jsx handling, even if not used locally
import path from 'path'
import pc from 'picocolors'
import modInfo from '../../mod.config.json' with { type: 'json' }
import { version } from '../../package.json' with { type: 'json' }
import type { ModConfig } from './types'
import { ModInfo } from './xml-tags'

const header = '<?xml version="1.0" encoding="utf-8"?>'

const xml = render(
    <ModInfo modInfo={modInfo as ModConfig} version={version} />
).end({
    headless: true,
})

const finalMarkup = `${header}\n${prettify(xml, { tab_size: 4 })}`

const modInfoPath = path.join(process.cwd(), `${modInfo.name}.modinfo`)
fs.writeFile(modInfoPath, finalMarkup)
    .then(() => console.log(pc.green('File written successfully')))
    .catch((error) => console.error(pc.red('Error writing file:'), error))

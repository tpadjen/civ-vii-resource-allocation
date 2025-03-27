#!/usr/bin/env node

import pc from 'picocolors'
import { createInterface } from 'readline'

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
})

// Match ANSI escape codes
const ansiEscape = '\u001b\\[\\d+m'
const ansiPattern = new RegExp(ansiEscape, 'g')

// Filter TypeScript 'Cannot find name' warnings
const filterPatterns: RegExp[] = [
    // The pattern allows for ANSI color codes between any characters
    new RegExp(
        `\\(!\\)${ansiEscape}*\\s*\\[plugin typescript\\].*TS2304:\\s*Cannot find name`
    ),
]

// Show initial message about suppressed warnings
console.warn(
    pc.blue(
        '\nNote: TypeScript "Cannot find name" warnings will be suppressed.\nThese are typically caused by rollup not being able to process the types for the core app code.\nThe warnings should not affect the build output.\nYou can use "bun bundle:verbose" to see them.\n'
    )
)

rl.on('line', (line: string): void => {
    // Strip ANSI codes for pattern matching
    const strippedLine = line.replace(ansiPattern, '')

    if (
        !filterPatterns.some((pattern: RegExp): boolean =>
            pattern.test(strippedLine)
        )
    ) {
        console.log(line) // output original line with colors
    }
})

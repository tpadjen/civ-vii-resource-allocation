import archiver from 'archiver'
import { createWriteStream } from 'fs'
import { readFile, unlink } from 'fs/promises'
import { globby } from 'globby'
import ignore from 'ignore'
import pc from 'picocolors'

async function createArchive() {
    try {
        // Read mod.config.json for name and package.json for version
        const [modConfig, packageJson] = await Promise.all([
            readFile('mod.config.json', 'utf8').then(JSON.parse),
            readFile('package.json', 'utf8').then(JSON.parse),
        ])

        const zipName = `${modConfig.name}-v${packageJson.version}.zip`

        // Delete any existing zip files that match our project name pattern
        const existingZips = await globby([`${modConfig.name}-v*.zip`])
        if (existingZips.length > 0) {
            console.log(
                pc.white(
                    `Removing ${pc.bold(existingZips.length)} existing version(s) of ${pc.bold(modConfig.name)}...`
                )
            )
            await Promise.all(existingZips.map((zip) => unlink(zip)))
        }

        // Read .releaseignore file
        const ignorePatterns = await readFile('.releaseignore', 'utf8')
        const ig = ignore().add(ignorePatterns)

        // Get all files in the project directory
        const files = await globby(['**/*'], {
            gitignore: false,
            dot: true,
        })

        // Filter files based on .releaseignore patterns
        const filesToInclude = files.filter((file) => !ig.ignores(file))

        if (filesToInclude.length === 0) {
            console.log(
                pc.yellow('Warning: No files found to include in the archive')
            )
            return
        }

        console.log(
            pc.white(
                `Found ${pc.bold(filesToInclude.length)} files to archive...`
            )
        )

        // Create zip file
        const output = createWriteStream(zipName)
        const archive = archiver('zip', {
            zlib: { level: 9 }, // Maximum compression
        })

        output.on('close', () => {
            const size = (archive.pointer() / 1024 / 1024).toFixed(2)
            console.log(pc.green(`✔ Archive created successfully!`))
            console.log(pc.white(`  Name: ${pc.bold(zipName)}`))
            console.log(pc.white(`  Size: ${pc.bold(size)} MB`))
        })

        archive.on('warning', (err) => {
            console.log(pc.yellow(`Warning: ${err.message}`))
        })

        archive.on('error', (err) => {
            throw err
        })

        archive.pipe(output)

        // Add each file to the archive
        for (const file of filesToInclude) {
            archive.file(file, { name: file })
        }

        await archive.finalize()
    } catch (error: any) {
        console.error(pc.red(`Error creating release zip: ${error.message}`))
        process.exit(1)
    }
}

createArchive()

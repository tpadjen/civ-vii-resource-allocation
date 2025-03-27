import { ChildProcess, spawn } from 'child_process'
import chokidar from 'chokidar'
import pc from 'picocolors'
import { showNotification } from '../editor/notifications.js'

// const { debounce } = _;

// Run an initial build to ensure dependencies are generated
console.log(pc.blue('Preparing initial build...'))
const initialBuild = spawn('bun', ['before:bundle'], {
    stdio: 'inherit',
    shell: true,
})

initialBuild.on('exit', (code) => {
    if (code !== 0) {
        const message = `Build preparation failed with code: ${code}`
        console.error(pc.red(message))
        showNotification(message)
        process.exit(code)
    }

    startWatchProcess()
})

function startWatchProcess() {
    // Start rollup in watch mode
    let rollup: ChildProcess | null = null

    function startRollup() {
        console.log(pc.blue('Starting Rollup in watch mode...'))
        rollup = spawn('bun', ['bundle:rollup:watch'], {
            stdio: 'inherit',
            shell: true,
        })

        rollup.on('error', (error) => {
            console.error(
                pc.red(`Rollup process encountered an error: ${error.message}`)
            )
            showNotification(`Rollup error: ${error.message}`)
        })

        rollup.on('exit', (code) => {
            console.log(pc.yellow(`Rollup process exited with code: ${code}`))
            if (code !== 0) {
                showNotification(`Rollup process exited with code: ${code}`)
                // Restart Rollup if it exits unexpectedly
                restartRollup()
            }
        })
    }

    startRollup()

    // Create a version of the modinfo update function without debounce for testing
    const updateModinfo = () => {
        console.log(pc.blue('Build files changed, updating modinfo...'))

        const update = spawn('bun', ['modinfo:update'], {
            stdio: ['inherit', 'pipe', 'inherit'],
            shell: true,
        })

        let output = ''
        update.stdout.on('data', (data) => {
            output += data.toString()
        })

        update.on('exit', (code) => {
            if (code !== 0) {
                const message = `Modinfo update failed with code: ${code}`
                console.error(pc.red(message))
                showNotification(message)
            } else if (output.includes('needed updates')) {
                const message = `Modinfo updated with changes`
                console.log(pc.green(message))
                showNotification(message, 'info')
            }
        })
    }

    // Restart rollup when config changes
    const restartRollup = () => {
        console.log(pc.blue('mod.config.json changed, restarting rollup...'))

        if (rollup && rollup.killed === false) {
            rollup.kill()

            // Wait for the process to clean up
            setTimeout(() => {
                console.log(
                    pc.green('Rollup process stopped, starting a new one...')
                )
                startRollup()
            }, 1000)
        } else {
            startRollup()
        }
    }

    // Set up watchers
    const buildWatcher = chokidar.watch('build/**/*.js', {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100,
        },
    })

    const configWatcher = chokidar.watch('mod.config.json', {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100,
        },
    })

    // Handle build file changes
    buildWatcher
        .on('add', (path) => {
            console.log(pc.gray(`Build file ${path} has been added`))
            updateModinfo()
        })
        .on('change', (path) => {
            console.log(pc.gray(`Build file ${path} has been changed`))
            updateModinfo()
        })
        .on('unlink', (path) => {
            console.log(pc.gray(`Build file ${path} has been removed`))
            updateModinfo()
        })
        .on('error', (error: any) => {
            const message = `Build watcher error: ${error.message}`
            console.error(pc.red(message))
            showNotification(message)
        })

    // Handle config file changes
    configWatcher
        .on('change', () => {
            console.log(
                pc.blue('mod.config.json changed, triggering rollup restart...')
            )
            restartRollup()
        })
        .on('error', (error: any) => {
            const message = `Config watcher error: ${error.message}`
            console.error(pc.red(message))
            showNotification(message)
        })

    // Handle process termination
    process.on('SIGINT', () => {
        console.log(pc.yellow('\nStopping watchers...'))
        buildWatcher.close()
        configWatcher.close()
        if (rollup && rollup.killed === false) {
            rollup.kill()
        }
        process.exit(0)
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        const message = `Uncaught exception: ${error.message}`
        console.error(pc.red(message))
        showNotification(message)
        process.exit(1)
    })
}

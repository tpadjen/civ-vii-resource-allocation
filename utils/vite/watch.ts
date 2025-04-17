import { ChildProcess, spawn } from 'child_process'
import chokidar from 'chokidar'
import pc from 'picocolors'
import { showNotification } from '../editor/notifications.js'

startWatchProcess()

function startWatchProcess() {
    let vite: ChildProcess | null = null

    function startVite() {
        console.log(pc.blue('Starting Vite in watch mode...'))
        vite = spawn(
            'bun',
            ['rimraf build && vite build --config vite.config.ts --watch'],
            {
                stdio: ['inherit', 'pipe', 'pipe'],
                shell: true,
            }
        )

        let output = ''
        vite.stdout?.on('data', (data) => {
            const message = data.toString()
            output += message
            console.log(message)
            if (message.includes('built in')) {
                updateModinfo()
            }
        })

        vite.stderr?.on('data', (data) => {
            console.error(data.toString())
        })

        vite.on('error', (error) => {
            console.error(
                pc.red(`Vite process encountered an error: ${error.message}`)
            )
            showNotification(`Vite error: ${error.message}`)
        })

        vite.on('exit', (code) => {
            console.log(pc.yellow(`Vite process exited with code: ${code}`))
            if (code !== 0) {
                showNotification(`Vite process exited with code: ${code}`)
                restartVite()
            }
        })
    }

    const updateModinfo = () => {
        console.log(pc.blue('Build files changed, updating modinfo...'))

        const update = spawn('bun', ['update:modinfo'], {
            stdio: ['inherit', 'pipe', 'pipe'],
            shell: true,
        })

        let output = ''
        update.stdout?.on('data', (data) => {
            const message = data.toString()
            output += message
            console.log(message)
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

    const restartVite = () => {
        console.log(pc.blue('mod.config.json changed, restarting vite...'))

        if (vite && vite.killed === false) {
            vite.kill()

            // Wait for the process to clean up
            setTimeout(() => {
                console.log(
                    pc.green('Vite process stopped, starting a new one...')
                )
                startVite()
            }, 1000)
        } else {
            startVite()
        }
    }

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

    buildWatcher
        .on('add', (path) => {
            updateModinfo()
        })
        .on('change', (path) => {
            updateModinfo()
        })
        .on('unlink', (path) => {
            updateModinfo()
        })
        .on('ready', () => {
            startVite()
        })
        .on('error', (error: any) => {
            const message = `Build watcher error: ${error.message}`
            console.error(pc.red(message))
            showNotification(message)
        })

    configWatcher
        .on('change', () => {
            console.log(
                pc.blue('mod.config.json changed, triggering rollup restart...')
            )
            restartVite()
        })
        .on('error', (error: any) => {
            const message = `Config watcher error: ${error.message}`
            console.error(pc.red(message))
            showNotification(message)
        })

    process.on('SIGINT', () => {
        console.log(pc.yellow('\nStopping watchers...'))
        buildWatcher.close()
        configWatcher.close()
        if (vite && vite.killed === false) {
            vite.kill()
        }
        process.exit(0)
    })

    process.on('uncaughtException', (error) => {
        const message = `Uncaught exception: ${error.message}`
        console.error(pc.red(message))
        showNotification(message)
        process.exit(1)
    })
}

import { spawn } from 'child_process'

/**
 * Shows a notification in the editor
 * @param {string} message - The message to display
 * @param {string} type - The notification type (error, warning, info, etc.)
 */
export function showNotification(message: string, type = 'error') {
    // Try Cursor first
    const cursor = spawn(
        'cursor',
        ['--cli', 'notification', type, `${message}`],
        {
            shell: true,
            stdio: 'ignore',
        }
    )

    cursor.on('error', () => {
        // If Cursor fails, try VSCode
        spawn('code', ['--remote', 'cli', `--${type}`, `"${message}"`], {
            shell: true,
            stdio: 'ignore',
        })
    })
}

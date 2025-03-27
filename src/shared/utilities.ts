import modConfig from './mod.config.js'

const { id } = modConfig

export function log(...args: any[]) {
    console.log(id, JSON.stringify(args, null, 2))
}

export function logw(...args: any[]) {
    console.warn(id, JSON.stringify(args, null, 2))
}

export function loge(...args: any[]) {
    console.error(id, JSON.stringify(args, null, 2))
}

export function logd(...args: any[]) {
    console.debug(id, JSON.stringify(args, null, 2))
}

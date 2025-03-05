export function localizeAndCompare (a, b) {
    return engine.translate(a).localeCompare(engine.translate(b));
}
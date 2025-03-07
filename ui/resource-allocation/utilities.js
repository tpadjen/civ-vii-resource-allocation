export function localizeAndCompare(a, b) {
    return Locale.compose(a).localeCompare(Locale.compose(b));
}
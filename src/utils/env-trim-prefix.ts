export function envTrimPrefix(prefix: string): void {
    Object.keys(process.env)
        .filter(n => n.startsWith(prefix))
        .map(n => n.substr(prefix.length))
        .forEach(n => process.env[n] = process.env[prefix + n]);
}

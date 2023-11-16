// Polyfill until Typescript Gods and Node Gods can get their s**t together
declare global {
    interface Crypto {
        randomUUID(): `${string}-${string}-${string}-${string}-${string}`
    }
}

export function GenerateIdentifier() { return global.crypto.randomUUID() }
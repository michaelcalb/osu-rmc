import { createHash } from 'node:crypto'

export const SEQUENCE_LENGTH = 60

// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// ABSOLUTELY DO NOT TOUCH THIS
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE
// EVERY RUN WILL BECOME UNREPRODUCIBLE AND UNVERIFIABLE

const SEED_BYTES = 8

export function generateSeed(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(SEED_BYTES)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export function createRng(seed: string): () => number {
    let counter = 0

    return function next(): number {
        const digest = createHash('sha256')
            .update(`${seed}:${counter++}`)
            .digest()

        return digest.readUintBE(0, 6) / 2 ** 48
    }
}

export function resolveSequence(
    seed: string,
    poolSize: number,
    length: number = SEQUENCE_LENGTH
): number[] {
    if (poolSize < length) {
        throw new Error(`pool has ${poolSize} maps, need at least ${length}`)
    }

    const rng = createRng(seed)
    const chosen = new Set<number>()
    const sequence: number[] = []

    while (sequence.length < length) {
        const index = Math.floor(rng() * poolSize) + 1

        if (!chosen.has(index)) {
            chosen.add(index)
            sequence.push(index)
        }
    }

    return sequence
}

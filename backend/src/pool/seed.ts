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

function hashSeed(seed: string): number {
    let hash = 0x811c9dc5

    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193) >>> 0
    }

    return hash
}

export function createRng(seed: string): () => number {
    let state = hashSeed(seed)

    return function next(): number {
        state = (state + 0x6d2b79f5) >>> 0

        let t = state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
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
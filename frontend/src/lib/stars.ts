type Stops = [number, string][]

const BACKGROUND: Stops = [
    [0.1, '#4290fb'],
    [1.25, '#4fc0ff'],
    [2, '#4fffd5'],
    [2.5, '#7cff4f'],
    [3.3, '#f6f05c'],
    [4.2, '#ff8068'],
    [4.9, '#ff4e6f'],
    [5.8, '#c645b8'],
    [6.7, '#6563de'] /* lmao */,
    [7.7, '#18158e'],
    [9, '#000000']
]

const TEXT: Stops = [
    [9, '#f6f05c'],
    [9.9, '#ff8068'],
    [10.6, '#ff4e6f'],
    [11.5, '#c645b8'],
    [12.4, '#6563de']
]

const GAMMA = 2.2

function channels(hex: string) {
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
}

function spectrum(stops: Stops, rating: number) {
    const upper = stops.findIndex(([sr]) => sr > rating)

    if (upper === 0) {
        return stops[0][1]
    }

    if (upper === -1) {
        return stops[stops.length - 1][1]
    }

    const [fromSr, fromHex] = stops[upper - 1]
    const [toSr, toHex] = stops[upper]
    const t = (rating - fromSr) / (toSr - fromSr)
    const to = channels(toHex)

    const mixed = channels(fromHex).map((a, i) =>
        Math.round(
            (a ** GAMMA + t * (to[i] ** GAMMA - a ** GAMMA)) ** (1 / GAMMA)
        )
    )

    return `rgb(${mixed.join(', ')})`
}

export function starColor(rating: number) {
    if (rating < 0.1) {
        return '#aaaaaa'
    }

    if (rating >= 9) {
        return '#000000'
    }

    return spectrum(BACKGROUND, rating)
}

export function starTextColor(rating: number) {
    if (rating < 6.5) {
        return '#000000'
    }

    if (rating < 9) {
        return '#f6f05c'
    }

    return spectrum(TEXT, rating)
}

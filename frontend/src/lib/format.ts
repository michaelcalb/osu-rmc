const score = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })

const accuracy = new Intl.NumberFormat('en', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})

export function formatScore(value: number | null) {
    return value === null ? '-' : score.format(value)
}

export function formatAccuracy(value: number | null) {
    return value === null ? '-' : accuracy.format(value)
}

export function formatStars(value: number) {
    return value.toFixed(5).slice(0, -3)
}

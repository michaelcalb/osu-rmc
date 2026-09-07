export type CoverVariant =
    | 'cover'
    | 'cover@2x'
    | 'card'
    | 'card@2x'
    | 'list'
    | 'list@2x'
    | 'slimcover'
    | 'slimcover@2x'

export function coverUrl(
    setId: number,
    coverUpdatedAt: string | null,
    variant: CoverVariant = 'cover'
): string {
    const version = coverUpdatedAt
        ? `?${Math.floor(new Date(coverUpdatedAt).getTime() / 1000)}`
        : ''

    return `https://assets.ppy.sh/beatmaps/${setId}/covers/${variant}.jpg${version}`
}

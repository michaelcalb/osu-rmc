const relative = new Intl.RelativeTimeFormat('en', { style: 'narrow' })

const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
})

const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'shortOffset'
})

export function timeAgo(iso: string) {
    const now = new Date()
    const then = new Date(iso)

    const months =
        (now.getFullYear() - then.getFullYear()) * 12 +
        now.getMonth() -
        then.getMonth() -
        (now.getDate() < then.getDate() ? 1 : 0)

    if (months >= 12) {
        return relative.format(-Math.floor(months / 12), 'year')
    }

    if (months >= 1) {
        return relative.format(-months, 'month')
    }

    const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000)

    return days < 1 ? 'today' : relative.format(-days, 'day')
}

export function exactTime(iso: string) {
    const d = new Date(iso)

    return {
        date: date.format(d),
        time: time.format(d).replace('GMT', 'UTC')
    }
}

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
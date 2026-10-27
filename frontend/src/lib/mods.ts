const MOD_NAMES: Record<string, string> = {
    EZ: 'easy',
    NF: 'no fail',
    HT: 'half time',
    DC: 'daycore',
    HR: 'hard rock',
    SD: 'sudden death',
    PF: 'perfect',
    DT: 'double time',
    NC: 'nightcore',
    HD: 'hidden',
    FL: 'flashlight',
    BL: 'blinds',
    ST: 'strict tracking',
    AC: 'accuracy challenge',
    TP: 'target practice',
    DA: 'difficulty adjust',
    CL: 'classic',
    RD: 'random',
    MR: 'mirror',
    AL: 'alternate',
    SG: 'single tap',
    AT: 'autoplay',
    CN: 'cinema',
    RX: 'relax',
    AP: 'autopilot',
    SO: 'spun out',
    TR: 'transform',
    WG: 'wiggle',
    SI: 'spin in',
    GR: 'grow',
    DF: 'deflate',
    WU: 'wind up',
    WD: 'wind down',
    TC: 'traceable',
    BR: 'barrel roll',
    AD: 'approach different',
    MU: 'muted',
    NS: 'no scope',
    MG: 'magnetised',
    RP: 'repel',
    AS: 'adaptive speed',
    FR: 'freeze frame',
    BU: 'bubbles',
    SY: 'synesthesia',
    DP: 'depth',
    BM: 'bloom',
    TD: 'touch device',
    SV2: 'score v2'
}

const icons = import.meta.glob<string>('../assets/mods/*.png', {
    eager: true,
    import: 'default'
})

export function modName(acronym: string) {
    return MOD_NAMES[acronym] ?? acronym
}

export function modIcon(name: string): string | undefined {
    return icons[`../assets/mods/${name.replaceAll(' ', '-')}.png`]
}

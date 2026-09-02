const BASE = import.meta.env.VITE_API_URL

if (!BASE) {
    throw new Error('VITE_API_URL is not set')
}

export class ApiError extends Error {
    readonly status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        credentials: 'include',
        headers: init.body
            ? { 'Content-Type': 'application/json', ...init.headers }
            : init.headers
    })

    const text = await res.text()

    if (!res.ok) {
        throw new ApiError(res.status, errorMessage(text, res.status))
    }

    return (text ? JSON.parse(text) : null) as T
}

function errorMessage(text: string, status: number): string {
    try {
        const parsed = JSON.parse(text) as { message?: string }

        if (parsed.message) {
            return parsed.message
        }
    } catch {}

    return text || `request failed with ${status}`
}

export function get<T>(path: string): Promise<T> {
    return request<T>(path)
}

export function post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body)
    })
}

export function goToLogin(): void {
    window.location.href = `${BASE}/auth/login`
}
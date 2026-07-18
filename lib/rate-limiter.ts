/**
 * Simple in-memory rate limiter for API routes and server actions.
 * Note: For multi-instance deployments (Vercel, K8s), replace with Redis-based limiter.
 */

const rateMap = new Map<string, { count: number; resetAt: number }>()

// Clean up stale entries every 60 seconds
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateMap.entries()) {
        if (entry.resetAt <= now) {
            rateMap.delete(key)
        }
    }
}, 60_000)

export interface RateLimitOptions {
    /** Number of allowed requests within the window */
    limit: number
    /** Window duration in milliseconds */
    windowMs: number
    /** Unique identifier for the client (IP, userId, etc.) */
    identifier: string
}

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
    limit: number
}

/**
 * Check if a request should be rate-limited.
 * Returns current usage stats.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
    const { limit, windowMs, identifier } = options
    const now = Date.now()

    const existing = rateMap.get(identifier)

    if (!existing || existing.resetAt <= now) {
        // First request or window expired — create new entry
        rateMap.set(identifier, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, limit }
    }

    if (existing.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt, limit }
    }

    existing.count++
    return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt, limit }
}

/**
 * Create a middleware wrapper for API route handlers with rate limiting.
 */
export function withRateLimit(
    options: Omit<RateLimitOptions, 'identifier'>,
    handler: (req: Request) => Promise<Response>
) {
    return async (req: Request): Promise<Response> => {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown'
        const identifier = `${options.limit}-${options.windowMs}-${ip}`

        const result = checkRateLimit({ ...options, identifier })

        if (!result.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'طلبات كثيرة جداً. يرجى المحاولة بعد قليل.',
                    retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                        'X-RateLimit-Limit': String(result.limit),
                        'X-RateLimit-Remaining': String(result.remaining),
                    },
                }
            )
        }

        return handler(req)
    }
}

/**
 * Rate limiter for Server Actions — wraps the execution with a check.
 */
export function actionRateLimit(identifier: string, limit = 30, windowMs = 60_000): RateLimitResult {
    return checkRateLimit({ limit, windowMs, identifier })
}

export function getActionIdentifier(userId?: string): string {
    return userId || `anon-${Math.random().toString(36).substring(2, 8)}`
}

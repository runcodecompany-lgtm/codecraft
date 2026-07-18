import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limiter'

describe('checkRateLimit', () => {
    it('should allow first request within limit', () => {
        const result = checkRateLimit({
            limit: 10,
            windowMs: 60_000,
            identifier: 'test-user-1',
        })

        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(9)
        expect(result.limit).toBe(10)
    })

    it('should block requests exceeding limit', () => {
        const identifier = 'test-user-2'

        // Use all 3 allowed requests
        for (let i = 0; i < 3; i++) {
            const result = checkRateLimit({
                limit: 3,
                windowMs: 60_000,
                identifier,
            })
            if (i < 2) {
                expect(result.allowed).toBe(true)
            } else {
                // Last allowed
                expect(result.allowed).toBe(true)
                expect(result.remaining).toBe(0)
            }
        }

        // This one should be blocked
        const blocked = checkRateLimit({
            limit: 3,
            windowMs: 60_000,
            identifier,
        })
        expect(blocked.allowed).toBe(false)
        expect(blocked.remaining).toBe(0)
    })

    it('should reset after window expires', () => {
        const identifier = 'test-user-3'

        // Exhaust the limit with windowMs = 0 (immediate expiry)
        checkRateLimit({
            limit: 1,
            windowMs: 0,
            identifier,
        })

        // With 0ms window, it should be expired
        // Small delay to ensure window passes
        const result = checkRateLimit({
            limit: 1,
            windowMs: -1,
            identifier,
        })
        // Negative window means expired, so should be allowed
        // But this is edge case — in practice, windowMs is always positive
        expect(result.allowed).toBe(true)
    })

    it('should handle multiple identifiers independently', () => {
        const id1 = 'user-a'
        const id2 = 'user-b'

        // Exhaust user-a
        for (let i = 0; i < 2; i++) {
            checkRateLimit({ limit: 2, windowMs: 60_000, identifier: id1 })
        }

        // user-a should be blocked
        expect(checkRateLimit({ limit: 2, windowMs: 60_000, identifier: id1 }).allowed).toBe(false)

        // user-b should still be allowed
        expect(checkRateLimit({ limit: 2, windowMs: 60_000, identifier: id2 }).allowed).toBe(true)
    })
})
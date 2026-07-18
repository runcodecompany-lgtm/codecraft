// lib/ai-cache.ts — AI Response Caching Layer
// In-memory cache with TTL support (can be upgraded to Redis later)

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

class AICache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly DEFAULT_TTL_MS = 30 * 60 * 1000 // 30 minutes
  private readonly MAX_ENTRIES = 1000

  /**
   * Generate a cache key from context parameters
   */
  createKey(...parts: (string | number | undefined | null)[]): string {
    return parts.filter(Boolean).join("::")
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set a cached value with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.DEFAULT_TTL_MS),
      createdAt: Date.now(),
    })
  }

  /**
   * Delete a cached value
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxEntries: number } {
    return { size: this.cache.size, maxEntries: this.MAX_ENTRIES }
  }

  /**
   * Get or compute a cached value
   * If the key exists and hasn't expired, returns the cached value.
   * Otherwise, calls the compute function, caches the result, and returns it.
   */
  async getOrCompute<T>(key: string, computeFn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    const result = await computeFn()
    this.set(key, result, ttlMs)
    return result
  }
}

// Singleton instance
export const aiCache = new AICache()

// ─── Specific cache namespaces ───────────────────────────────────────

export const AI_CACHE_KEYS = {
  summary: (contentId: string, level: string) =>
    `summary::${contentId}::${level}`,
  flashcards: (contentId: string) =>
    `flashcards::${contentId}`,
  quiz: (contentId: string, questionCount: number) =>
    `quiz::${contentId}::${questionCount}`,
  recommendations: (userId: string) =>
    `recommendations::${userId}`,
  analysis: (userId: string) =>
    `analysis::${userId}`,
  search: (query: string) =>
    `search::${query.toLowerCase().trim()}`,
  moderation: (contentHash: string) =>
    `moderation::${contentHash}`,
}

// Cache TTLs
export const AI_CACHE_TTLS = {
  SUMMARY: 60 * 60 * 1000,        // 1 hour
  FLASHCARDS: 60 * 60 * 1000,     // 1 hour
  QUIZ: 30 * 60 * 1000,           // 30 minutes
  RECOMMENDATIONS: 15 * 60 * 1000, // 15 minutes
  ANALYSIS: 30 * 60 * 1000,       // 30 minutes
  SEARCH: 10 * 60 * 1000,         // 10 minutes
  MODERATION: 60 * 60 * 1000,     // 1 hour
}

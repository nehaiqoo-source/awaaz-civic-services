/** Fixed-window in-memory limiter. Per-process only: use a shared store when running multiple instances. */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns seconds to wait if the key is limited, otherwise null. */
  check(key: string): number | null {
    const now = this.now()
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k)
    }
    const entry = this.hits.get(key)
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs })
      return null
    }
    if (entry.count >= this.limit) return Math.ceil((entry.resetAt - now) / 1000)
    entry.count += 1
    return null
  }
}

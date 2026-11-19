import { CAPABILITIES, type Capability } from '@/lib/act/schema'

export const DEFAULT_GRANT_MS = 10 * 60_000
export const MAX_GRANT_MS = 30 * 60_000

/**
 * What the person has allowed the assistant to do on THIS site, for a short time.
 *
 * Deliberately kept in memory only: page JavaScript can read and write the page's localStorage/cookies, so a stored
 * grant could be forged by the page. A grant dies when the panel closes, the tab navigates to another origin, the
 * time runs out, or the person revokes it. Nothing is granted by default.
 */
export class Permissions {
  private granted = new Set<Capability>()
  private expiresAt = 0
  private origin: string | null = null
  private listeners = new Set<() => void>()

  constructor(
    private readonly currentOrigin: () => string,
    private readonly now: () => number = Date.now,
  ) {}

  /** Replaces the current grant. Unknown capability names are ignored. */
  grant(capabilities: readonly string[], ttlMs: number = DEFAULT_GRANT_MS): void {
    const valid = capabilities.filter((c): c is Capability => (CAPABILITIES as readonly string[]).includes(c))
    this.granted = new Set(valid)
    this.origin = valid.length > 0 ? this.currentOrigin() : null
    this.expiresAt = valid.length > 0 ? this.now() + Math.min(Math.max(ttlMs, 1_000), MAX_GRANT_MS) : 0
    this.emit()
  }

  has(capability: Capability): boolean {
    this.expireIfNeeded()
    return this.granted.has(capability)
  }

  active(): Capability[] {
    this.expireIfNeeded()
    return CAPABILITIES.filter((c) => this.granted.has(c))
  }

  remainingMs(): number {
    this.expireIfNeeded()
    return this.granted.size === 0 ? 0 : Math.max(0, this.expiresAt - this.now())
  }

  revoke(): void {
    if (this.granted.size === 0) return
    this.granted = new Set()
    this.expiresAt = 0
    this.origin = null
    this.emit()
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private expireIfNeeded(): void {
    if (this.granted.size === 0) return
    if (this.now() >= this.expiresAt || this.origin !== this.currentOrigin()) this.revoke()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

/** Sliding-window limiter so a runaway loop (or a confused model) cannot hammer the page. */
export class ActionLimiter {
  private times: number[] = []
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  tryTake(): boolean {
    const t = this.now()
    this.times = this.times.filter((x) => t - x < this.windowMs)
    if (this.times.length >= this.limit) return false
    this.times.push(t)
    return true
  }
}

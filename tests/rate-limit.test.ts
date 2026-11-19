import { describe, expect, it } from 'vitest'
import { RateLimiter } from '@/lib/rate-limit'

describe('RateLimiter', () => {
  it('blocks after the limit and resets after the window', () => {
    let now = 0
    const limiter = new RateLimiter(2, 1000, () => now)
    expect(limiter.check('a')).toBeNull()
    expect(limiter.check('a')).toBeNull()
    expect(limiter.check('a')).toBe(1)
    expect(limiter.check('b')).toBeNull()
    now = 1001
    expect(limiter.check('a')).toBeNull()
  })
})

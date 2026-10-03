import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../src/index.js';

describe('RateLimiter Token Bucket', () => {
  it('acquires and releases tokens cleanly', async () => {
    const limiter = new RateLimiter({ requestsPerSecond: 20, maxConcurrency: 2 });
    const release1 = await limiter.acquire();
    const release2 = await limiter.acquire();

    expect(typeof release1).toBe('function');
    expect(typeof release2).toBe('function');

    release1();
    release2();
  });
});

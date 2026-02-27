/**
 * apiQueue.ts — ZERØ MERIDIAN push75
 * Centralized API rate limiter — cegah IP-ban Binance & CoinGecko.
 * Pure TypeScript, zero deps.
 *
 * binanceQueue  : max 3 concurrent, 100ms gap  → aman di bawah 1200 weight/min
 * coingeckoQueue: max 1 concurrent, 2000ms gap → max 30 calls/min (free tier)
 */

class ApiQueue {
  private readonly queue: Array<() => Promise<void>> = [];
  private running = 0;
  private readonly maxConcurrent: number;
  private readonly minIntervalMs: number;

  constructor(maxConcurrent = 3, minIntervalMs = 200) {
    this.maxConcurrent = maxConcurrent;
    this.minIntervalMs = minIntervalMs;
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        }
      });
      void this.run();
    });
  }

  private async run(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;
    this.running++;
    const task = this.queue.shift()!;
    await task();
    await new Promise<void>(r => setTimeout(r, this.minIntervalMs));
    this.running--;
    void this.run();
  }
}

// Binance public REST: 3 concurrent, 100ms gap
export const binanceQueue = new ApiQueue(3, 100);

// CoinGecko free tier: 1 concurrent, 2000ms gap
export const coingeckoQueue = new ApiQueue(1, 2000);

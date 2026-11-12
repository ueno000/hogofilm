/** requestAnimationFrame ベースのカウントダウン。 */
export class CountdownTimer {
  private startAt = 0;
  private rafId = 0;
  private running = false;

  constructor(
    private readonly durationMs: number,
    private readonly onTick: (remainingMs: number) => void,
    private readonly onTimeout: () => void,
  ) {}

  get remainingMs(): number {
    if (!this.running) return this.stoppedRemaining;
    return Math.max(0, this.durationMs - (performance.now() - this.startAt));
  }

  private stoppedRemaining = 0;

  start(): void {
    this.startAt = performance.now();
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      const left = this.remainingMs;
      this.onTick(left);
      if (left <= 0) {
        this.stop();
        this.onTimeout();
        return;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  /** 停止し、停止時点の残り時間を返す。 */
  stop(): number {
    if (this.running) {
      this.stoppedRemaining = this.remainingMs;
      this.running = false;
      cancelAnimationFrame(this.rafId);
    }
    return this.stoppedRemaining;
  }
}

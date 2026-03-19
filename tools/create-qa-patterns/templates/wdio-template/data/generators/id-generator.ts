// Deterministic id generator for repeatable local and CI runs.
export class IdGenerator {
  private readonly counters = new Map<string, number>();

  constructor(private readonly runId: string) {}

  next(prefix: string): string {
    const counter = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, counter);
    return `${prefix}-${this.runId}-${String(counter).padStart(4, '0')}`;
  }

  nextSequence(prefix: string): number {
    const counter = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, counter);
    return counter;
  }
}

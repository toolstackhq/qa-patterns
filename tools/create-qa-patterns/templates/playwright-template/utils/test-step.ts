import { test } from "@playwright/test";

import type { Logger } from "./logger";

export class StepLogger {
  constructor(private readonly logger: Logger) {}

  async run<T>(message: string, callback: () => Promise<T>): Promise<T> {
    this.logger.info("step.started", { step: message });
    try {
      const result = await test.step(message, callback);
      this.logger.info("step.passed", { step: message });
      return result;
    } catch (error) {
      this.logger.error("step.failed", {
        step: message,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

import fs from "node:fs";
import path from "node:path";

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult
} from "@playwright/test/reporter";

type ReporterOptions = {
  outputFile?: string;
};

class StructuredReporter implements Reporter {
  private outputFile = path.resolve(process.cwd(), "reports/logs/playwright-events.jsonl");

  constructor(options?: ReporterOptions) {
    if (options?.outputFile) {
      this.outputFile = path.resolve(process.cwd(), options.outputFile);
    }
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.write({
      event: "run.started",
      projectCount: config.projects.length,
      testCount: suite.allTests().length
    });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.write({
      event: "test.finished",
      title: test.title,
      tags: test.title.match(/@\w+/g) ?? [],
      status: result.status,
      durationMs: result.duration
    });
  }

  onEnd(result: FullResult): void {
    this.write({
      event: "run.finished",
      status: result.status
    });
  }

  private write(payload: Record<string, unknown>): void {
    fs.appendFileSync(
      this.outputFile,
      `${JSON.stringify({ timestamp: new Date().toISOString(), ...payload })}\n`,
      "utf8"
    );
  }
}

export default StructuredReporter;

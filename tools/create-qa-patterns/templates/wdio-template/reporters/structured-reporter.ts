// Custom reporter that writes machine-readable WebdriverIO lifecycle events to disk.
import fs from 'node:fs';
import path from 'node:path';

import reporter from '@wdio/reporter';

type ReporterOptions = {
  outputFile?: string;
};

export default class StructuredReporter extends reporter {
  private readonly outputFile: string;

  constructor(options: ReporterOptions = {}) {
    super({ ...options, stdout: false });
    this.outputFile = path.resolve(
      process.cwd(),
      options.outputFile ?? 'reports/logs/wdio-events.jsonl'
    );
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
  }

  onRunnerStart(runnerStats: { cid?: string; specs?: string[] }): void {
    this.writeEvent({
      event: 'run.started',
      cid: runnerStats.cid ?? 'unknown',
      specCount: runnerStats.specs?.length ?? 0
    });
  }

  onTestPass(testStats: { title: string; duration?: number }): void {
    this.writeTestEvent('passed', testStats);
  }

  onTestFail(testStats: {
    title: string;
    duration?: number;
    errors?: Array<{ message?: string }>;
  }): void {
    this.writeTestEvent('failed', testStats, {
      error: testStats.errors?.[0]?.message
    });
  }

  onTestSkip(testStats: { title: string; duration?: number }): void {
    this.writeTestEvent('skipped', testStats);
  }

  onRunnerEnd(runnerStats: { failures?: number }): void {
    this.writeEvent({
      event: 'run.finished',
      status: runnerStats.failures ? 'failed' : 'passed'
    });
  }

  private writeTestEvent(
    status: string,
    testStats: { title: string; duration?: number },
    extra: Record<string, unknown> = {}
  ): void {
    this.writeEvent({
      event: 'test.finished',
      title: testStats.title,
      tags: testStats.title.match(/@\w+/g) ?? [],
      status,
      durationMs: testStats.duration ?? 0,
      ...extra
    });
  }

  private writeEvent(payload: Record<string, unknown>): void {
    fs.appendFileSync(
      this.outputFile,
      `${JSON.stringify({ timestamp: new Date().toISOString(), ...payload })}\n`,
      'utf8'
    );
  }
}

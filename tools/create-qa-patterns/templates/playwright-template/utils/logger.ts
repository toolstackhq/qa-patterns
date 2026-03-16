import fs from "node:fs";
import path from "node:path";

type LogLevel = "info" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

const LOG_FILE = path.resolve(process.cwd(), "reports/logs/execution.log");

function ensureLogDirectory(): void {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function serialize(level: LogLevel, message: string, context?: LogContext): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  });
}

export class Logger {
  constructor(private readonly context: LogContext = {}) {
    ensureLogDirectory();
  }

  child(context: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...context
    });
  }

  info(message: string, context?: LogContext): void {
    this.write("info", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    const line = serialize(level, message, {
      ...this.context,
      ...context
    });
    fs.appendFileSync(LOG_FILE, `${line}\n`, "utf8");
    console.log(line);
  }
}

export function createLogger(context: LogContext = {}): Logger {
  return new Logger(context);
}

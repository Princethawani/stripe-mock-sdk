type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  resource: string;
  action: string;
  id?: string;
  timestamp: number;
}

class RequestLogger {
  private enabled: boolean = false;
  private logs: LogEntry[] = [];

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  log(level: LogLevel, resource: string, action: string, id?: string): void {
    const entry: LogEntry = { level, resource, action, id, timestamp: Date.now() };
    this.logs.push(entry);
    if (this.enabled) {
      const tag = `[stripe-mock] ${resource}.${action}${id ? ` (${id})` : ""}`;
      if (level === "error") console.error(tag);
      else if (level === "warn") console.warn(tag);
      else console.log(tag);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new RequestLogger();
type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  hotelId?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(JSON.stringify(entry));
      }
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (message: string, context?: LogContext) => log("error", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  debug: (message: string, context?: LogContext) => log("debug", message, context),
};

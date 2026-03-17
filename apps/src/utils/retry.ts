import { logger } from "@/lib/logger";

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    context?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, context = "operation" } = options;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.warn(`Retry ${attempt + 1}/${maxRetries} for ${context}`, {
          action: "retry",
          error: lastError.message,
          delayMs: delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error(`All ${maxRetries} retries failed for ${context}`, {
    action: "retry_exhausted",
    error: lastError.message,
  });
  throw lastError;
}

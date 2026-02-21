import { DatabaseError } from "../errors";
import { logger } from "./logger";

export async function executeWithDatabaseError<T>(
  operation: () => Promise<T>,
  message: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(message, error);
    throw new DatabaseError(message);
  }
}

export async function executeWithLoggedError(
  operation: () => Promise<void>,
  message: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    logger.error(message, error);
  }
}

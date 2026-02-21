// src/shared/utils/index.ts
// shared utility exports
export {
  executeWithDatabaseError,
  executeWithLoggedError,
} from "./errorHandling";
export { logger } from "./logger";
export {
  getPrismaClient,
  requirePrismaClient,
  setPrismaClient,
} from "./prisma";

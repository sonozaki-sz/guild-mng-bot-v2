// src/bot/services/shared-access/errorAccess.ts
// error handling API へのアクセス集約

export {
  DatabaseError,
  ValidationError,
} from "../../../shared/errors/customErrors";

export {
  handleCommandError,
  handleInteractionError,
} from "../../errors/interactionErrorHandler";

export {
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
} from "../../../shared/errors/errorHandler";

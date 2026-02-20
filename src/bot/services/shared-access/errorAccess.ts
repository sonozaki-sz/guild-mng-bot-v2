// src/bot/services/shared-access/errorAccess.ts
// error handling API へのアクセス集約

export { DatabaseError, ValidationError } from "../../../shared/errors";

export {
  handleCommandError,
  handleInteractionError,
} from "../../errors/interactionErrorHandler";

export {
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
} from "../../../shared/errors";

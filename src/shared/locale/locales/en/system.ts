// src/shared/locale/locales/en/system.ts
// System message translations (English)

export const system = {
  // Bot startup & shutdown
  "bot.starting": "Starting Discord Bot...",
  "bot.commands.registering": "Registering {{count}} commands...",
  "bot.commands.registered": "Commands registered",
  "bot.events.registering": "Registering {{count}} events...",
  "bot.events.registered": "Events registered",
  "bot.startup.error": "Error during bot startup:",
  "bot.startup.failed": "Bot startup failed:",
  "bot.client.initialized": "Discord Bot client initialized",
  "bot.client.shutting_down": "Shutting down bot client...",
  "bot.client.shutdown_complete": "Bot client shut down successfully",

  // Error handling
  "error.reply_failed": "Failed to send error message",
  "error.unhandled_rejection": "Unhandled Promise rejection:",
  "error.uncaught_exception": "Uncaught exception:",
  "error.unhandled_rejection_log": "Unhandled Promise Rejection:",
  "error.uncaught_exception_log": "Uncaught Exception:",
  "error.node_warning": "Node Warning:",
  "error.cleanup_complete": "Cleanup completed",
  "error.cleanup_failed": "Error during cleanup:",

  // Locale manager
  "locale.initialized": "LocaleManager initialized with i18next",

  // Cooldown manager
  "cooldown.cleared_all": "All cooldowns cleared",
  "cooldown.destroyed": "CooldownManager destroyed",

  // Scheduler
  "scheduler.stopping": "Stopping all scheduled jobs...",

  // Shutdown
  "shutdown.signal_received":
    "{{signal}} received, shutting down gracefully...",
} as const;

export type SystemTranslations = typeof system;

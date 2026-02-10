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

  // Cooldown manager
  "cooldown.cleared_all": "All cooldowns cleared",
  "cooldown.destroyed": "CooldownManager destroyed",
  "cooldown.reset": "Cooldown reset: {{commandName}} for user {{userId}}",
  "cooldown.cleared_for_command":
    "All cooldowns cleared for command: {{commandName}}",
  "cooldown.cleanup": "Cleanup: removed {{count}} expired cooldowns",

  // Scheduler
  "scheduler.stopping": "Stopping all scheduled jobs...",
  "scheduler.job_exists": "Job {{jobId}} already exists. Removing old job.",
  "scheduler.executing_job": "Executing job: {{jobId}}",
  "scheduler.job_completed": "Job completed: {{jobId}}",
  "scheduler.job_error": "Error in job {{jobId}}:",
  "scheduler.schedule_failed": "Failed to schedule job {{jobId}}:",
  "scheduler.job_removed": "Job removed: {{jobId}}",
  "scheduler.job_stopped": "Stopped job: {{jobId}}",
  "scheduler.cancel_bump_reminder":
    "Cancelling existing bump reminder for guild {{guildId}}",
  "scheduler.bump_reminder_cancelled":
    "Bump reminder cancelled for guild {{guildId}}",

  // Shutdown
  "shutdown.signal_received":
    "{{signal}} received, shutting down gracefully...",
  "shutdown.gracefully": "Shutting down gracefully...",
  "shutdown.sigterm": "Received SIGTERM, shutting down...",

  // Database operation logs
  "database.get_config_log": "Failed to get config for guild {{guildId}}:",
  "database.save_config_log": "Failed to save config for guild {{guildId}}:",
  "database.saved_config": "Saved config for guild {{guildId}}",
  "database.update_config_log":
    "Failed to update config for guild {{guildId}}:",
  "database.updated_config": "Updated config for guild {{guildId}}",
  "database.delete_config_log":
    "Failed to delete config for guild {{guildId}}:",
  "database.deleted_config": "Deleted config for guild {{guildId}}",
  "database.check_existence_log":
    "Failed to check existence for guild {{guildId}}:",

  // Web server
  "web.server_started": "Web server started: {{url}}",
  "web.startup_error": "Web server startup error:",
  "web.unhandled_rejection": "Unhandled Promise rejection:",
  "web.uncaught_exception": "Uncaught exception:",
  "web.startup_failed": "Web server startup failed:",
  "web.api_error": "API Error:",
  "web.internal_server_error": "Internal Server Error",
} as const;

export type SystemTranslations = typeof system;

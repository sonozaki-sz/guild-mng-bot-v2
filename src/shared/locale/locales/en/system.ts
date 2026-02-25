// src/shared/locale/locales/en/system.ts
// System message translations (English)

export const system = {
  // Bot startup & shutdown
  // High-level lifecycle logs emitted from process startup/teardown paths
  "bot.starting": "Starting Discord Bot...",
  "bot.commands.registering": "Registering {{count}} commands...",
  "bot.commands.registered": "Commands registered",
  "bot.commands.command_registered": "  ✓ /{{name}}",
  "bot.events.registering": "Registering {{count}} events...",
  "bot.events.registered": "Events registered",
  "bot.startup.error": "Error during bot startup:",
  "bot.startup.failed": "Bot startup failed:",
  "bot.client.initialized": "Discord Bot client initialized",
  "bot.client.shutting_down": "Shutting down bot client...",
  "bot.client.shutdown_complete": "Bot client shut down successfully",
  "bot.presence_activity": "Running on {{count}} servers | by sonozaki-sz",

  // Log messages
  // Bump configuration audit logs
  // `log.*` keys are primarily emitted from command handlers (admin actions)
  "bump-reminder.detected": "Bump detected for guild {{guildId}} ({{service}})",
  "bump-reminder.detection_failed":
    "Failed to handle bump detection for guild {{guildId}}:",
  "log.bump_reminder_enabled":
    "Enabled bump reminder for guild {{guildId}} (Channel: {{channelId}})",
  "log.bump_reminder_disabled": "Disabled bump reminder for guild {{guildId}}",
  "log.bump_reminder_mention_set":
    "Set bump reminder mention role for guild {{guildId}} (Role: {{roleId}})",
  "log.bump_reminder_mention_removed":
    "Removed bump reminder mention settings for guild {{guildId}} (target: {{target}})",
  "log.bump_reminder_users_removed":
    "Removed {{count}} user(s) from bump reminder for guild {{guildId}}",

  // Error handling
  // Generic process-level failure and cleanup traces
  "error.reply_failed": "Failed to send error message",
  "error.unhandled_rejection": "Unhandled Promise rejection:",
  "error.uncaught_exception": "Uncaught exception:",
  "error.unhandled_rejection_log": "Unhandled Promise Rejection:",
  "error.uncaught_exception_log": "Uncaught Exception:",
  "error.node_warning": "Node Warning:",
  "error.cleanup_complete": "Cleanup completed",
  "error.cleanup_failed": "Error during cleanup:",

  // Locale
  "locale.manager_initialized": "LocaleManager initialized with i18next",

  // Cooldown manager
  "cooldown.cleared_all": "All cooldowns cleared",
  "cooldown.destroyed": "CooldownManager destroyed",
  "cooldown.reset": "Cooldown reset: {{commandName}} for user {{userId}}",
  "cooldown.cleared_for_command":
    "All cooldowns cleared for command: {{commandName}}",
  "cooldown.cleanup": "Cleanup: removed {{count}} expired cooldowns",

  // Scheduler
  // Generic job lifecycle logs
  // Common scheduler traces shared by reminder and other jobs
  // `scheduler.*` is consumed across both runtime scheduler and startup restoration
  "scheduler.stopping": "Stopping all scheduled jobs...",
  "scheduler.job_exists": "Job {{jobId}} already exists. Removing old job.",
  "scheduler.executing_job": "Executing job: {{jobId}}",
  "scheduler.job_completed": "Job completed: {{jobId}}",
  "scheduler.job_error": "Error in job {{jobId}}:",
  "scheduler.schedule_failed": "Failed to schedule job {{jobId}}:",
  "scheduler.job_removed": "Job removed: {{jobId}}",
  "scheduler.job_stopped": "Stopped job: {{jobId}}",
  "scheduler.job_scheduled": "Job scheduled: {{jobId}}",
  // Bump reminder scheduling / restoration logs
  // Keys below are intentionally split by lifecycle: schedule / execute / restore / panel-cleanup
  "scheduler.bump_reminder_task_failed":
    "Bump reminder task failed for guild {{guildId}}:",
  "scheduler.bump_reminder_description":
    "Bump reminder for guild {{guildId}} at {{executeAt}}",
  "scheduler.bump_reminder_scheduled":
    "Bump reminder scheduled for guild {{guildId}} in {{minutes}} minutes",
  "scheduler.cancel_bump_reminder":
    "Cancelling existing bump reminder for guild {{guildId}}",
  "scheduler.bump_reminder_cancelled":
    "Bump reminder cancelled for guild {{guildId}}",
  "scheduler.bump_reminder_executing_immediately":
    "Executing overdue bump reminder immediately for guild {{guildId}}",
  "scheduler.bump_reminders_restored":
    "Restored {{count}} pending bump reminders from database",
  "scheduler.bump_reminder_sent":
    "Bump reminder sent for guild {{guildId}} in channel {{channelId}}",
  "scheduler.bump_reminder_channel_not_found":
    "Channel {{channelId}} not found for guild {{guildId}}",
  "scheduler.bump_reminder_disabled":
    "Bump reminder disabled for guild {{guildId}}",
  "scheduler.bump_reminder_restore_failed":
    "Failed to restore pending bump reminders:",
  "scheduler.bump_reminder_duplicates_cancelled":
    "Cancelled {{count}} duplicate pending bump reminder(s)",
  // Panel synchronization and channel consistency logs
  // Keep panel-related keys contiguous to simplify grep-based incident review
  "scheduler.bump_reminder_unregistered_channel":
    "Skipping bump detection in unregistered channel {{channelId}} for guild {{guildId}} (expected: {{expectedChannelId}})",
  "scheduler.bump_reminder_orphaned_panel_delete_failed":
    "Failed to delete orphaned bump panel message {{panelMessageId}}",
  "scheduler.bump_reminder_panel_deleted":
    "Deleted bump panel message {{panelMessageId}} in guild {{guildId}}",
  "scheduler.bump_reminder_panel_delete_failed":
    "Failed to delete bump panel message {{panelMessageId}}",
  "scheduler.bump_reminder_panel_send_failed": "Failed to send bump panel",

  // Shutdown
  "shutdown.signal_received":
    "{{signal}} received, shutting down gracefully...",
  "shutdown.gracefully": "Shutting down gracefully...",
  "shutdown.sigterm": "Received SIGTERM, shutting down...",

  // Database operation logs
  // GuildConfig operation logs
  // Key-value style persistence logs for guild-scoped config
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

  // Bump Reminder database operations
  // BumpReminder table operation logs
  // Persistence lifecycle logs for reminder records
  "database.bump_reminder_created":
    "Bump reminder created: {{id}} for guild {{guildId}}",
  "database.bump_reminder_create_failed":
    "Failed to create bump reminder for guild {{guildId}}:",
  "database.bump_reminder_find_failed": "Failed to find bump reminder {{id}}:",
  "database.bump_reminder_find_all_failed":
    "Failed to find all pending bump reminders:",
  "database.bump_reminder_status_updated":
    "Bump reminder {{id}} status updated to {{status}}",
  "database.bump_reminder_update_failed":
    "Failed to update bump reminder {{id}}:",
  "database.bump_reminder_deleted": "Bump reminder deleted: {{id}}",
  "database.bump_reminder_delete_failed":
    "Failed to delete bump reminder {{id}}:",
  "database.bump_reminder_cancelled_by_guild":
    "Cancelled pending bump reminders for guild {{guildId}}",
  "database.bump_reminder_cancelled_by_channel":
    "Cancelled pending bump reminders for guild {{guildId}} / channel {{channelId}}",
  "database.bump_reminder_cancel_failed":
    "Failed to cancel bump reminders for guild {{guildId}}:",
  "database.bump_reminder_cleanup_completed":
    "Cleaned up {{count}} old bump reminders (older than {{days}} days)",
  "database.bump_reminder_cleanup_failed":
    "Failed to cleanup old bump reminders:",

  // Bot startup event logs
  // Human-readable startup summary logs
  // These are mostly operator-facing summary lines on ready
  "ready.bot_ready": "✅ Bot is ready! Logged in as {{tag}}",
  "ready.servers": "📊 Servers: {{count}}",
  "ready.users": "👥 Users: {{count}}",
  "ready.commands": "💬 Commands: {{count}}",
  "ready.event_registered": "Event registered: {{name}}",

  // Interaction event logs
  // Command/modal/button/select execution traces
  // Unified interaction execution and failure logs
  // Keep interaction keys contiguous because handlers share common error paths
  "interaction.unknown_command": "Unknown command: {{commandName}}",
  "interaction.command_executed":
    "Command executed: {{commandName}} by {{userTag}}",
  "interaction.command_error": "Error executing command {{commandName}}:",
  "interaction.autocomplete_error":
    "Error in autocomplete for {{commandName}}:",
  "interaction.unknown_modal": "Unknown modal: {{customId}}",
  "interaction.modal_submitted": "Modal submitted: {{customId}} by {{userTag}}",
  "interaction.modal_error": "Error executing modal {{customId}}:",
  "interaction.button_error": "Error executing button {{customId}}:",
  "interaction.select_menu_error": "Error executing select menu {{customId}}:",

  // AFK command logs
  "afk.moved_log":
    "Moved user {{userId}} to {{channelId}} in guild {{guildId}}",
  "afk.configured_log":
    "AFK channel configured for guild {{guildId}}, channel {{channelId}}",

  // VAC logs
  // Voice-state / channel lifecycle / panel operation logs
  // Keep VAC runtime keys grouped for easier operator triage during incidents
  "vac.voice_state_update_failed": "Failed to process VAC voiceStateUpdate:",
  "vac.channel_created":
    "VAC channel created in guild {{guildId}} (Channel: {{channelId}}, Owner: {{ownerId}})",
  "vac.channel_deleted":
    "VAC channel deleted in guild {{guildId}} (Channel: {{channelId}})",
  "vac.category_full":
    "Category {{categoryId}} reached channel limit in guild {{guildId}}",
  "vac.trigger_removed_by_delete":
    "Removed deleted trigger channel from VAC config in guild {{guildId}} (Channel: {{channelId}})",
  "vac.channel_delete_sync_failed":
    "Failed to sync VAC config on channelDelete:",
  "vac.panel_send_failed": "Failed to send VAC control panel:",
  "vac.startup_cleanup_failed": "Failed VAC startup cleanup:",

  // Web server
  // Startup and exception handling
  // HTTP process and request pipeline logs for the web module
  "web.server_started": "Web server started: {{url}}",
  "web.startup_error": "Web server startup error:",
  "web.unhandled_rejection": "Unhandled Promise rejection:",
  "web.uncaught_exception": "Uncaught exception:",
  "web.startup_failed": "Web server startup failed:",
  "web.api_error": "API Error:",
  "web.internal_server_error": "Internal Server Error",
  // API authentication (Bearer API key)
  // Request-level auth result logs and user-facing messages
  "web.auth_unauthorized": "[Auth] Unauthorized request: {{method}} {{url}}",
  "web.auth_invalid_token": "[Auth] Invalid token: {{method}} {{url}}",
  "web.auth_unauthorized_error": "Unauthorized",
  "web.auth_forbidden_error": "Forbidden",
  // Missing/invalid Authorization header guidance
  "web.auth_header_required":
    "Authorization: Bearer <api-key> header is required",
  "web.auth_invalid_token_message": "Invalid token",
} as const;

export type SystemTranslations = typeof system;

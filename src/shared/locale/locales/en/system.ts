// src/shared/locale/locales/en/system.ts
// System message translations (English)

export const system = {
  // Bot startup & shutdown
  // High-level lifecycle logs emitted from process startup/teardown paths
  "bot.starting": "Bot: Starting Discord Bot...",
  "bot.commands.registering": "Bot: Registering {{count}} commands...",
  "bot.commands.registered": "Bot: Commands registered",
  "bot.commands.command_registered": "  ✓ /{{name}}",
  "bot.events.registering": "Bot: Registering {{count}} events...",
  "bot.events.registered": "Bot: Events registered",
  "bot.startup.error": "Bot: Error during bot startup:",
  "bot.startup.failed": "Bot: Bot startup failed:",
  "bot.client.initialized": "Bot: Discord Bot client initialized",
  "bot.client.shutting_down": "Bot: Shutting down bot client...",
  "bot.client.shutdown_complete": "Bot: Bot client shut down successfully",
  "bot.presence_activity": "Running on {{count}} servers | by sonozaki-sz",

  // Log messages
  // Bump configuration audit logs
  // `log.*` keys are primarily emitted from command handlers (admin actions)
  "bump-reminder.detected":
    "BumpReminder: bump detected GuildId: {{guildId}} Service: {{service}}",
  "bump-reminder.detection_failed":
    "BumpReminder: failed to handle bump detection GuildId: {{guildId}}",
  "log.bump_reminder_enabled":
    "BumpReminder: enabled GuildId: {{guildId}} ChannelId: {{channelId}}",
  "log.bump_reminder_disabled": "BumpReminder: disabled GuildId: {{guildId}}",
  "log.bump_reminder_mention_set":
    "BumpReminder: mention role set GuildId: {{guildId}} RoleId: {{roleId}}",
  "log.bump_reminder_mention_removed":
    "BumpReminder: mention settings removed GuildId: {{guildId}} Target: {{target}}",
  "log.bump_reminder_users_removed":
    "BumpReminder: mention users removed GuildId: {{guildId}} UserIds: {{userIds}}",

  // Error handling
  // Generic process-level failure and cleanup traces
  "error.reply_failed": "Bot: Failed to send error message",
  "error.unhandled_rejection": "Bot: Unhandled Promise rejection:",
  "error.uncaught_exception": "Bot: Uncaught exception:",
  "error.unhandled_rejection_log": "Bot: Unhandled Promise Rejection:",
  "error.uncaught_exception_log": "Bot: Uncaught Exception:",
  "error.node_warning": "Bot: Node Warning:",
  "error.cleanup_complete": "Bot: Cleanup completed",
  "error.cleanup_failed": "Bot: Error during cleanup:",

  // Locale
  "locale.manager_initialized": "Bot: LocaleManager initialized with i18next",

  // Cooldown manager
  "cooldown.cleared_all": "Cooldown: All cooldowns cleared",
  "cooldown.destroyed": "Cooldown: CooldownManager destroyed",
  "cooldown.reset":
    "Cooldown: Reset CommandName: {{commandName}} UserId: {{userId}}",
  "cooldown.cleared_for_command":
    "Cooldown: Cleared all for command CommandName: {{commandName}}",
  "cooldown.cleanup": "Cooldown: Removed {{count}} expired cooldowns",

  // Scheduler
  // Generic job lifecycle logs
  // Common scheduler traces shared by reminder and other jobs
  // `scheduler.*` is consumed across both runtime scheduler and startup restoration
  "scheduler.stopping": "Scheduler: Stopping all scheduled jobs...",
  "scheduler.job_exists":
    "Scheduler: Job already exists, removing old job JobId: {{jobId}}",
  "scheduler.executing_job": "Scheduler: Executing job JobId: {{jobId}}",
  "scheduler.job_completed": "Scheduler: Job completed JobId: {{jobId}}",
  "scheduler.job_error": "Scheduler: Job error JobId: {{jobId}}",
  "scheduler.schedule_failed":
    "Scheduler: Failed to schedule job JobId: {{jobId}}",
  "scheduler.job_removed": "Scheduler: Job removed JobId: {{jobId}}",
  "scheduler.job_stopped": "Scheduler: Job stopped JobId: {{jobId}}",
  "scheduler.job_scheduled": "Scheduler: Job scheduled JobId: {{jobId}}",
  // Bump reminder scheduling / restoration logs
  // Keys below are intentionally split by lifecycle: schedule / execute / restore / panel-cleanup
  "scheduler.bump_reminder_task_failed":
    "BumpReminder: Task failed GuildId: {{guildId}}",
  "scheduler.bump_reminder_description":
    "BumpReminder: GuildId: {{guildId}} ExecuteAt: {{executeAt}}",
  "scheduler.bump_reminder_scheduled":
    "BumpReminder: Scheduled GuildId: {{guildId}} Minutes: {{minutes}}",
  "scheduler.cancel_bump_reminder":
    "BumpReminder: Cancelling existing reminder GuildId: {{guildId}}",
  "scheduler.bump_reminder_cancelled":
    "BumpReminder: Reminder cancelled GuildId: {{guildId}}",
  "scheduler.bump_reminder_executing_immediately":
    "BumpReminder: Executing overdue reminder immediately GuildId: {{guildId}}",
  "scheduler.bump_reminders_restored":
    "BumpReminder: Restored pending reminders Count: {{count}}",
  "scheduler.bump_reminder_sent":
    "BumpReminder: Reminder sent GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_channel_not_found":
    "BumpReminder: Channel not found GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_disabled":
    "BumpReminder: Disabled GuildId: {{guildId}}",
  "scheduler.bump_reminder_restore_failed": "BumpReminder: Failed to restore:",
  "scheduler.bump_reminder_duplicates_cancelled":
    "BumpReminder: Cancelled duplicates Count: {{count}}",
  // Panel synchronization and channel consistency logs
  // Keep panel-related keys contiguous to simplify grep-based incident review
  "scheduler.bump_reminder_unregistered_channel":
    "BumpReminder: Skipping unregistered channel GuildId: {{guildId}} ChannelId: {{channelId}} ExpectedChannelId: {{expectedChannelId}}",
  "scheduler.bump_reminder_orphaned_panel_delete_failed":
    "BumpReminder: Failed to delete orphaned panel message PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_deleted":
    "BumpReminder: Deleted panel message GuildId: {{guildId}} PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_delete_failed":
    "BumpReminder: Failed to delete panel message PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_send_failed":
    "BumpReminder: Failed to send panel",

  // Shutdown
  "shutdown.signal_received":
    "Bot: {{signal}} received, shutting down gracefully...",
  "shutdown.gracefully": "Bot: Shutting down gracefully...",
  "shutdown.sigterm": "Bot: Received SIGTERM, shutting down...",

  // Database operation logs
  // GuildConfig operation logs
  // Key-value style persistence logs for guild-scoped config
  "database.get_config_log":
    "Database: Failed to get config GuildId: {{guildId}}",
  "database.save_config_log":
    "Database: Failed to save config GuildId: {{guildId}}",
  "database.saved_config": "Database: Config saved GuildId: {{guildId}}",
  "database.update_config_log":
    "Database: Failed to update config GuildId: {{guildId}}",
  "database.updated_config": "Database: Config updated GuildId: {{guildId}}",
  "database.delete_config_log":
    "Database: Failed to delete config GuildId: {{guildId}}",
  "database.deleted_config": "Database: Config deleted GuildId: {{guildId}}",
  "database.check_existence_log":
    "Database: Failed to check existence GuildId: {{guildId}}",

  // Bump Reminder database operations
  // BumpReminder table operation logs
  // Persistence lifecycle logs for reminder records
  "database.bump_reminder_created":
    "Database: Bump reminder created Id: {{id}} GuildId: {{guildId}}",
  "database.bump_reminder_create_failed":
    "Database: Failed to create bump reminder GuildId: {{guildId}}",
  "database.bump_reminder_find_failed":
    "Database: Failed to find bump reminder Id: {{id}}",
  "database.bump_reminder_find_all_failed":
    "Database: Failed to find pending bump reminders",
  "database.bump_reminder_status_updated":
    "Database: Bump reminder status updated Id: {{id}} Status: {{status}}",
  "database.bump_reminder_update_failed":
    "Database: Failed to update bump reminder Id: {{id}}",
  "database.bump_reminder_deleted":
    "Database: Bump reminder deleted Id: {{id}}",
  "database.bump_reminder_delete_failed":
    "Database: Failed to delete bump reminder Id: {{id}}",
  "database.bump_reminder_cancelled_by_guild":
    "Database: Cancelled pending bump reminders GuildId: {{guildId}}",
  "database.bump_reminder_cancelled_by_channel":
    "Database: Cancelled pending bump reminders GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.bump_reminder_cancel_failed":
    "Database: Failed to cancel bump reminders GuildId: {{guildId}}",
  "database.bump_reminder_cleanup_completed":
    "Database: Cleaned up old bump reminders Count: {{count}} Days: {{days}}",
  "database.bump_reminder_cleanup_failed":
    "Database: Failed to cleanup old bump reminders:",

  // Bot startup event logs
  // Human-readable startup summary logs
  // These are mostly operator-facing summary lines on ready
  "ready.bot_ready": "Bot: ✅ Bot is ready! Logged in as {{tag}}",
  "ready.servers": "Bot: 📊 Servers: {{count}}",
  "ready.users": "Bot: 👥 Users: {{count}}",
  "ready.commands": "Bot: 💬 Commands: {{count}}",
  "ready.event_registered": "  ✓ {{name}}",

  // Interaction event logs
  // Command/modal/button/select execution traces
  // Unified interaction execution and failure logs
  // Keep interaction keys contiguous because handlers share common error paths
  "interaction.unknown_command":
    "Interaction: Unknown command CommandName: {{commandName}}",
  "interaction.command_executed":
    "Interaction: Command executed CommandName: {{commandName}} UserTag: {{userTag}}",
  "interaction.command_error":
    "Interaction: Command error CommandName: {{commandName}}",
  "interaction.autocomplete_error":
    "Interaction: Autocomplete error CommandName: {{commandName}}",
  "interaction.unknown_modal":
    "Interaction: Unknown modal CustomId: {{customId}}",
  "interaction.modal_submitted":
    "Interaction: Modal submitted CustomId: {{customId}} UserTag: {{userTag}}",
  "interaction.modal_error": "Interaction: Modal error CustomId: {{customId}}",
  "interaction.button_error":
    "Interaction: Button error CustomId: {{customId}}",
  "interaction.select_menu_error":
    "Interaction: Select menu error CustomId: {{customId}}",

  // AFK command logs
  "afk.moved_log":
    "AFK: moved user to AFK channel GuildId: {{guildId}} UserId: {{userId}} ChannelId: {{channelId}}",
  "afk.configured_log":
    "AFK: channel configured GuildId: {{guildId}} ChannelId: {{channelId}}",

  // VAC logs
  // Voice-state / channel lifecycle / panel operation logs
  // Keep VAC runtime keys grouped for easier operator triage during incidents
  "vac.voice_state_update_failed": "VAC: Failed to process voiceStateUpdate",
  "vac.channel_created":
    "VAC: channel created GuildId: {{guildId}} ChannelId: {{channelId}} OwnerId: {{ownerId}}",
  "vac.channel_deleted":
    "VAC: channel deleted GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.category_full":
    "VAC: category reached channel limit GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vac.trigger_removed_by_delete":
    "VAC: removed deleted trigger channel from config GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.channel_delete_sync_failed":
    "VAC: Failed to sync config on channelDelete",
  "vac.panel_send_failed": "VAC: Failed to send control panel",
  "vac.startup_cleanup_failed": "VAC: Startup cleanup failed",

  // Web server
  // Startup and exception handling
  // HTTP process and request pipeline logs for the web module
  "web.server_started": "WebServer: Started URL: {{url}}",
  "web.startup_error": "WebServer: Startup error:",
  "web.unhandled_rejection": "WebServer: Unhandled Promise rejection:",
  "web.uncaught_exception": "WebServer: Uncaught exception:",
  "web.startup_failed": "WebServer: Startup failed:",
  "web.api_error": "WebServer: API Error:",
  "web.internal_server_error": "WebServer: Internal Server Error",
  // API authentication (Bearer API key)
  // Request-level auth result logs and user-facing messages
  "web.auth_unauthorized":
    "WebServer: [Auth] Unauthorized request Method: {{method}} URL: {{url}}",
  "web.auth_invalid_token":
    "WebServer: [Auth] Invalid token Method: {{method}} URL: {{url}}",
  "web.auth_unauthorized_error": "Unauthorized",
  "web.auth_forbidden_error": "Forbidden",
  // Missing/invalid Authorization header guidance
  "web.auth_header_required":
    "Authorization: Bearer <api-key> header is required",
  "web.auth_invalid_token_message": "Invalid token",

  // Discord error notification
  "discord.error_notification_title": "🚨 {{appName}} Error Notification",
} as const;

export type SystemTranslations = typeof system;

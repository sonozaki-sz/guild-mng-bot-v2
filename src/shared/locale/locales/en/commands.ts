// src/shared/locale/locales/en/commands.ts
// Command-related translations (English)

export const commands = {
  // Ping command
  // Basic latency diagnostics shown to any user
  "ping.description": "Check bot response speed",
  "ping.embed.measuring": "🏓 Measuring...",
  "ping.embed.response":
    "📡 API Latency: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // Cooldown
  "cooldown.wait": "⏱️ You can use this command in **{{seconds}} seconds**",

  // AFK command
  "afk.description": "Move user to AFK channel",
  "afk.user.description": "User to move (default: yourself)",
  "afk.embed.moved": "Moved {{user}} to {{channel}}",

  // AFK config command
  // Admin-only AFK configuration labels and result text
  "afk-config.description": "Configure AFK feature (administrators only)",
  "afk-config.set-ch.description": "Configure AFK channel",
  "afk-config.set-ch.channel.description": "AFK channel (voice channel)",
  "afk-config.view.description": "Show current settings",
  "afk-config.embed.title": "AFK",
  "afk-config.embed.set_ch_success": "AFK channel configured: {{channel}}",
  "afk-config.embed.not_configured": "AFK channel is not configured",
  "afk-config.embed.field.channel": "AFK Channel",

  // Bump Reminder config command (Discord UI labels)
  // Slash command and subcommand descriptions
  "bump-reminder-config.description":
    "Configure bump reminder (administrators only)",
  "bump-reminder-config.enable.description": "Enable bump reminder feature",
  "bump-reminder-config.disable.description": "Disable bump reminder feature",
  "bump-reminder-config.set-mention.description": "Set mention role or user",
  "bump-reminder-config.set-mention.role.description":
    "Role to mention in reminders",
  "bump-reminder-config.set-mention.user.description":
    "User to mention in reminders (toggle add/remove)",
  "bump-reminder-config.remove-mention.description": "Remove mention settings",
  "bump-reminder-config.remove-mention.target.description": "Target to remove",
  "bump-reminder-config.remove-mention.target.role": "Role setting",
  "bump-reminder-config.remove-mention.target.user": "User (with selection UI)",
  "bump-reminder-config.remove-mention.target.users": "All users",
  "bump-reminder-config.remove-mention.target.all": "Role + All users",
  "bump-reminder-config.view.description": "Show current settings",

  // Bump Reminder config command responses
  // Generic status messages
  // Success/warning/error result strings for config subcommands
  "bump-reminder-config.embed.success_title": "Settings Updated",
  "bump-reminder-config.embed.not_configured":
    "Bump reminder is not configured.",
  "bump-reminder-config.embed.select_users_to_remove":
    "Select users to remove:",
  "bump-reminder-config.embed.enable_success":
    "Bump reminder feature has been enabled",
  "bump-reminder-config.embed.disable_success":
    "Bump reminder feature has been disabled",
  // Mention setting results (add/remove/validation)
  "bump-reminder-config.embed.set_mention_role_success":
    "Mention role set to {{role}}",
  "bump-reminder-config.embed.set_mention_user_added":
    "Added {{user}} to mention list",
  "bump-reminder-config.embed.set_mention_user_removed":
    "Removed {{user}} from mention list",
  "bump-reminder-config.embed.set_mention_error_title": "Input Error",
  "bump-reminder-config.embed.set_mention_error":
    "Please specify a role or user",
  "bump-reminder-config.embed.remove_mention_role":
    "Mention role registration has been removed",
  "bump-reminder-config.embed.remove_mention_users":
    "All mention users have been removed",
  "bump-reminder-config.embed.remove_mention_all":
    "All mention settings have been removed",
  "bump-reminder-config.embed.remove_mention_select":
    "Removed the following users from mention list:\n{{users}}",
  "bump-reminder-config.embed.remove_mention_error_title": "Deletion Error",
  "bump-reminder-config.embed.remove_mention_error_no_users":
    "No users are registered to remove",
  // view subcommand display fields
  "bump-reminder-config.embed.title": "Bump Reminder Feature",
  "bump-reminder-config.embed.status": "Current settings status",
  "bump-reminder-config.embed.field.status": "Status",
  "bump-reminder-config.embed.field.mention_role": "Mention Role",
  "bump-reminder-config.embed.field.mention_users": "Mention Users",

  // VAC config command
  // Trigger VC management (create/remove)
  // Labels for setup commands that define VAC trigger channels
  "vac-config.description":
    "Configure voice auto-create feature (Manage Server)",
  "vac-config.create-trigger-vc.description": "Create trigger channel",
  "vac-config.create-trigger-vc.category.description":
    "Destination category (TOP or category; defaults to current category)",
  "vac-config.remove-trigger-vc.description": "Remove trigger channel",
  "vac-config.remove-trigger-vc.category.description":
    "Target category (TOP or category; defaults to current category)",
  "vac-config.remove-trigger-vc.category.top": "TOP (no category)",
  "vac-config.view.description": "Show current settings",
  // view subcommand display fields
  "vac-config.embed.title": "Voice Auto-Create",
  "vac-config.embed.not_configured": "Not configured",
  "vac-config.embed.no_created_vcs": "None",
  "vac-config.embed.top": "TOP",
  "vac-config.embed.field.trigger_channels": "Trigger channels",
  "vac-config.embed.field.created_vcs": "Created VC count",
  "vac-config.embed.field.created_vc_details": "Created VCs",
  "vac-config.embed.trigger_created": "Created trigger channel {{channel}}",
  "vac-config.embed.trigger_removed": "Removed trigger channel {{channel}}",
  "vac-config.embed.remove_error_title": "Removal Error",

  // VAC command
  // VC operation commands (rename/user limit)
  // Runtime panel/manual operation result messages
  "vac.description": "Change settings of an auto-created VC",
  "vac.vc-rename.description": "Rename your current VC",
  "vac.vc-rename.name.description": "New VC name",
  "vac.vc-limit.description": "Change user limit of your current VC",
  "vac.vc-limit.limit.description": "User limit (0=unlimited, max 99)",
  "vac.embed.renamed": "VC name has been changed to {{name}}",
  "vac.embed.limit_changed": "User limit has been set to {{limit}}",
  // Result message for AFK bulk-move action on panel
  "vac.embed.members_moved": "Moved {{count}} member(s) to AFK",
  // Result message when re-posting panel to the latest position
  "vac.embed.panel_refreshed": "Panel moved to the bottom",
  // Shared label used when 0 (= no cap) is selected
  "vac.embed.unlimited": "unlimited",
  // Control panel UI labels
  "vac.panel.title": "Voice Channel Control Panel",
  // Panel intro sentence shown in embed body
  "vac.panel.description": "You can change VC settings from this panel.",
  // Button labels correspond to VAC panel interaction handlers
  "vac.panel.rename_button": "Change VC Name",
  "vac.panel.limit_button": "Change User Limit",
  "vac.panel.afk_button": "Move Members to AFK",
  "vac.panel.refresh_button": "Move Panel to Bottom",
} as const;

export type CommandsTranslations = typeof commands;

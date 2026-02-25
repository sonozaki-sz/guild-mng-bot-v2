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
  "afk-config.set-channel.description": "Configure AFK channel",
  "afk-config.set-channel.channel.description": "AFK channel (voice channel)",
  "afk-config.view.description": "Show current settings",
  "afk-config.embed.title": "AFK",
  "afk-config.embed.success_title": "Settings Updated",
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
  "vac-config.embed.success_title": "Settings Updated",
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
  "vac.embed.members_moved": "Moved to {{channel}}.",
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
  "vac.panel.limit_input_placeholder": "0–99 (0: unlimited)",
  "vac.panel.afk_button": "Move Members to AFK",
  "vac.panel.refresh_button": "Move Panel to Bottom",

  // Sticky Message command
  "sticky-message.description":
    "Manage sticky messages (pinned to channel bottom) — requires Manage Channels",
  // set subcommand
  "sticky-message.set.description": "Set a sticky message (modal input)",
  "sticky-message.set.channel.description":
    "Text channel to set the sticky message in (defaults to this channel)",
  "sticky-message.set.embed.description":
    "Set as embed format (true: embed modal / false: plain text modal)",
  // set plain text modal
  "sticky-message.set.modal.title": "Enter sticky message content",
  "sticky-message.set.modal.message.label": "Message content",
  "sticky-message.set.modal.message.placeholder":
    "Supports multiple lines (max 2000 characters)",
  // set embed modal
  "sticky-message.set.embed-modal.title": "Set embed sticky message",
  "sticky-message.set.embed-modal.embed-title.label": "Title",
  "sticky-message.set.embed-modal.embed-title.placeholder":
    "Embed title (optional)",
  "sticky-message.set.embed-modal.embed-description.label": "Description",
  "sticky-message.set.embed-modal.embed-description.placeholder":
    "Embed body text (leave blank for none)",
  "sticky-message.set.embed-modal.embed-color.label": "Color code",
  "sticky-message.set.embed-modal.embed-color.placeholder":
    "#5865F2 or 0x5865F2 (leave blank for default)",
  "sticky-message.set.success.title": "Done",
  "sticky-message.set.success.description": "Sticky message has been set.",
  "sticky-message.set.alreadyExists.title": "Warning",
  "sticky-message.set.alreadyExists.description":
    "A sticky message is already configured for this channel. Remove it first before setting a new one.",
  // remove subcommand
  "sticky-message.remove.description": "Remove a sticky message",
  "sticky-message.remove.channel.description":
    "Text channel to remove the sticky message from",
  "sticky-message.remove.success.title": "Removed",
  "sticky-message.remove.success.description":
    "Sticky message has been removed.",
  "sticky-message.remove.notFound.title": "Not Found",
  "sticky-message.remove.notFound.description":
    "No sticky message is configured for this channel.",

  // errors
  "sticky-message.errors.permissionDenied":
    "You do not have permission to do this. Manage Channels permission is required.",
  "sticky-message.errors.emptyMessage": "Please enter a message.",
  "sticky-message.errors.text_channel_only":
    "Sticky messages can only be set in text channels.",
  "sticky-message.errors.failed":
    "An error occurred while managing the sticky message.",
  // view subcommand
  "sticky-message.view.description":
    "View sticky message settings (channel select UI)",
  "sticky-message.view.title": "Sticky Message Settings",
  "sticky-message.view.select.placeholder": "Select a channel",
  "sticky-message.view.notFound.title": "Not Configured",
  "sticky-message.view.empty":
    "No sticky messages are configured for any channel.",
  "sticky-message.view.field.channel": "Channel",
  "sticky-message.view.field.format": "Format",
  "sticky-message.view.field.format_plain": "Plain text",
  "sticky-message.view.field.format_embed": "Embed",
  "sticky-message.view.field.updated_at": "Last updated",
  "sticky-message.view.field.updated_by": "Set by",
  "sticky-message.view.field.content": "Message content",
  "sticky-message.view.field.embed_title": "Embed title",
  "sticky-message.view.field.embed_color": "Embed color",
  // update subcommand
  "sticky-message.update.description":
    "Update the content of an existing sticky message (modal input)",
  "sticky-message.update.channel.description":
    "Channel whose sticky message to update (defaults to this channel)",
  "sticky-message.update.embed.description":
    "Update as embed format (true: embed modal / false: plain text modal)",
  // update plain text modal
  "sticky-message.update.modal.title": "Update sticky message",
  "sticky-message.update.modal.message.label": "Message content",
  "sticky-message.update.modal.message.placeholder":
    "Supports multiple lines (max 2000 characters)",
  // update embed modal
  "sticky-message.update.embed-modal.title": "Update embed sticky message",
  "sticky-message.update.success.title": "Updated",
  "sticky-message.update.success.description":
    "Sticky message has been updated.",
  "sticky-message.update.notFound.title": "Not Configured",
} as const;

export type CommandsTranslations = typeof commands;

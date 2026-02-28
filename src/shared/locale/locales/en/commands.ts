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

  // Message Delete command
  "message-delete.description":
    "Bulk delete messages (default: all channels in server)",
  "message-delete.count.description":
    "Number of messages to delete (all if omitted)",
  "message-delete.user.description":
    "Target user ID or mention (for bots/webhooks, paste the user ID directly)",
  "message-delete.errors.user_invalid_format":
    "Invalid `user` format. Enter a user ID or mention (e.g. `<@123456789>`).",
  "message-delete.bot.description":
    "Delete bot/webhook messages only (set to true)",
  "message-delete.keyword.description":
    "Delete messages containing this keyword (case-insensitive partial match)",
  "message-delete.days.description":
    "Delete only messages from the past N days (cannot combine with after/before)",
  "message-delete.after.description":
    "Delete only messages after this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
  "message-delete.before.description":
    "Delete only messages before this date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
  "message-delete.channel.description":
    "Restrict deletion to a specific channel (default: entire server)",

  // message-delete-config command
  "message-delete-config.description":
    "Configure /message-delete behavior settings",
  "message-delete-config.confirm.description":
    "Show confirmation dialog before deleting (true: enabled / false: skip)",
  // message-delete-config result
  "message-delete-config.result.confirm_on": "Confirmation dialog: Enabled",
  "message-delete-config.result.confirm_off": "Confirmation dialog: Disabled",
  "message-delete-config.result.updated":
    "✅ Settings updated. Changes will apply from the next `/message-delete`.\n{{status}}",

  // message-delete validation errors
  "message-delete.errors.no_filter":
    "No filter condition specified. Please provide at least one of: `count`, `user`, `bot`, `keyword`, `days`, `after`, `before`.",
  "message-delete.errors.no_channel_no_count":
    "When targeting the entire server, `count` (number of messages) is required.\nTo target a specific channel, please specify `channel`.",
  "message-delete.confirm.condition_bot": "  Bot/Webhook: targeted",
  "message-delete.errors.days_and_date_conflict":
    "`days` cannot be combined with `after`/`before`. Use one or the other.",
  "message-delete.errors.after_invalid_format":
    "Invalid `after` date format. Use `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`.",
  "message-delete.errors.before_invalid_format":
    "Invalid `before` date format. Use `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`.",
  "message-delete.errors.date_range_invalid":
    "`after` must be earlier than `before`.",
  "message-delete.errors.no_permission":
    "You do not have permission to perform this action.\nRequired permission: Manage Messages",
  "message-delete.errors.text_channel_only": "Please specify a text channel.",
  "message-delete.errors.no_messages_found":
    "No deletable messages were found.",
  "message-delete.errors.delete_failed":
    "An error occurred while deleting messages.",
  "message-delete.errors.not_authorized": "You are not authorized to do this.",
  "message-delete.errors.days_invalid_value":
    "Please enter a positive integer for the number of days.",
  // confirmation dialog
  "message-delete.confirm.channel_all": "Entire server",
  "message-delete.confirm.target_channel": "Target channel: {{channel}}",
  "message-delete.confirm.conditions": "Delete conditions:",
  "message-delete.confirm.condition_user": "  User     : <@{{userId}}>",
  "message-delete.confirm.condition_keyword": '  Keyword  : "{{keyword}}"',
  "message-delete.confirm.condition_days": "  Period   : Past {{days}} days",
  "message-delete.confirm.condition_after": "  after    : {{after}}",
  "message-delete.confirm.condition_before": "  before   : {{before}}",
  "message-delete.confirm.condition_count": "  Limit    : {{count}} messages",
  "message-delete.confirm.question":
    "⚠️ **This action cannot be undone**\n\n{{conditions}}\n\nProceed?",
  "message-delete.confirm.btn_yes": "Delete",
  "message-delete.confirm.btn_no": "Cancel",
  "message-delete.confirm.btn_skip_toggle_off": "Skip confirmation next time",
  "message-delete.confirm.btn_skip_toggle_on": "Skip confirmation next time",
  "message-delete.confirm.cancelled": "Deletion cancelled.",
  "message-delete.confirm.timed_out":
    "⌛ Timed out. Please run the command again.",
  // result display
  "message-delete.result.empty_content": "*(no content)*",
  // summary embed
  "message-delete.embed.summary_title": "✅ Deletion Complete",
  "message-delete.embed.total_deleted": "Total Deleted",
  "message-delete.embed.channel_breakdown": "By Channel",
  "message-delete.embed.channel_breakdown_item": "#{{channel}}: {{count}}",
  "message-delete.embed.breakdown_empty": "—",
  // detail embed
  "message-delete.embed.detail_title":
    "📋 Deleted Messages  ({{page}} / {{total}})",
  "message-delete.embed.filter_active": " (filter active)",
  "message-delete.embed.no_messages": "No messages to display.",
  // pagination
  "message-delete.pagination.btn_prev": "Prev",
  "message-delete.pagination.btn_next": "Next",
  "message-delete.pagination.btn_days_set": "Past {{days}} days",
  "message-delete.pagination.btn_days_empty": "Enter past N days",
  "message-delete.pagination.btn_after_set": "after: {{date}}",
  "message-delete.pagination.btn_after_empty": "Enter after date",
  "message-delete.pagination.btn_before_set": "before: {{date}}",
  "message-delete.pagination.btn_before_empty": "Enter before date",
  "message-delete.pagination.btn_keyword": "Search by content",
  "message-delete.pagination.btn_reset": "Reset",
  "message-delete.pagination.author_select_placeholder": "Filter by author",
  "message-delete.pagination.author_all": "(All authors)",
  // modals
  "message-delete.modal.keyword.title": "Filter by Content",
  "message-delete.modal.keyword.label": "Keyword",
  "message-delete.modal.keyword.placeholder": "Enter keyword to filter",
  "message-delete.modal.days.title": "Filter by Past N Days",
  "message-delete.modal.days.label": "Number of days (positive integer)",
  "message-delete.modal.days.placeholder": "e.g. 7",
  "message-delete.modal.after.title": "Filter by After Date",
  "message-delete.modal.after.label": "Start date/time",
  "message-delete.modal.after.placeholder":
    "e.g. 2026-01-01 or 2026-01-01T00:00:00",
  "message-delete.modal.before.title": "Filter by Before Date",
  "message-delete.modal.before.label": "End date/time",
  "message-delete.modal.before.placeholder":
    "e.g. 2026-02-28 or 2026-02-28T23:59:59",

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
  "sticky-message.set.embed-modal.embed-color.label": "Color code (optional)",
  "sticky-message.set.embed-modal.embed-color.placeholder":
    "#008969 or 0x008969 (default: #008969)",
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

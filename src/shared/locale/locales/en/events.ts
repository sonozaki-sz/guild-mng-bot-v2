// src/shared/locale/locales/en/events.ts
// Event-related translations (English)

export const events = {
  // Bump reminder messages
  // Service-specific (Disboard / Dissoku) plus shared fallback message
  "bump-reminder.reminder_message.disboard": "⏰ `/bump` is ready!",
  "bump-reminder.reminder_message.dissoku": "⏰ `/up` is ready!",
  "bump-reminder.reminder_message": "⏰ **Ready to bump!**",

  // Bump reminder panel on bump detection
  // Panel header and scheduled-time text
  "bump-reminder.panel.title": "Bump Reminder",
  "bump-reminder.panel.scheduled_at":
    "Reminder will be sent <t:{{timestamp}}:R>.",
  // Panel button labels (mention on/off)
  "bump-reminder.panel.button_mention_on": "Get mentioned",
  "bump-reminder.panel.button_mention_off": "Don't mention me",
  // Panel action result messages
  "bump-reminder.panel.mention_added":
    "{{user}} has been added to bump reminder mentions.",
  "bump-reminder.panel.mention_removed":
    "{{user}} has been removed from bump reminder mentions.",
  "bump-reminder.panel.already_added":
    "You are already in the bump reminder mention list.",
  "bump-reminder.panel.not_in_list":
    "You are not in the bump reminder mention list.",
  "bump-reminder.panel.success_title": "Settings Updated",
  "bump-reminder.panel.error": "Failed to update mention settings",

  // Member log feature embeds
  // Join notification embed field labels and footer
  "member-log.join.title": "👋 A new member has joined!",
  "member-log.join.fields.username": "User",
  "member-log.join.fields.accountCreated": "Account Created",
  "member-log.join.fields.serverJoined": "Joined Server At",
  "member-log.join.fields.memberCount": "Member Count",
  "member-log.join.footer": "Welcome!",
  // Leave notification embed field labels and footer
  "member-log.leave.title": "👋 A member has left",
  "member-log.leave.fields.username": "User",
  "member-log.leave.fields.accountCreated": "Account Created",
  "member-log.leave.fields.serverJoined": "Joined Server At",
  "member-log.leave.fields.serverLeft": "Left Server At",
  "member-log.leave.fields.stayDuration": "Stay Duration",
  "member-log.leave.fields.memberCount": "Member Count",
  "member-log.leave.footer": "See you!",
  // Days unit label
  "member-log.days": "{{count}} days",
  "member-log.unknown": "Unknown",
  // Duration format
  "member-log.age.years": "{{count}}yr",
  "member-log.age.months": "{{count}}mo",
  "member-log.age.days": "{{count}}d",
  "member-log.age.separator": " ",
} as const;

export type EventsTranslations = typeof events;

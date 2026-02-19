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
} as const;

export type EventsTranslations = typeof events;

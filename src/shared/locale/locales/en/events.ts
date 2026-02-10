// src/shared/locale/locales/en/events.ts
// Event-related translations (English)

export const events = {
  // Bot startup
  "ready.bot_ready": "✅ Bot is ready! Logged in as {{tag}}",
  "ready.servers": "📊 Servers: {{count}}",
  "ready.users": "👥 Users: {{count}}",
  "ready.commands": "💬 Commands: {{count}}",
  "ready.status": "Running on {{count}} servers | by sonozaki-sz",
  "ready.event_registered": "Event registered: {{name}}",

  // Interactions
  "interaction.unknown_command": "Unknown command: {{commandName}}",
  "interaction.command_executed":
    "Command executed: {{commandName}} by {{userTag}}",
  "interaction.command_error": "Error executing command {{commandName}}:",
  "interaction.autocomplete_error":
    "Error in autocomplete for {{commandName}}:",
  "interaction.unknown_modal": "Unknown modal: {{customId}}",
  "interaction.modal_submitted": "Modal submitted: {{customId}} by {{userTag}}",
  "interaction.modal_error": "Error executing modal {{customId}}:",
} as const;

export type EventsTranslations = typeof events;

// src/shared/locale/locales/en/commands.ts
// Command-related translations (English)

export const commands = {
  // Example command
  "example.description": "Sample command",
  "example.success": "Command executed successfully!",

  // Common messages
  "cooldown.message": "You can use this command again in {{seconds}} seconds.",
  "permission.denied": "You don't have permission to execute this command.",
  "execution.failed": "Failed to execute the command.",
} as const;

export type CommandsTranslations = typeof commands;

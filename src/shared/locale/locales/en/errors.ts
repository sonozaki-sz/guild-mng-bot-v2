// src/shared/locale/locales/en/errors.ts
// Error message translations (English)

export const errors = {
  // Database errors
  "database.get_config_failed": "Failed to get config",
  "database.save_config_failed": "Failed to save config",
  "database.update_config_failed": "Failed to update config",
  "database.delete_config_failed": "Failed to delete config",
  "database.unknown_error": "unknown error",

  // Validation errors
  "validation.guild_only": "This command can only be used within a server",
  "validation.invalid_subcommand": "Invalid subcommand",

  // Permission errors
  "permission.administrator_required":
    "Administrator permission is required to execute this command.",

  // AFK errors
  "afk.not_configured":
    "AFK channel is not configured.\nPlease configure a channel with `/afk-config set-ch` (administrator only).",
  "afk.member_not_found": "User not found.",
  "afk.user_not_in_voice": "The specified user is not in a voice channel.",
  "afk.channel_not_found":
    "AFK channel not found.\nThe channel may have been deleted.",
  "afk.invalid_channel_type": "Please specify a voice channel.",

  // General errors
  "general.unexpected_production":
    "An unexpected error occurred. Please try again later.",
  "general.unexpected_with_message": "Error: {{message}}",
} as const;

export type ErrorsTranslations = typeof errors;

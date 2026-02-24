// src/shared/locale/locales/en/errors.ts
// Error message translations (English)

export const errors = {
  // Database errors
  // User-facing messages for repository/store failures
  "database.get_config_failed": "Failed to get config",
  "database.save_config_failed": "Failed to save config",
  "database.update_config_failed": "Failed to update config",
  "database.delete_config_failed": "Failed to delete config",
  "database.check_existence_failed": "Failed to check existence",
  "database.unknown_error": "unknown error",

  // Validation errors
  // Invalid command input or execution context
  "validation.error_title": "Validation Error",
  "validation.guild_only": "This command can only be used within a server",
  "validation.invalid_subcommand": "Invalid subcommand",

  // Permission errors
  // Missing runtime permissions for command execution
  "permission.manage_guild_required":
    "Manage Server (MANAGE_GUILD) permission is required to execute this command.",

  // Interaction errors
  // UI interaction timeout (buttons/select menus)
  "interaction.timeout": "Operation timed out.",

  // AFK errors
  "afk.not_configured":
    "AFK channel is not configured.\nPlease configure a channel with `/afk-config set-channel` (administrator only).",
  "afk.member_not_found": "User not found.",
  "afk.user_not_in_voice": "The specified user is not in a voice channel.",
  "afk.channel_not_found":
    "AFK channel not found.\nThe channel may have been deleted.",
  "afk.invalid_channel_type": "Please specify a voice channel.",

  // VAC errors
  "vac.not_configured": "Voice auto-create feature is not configured.",
  "vac.trigger_not_found":
    "There is no trigger channel in the specified category.",
  "vac.already_exists": "A trigger channel already exists.",
  "vac.category_full": "The category has reached the channel limit.",
  "vac.no_permission": "Missing permission to create or edit channels.",
  "vac.not_in_vc": "Only users currently in this VC can use this action.",
  "vac.not_in_any_vc": "This command can only be used while in a VC.",
  "vac.not_vac_channel": "This VC is not managed by auto-create feature.",
  "vac.limit_out_of_range": "User limit must be between 0 and 99.",
  "vac.afk_move_failed":
    "Failed to move to AFK channel. The target user(s) may have left the VC.",

  // General errors
  // Final fallback for unexpected exceptions
  "general.error_title": "An Error Occurred",
  "general.unexpected_production":
    "An unexpected error occurred. Please try again later.",
  "general.unexpected_with_message": "Error: {{message}}",
} as const;

export type ErrorsTranslations = typeof errors;

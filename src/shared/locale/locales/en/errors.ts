// src/shared/locale/locales/en/errors.ts
// Error message translations (English)

export const errors = {
  // General errors
  unexpected: "An unexpected error occurred.",
  not_found: "Not found.",
  invalid_input: "Invalid input.",
  permission_denied: "Permission denied.",

  // Database errors
  "database.connection_failed": "Failed to connect to the database.",
  "database.query_failed": "Database query failed.",

  // Discord API errors
  "discord.api_error": "An error occurred with the Discord API.",
  "discord.rate_limit": "API rate limit reached. Please try again later.",

  // Validation errors
  "validation.required": "This field is required.",
  "validation.invalid_format": "Invalid format.",
  "validation.out_of_range": "Value out of range.",
} as const;

export type ErrorsTranslations = typeof errors;

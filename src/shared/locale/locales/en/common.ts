// src/shared/locale/locales/en/common.ts
// Common translations (English)

export const common = {
  // State labels
  // Shared in embed titles and field values
  success: "Success",
  info: "Information",
  warning: "Warning",
  error: "Error",
  // Feature configuration state (ON/OFF)
  enabled: "Enabled",
  disabled: "Disabled",
  // Placeholder for unset / empty values
  none: "None",
} as const;

export type CommonTranslations = typeof common;

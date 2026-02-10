// src/shared/locale/locales/en/common.ts
// Common translations (English)

export const common = {
  // Basic
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Information",

  // Status
  enabled: "Enabled",
  disabled: "Disabled",
  loading: "Loading",
  processing: "Processing",

  // Actions
  cancel: "Cancel",
  confirm: "Confirm",
  delete: "Delete",
  edit: "Edit",
  save: "Save",

  // Others
  unknown: "Unknown",
  none: "None",
  all: "All",
} as const;

export type CommonTranslations = typeof common;

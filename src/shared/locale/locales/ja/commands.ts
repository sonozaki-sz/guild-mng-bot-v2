// src/shared/locale/locales/ja/commands.ts
// コマンド関連の翻訳リソース

export const commands = {
  // Ping コマンド
  "ping.description": "ボットの応答速度を確認。",
  "ping.measuring": "🏓 計測中...",
  "ping.result":
    "🏓 Pong!\n📡 API レイテンシー: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // 共通メッセージ
  "cooldown.wait": "⏱️ このコマンドは **{{seconds}}秒後** に使用できます。",

  // AFKコマンド
  "afk.description": "AFKチャンネルにユーザーを移動。",
  "afk.user.description": "移動するユーザー（省略で自分）",
  "afk.moved": "{{user}} を {{channel}} に移動しました",
  "afk.moved_log":
    "Guild {{guildId}} でユーザー {{userId}} を {{channelId}} に移動。",

  // AFK設定コマンド
  "afk-config.description": "AFK機能の設定（管理者専用）",
  "afk-config.set-ch.description": "AFKチャンネルを設定。",
  "afk-config.set-ch.channel.description": "AFKチャンネル（ボイスチャンネル）",
  "afk-config.show.description": "現在の設定を表示。",
  "afk.configured": "AFKチャンネルを {{channel}} に設定しました。",
  "afk.not_configured": "AFKチャンネルが設定されていません。",
  "afk.settings_title": "**AFK設定**",
  "afk.configured_log":
    "Guild {{guildId}} でAFKチャンネル設定, channel {{channelId}}",
} as const;

export type CommandsTranslations = typeof commands;

// src/shared/utils/discordWebhookTransport.ts
// Discord Webhook へエラーログを転送するカスタム Winston トランスポート

import TransportStream from "winston-transport";
import { name as PROJECT_NAME } from "../../../package.json";

// Discord Embed の description 文字数上限（Discord API の制限に準拠）
const DISCORD_EMBED_DESCRIPTION_MAX_LENGTH = 4096;

// Discord Embed カラーコード（エラー通知用）
const DISCORD_EMBED_COLOR = {
  ERROR: 0xe74c3c, // 赤
} as const;

/**
 * Winston から Discord Webhook へエラーログを送信するカスタムトランスポート
 * logger.error() 呼び出し時に Discord Webhook へ Embed 形式で通知する
 */
export class DiscordWebhookTransport extends TransportStream {
  private readonly webhookUrl: string;

  constructor(webhookUrl: string) {
    // error レベルのみ受信するよう level を固定する
    super({ level: "error" });
    this.webhookUrl = webhookUrl;
  }

  /**
   * ログイベントを受け取り Discord Webhook へ Embed 形式で送信する
   * 送信失敗はアプリの動作を阻害しないよう stderr へ記録するのみで上位へは伝播させない
   */
  log(info: Record<string, unknown>, callback: () => void): void {
    // 非同期で "logged" イベントを発行（Winston トランスポートの規約）
    setImmediate(() => this.emit("logged", info));

    const description = this.buildDescription(info);
    const payload = {
      embeds: [
        {
          title: `🚨 ${PROJECT_NAME} エラー通知`,
          description,
          color: DISCORD_EMBED_COLOR.ERROR,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Webhook 送信は非同期で実施し、失敗してもコールバックは即座に呼び出す
    fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err: unknown) => {
      // 送信失敗はアプリを止めず stderr のみに記録する
      process.stderr.write(
        `[DiscordWebhookTransport] Failed to send webhook: ${String(err)}\n`,
      );
    });

    callback();
  }

  /**
   * Discord Embed の description 文字列を組み立てる
   * message と stack を連結し、Discord の制限を超える場合は末尾をトリミングする
   */
  private buildDescription(info: Record<string, unknown>): string {
    const message =
      typeof info.message === "string"
        ? info.message
        : String(info.message ?? "");
    const stack = typeof info.stack === "string" ? info.stack : undefined;
    const stackStr = stack ? `\n\`\`\`\n${stack}\n\`\`\`` : "";
    const full = `**${message}**${stackStr}`;
    if (full.length <= DISCORD_EMBED_DESCRIPTION_MAX_LENGTH) {
      return full;
    }
    // 上限を超える場合は末尾を "..." に置き換えてトリミング
    return full.slice(0, DISCORD_EMBED_DESCRIPTION_MAX_LENGTH - 3) + "...";
  }
}

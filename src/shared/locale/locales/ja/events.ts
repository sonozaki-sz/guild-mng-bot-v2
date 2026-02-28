// src/shared/locale/locales/ja/events.ts
// イベント関連の翻訳リソース

export const events = {
  // Bumpリマインダー機能のリメインドメッセージ
  // サービス別（Disboard / Dissoku）と共通フォールバックを持つ
  "bump-reminder.reminder_message.disboard":
    "⏰ `/bump` が出来るようになったよ！",
  "bump-reminder.reminder_message.dissoku": "⏰ `/up` が出来るようになったよ！",
  "bump-reminder.reminder_message": "⏰ **Bump出来るようになったよ！**",

  // Bumpリマインダー機能のBump検知時パネル
  // パネル本体（タイトル/予定時刻表示）
  "bump-reminder.panel.title": "Bumpリマインダー機能",
  "bump-reminder.panel.scheduled_at":
    "<t:{{timestamp}}:R>にリマインドが通知されます。",
  // パネルボタンラベル（メンションON/OFF）
  "bump-reminder.panel.button_mention_on": "メンションする",
  "bump-reminder.panel.button_mention_off": "メンションしない",
  // パネル操作結果（追加/削除/状態通知）
  "bump-reminder.panel.mention_added":
    "{{user}} をBumpリマインダーのメンションリストに追加しました。",
  "bump-reminder.panel.mention_removed":
    "{{user}} をBumpリマインダーのメンションリストから削除しました。",
  "bump-reminder.panel.already_added":
    "既にBumpリマインダーのメンションリストに登録されています。",
  "bump-reminder.panel.not_in_list":
    "Bumpリマインダーのメンションリストに登録されていません。",
  "bump-reminder.panel.success_title": "設定完了",
  "bump-reminder.panel.error": "メンション設定の更新に失敗しました",

  // メンバーログ機能のEmbed
  // 参加通知Embedのフィールドラベル・フッター
  "member-log.join.title": "👋 新しいメンバーが参加しました！",
  "member-log.join.fields.username": "ユーザー",
  "member-log.join.fields.accountCreated": "アカウント作成日時",
  "member-log.join.fields.serverJoined": "サーバー参加日時",
  "member-log.join.fields.memberCount": "メンバー数",
  "member-log.join.footer": "ようこそ！",
  // 退出通知Embedのフィールドラベル・フッター
  "member-log.leave.title": "👋 メンバーが退出しました",
  "member-log.leave.fields.username": "ユーザー",
  "member-log.leave.fields.accountCreated": "アカウント作成日時",
  "member-log.leave.fields.serverJoined": "サーバー参加日時",
  "member-log.leave.fields.serverLeft": "サーバー退出日時",
  "member-log.leave.fields.stayDuration": "滞在期間",
  "member-log.leave.fields.memberCount": "メンバー数",
  "member-log.leave.footer": "またね！",
  // 日・単位ラベル
  "member-log.days": "{{count}}日",
  "member-log.unknown": "不明",
  // 経過期間フォーマット
  "member-log.age.years": "{{count}}年",
  "member-log.age.months": "{{count}}ヶ月",
  "member-log.age.days": "{{count}}日",
  "member-log.age.separator": "",
} as const;

export type EventsTranslations = typeof events;

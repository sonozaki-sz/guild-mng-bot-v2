// tests/unit/bot/events/index.test.ts
import { channelDeleteEvent } from "@/bot/events/channelDelete";
import { clientReadyEvent } from "@/bot/events/clientReady";
import { events } from "@/bot/events/events";
import { interactionCreateEvent } from "@/bot/events/interactionCreate";
import { messageCreateEvent } from "@/bot/events/messageCreate";
import { voiceStateUpdateEvent } from "@/bot/events/voiceStateUpdate";

// 各イベントモジュールをスタブ化し、index の束ね方に焦点を当てる
vi.mock("@/bot/events/channelDelete", () => ({
  channelDeleteEvent: { name: "channelDelete" },
}));
vi.mock("@/bot/events/clientReady", () => ({
  clientReadyEvent: { name: "clientReady" },
}));
vi.mock("@/bot/events/interactionCreate", () => ({
  interactionCreateEvent: { name: "interactionCreate" },
}));
vi.mock("@/bot/events/messageCreate", () => ({
  messageCreateEvent: { name: "messageCreate" },
}));
vi.mock("@/bot/events/voiceStateUpdate", () => ({
  voiceStateUpdateEvent: { name: "voiceStateUpdate" },
}));

describe("bot/events index", () => {
  // イベント配列に必要なイベントが順序どおり並ぶことを保証する
  it("exports all events in expected order", () => {
    expect(events).toEqual([
      channelDeleteEvent,
      interactionCreateEvent,
      clientReadyEvent,
      messageCreateEvent,
      voiceStateUpdateEvent,
    ]);
  });
});

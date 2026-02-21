import { Events } from "discord.js";
import { events } from "@/bot/events";
import { channelDeleteEvent } from "@/bot/events/channelDelete";
import { clientReadyEvent } from "@/bot/events/clientReady";
import { interactionCreateEvent } from "@/bot/events/interactionCreate";
import { messageCreateEvent } from "@/bot/events/messageCreate";
import { voiceStateUpdateEvent } from "@/bot/events/voiceStateUpdate";

// 各イベントモジュールをスタブ化し、index の束ね方に焦点を当てる
jest.mock("@/bot/events/channelDelete", () => ({
  channelDeleteEvent: { name: Events.ChannelDelete },
}));
jest.mock("@/bot/events/clientReady", () => ({
  clientReadyEvent: { name: Events.ClientReady },
}));
jest.mock("@/bot/events/interactionCreate", () => ({
  interactionCreateEvent: { name: Events.InteractionCreate },
}));
jest.mock("@/bot/events/messageCreate", () => ({
  messageCreateEvent: { name: Events.MessageCreate },
}));
jest.mock("@/bot/events/voiceStateUpdate", () => ({
  voiceStateUpdateEvent: { name: Events.VoiceStateUpdate },
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

import { Events } from "discord.js";
import { events } from "../../../../src/bot/events";
import { channelDeleteEvent } from "../../../../src/bot/events/channelDelete";
import { clientReadyEvent } from "../../../../src/bot/events/clientReady";
import { interactionCreateEvent } from "../../../../src/bot/events/interactionCreate";
import { messageCreateEvent } from "../../../../src/bot/events/messageCreate";
import { voiceStateUpdateEvent } from "../../../../src/bot/events/voiceStateUpdate";

// 各イベントモジュールをスタブ化し、index の束ね方に焦点を当てる
jest.mock("../../../../src/bot/events/channelDelete", () => ({
  channelDeleteEvent: { name: Events.ChannelDelete },
}));
jest.mock("../../../../src/bot/events/clientReady", () => ({
  clientReadyEvent: { name: Events.ClientReady },
}));
jest.mock("../../../../src/bot/events/interactionCreate", () => ({
  interactionCreateEvent: { name: Events.InteractionCreate },
}));
jest.mock("../../../../src/bot/events/messageCreate", () => ({
  messageCreateEvent: { name: Events.MessageCreate },
}));
jest.mock("../../../../src/bot/events/voiceStateUpdate", () => ({
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

// tests/unit/shared/features/bump-reminder/index.test.ts
describe("shared/features/bump-reminder modules", () => {
  it("exports bump reminder config service values from direct module", async () => {
    const serviceModule = await import(
      "@/shared/features/bump-reminder/bumpReminderConfigService"
    );

    expect(serviceModule.BUMP_REMINDER_MENTION_CLEAR_RESULT).toBeDefined();
    expect(serviceModule.BUMP_REMINDER_MENTION_ROLE_RESULT).toBeDefined();
    expect(serviceModule.BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT).toBeDefined();
    expect(serviceModule.BUMP_REMINDER_MENTION_USER_ADD_RESULT).toBeDefined();
    expect(serviceModule.BUMP_REMINDER_MENTION_USER_REMOVE_RESULT).toBeDefined();
    expect(serviceModule.BumpReminderConfigService).toEqual(expect.any(Function));
    expect(serviceModule.DEFAULT_BUMP_REMINDER_CONFIG).toBeDefined();
    expect(serviceModule.addBumpReminderMentionUser).toEqual(
      expect.any(Function),
    );
    expect(serviceModule.clearBumpReminderMentionUsers).toEqual(
      expect.any(Function),
    );
    expect(serviceModule.clearBumpReminderMentions).toEqual(
      expect.any(Function),
    );
    expect(serviceModule.createBumpReminderConfigService).toEqual(
      expect.any(Function),
    );
    expect(serviceModule.getBumpReminderConfig).toEqual(expect.any(Function));
    expect(serviceModule.getBumpReminderConfigOrDefault).toEqual(
      expect.any(Function),
    );
    expect(serviceModule.getBumpReminderConfigService).toEqual(
      expect.any(Function),
    );
    expect(serviceModule.removeBumpReminderMentionUser).toEqual(
      expect.any(Function),
    );
    expect(serviceModule.saveBumpReminderConfig).toEqual(expect.any(Function));
    expect(serviceModule.setBumpReminderEnabled).toEqual(expect.any(Function));
    expect(serviceModule.setBumpReminderMentionRole).toEqual(
      expect.any(Function),
    );
  });
});

// tests/unit/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver.test.ts
import type { Mock } from "vitest";

const createBumpReminderConfigServiceMock: Mock = vi.fn();
const getBumpReminderConfigServiceMock: Mock = vi.fn();

vi.mock("@/shared/features/bump-reminder/bumpReminderConfigService", () => ({
  createBumpReminderConfigService: (...args: unknown[]) =>
    createBumpReminderConfigServiceMock(...args),
  getBumpReminderConfigService: (...args: unknown[]) =>
    getBumpReminderConfigServiceMock(...args),
}));

describe("bot/features/bump-reminder/services/bumpReminderConfigServiceResolver", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates feature config service from injected repository", async () => {
    const service = { getBumpReminderConfig: vi.fn() };
    createBumpReminderConfigServiceMock.mockReturnValue(service);

    const { createBumpReminderFeatureConfigService } =
      await import("@/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver");

    const repository = { getBumpReminderConfigByGuildId: vi.fn() };
    const resolved = createBumpReminderFeatureConfigService(
      repository as never,
    );

    expect(resolved).toBe(service);
    expect(createBumpReminderConfigServiceMock).toHaveBeenCalledWith(
      repository,
    );
  });

  it("returns shared singleton when repository is omitted", async () => {
    const shared = { getBumpReminderConfig: vi.fn() };
    getBumpReminderConfigServiceMock.mockReturnValue(shared);

    const { getBumpReminderFeatureConfigService } =
      await import("@/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver");

    const resolved = getBumpReminderFeatureConfigService();

    expect(resolved).toBe(shared);
    expect(getBumpReminderConfigServiceMock).toHaveBeenCalledTimes(1);
  });

  it("caches service per repository instance", async () => {
    const serviceA = { id: "service-a" };
    const serviceB = { id: "service-b" };
    createBumpReminderConfigServiceMock
      .mockReturnValueOnce(serviceA)
      .mockReturnValueOnce(serviceB);

    const { getBumpReminderFeatureConfigService } =
      await import("@/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver");

    const repoA = { id: "repo-a" };
    const repoB = { id: "repo-b" };

    const a1 = getBumpReminderFeatureConfigService(repoA as never);
    const a2 = getBumpReminderFeatureConfigService(repoA as never);
    const b1 = getBumpReminderFeatureConfigService(repoB as never);

    expect(a1).toBe(serviceA);
    expect(a2).toBe(serviceA);
    expect(b1).toBe(serviceB);
    expect(createBumpReminderConfigServiceMock).toHaveBeenCalledTimes(2);
  });
});

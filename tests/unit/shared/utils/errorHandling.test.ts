import { DatabaseError } from "@/shared/errors/customErrors";
import {
  executeWithDatabaseError,
  executeWithLoggedError,
} from "@/shared/utils/errorHandling";
import { logger } from "@/shared/utils/logger";
import type { MockedFunction } from "vitest";

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("shared/utils/errorHandling", () => {
  const loggerErrorMock = logger.error as unknown as MockedFunction<
    typeof logger.error
  >;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executeWithDatabaseError returns operation result when successful", async () => {
    const operation = vi.fn().mockResolvedValue("ok");

    await expect(
      executeWithDatabaseError(operation, "db failed"),
    ).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("executeWithDatabaseError logs and throws DatabaseError on failure", async () => {
    const cause = new Error("boom");
    const operation = vi.fn().mockRejectedValue(cause);

    await expect(
      executeWithDatabaseError(operation, "query failed"),
    ).rejects.toBeInstanceOf(DatabaseError);
    await expect(
      executeWithDatabaseError(operation, "query failed"),
    ).rejects.toMatchObject({
      message: "query failed",
      name: "DatabaseError",
    });
    expect(loggerErrorMock).toHaveBeenCalledWith("query failed", cause);
  });

  it("executeWithLoggedError resolves when operation succeeds", async () => {
    const operation = vi.fn().mockResolvedValue(undefined);

    await expect(
      executeWithLoggedError(operation, "ignored"),
    ).resolves.toBeUndefined();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("executeWithLoggedError logs and swallows operation error", async () => {
    const cause = new Error("non-fatal");
    const operation = vi.fn().mockRejectedValue(cause);

    await expect(
      executeWithLoggedError(operation, "warn message"),
    ).resolves.toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith("warn message", cause);
  });
});

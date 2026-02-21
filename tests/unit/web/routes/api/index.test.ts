import { apiAuthPlugin } from "@/web/middleware/auth";
import { apiRoutes } from "@/web/routes/api";

jest.mock("@/web/middleware/auth", () => ({
  apiAuthPlugin: jest.fn(async () => undefined),
}));

describe("web/routes/api/index", () => {
  it("registers auth plugin and API root route", async () => {
    let registeredRootHandler: (() => Promise<unknown>) | undefined;
    const fastifyMock = {
      register: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(
        (_path: string, handler: () => Promise<unknown> | unknown) => {
          registeredRootHandler = async () => handler();
        },
      ),
    };

    await apiRoutes(fastifyMock as never, {});

    expect(fastifyMock.register).toHaveBeenCalledWith(apiAuthPlugin);
    expect(fastifyMock.get).toHaveBeenCalledWith("/", expect.any(Function));

    await expect(registeredRootHandler?.()).resolves.toEqual({
      message: "Guild Management Bot API",
      version: "2.0.0",
    });
  });
});

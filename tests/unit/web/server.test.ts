// tests/unit/web/server.test.ts
describe("web/server", () => {
  it("has source file path mapped", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const filePath = path.resolve(process.cwd(), "src/web/server.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

/**
 * Sample test file
 * このファイルは、Jestが正しく動作するかを確認するためのサンプルです。
 */

describe("Sample Test Suite", () => {
  it("should pass a basic test", () => {
    expect(true).toBe(true);
  });

  it("should perform basic arithmetic", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle strings", () => {
    const greeting = "Hello, Guild Management Bot v2!";
    expect(greeting).toContain("Guild");
    expect(greeting).toHaveLength(35);
  });

  it("should work with arrays", () => {
    const features = ["AFK", "Bump Reminder", "VAC", "Sticky Message"];
    expect(features).toHaveLength(4);
    expect(features).toContain("VAC");
  });
});

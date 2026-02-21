describe("shared/scheduler/jobScheduler", () => {
  it("loads scheduler module", async () => {
    const module = await import("@/shared/scheduler/jobScheduler");
    expect(module.jobScheduler).toBeDefined();
  });
});

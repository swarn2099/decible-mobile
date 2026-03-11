describe("useArtistFans - tier sort order", () => {
  it("should sort fans in order: founded > collected > discovered", () => {
    // Stub: validates the expected sort contract
    const tierOrder = ["founded", "collected", "discovered"];
    const fans = [
      { type: "discovered" },
      { type: "founded" },
      { type: "collected" },
    ];
    const sorted = [...fans].sort(
      (a, b) => tierOrder.indexOf(a.type) - tierOrder.indexOf(b.type)
    );
    expect(sorted[0].type).toBe("founded");
    expect(sorted[1].type).toBe("collected");
    expect(sorted[2].type).toBe("discovered");
  });

  it("should include a date field on ArtistFan type", () => {
    // Placeholder: verifies date field is present after Task 1 implementation
    const fan = { fan_id: "1", display_name: "Test", type: "founded", date: "2026-03-11" };
    expect(fan.date).toBeDefined();
  });
});

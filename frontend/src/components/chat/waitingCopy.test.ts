// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BAND_COPY,
  selectBand,
  selectVariant,
  formatElapsed,
  type BandId,
} from "./waitingCopy";

describe("waitingCopy — BAND_COPY table", () => {
  it("holds exactly six bands A-F", () => {
    expect(Object.keys(BAND_COPY)).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("each band has exactly two variants", () => {
    for (const band of Object.keys(BAND_COPY) as BandId[]) {
      expect(BAND_COPY[band]).toHaveLength(2);
    }
  });

  it("contains the verbatim UI-SPEC strings", () => {
    expect(BAND_COPY.A).toEqual([
      "Reading your request.",
      "Working on your plan.",
    ]);
    expect(BAND_COPY.B).toEqual([
      "Gathering destination ideas.",
      "Looking at places that fit your trip.",
    ]);
    expect(BAND_COPY.C).toEqual([
      "Checking routes and places to stay.",
      "Weighing options for your itinerary.",
    ]);
    expect(BAND_COPY.D).toEqual([
      "This one is taking a while. Full itineraries often do.",
      "Still going. Longer trips need more research.",
    ]);
    expect(BAND_COPY.E).toEqual([
      "Still working on your plan.",
      "Detailed plans take time to put together.",
    ]);
    expect(BAND_COPY.F).toEqual([
      "This is taking longer than usual. Keep waiting, or stop and try again.",
      "Longer than a typical plan. Keep waiting, or stop and start again.",
    ]);
  });
});

describe("waitingCopy — selectBand boundaries", () => {
  it("maps elapsed ms to the correct band", () => {
    expect(selectBand(0)).toBe("A");
    expect(selectBand(59_999)).toBe("A");
    expect(selectBand(60_000)).toBe("B");
    expect(selectBand(179_999)).toBe("B");
    expect(selectBand(180_000)).toBe("C");
    expect(selectBand(299_999)).toBe("C");
    expect(selectBand(300_000)).toBe("D");
    expect(selectBand(539_999)).toBe("D");
    expect(selectBand(540_000)).toBe("E");
    expect(selectBand(899_999)).toBe("E");
    expect(selectBand(900_000)).toBe("F");
    expect(selectBand(6_000_000)).toBe("F");
  });
});

describe("waitingCopy — selectVariant", () => {
  it("uses floor(elapsed / 45000) % 2", () => {
    expect(selectVariant(0)).toBe(0);
    expect(selectVariant(44_999)).toBe(0);
    expect(selectVariant(45_000)).toBe(1);
    expect(selectVariant(89_999)).toBe(1);
    expect(selectVariant(90_000)).toBe(0);
    expect(selectVariant(135_000)).toBe(1);
  });
});

describe("waitingCopy — formatElapsed", () => {
  it("formats M:SS with minutes unpadded and seconds zero-padded", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(59_000)).toBe("0:59");
    expect(formatElapsed(60_000)).toBe("1:00");
    expect(formatElapsed(65_000)).toBe("1:05");
    expect(formatElapsed(900_000)).toBe("15:00");
    expect(formatElapsed(6_000_000)).toBe("100:00");
  });
});

import { describe, expect, test } from "vitest";
import { hoyISO } from "./fecha";

describe("hoyISO", () => {
  test("usa la fecha de Bogotá aunque en UTC ya haya cruzado a mañana", () => {
    // 2026-08-06T02:00:00Z = 2026-08-05 21:00 en Bogotá (UTC-5)
    const momento = new Date("2026-08-06T02:00:00.000Z");
    expect(hoyISO(momento)).toBe("2026-08-05");
  });

  test("coincide con la fecha UTC cuando aún no cruza medianoche en Bogotá", () => {
    // 2026-08-05T15:00:00Z = 2026-08-05 10:00 en Bogotá
    const momento = new Date("2026-08-05T15:00:00.000Z");
    expect(hoyISO(momento)).toBe("2026-08-05");
  });
});

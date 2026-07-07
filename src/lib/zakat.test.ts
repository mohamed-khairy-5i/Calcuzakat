import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PRICES,
  GOLD_NISAB_G,
  RATE,
  SILVER_NISAB_G,
  cashNisabUSD,
  fetchLivePrices,
  goldNisabUSD,
  silverNisabUSD,
  zakatCrops,
  zakatFitr,
  zakatGold,
  zakatMoney,
  zakatSilver,
  zakatTreasure,
} from "./zakat";

const P = DEFAULT_PRICES; // goldUSD 85, silverUSD 1.02

describe("nisab thresholds", () => {
  it("gold nisab = 85g * gold price", () => {
    expect(goldNisabUSD(P)).toBeCloseTo(85 * 85, 5);
  });
  it("silver nisab = 595g * silver price", () => {
    expect(silverNisabUSD(P)).toBeCloseTo(595 * 1.02, 5);
  });
  it("cash nisab uses the lower of the two (silver here)", () => {
    expect(cashNisabUSD(P)).toBeCloseTo(Math.min(85 * 85, 595 * 1.02), 5);
  });
});

describe("zakatMoney", () => {
  it("charges 2.5% above nisab", () => {
    // 100000 USD is well above nisab → 2500
    expect(zakatMoney(100000, "USD", P)).toBeCloseTo(100000 * RATE, 5);
  });
  it("returns 0 below nisab", () => {
    expect(zakatMoney(10, "USD", P)).toBe(0);
  });
  it("returns exactly at nisab boundary", () => {
    const nisab = cashNisabUSD(P);
    expect(zakatMoney(nisab, "USD", P)).toBeCloseTo(nisab * RATE, 5);
  });
});

describe("zakatGold", () => {
  it("100g @ 21k @ $200/g → pure 87.5g (≥85), zakat 2.5%", () => {
    const pure = 100 * (21 / 24); // 87.5g
    const value = pure * 200;
    expect(zakatGold(100, 21, 200, "USD")).toBeCloseTo(value * RATE, 5);
  });
  it("below gold nisab (pure < 85g) → 0", () => {
    // 90g @ 21k = 78.75g pure < 85
    expect(zakatGold(90, 21, 200, "USD")).toBe(0);
  });
});

describe("zakatSilver", () => {
  it("charges when pure weight ≥ 595g", () => {
    const pure = 700 * (100 / 100);
    expect(zakatSilver(700, 100, 1, "USD")).toBeCloseTo(pure * 1 * RATE, 5);
  });
  it("below silver nisab → 0", () => {
    expect(zakatSilver(500, 100, 1, "USD")).toBe(0);
  });
});

describe("zakatCrops", () => {
  it("rain-fed = 10% above nisab", () => {
    const r = zakatCrops(1000, 5, "rain", "USD");
    expect(r.rate).toBe(0.1);
    expect(r.usd).toBeCloseTo(1000 * 5 * 0.1, 5);
  });
  it("cost-irrigated = 5%", () => {
    const r = zakatCrops(1000, 5, "cost", "USD");
    expect(r.rate).toBe(0.05);
    expect(r.usd).toBeCloseTo(1000 * 5 * 0.05, 5);
  });
  it("mixed = 7.5%", () => {
    const r = zakatCrops(1000, 5, "mixed", "USD");
    expect(r.rate).toBe(0.075);
  });
  it("below crop nisab (653kg) → 0 usd", () => {
    expect(zakatCrops(500, 5, "rain", "USD").usd).toBe(0);
  });
});

describe("zakatTreasure", () => {
  it("takes the khums (20%)", () => {
    expect(zakatTreasure(10000, "USD")).toBeCloseTo(2000, 5);
  });
});

describe("zakatFitr", () => {
  it("multiplies persons by per-person amount", () => {
    expect(zakatFitr(4)).toBe(4 * 8);
  });
  it("never negative", () => {
    expect(zakatFitr(-3)).toBe(0);
  });
});

describe("fetchLivePrices", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("falls back to defaults when the network throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const p = await fetchLivePrices();
    expect(p.live).toBe(false);
    expect(p.goldUSD).toBe(DEFAULT_PRICES.goldUSD);
  });

  it("uses a valid live price and flags live:true", async () => {
    // 8000/31.1035 ≈ 257/g gold (in range), 800/31.1035 ≈ 25.7 silver (out of range → default)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ price: 8000 }),
      })
    );
    const p = await fetchLivePrices();
    expect(p.live).toBe(true);
    expect(p.goldUSD).toBeGreaterThan(20);
    expect(p.goldUSD).toBeLessThan(500);
  });

  it("rejects an absurd price and stays on defaults", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ price: -1 }),
      })
    );
    const p = await fetchLivePrices();
    // primary invalid → secondary also mocked to -1 → default
    expect(p.goldUSD).toBe(DEFAULT_PRICES.goldUSD);
  });
});

// Guard constants so refactors can't silently change doctrine.
describe("doctrine constants", () => {
  it("rate 2.5%, gold nisab 85g, silver nisab 595g", () => {
    expect(RATE).toBe(0.025);
    expect(GOLD_NISAB_G).toBe(85);
    expect(SILVER_NISAB_G).toBe(595);
  });
});

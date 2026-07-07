/**
 * CalcuZakat — pure calculation engine (framework-agnostic, typed).
 * All monetary math is done in USD internally, then displayed in the
 * selected currency. Nisab: 85g gold / 595g silver, rate 2.5%.
 */

export const RATE = 0.025;
export const GOLD_NISAB_G = 85;
export const SILVER_NISAB_G = 595;
export const CROP_NISAB_KG = 653;
export const FITR_PER_PERSON_USD = 8;

export interface Currency {
  rate: number; // units per 1 USD
  sym: string;
  name: string;
}

export const CURRENCIES: Record<string, Currency> = {
  SAR: { rate: 3.75, sym: "ر.س", name: "ريال سعودي" },
  EGP: { rate: 49.0, sym: "ج.م", name: "جنيه مصري" },
  AED: { rate: 3.67, sym: "د.إ", name: "درهم إماراتي" },
  KWD: { rate: 0.307, sym: "د.ك", name: "دينار كويتي" },
  QAR: { rate: 3.64, sym: "ر.ق", name: "ريال قطري" },
  USD: { rate: 1, sym: "$", name: "دولار أمريكي" },
  JOD: { rate: 0.709, sym: "د.أ", name: "دينار أردني" },
  BHD: { rate: 0.376, sym: "د.ب", name: "دينار بحريني" },
  OMR: { rate: 0.385, sym: "ر.ع", name: "ريال عماني" },
  MAD: { rate: 9.9, sym: "د.م", name: "درهم مغربي" },
};

export interface Prices {
  goldUSD: number; // per gram 24k
  silverUSD: number; // per gram
  live: boolean;
}

export const DEFAULT_PRICES: Prices = {
  goldUSD: 85.0,
  silverUSD: 1.02,
  live: false,
};

export function fmt(n: number): string {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function toLocal(usd: number, cur: string): number {
  return usd * (CURRENCIES[cur]?.rate ?? 1);
}
export function toUSD(local: number, cur: string): number {
  return local / (CURRENCIES[cur]?.rate ?? 1);
}
export function sym(cur: string): string {
  return CURRENCIES[cur]?.sym ?? cur;
}

export function goldNisabUSD(p: Prices): number {
  return GOLD_NISAB_G * p.goldUSD;
}
export function silverNisabUSD(p: Prices): number {
  return SILVER_NISAB_G * p.silverUSD;
}
/** Cash nisab uses the lower (silver) — safer for the poor, common fatwa. */
export function cashNisabUSD(p: Prices): number {
  return Math.min(goldNisabUSD(p), silverNisabUSD(p));
}

/* ---- Individual calculators. All return zakat in USD. ---- */

export function zakatMoney(
  localTotal: number,
  cur: string,
  p: Prices
): number {
  const usd = toUSD(localTotal, cur);
  return usd >= cashNisabUSD(p) ? usd * RATE : 0;
}

export function zakatGold(
  weightG: number,
  karat: number,
  pricePerGramLocal: number,
  cur: string
): number {
  const pure = weightG * (karat / 24);
  const valueLocal = pure * pricePerGramLocal;
  return pure >= GOLD_NISAB_G ? toUSD(valueLocal * RATE, cur) : 0;
}

export function zakatSilver(
  weightG: number,
  purityPct: number,
  pricePerGramLocal: number,
  cur: string
): number {
  const pure = weightG * (purityPct / 100);
  const valueLocal = pure * pricePerGramLocal;
  return pure >= SILVER_NISAB_G ? toUSD(valueLocal * RATE, cur) : 0;
}

export function zakatCrops(
  kg: number,
  pricePerKgLocal: number,
  irrigation: "rain" | "cost" | "mixed",
  cur: string
): { usd: number; rate: number } {
  const rate = irrigation === "rain" ? 0.1 : irrigation === "cost" ? 0.05 : 0.075;
  const valueLocal = kg * pricePerKgLocal;
  const usd = kg >= CROP_NISAB_KG ? toUSD(valueLocal * rate, cur) : 0;
  return { usd, rate };
}

export function zakatTreasure(valueLocal: number, cur: string): number {
  return toUSD(valueLocal * 0.2, cur); // الخُمس 20%
}

export function zakatFitr(persons: number): number {
  return Math.max(0, Math.round(persons)) * FITR_PER_PERSON_USD;
}

export type LivestockType = "sheep" | "cattle" | "camel";

export function zakatLivestock(type: LivestockType, count: number): string {
  const n = count;
  if (type === "sheep") {
    if (n < 40) return "لا زكاة (النصاب 40)";
    if (n <= 120) return "شاة واحدة";
    if (n <= 200) return "شاتان";
    if (n <= 399) return "3 شياه";
    return `${Math.floor(n / 100)} شياه`;
  }
  if (type === "cattle") {
    if (n < 30) return "لا زكاة (النصاب 30)";
    if (n < 40) return "تبيع/تبيعة (عمر سنة)";
    return "مسنة (عمرها سنتان)";
  }
  // camel
  if (n < 5) return "لا زكاة (النصاب 5)";
  if (n < 10) return "شاة واحدة";
  if (n < 25) return `${Math.floor(n / 5)} شياه`;
  if (n < 36) return "بنت مخاض";
  if (n < 46) return "بنت لبون";
  return "راجع جدول الإبل التفصيلي";
}

/** Troy ounce → gram conversion factor. */
const OZ_TO_G = 31.1035;

/**
 * Sanity ranges (USD per gram) to reject absurd API responses.
 * Gold ~ $50–$300/g, silver ~ $0.2–$5/g cover any realistic market swing.
 */
const GOLD_MIN = 20,
  GOLD_MAX = 500;
const SILVER_MIN = 0.1,
  SILVER_MAX = 20;

function inRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

/** fetch with an abort timeout so a hung endpoint can never freeze the UI. */
async function fetchJSON(url: string, ms = 5000): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Extract a per-gram USD price from either provider's JSON shape. */
function toPerGram(json: any): number | null {
  if (!json) return null;
  // gold-api.com → { price: <per troy ounce> }
  if (typeof json.price === "number") return json.price / OZ_TO_G;
  // metals.dev style → { metals: { gold: <per gram> } } (already per gram)
  return null;
}

/**
 * Live prices with timeout, value validation and a secondary provider.
 * Any failure degrades gracefully to DEFAULT_PRICES (live: false) — the
 * calculator always stays usable.
 */
export async function fetchLivePrices(): Promise<Prices> {
  const out: Prices = { ...DEFAULT_PRICES };

  // Primary provider (key-less).
  const [g, s] = await Promise.all([
    fetchJSON("https://api.gold-api.com/price/XAU"),
    fetchJSON("https://api.gold-api.com/price/XAG"),
  ]);

  const gold = toPerGram(g);
  const silver = toPerGram(s);

  if (inRange(gold, GOLD_MIN, GOLD_MAX)) {
    out.goldUSD = gold;
    out.live = true;
  }
  if (inRange(silver, SILVER_MIN, SILVER_MAX)) {
    out.silverUSD = silver;
  }

  // Secondary provider only if the primary gold price failed validation.
  if (!out.live) {
    const alt = await fetchJSON("https://api.metals.live/v1/spot/gold");
    // metals.live returns an array like [{ price: <per ounce> }]
    const price = Array.isArray(alt) ? alt[0]?.price : alt?.price;
    const altGold =
      typeof price === "number" ? price / OZ_TO_G : null;
    if (inRange(altGold, GOLD_MIN, GOLD_MAX)) {
      out.goldUSD = altGold;
      out.live = true;
    }
  }

  return out;
}

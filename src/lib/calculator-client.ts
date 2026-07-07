/**
 * Client-side controller for the Zakat calculator island.
 * Wires the DOM to the pure engine in zakat.ts. TypeScript, no deps.
 */
import {
  CURRENCIES,
  DEFAULT_PRICES,
  fetchLivePrices,
  fmt,
  toLocal,
  sym,
  goldNisabUSD,
  silverNisabUSD,
  zakatMoney,
  zakatGold,
  zakatSilver,
  zakatCrops,
  zakatTreasure,
  zakatFitr,
  zakatLivestock,
  type Prices,
  type LivestockType,
} from "./zakat";

declare global {
  interface Window {
    czTrack?: (name: string, params?: Record<string, unknown>) => void;
  }
}

const STORAGE_KEY = "cz-data";
const THEME = { currency: "SAR" };
let prices: Prices = { ...DEFAULT_PRICES };

const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;
const num = (id: string): number => {
  const el = $<HTMLInputElement>(id);
  return el ? parseFloat(el.value) || 0 : 0;
};
const selVal = (id: string): string => $<HTMLSelectElement>(id)?.value ?? "";

function setResult(type: string, usd: number): void {
  const hidden = $<HTMLInputElement>(`res-${type}`);
  if (hidden) hidden.dataset.usd = String(usd);
  const disp = $(`res-${type}-disp`);
  if (disp) disp.textContent = `${fmt(toLocal(usd, THEME.currency))} ${sym(THEME.currency)}`;
}

function recalc(): void {
  const cur = THEME.currency;

  setResult(
    "money",
    zakatMoney(num("cz-cash") + num("cz-savings") + num("cz-receivables") - num("cz-debts"), cur, prices)
  );
  setResult(
    "gold",
    zakatGold(num("cz-gold-weight"), num("cz-gold-purity") || 24, num("cz-gold-price"), cur)
  );
  setResult(
    "silver",
    zakatSilver(num("cz-silver-weight"), num("cz-silver-purity") || 92.5, num("cz-silver-price"), cur)
  );
  setResult("stocks", zakatMoney(num("cz-stocks-value") + num("cz-dividends"), cur, prices));
  setResult("property", zakatMoney(num("cz-prop-value") + num("cz-prop-rent"), cur, prices));
  setResult(
    "business",
    zakatMoney(
      num("cz-biz-inventory") + num("cz-biz-cash") + num("cz-biz-receivables") - num("cz-biz-payables"),
      cur,
      prices
    )
  );
  const crop = zakatCrops(
    num("cz-crop-kg"),
    num("cz-crop-price"),
    (selVal("cz-crop-irr") as "rain" | "cost" | "mixed") || "rain",
    cur
  );
  setResult("crops", crop.usd);
  setResult("treasure", zakatTreasure(num("cz-treasure-value"), cur));

  // Fitr — separate obligation, in-currency
  const fitrUsd = zakatFitr(num("cz-fitr-persons"));
  const fitrDisp = $(`res-fitr-disp`);
  if (fitrDisp) {
    const persons = Math.max(0, Math.round(num("cz-fitr-persons")));
    fitrDisp.textContent = `${fmt(toLocal(fitrUsd, cur))} ${sym(cur)}${persons ? ` (عن ${persons} فرد)` : ""}`;
  }

  // Livestock — in-kind text
  const liveDisp = $(`res-livestock-disp`);
  if (liveDisp) {
    liveDisp.textContent = zakatLivestock(
      (selVal("cz-live-type") as LivestockType) || "sheep",
      num("cz-live-count")
    );
  }

  // Grand total (monetary types only)
  const monetary = ["money", "gold", "silver", "stocks", "property", "business", "crops", "treasure"];
  let sumUsd = 0;
  monetary.forEach((t) => {
    const el = $<HTMLInputElement>(`res-${t}`);
    if (el) sumUsd += parseFloat(el.dataset.usd || "0") || 0;
  });
  const gt = $("grand-total");
  if (gt) gt.textContent = `${fmt(toLocal(sumUsd, cur))} ${sym(cur)}`;

  save();
}

function updateNisabCards(): void {
  const cur = THEME.currency;
  const set = (id: string, usd: number) => {
    const el = $(id);
    if (el) el.textContent = `${fmt(toLocal(usd, cur))} ${sym(cur)}`;
  };
  set("nisab-gold-val", goldNisabUSD(prices));
  set("nisab-silver-val", silverNisabUSD(prices));
  set("nisab-goldprice-val", prices.goldUSD);
  set("nisab-silverprice-val", prices.silverUSD);

  const badge = $("price-status");
  if (badge) {
    badge.textContent = prices.live ? "أسعار حيّة محدّثة" : "أسعار تقديرية";
    badge.className = prices.live
      ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }
  const upd = $("last-update");
  if (upd)
    upd.textContent = new Date().toLocaleDateString("ar-EG-u-nu-latn", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
}

function setDefaultPrices(): void {
  const cur = THEME.currency;
  const gp = $<HTMLInputElement>("cz-gold-price");
  const sp = $<HTMLInputElement>("cz-silver-price");
  if (gp && !gp.dataset.touched) gp.value = toLocal(prices.goldUSD, cur).toFixed(2);
  if (sp && !sp.dataset.touched) sp.value = toLocal(prices.silverUSD, cur).toFixed(2);
}

function selectCurrency(code: string): void {
  if (!CURRENCIES[code]) return;
  THEME.currency = code;
  document.querySelectorAll<HTMLElement>("[data-cur]").forEach((b) =>
    b.classList.toggle("active", b.dataset.cur === code)
  );
  setDefaultPrices();
  updateNisabCards();
  recalc();
  window.czTrack?.("select_currency", { currency: code });
}

function showTab(id: string): void {
  document.querySelectorAll<HTMLElement>(".cz-panel").forEach((p) =>
    p.classList.toggle("hidden", p.id !== `panel-${id}`)
  );
  document.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) => {
    const active = b.dataset.tab === id;
    b.classList.toggle("bg-brand-600", active);
    b.classList.toggle("text-white", active);
    b.classList.toggle("shadow-glow", active);
    b.classList.toggle("text-slate-600", !active);
  });
  window.czTrack?.("view_zakat_type", { type: id });
}

function save(): void {
  try {
    const data: Record<string, string> = { currency: THEME.currency };
    document
      .querySelectorAll<HTMLInputElement | HTMLSelectElement>("#calculator input[data-calc], #calculator select[data-calc]")
      .forEach((el) => {
        if (el.id) data[el.id] = el.value;
      });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function load(): void {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (data.currency && CURRENCIES[data.currency]) THEME.currency = data.currency;
    Object.keys(data).forEach((k) => {
      if (k === "currency") return;
      const el = $<HTMLInputElement>(k);
      if (el) {
        el.value = data[k];
        if (["cz-gold-price", "cz-silver-price"].includes(k) && data[k]) el.dataset.touched = "1";
      }
    });
  } catch {}
}

function printReport(): void {
  const rows: [string, string][] = [
    ["زكاة المال", "res-money-disp"],
    ["زكاة الذهب", "res-gold-disp"],
    ["زكاة الفضة", "res-silver-disp"],
    ["زكاة الأسهم", "res-stocks-disp"],
    ["زكاة العقارات", "res-property-disp"],
    ["زكاة عروض التجارة", "res-business-disp"],
    ["الزروع والثمار", "res-crops-disp"],
    ["زكاة الركاز", "res-treasure-disp"],
  ];
  const body = rows
    .map(([label, id]) => `<tr><td>${label}</td><td>${$(id)?.textContent || "0.00"}</td></tr>`)
    .join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <title>تقرير الزكاة — CalcuZakat</title>
  <style>body{font-family:'Tajawal',Arial,sans-serif;padding:32px;color:#0c4826}
  h1{color:#027a48;text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{border:1px solid #cbd5e1;padding:12px;text-align:right}th{background:#e9f6ee}
  .total{font-weight:bold;background:#027a48;color:#fff}.f{margin-top:24px;text-align:center;color:#64748b;font-size:13px}</style></head>
  <body><h1>تقرير حساب الزكاة</h1>
  <p>التاريخ: ${new Date().toLocaleString("ar-EG-u-nu-latn")}</p>
  <table><tr><th>البند</th><th>مبلغ الزكاة</th></tr>${body}
  <tr class="total"><td>الإجمالي المستحق</td><td>${$("grand-total")?.textContent || "0.00"}</td></tr></table>
  <p class="f">تم إنشاء هذا التقرير بواسطة CalcuZakat — calcuzakat.netlify.app</p></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
  window.czTrack?.("print_report");
}

function reset(): void {
  document.querySelectorAll<HTMLInputElement>("#calculator input[type=number]").forEach((i) => {
    i.value = "";
    delete i.dataset.touched;
  });
  localStorage.removeItem(STORAGE_KEY);
  setDefaultPrices();
  recalc();
}

export function init(): void {
  if (!$("calculator")) return;
  load();

  // Currency chips
  document.querySelectorAll<HTMLElement>("[data-cur]").forEach((b) =>
    b.addEventListener("click", () => selectCurrency(b.dataset.cur!))
  );
  document.querySelectorAll<HTMLElement>("[data-cur]").forEach((b) =>
    b.classList.toggle("active", b.dataset.cur === THEME.currency)
  );

  // Tabs
  document.querySelectorAll<HTMLElement>("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => showTab(b.dataset.tab!))
  );

  // Inputs
  document
    .querySelectorAll<HTMLInputElement | HTMLSelectElement>("#calculator [data-calc]")
    .forEach((el) => {
      const ev = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(ev, () => {
        if (["cz-gold-price", "cz-silver-price"].includes(el.id)) el.dataset.touched = "1";
        recalc();
      });
    });

  $("cz-print")?.addEventListener("click", printReport);
  $("cz-reset")?.addEventListener("click", reset);

  setDefaultPrices();
  updateNisabCards();
  recalc();

  // Live prices (async, non-blocking)
  fetchLivePrices().then((p) => {
    prices = p;
    setDefaultPrices();
    updateNisabCards();
    recalc();
  });
}

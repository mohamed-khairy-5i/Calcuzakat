/**
 * Client-side controller for the Zakat calculator island.
 * Wires the DOM to the pure engine in zakat.ts. TypeScript, no deps.
 */
import {
  CURRENCIES,
  DEFAULT_PRICES,
  fetchLivePrices,
  fetchRates,
  PEGGED,
  fmt,
  toLocal,
  toUSD,
  GOLD_NISAB_G,
  SILVER_NISAB_G,
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
let prices: Prices = { ...DEFAULT_PRICES, live: false, silverLive: false };

let fxLive = false;
let fxAsOf: number | undefined;

/** Exchange rate for the chosen currency is real: live daily rate, or an official peg. */
function fxTrusted(cur: string = THEME.currency): boolean {
  return fxLive || PEGGED.has(cur);
}

/** A feed price is trusted only when gold and silver both came from a live feed AND the
 *  conversion to the chosen currency is real. */
function feedTrusted(): boolean {
  return prices.live && prices.silverLive === true && fxTrusted();
}

/**
 * Prices the nisab may be based on: the live feed, or prices the visitor typed
 * for today. Never the built-in default. null = no trustworthy price yet.
 */
function usablePrices(): Prices | null {
  if (feedTrusted()) return prices;
  const g = num("cz-manual-gold");
  const s = num("cz-manual-silver");
  if (g > 0 && s > 0) {
    return { goldUSD: toUSD(g, THEME.currency), silverUSD: toUSD(s, THEME.currency), live: false };
  }
  return null;
}
const NEED_PRICE = "أدخل سعر اليوم لتحديد الوجوب";

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

let incomplete = false;

function setNeedPrice(type: string): void {
  incomplete = true;
  const hidden = $<HTMLInputElement>(`res-${type}`);
  if (hidden) hidden.dataset.usd = "0";
  const disp = $(`res-${type}-disp`);
  if (disp) disp.textContent = NEED_PRICE;
}

function recalc(): void {
  const cur = THEME.currency;
  incomplete = false;
  const up = usablePrices();
  const money = (type: string, total: number) =>
    up ? setResult(type, zakatMoney(total, cur, up)) : setNeedPrice(type);

  money("money", num("cz-cash") + num("cz-savings") + num("cz-receivables") - num("cz-debts"));
  if (num("cz-gold-price") > 0 || num("cz-gold-weight") * ((num("cz-gold-purity") || 24) / 24) < GOLD_NISAB_G) {
    setResult(
      "gold",
      zakatGold(num("cz-gold-weight"), num("cz-gold-purity") || 24, num("cz-gold-price"), cur)
    );
  } else setNeedPrice("gold");
  if (num("cz-silver-price") > 0 || num("cz-silver-weight") * ((num("cz-silver-purity") || 92.5) / 100) < SILVER_NISAB_G) {
    setResult(
      "silver",
      zakatSilver(num("cz-silver-weight"), num("cz-silver-purity") || 92.5, num("cz-silver-price"), cur)
    );
  } else setNeedPrice("silver");
  money("stocks", num("cz-stocks-value") + num("cz-dividends"));
  money("property", num("cz-prop-value") + num("cz-prop-rent"));
  money(
    "business",
    num("cz-biz-inventory") + num("cz-biz-cash") + num("cz-biz-receivables") - num("cz-biz-payables")
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
    fitrDisp.textContent = fxTrusted()
      ? `${fmt(toLocal(fitrUsd, cur))} ${sym(cur)}${persons ? ` (عن ${persons} فرد)` : ""}`
      : `${persons ? persons * 8 : 8} دولارًا${persons ? ` (عن ${persons} فرد)` : " للفرد"}، سعر الصرف لهذه العملة غير متاح`;
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
  if (gt)
    gt.textContent = `${fmt(toLocal(sumUsd, cur))} ${sym(cur)}${incomplete ? " (جزئي، غير مكتمل)" : ""}`;
  let warn = $("total-warning");
  if (!warn && gt) {
    warn = document.createElement("div");
    warn.id = "total-warning";
    warn.setAttribute("role", "alert");
    warn.className =
      "mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-800";
    gt.insertAdjacentElement("afterend", warn);
  }
  if (warn) {
    warn.textContent = incomplete
      ? "هذا الإجمالي غير مكتمل: بنود لم تُحسب لأن سعر الذهب والفضة اليوم غير متوفر. أدخل سعر اليوم أعلى الصفحة ليكتمل الحساب."
      : "";
    warn.classList.toggle("hidden", !incomplete);
  }

  save();
}

function updateNisabCards(): void {
  const cur = THEME.currency;
  const text = (id: string, t: string) => {
    const el = $(id);
    if (el) el.textContent = t;
  };
  const set = (id: string, usd: number) => text(id, `${fmt(toLocal(usd, cur))} ${sym(cur)}`);
  const up = usablePrices();
  const trusted = feedTrusted();
  if (up) {
    set("nisab-gold-val", goldNisabUSD(up));
    set("nisab-silver-val", silverNisabUSD(up));
    set("nisab-goldprice-val", up.goldUSD);
    set("nisab-silverprice-val", up.silverUSD);
  } else {
    // No trustworthy price: show the nisab in grams only, never a built-in number.
    text("nisab-gold-val", `${GOLD_NISAB_G} جرام ذهب`);
    text("nisab-silver-val", `${SILVER_NISAB_G} جرام فضة`);
    text("nisab-goldprice-val", "—");
    text("nisab-silverprice-val", "—");
  }

  const badge = $("price-status");
  const fresh = trusted;
  if (badge) {
    badge.textContent = fresh
      ? "أسعار حيّة محدّثة"
      : up
        ? "أسعار أدخلتها أنت"
        : prices.live && prices.silverLive && !fxTrusted()
          ? "سعر الصرف لهذه العملة غير متاح، أدخل أسعار اليوم بالعملة المحلية"
          : "السعر الحي غير متاح، أدخل سعر اليوم";
    badge.className = fresh
      ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }
  const lbl = $("last-update-label");
  if (lbl)
    lbl.textContent =
      trusted && prices.asOfKind === "fetch"
        ? "وقت جلب السعر (المصدر لم يذكر وقت الاقتباس): "
        : "وقت اقتباس السعر: ";
  const fx = $("fx-status");
  if (fx) {
    fx.textContent = fxLive
      ? `سعر الصرف: يومي من open.er-api، تحديث ${fxAsOf ? new Date(fxAsOf).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" }) : ""}`
      : PEGGED.has(cur)
        ? "سعر الصرف: ربط رسمي ثابت (المصدر الحي غير متاح)"
        : "سعر الصرف: غير متاح لهذه العملة الآن";
  }
  const upd = $("last-update");
  if (upd) {
    upd.textContent =
      trusted && prices.asOf
        ? new Date(prices.asOf).toLocaleString("ar-EG-u-nu-latn", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "غير متاح";
  }
  const manual = $("manual-price");
  if (manual) {
    manual.classList.toggle("hidden", trusted);
    const hint = $("manual-price-cur");
    if (hint) hint.textContent = sym(cur);
  }
}

function setDefaultPrices(): void {
  const cur = THEME.currency;
  const gp = $<HTMLInputElement>("cz-gold-price");
  const sp = $<HTMLInputElement>("cz-silver-price");
  // Only a trusted feed price pre-fills; the built-in default never does.
  if (!feedTrusted()) return;
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

function shareResult(): void {
  const total = $("grand-total")?.textContent?.trim() || "0.00";
  const cur = sym(THEME.currency);
  const text = `حسبت زكاتي بدقة عبر CalcuZakat: ${total} ${cur} 🌙\nاحسب زكاتك مجانًا:`;
  const url = "https://calcuzakat.netlify.app";
  window.czTrack?.("share_result", { currency: THEME.currency });

  // Native share sheet on mobile if available.
  if (navigator.share) {
    navigator
      .share({ title: "CalcuZakat", text, url })
      .catch(() => {});
    return;
  }
  // Fallback: open WhatsApp share in a new tab.
  const wa = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
  window.open(wa, "_blank", "noopener");
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

  ["cz-manual-gold", "cz-manual-silver"].forEach((id) =>
    $<HTMLInputElement>(id)?.addEventListener("input", () => {
      const g = $<HTMLInputElement>("cz-gold-price");
      const sv = $<HTMLInputElement>("cz-silver-price");
      if (!feedTrusted()) {
        if (g && !g.dataset.touched && id === "cz-manual-gold") g.value = $<HTMLInputElement>(id)!.value;
        if (sv && !sv.dataset.touched && id === "cz-manual-silver") sv.value = $<HTMLInputElement>(id)!.value;
      }
      updateNisabCards();
      recalc();
    })
  );
  $("cz-print")?.addEventListener("click", printReport);
  $("cz-share")?.addEventListener("click", shareResult);
  $("cz-reset")?.addEventListener("click", reset);

  setDefaultPrices();
  updateNisabCards();
  recalc();

  // Open a specific tab when arriving from a zakat guide page.
  try {
    const wanted = sessionStorage.getItem("cz-open-tab");
    if (wanted) {
      sessionStorage.removeItem("cz-open-tab");
      showTab(wanted);
      setTimeout(
        () => $("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        120
      );
    }
  } catch {}

  // Live exchange rates (async, non-blocking)
  fetchRates().then((r) => {
    if (!r) return;
    Object.keys(r.rates).forEach((c) => {
      CURRENCIES[c].rate = r.rates[c];
    });
    fxLive = true;
    fxAsOf = r.asOf;
    setDefaultPrices();
    updateNisabCards();
    recalc();
  });

  // Live prices (async, non-blocking)
  fetchLivePrices().then((p) => {
    prices = p;
    setDefaultPrices();
    updateNisabCards();
    recalc();
  });
}

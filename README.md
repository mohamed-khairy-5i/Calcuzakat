# CalcuZakat — حاسبة الزكاة الشرعية

موقع احترافي (Arabic-first, RTL) لحساب الزكاة بجميع أنواعها وفقاً للمعايير الشرعية،
مع أسعار ذهب وفضة حيّة، تصميم فاخر متجاوب، ومدونة توعوية. مبنيّ بـ **Astro +
TypeScript + Tailwind CSS** — يولّد HTML ثابتًا مُفهرَسًا بالكامل (SSG) مع
جزيرة تفاعلية واحدة للحاسبة (Islands Architecture).

الموقع: <https://calcuzakat.com/>

---

## لماذا هذه المعمارية؟

- **مفهرس بالكامل:** كل المحتوى (الحاسبة، الأقسام، المقالات) يُصدَّر HTML ثابتًا
  أثناء البناء — لا شيء مخفيّ خلف JavaScript. أفضل لـ SEO وسرعة أول عرض.
- **JavaScript أدنى:** يُحمَّل كود الحاسبة فقط كـ island، والباقي صفر JS.
- **TypeScript صارم:** محرك حساب الزكاة (`src/lib/zakat.ts`) نقيّ ومُختبَر ومنفصل
  عن الواجهة.

---

## المزايا

- **10 أنواع للزكاة:** المال، الذهب، الفضة، الأسهم، العقارات، عروض التجارة،
  الأنعام، الزروع والثمار، الركاز، وزكاة الفطر.
- **10 عملات:** SAR, EGP, AED, KWD, QAR, USD, JOD, BHD, OMR, MAD.
- **أسعار حيّة:** الذهب (XAU) والفضة (XAG) عبر `api.gold-api.com` مع تراجع آمن.
- **تصميم فاخر:** نظام تصميم أخضر زمردي + ذهبي، وضع ليلي، أيقونات SVG حديثة، حركات ناعمة.
- **مدونة:** مقالات كـ Content Collections (Markdown) مع صور محسّنة.
- **PWA:** يعمل دون اتصال (Service Worker + manifest + أيقونات + صفحة offline).
- **SEO كامل:** canonical, OG/Twitter, JSON-LD (WebApplication/Organization/FAQ/Article/Breadcrumb),
  hreflang, sitemap.xml وrobots.txt مُولَّدة ديناميكيًا.
- **جاهز للربح والقياس:** أماكن إعلانية (AdSense) + GA4 مع Consent Mode v2 +
  تتبّع أحداث التحويل — تُفعَّل بمجرد إضافة المعرّفات.
- **خصوصية:** كل الحسابات تجري في متصفحك، لا تُحفظ أي بيانات على أي خادم.

---

## البنية

```
src/
├── components/     # Icon, Seo, Analytics, AdSlot, Header, Footer, Hero, Calculator, HomeSections
├── layouts/        # BaseLayout.astro
├── pages/          # index, about, privacy, 404, blog/[slug], sitemap.xml, robots.txt
├── content/blog/   # مقالات المدونة (Markdown + frontmatter)
├── lib/            # zakat.ts (المحرك), calculator-client.ts, icons.ts, site.ts
├── data/           # zakatTypes.ts, content.ts
└── styles/         # global.css (نظام التصميم)
public/             # assets, icons, manifest, sw.js, offline.html
```

---

## التطوير

```bash
npm install        # تثبيت التبعيات
npm run dev        # خادم تطوير (http://localhost:4321)
npm run build      # بناء الإنتاج إلى dist/
npm run preview    # معاينة نتيجة البناء
```

### تفعيل الإعلانات والتحليلات

عدّل `src/lib/site.ts`:

```ts
export const ANALYTICS = {
  ga4Id: "G-XXXXXXXXXX",             // معرّف GA4
  adsenseClient: "ca-pub-XXXXXXXXXX", // معرّف AdSense
  enableAds: true,                    // فعّلها بعد اعتماد AdSense
};
```

---

## النشر

يُنشر تلقائيًا عبر **Netlify** (راجع `netlify.toml`) — أمر البناء `npm run build`
ومجلد النشر `dist`. الفرع الرئيسي للإنتاج: `main`.

---

## الترخيص

مشروع مجاني بهدف خدمة المجتمع ونشر الوعي بالزكاة.

/**
 * Central site configuration — single source of truth for SEO,
 * branding, monetization and analytics identifiers.
 */
export const SITE = {
  name: "CalcuZakat",
  domain: "https://calcuzakat.netlify.app",
  titleAr: "حاسبة الزكاة الشرعية",
  tagline: "احسب زكاتك بدقة شرعية في دقائق",
  description:
    "حاسبة الزكاة الشرعية الأدق والأشمل مجاناً. احسب زكاة المال، الذهب، الفضة، الأسهم، العقارات، عروض التجارة، الأنعام، الزروع وزكاة الفطر بأسعار محدّثة ونصاب دقيق.",
  email: "info@calcuzakat.com",
  locale: "ar_AR",
  lang: "ar",
  themeColor: "#027a48",
  ogImage: "/assets/img/og-image.jpg",
  logo: "/assets/img/logo.webp",
  logoPng: "/assets/img/logo.png",
} as const;

/**
 * Monetization & analytics IDs.
 * Leave empty to disable — fill with real IDs to activate.
 *  - GA4:      "G-XXXXXXXXXX"
 *  - AdSense:  "ca-pub-XXXXXXXXXXXXXXXX"
 */
export const ANALYTICS = {
  ga4Id: "" as string, // ضع هنا معرّف Google Analytics 4 لاحقاً: "G-XXXXXXXXXX"
  adsenseClient: "ca-pub-7246907159112211" as string, // معرّف AdSense
  enableAds: true, // الإعلانات مُفعّلة
} as const;

export const NAV = [
  { href: "/#calculator", label: "الحاسبة" },
  { href: "/zakat", label: "أنواع الزكاة" },
  { href: "/#about", label: "عن الزكاة" },
  { href: "/blog", label: "المدونة" },
  { href: "/#faq", label: "الأسئلة" },
  { href: "/#contact", label: "تواصل" },
] as const;

export const SOCIAL_SHARE = {
  whatsapp:
    "https://wa.me/?text=احسب%20زكاتك%20بدقة%20مع%20CalcuZakat%20https://calcuzakat.netlify.app",
  twitter:
    "https://twitter.com/intent/tweet?text=احسب%20زكاتك%20بدقة%20مع%20CalcuZakat&url=https://calcuzakat.netlify.app",
  facebook:
    "https://www.facebook.com/sharer/sharer.php?u=https://calcuzakat.netlify.app",
  telegram:
    "https://t.me/share/url?url=https://calcuzakat.netlify.app&text=احسب%20زكاتك%20بدقة",
} as const;

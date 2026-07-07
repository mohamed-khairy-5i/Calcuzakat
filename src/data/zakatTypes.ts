import type { IconName } from "@lib/icons";

export interface ZakatTab {
  id: string;
  label: string;
  icon: IconName;
  short: string;
}

export const ZAKAT_TABS: ZakatTab[] = [
  { id: "money", label: "زكاة المال", icon: "wallet", short: "النقود والودائع والمستحقات" },
  { id: "gold", label: "زكاة الذهب", icon: "gem", short: "احسب زكاة الذهب حسب العيار" },
  { id: "silver", label: "زكاة الفضة", icon: "coins", short: "احسب زكاة الفضة والمصوغات" },
  { id: "stocks", label: "زكاة الأسهم", icon: "chart", short: "الأسهم والأرباح والاستثمار" },
  { id: "property", label: "زكاة العقارات", icon: "building", short: "العقارات المُعدّة للبيع والإيجار" },
  { id: "business", label: "عروض التجارة", icon: "briefcase", short: "البضائع ورأس مال التجارة" },
  { id: "livestock", label: "زكاة الأنعام", icon: "sheep", short: "الأغنام والبقر والإبل" },
  { id: "crops", label: "الزروع والثمار", icon: "wheat", short: "المحاصيل الزراعية" },
  { id: "treasure", label: "زكاة الركاز", icon: "diamond", short: "الكنوز والمعادن (الخُمس)" },
  { id: "fitr", label: "زكاة الفطر", icon: "gift", short: "عن كل فرد في رمضان" },
];

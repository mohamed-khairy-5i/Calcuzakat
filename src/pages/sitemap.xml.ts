import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@lib/site";
import { ZAKAT_GUIDES } from "@data/zakatGuides";

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  const today = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/zakat", priority: "0.9", changefreq: "monthly" },
    { loc: "/blog", priority: "0.8", changefreq: "weekly" },
    { loc: "/about", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  ];

  const guideUrls = ZAKAT_GUIDES.map((g) => ({
    loc: `/zakat/${g.slug}`,
    priority: "0.8",
    changefreq: "monthly",
  }));

  const blogUrls = posts.map((p) => ({
    loc: `/blog/${p.slug}`,
    priority: "0.7",
    changefreq: "monthly",
    lastmod: (p.data.updatedDate ?? p.data.pubDate).toISOString().split("T")[0],
  }));

  const all = [...staticUrls, ...guideUrls, ...blogUrls];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${SITE.domain}${u.loc}</loc>
    <lastmod>${(u as { lastmod?: string }).lastmod ?? today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

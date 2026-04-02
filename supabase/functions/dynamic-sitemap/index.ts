import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
};

const BASE_URL = "https://www.xavorian.xyz";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch all published properties
  const { data: properties } = await supabase
    .from("properties")
    .select("slug, updated_at, images")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Fetch all published blog posts
  const { data: blogs } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  // Static pages with priorities
  const staticPages = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/browse", changefreq: "daily", priority: "0.9" },
    { loc: "/agents", changefreq: "daily", priority: "0.9" },
    { loc: "/blog", changefreq: "weekly", priority: "0.9" },
    { loc: "/how-it-works", changefreq: "monthly", priority: "0.8" },
    { loc: "/about", changefreq: "monthly", priority: "0.7" },
    { loc: "/contact", changefreq: "monthly", priority: "0.6" },
    { loc: "/vision", changefreq: "monthly", priority: "0.6" },
    { loc: "/faq", changefreq: "monthly", priority: "0.6" },
    { loc: "/support", changefreq: "monthly", priority: "0.5" },
    { loc: "/login", changefreq: "monthly", priority: "0.5" },
    { loc: "/signup", changefreq: "monthly", priority: "0.5" },
    { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
    { loc: "/terms", changefreq: "yearly", priority: "0.3" },
    { loc: "/disclaimer", changefreq: "yearly", priority: "0.3" },
  ];

  // Location pages
  const locationPages = [
    "/location/benin-city",
    "/location/lagos",
    "/location/abuja",
    "/location/port-harcourt",
    "/location/benin-city/ugbowo",
    "/location/benin-city/gra",
    "/location/benin-city/ikpoba-hill",
    "/location/benin-city/sapele-road",
    "/location/benin-city/new-benin",
    "/location/benin-city/aduwawa",
    "/location/benin-city/uniben-area",
    "/location/benin-city/ekosodin",
    "/location/benin-city/oluku",
    "/location/benin-city/uselu",
    "/location/lagos/lekki",
    "/location/lagos/ikoyi",
    "/location/lagos/ibeju-lekki",
    "/location/lagos/yaba",
    "/location/lagos/victoria-island",
    "/location/abuja/maitama",
    "/location/abuja/wuse",
    "/location/abuja/garki",
  ];

  // Landing pages
  const landingPages = [
    "/land-for-sale-lagos",
    "/land-for-sale-benin-city",
    "/cheap-land-ibeju-lekki",
    "/duplex-for-sale-lekki",
    "/apartments-for-rent-benin-city",
    "/student-accommodation-benin-city",
    "/houses-for-rent-ugbowo",
    "/property-for-sale-edo-state",
  ];

  const today = new Date().toISOString().split("T")[0];

  let urls = "";

  // Static pages
  for (const p of staticPages) {
    urls += `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>\n`;
  }

  // Location pages
  for (const loc of locationPages) {
    urls += `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  }

  // Landing pages
  for (const lp of landingPages) {
    urls += `  <url>
    <loc>${BASE_URL}${lp}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  }

  // Property pages from DB
  if (properties) {
    for (const prop of properties) {
      if (!prop.slug) continue;
      const lastmod = prop.updated_at
        ? prop.updated_at.split("T")[0]
        : today;
      const hasImages = prop.images && prop.images.length > 0;
      urls += `  <url>
    <loc>${BASE_URL}/property/${prop.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${
        hasImages
          ? `\n    <image:image>\n      <image:loc>${prop.images[0]}</image:loc>\n    </image:image>`
          : ""
      }
  </url>\n`;
    }
  }

  // Blog posts from DB
  if (blogs) {
    for (const blog of blogs) {
      if (!blog.slug) continue;
      const lastmod = blog.updated_at
        ? blog.updated_at.split("T")[0]
        : today;
      urls += `  <url>
    <loc>${BASE_URL}/blog/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}</urlset>`;

  return new Response(sitemap, { headers: corsHeaders });
});

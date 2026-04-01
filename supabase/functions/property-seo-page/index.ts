import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "Access-Control-Allow-Origin": "*",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !property) {
    return new Response("Property not found", { status: 404 });
  }

  // Get seller profile
  const { data: seller } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, is_verified_badge")
    .eq("id", property.user_id)
    .single();

  const BASE_URL = "https://www.xavorian.xyz";
  const pageUrl = `${BASE_URL}/property/${property.slug}`;
  const mainImage = property.images?.[0] || `${BASE_URL}/favicon.ico`;
  const priceFormatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(property.price);

  const title = `${property.title} | Xavorian`;
  const description =
    property.description?.substring(0, 155) ||
    `${property.property_type} ${property.listing_type === "rent" ? "for rent" : "for sale"} in ${property.city || property.address}. ${priceFormatted}`;

  const amenitiesList = (property.amenities || [])
    .map((a: string) => `<li>${escapeHtml(a)}</li>`)
    .join("");

  const imageGallery = (property.images || [])
    .map(
      (img: string) =>
        `<div class="gallery-item"><img src="${escapeHtml(img)}" alt="${escapeHtml(property.title)}" loading="lazy" width="600" height="400"></div>`
    )
    .join("");

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: pageUrl,
    image: property.images || [],
    datePosted: property.created_at,
    dateModified: property.updated_at,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "NGN",
      availability:
        property.status === "published"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city || "",
      addressRegion: property.state || "Edo",
      addressCountry: "NG",
    },
    numberOfRooms: property.bedrooms || undefined,
    numberOfBathroomsTotal: property.bathrooms || undefined,
    floorSize: property.area
      ? { "@type": "QuantitativeValue", value: property.area, unitCode: "FTK" }
      : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Properties",
        item: `${BASE_URL}/browse`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: property.title,
        item: pageUrl,
      },
    ],
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${pageUrl}">
  <meta name="robots" content="index, follow">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${escapeHtml(mainImage)}">
  <meta property="og:site_name" content="Xavorian">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(mainImage)}">

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; background: #fafafa; line-height: 1.6; }
    a { color: #6c3ecf; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
    header { background: linear-gradient(135deg, #6c3ecf 0%, #4a1fa0 100%); color: #fff; padding: 16px 0; }
    header .logo { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
    header nav a { color: #e0d4f5; margin-left: 20px; font-size: 0.9rem; }
    header nav a:hover { color: #fff; text-decoration: none; }
    .breadcrumb { padding: 12px 0; font-size: 0.85rem; color: #666; }
    .breadcrumb a { color: #6c3ecf; }
    .breadcrumb span { margin: 0 6px; }
    .hero { position: relative; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    .gallery-item img { width: 100%; height: 250px; object-fit: cover; display: block; }
    .price-tag { font-size: 2rem; font-weight: 800; color: #6c3ecf; margin: 8px 0; }
    .badge { display: inline-block; background: #e8def8; color: #4a1fa0; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-right: 8px; }
    .badge.verified { background: #d4edda; color: #155724; }
    .details-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; margin-top: 24px; }
    @media (max-width: 768px) { .details-grid { grid-template-columns: 1fr; } }
    .info-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .info-card h2 { font-size: 1.25rem; margin-bottom: 12px; color: #1a1a2e; }
    .specs { display: flex; gap: 24px; flex-wrap: wrap; margin: 16px 0; }
    .spec-item { text-align: center; }
    .spec-item .value { font-size: 1.4rem; font-weight: 700; color: #6c3ecf; }
    .spec-item .label { font-size: 0.8rem; color: #888; }
    .amenities-list { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .amenities-list li { padding: 8px 12px; background: #f5f0ff; border-radius: 8px; font-size: 0.9rem; }
    .amenities-list li::before { content: '✓ '; color: #6c3ecf; font-weight: bold; }
    .cta-btn { display: inline-block; background: #6c3ecf; color: #fff; padding: 14px 32px; border-radius: 10px; font-size: 1rem; font-weight: 600; border: none; cursor: pointer; text-align: center; width: 100%; margin-top: 12px; }
    .cta-btn:hover { background: #5a2db8; text-decoration: none; }
    .seller-card { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .seller-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e8def8; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #4a1fa0; overflow: hidden; }
    .seller-avatar img { width: 100%; height: 100%; object-fit: cover; }
    footer { background: #1a1a2e; color: #aaa; padding: 32px 0; margin-top: 48px; text-align: center; font-size: 0.85rem; }
    footer a { color: #b39ddb; }
    .description-text { white-space: pre-line; color: #444; }
    h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.3; }
  </style>
</head>
<body>
  <header>
    <div class="container" style="display:flex;align-items:center;justify-content:space-between;">
      <a href="${BASE_URL}" class="logo" style="color:#fff;">Xavorian</a>
      <nav>
        <a href="${BASE_URL}/browse">Browse</a>
        <a href="${BASE_URL}/agents">Agents</a>
        <a href="${BASE_URL}/blog">Blog</a>
        <a href="${BASE_URL}/contact">Contact</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb">
      <a href="${BASE_URL}">Home</a><span>›</span>
      <a href="${BASE_URL}/browse">Properties</a><span>›</span>
      ${property.city ? `<a href="${BASE_URL}/location/${property.city.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(property.city)}</a><span>›</span>` : ""}
      <strong>${escapeHtml(property.title)}</strong>
    </div>

    <div class="hero">
      ${imageGallery ? `<div class="gallery">${imageGallery}</div>` : ""}
    </div>

    <div>
      <span class="badge">${escapeHtml(property.property_type)}</span>
      ${property.listing_type ? `<span class="badge">${escapeHtml(property.listing_type === "rent" ? "For Rent" : "For Sale")}</span>` : ""}
      ${property.is_verified ? '<span class="badge verified">✓ Verified</span>' : ""}
    </div>

    <h1>${escapeHtml(property.title)}</h1>
    <p style="color:#666;margin:4px 0;">📍 ${escapeHtml(property.address)}${property.city ? `, ${escapeHtml(property.city)}` : ""}${property.state ? `, ${escapeHtml(property.state)}` : ""}</p>
    <div class="price-tag">${priceFormatted}</div>

    <div class="specs">
      ${property.bedrooms ? `<div class="spec-item"><div class="value">${property.bedrooms}</div><div class="label">Bedrooms</div></div>` : ""}
      ${property.bathrooms ? `<div class="spec-item"><div class="value">${property.bathrooms}</div><div class="label">Bathrooms</div></div>` : ""}
      ${property.area ? `<div class="spec-item"><div class="value">${property.area}</div><div class="label">Sq Ft</div></div>` : ""}
      ${property.parking_spaces ? `<div class="spec-item"><div class="value">${property.parking_spaces}</div><div class="label">Parking</div></div>` : ""}
    </div>

    <div class="details-grid">
      <div>
        <div class="info-card">
          <h2>Description</h2>
          <p class="description-text">${escapeHtml(property.description || "")}</p>
        </div>

        ${amenitiesList ? `<div class="info-card"><h2>Amenities</h2><ul class="amenities-list">${amenitiesList}</ul></div>` : ""}

        <div class="info-card">
          <h2>Property Details</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${tableRow("Property Type", property.property_type)}
            ${tableRow("Listing Type", property.listing_type === "rent" ? "For Rent" : "For Sale")}
            ${property.condition ? tableRow("Condition", property.condition) : ""}
            ${property.year_built ? tableRow("Year Built", property.year_built) : ""}
            ${property.furnishing_status ? tableRow("Furnishing", property.furnishing_status) : ""}
            ${property.land_size ? tableRow("Land Size", property.land_size + " sqm") : ""}
            ${property.title_type ? tableRow("Title", property.title_type) : ""}
          </table>
        </div>
      </div>

      <div>
        <div class="info-card">
          <h2>Listed By</h2>
          <div class="seller-card">
            <div class="seller-avatar">
              ${seller?.avatar_url ? `<img src="${escapeHtml(seller.avatar_url)}" alt="${escapeHtml(seller?.full_name || "Seller")}">` : (seller?.full_name || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>${escapeHtml(seller?.full_name || "Seller")}</strong>
              ${seller?.is_verified_badge ? ' <span style="color:#28a745;">✓</span>' : ""}
            </div>
          </div>
          <a href="${BASE_URL}/property/${property.slug}" class="cta-btn">View on Xavorian</a>
          <a href="${BASE_URL}/chat/${property.id}" class="cta-btn" style="background:#1a1a2e;margin-top:8px;">Message Seller</a>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} Xavorian. Nigeria's Trust-First Real Estate Marketplace.</p>
      <p style="margin-top:8px;">
        <a href="${BASE_URL}/about">About</a> · 
        <a href="${BASE_URL}/privacy">Privacy</a> · 
        <a href="${BASE_URL}/terms">Terms</a> · 
        <a href="${BASE_URL}/contact">Contact</a>
      </p>
    </div>
  </footer>

  <script>
    // Redirect interactive users to React app
    if (window.location.search.indexOf('_escaped_fragment_') === -1 && !navigator.userAgent.match(/bot|crawl|spider|slurp|baidu|yandex|google/i)) {
      window.location.href = '${BASE_URL}/property/${property.slug}';
    }
  </script>
</body>
</html>`;

  return new Response(html, { headers: corsHeaders });
});

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function tableRow(label: string, value: any): string {
  if (!value) return "";
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;">${escapeHtml(label)}</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;text-align:right;">${escapeHtml(String(value))}</td></tr>`;
}

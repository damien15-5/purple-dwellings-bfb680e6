import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://www.xavorian.xyz";

const ROUTE_META: Record<string, { title: string; description: string; h1: string; body: string }> = {
  "/": {
    title: "Xavorian – Verified Real Estate in Benin City & Nigeria | Buy, Rent & Sell",
    description: "Find trusted agents and verified property listings in Benin City, Lagos, Abuja. Rent, buy or sell scam-free on Xavorian – Nigeria's trust-first real estate marketplace.",
    h1: "Verified Real Estate in Nigeria",
    body: `<p>Xavorian is Nigeria's trust-first real estate marketplace. Browse verified property listings in Benin City, Lagos, Abuja, and Port Harcourt. Every listing is vetted, every agent is verified.</p>
    <h2>Why Xavorian?</h2><ul><li>Verified agents &amp; listings</li><li>Secure escrow payments</li><li>KYC-verified users</li><li>Scam-free transactions</li></ul>
    <h2>Popular Locations</h2><ul><li><a href="${BASE_URL}/location/benin-city">Benin City Properties</a></li><li><a href="${BASE_URL}/location/lagos">Lagos Properties</a></li><li><a href="${BASE_URL}/location/abuja">Abuja Properties</a></li></ul>`,
  },
  "/browse": {
    title: "Browse Properties – Houses, Land & Apartments for Sale & Rent | Xavorian",
    description: "Search verified properties across Nigeria. Filter by location, price, type. Find houses, land, apartments for sale or rent in Benin City, Lagos, Abuja.",
    h1: "Browse Verified Properties in Nigeria",
    body: `<p>Explore thousands of verified real estate listings. Filter by city, price range, property type, and more.</p>`,
  },
  "/agents": {
    title: "Verified Real Estate Agents in Nigeria | Xavorian",
    description: "Connect with KYC-verified real estate agents in Benin City, Lagos, Abuja. Trusted agents for buying, selling, and renting property.",
    h1: "Verified Real Estate Agents",
    body: `<p>Find trusted, KYC-verified real estate agents across Nigeria. Every agent on Xavorian passes identity verification.</p>`,
  },
  "/blog": {
    title: "Real Estate Blog – Tips, News & Market Insights | Xavorian",
    description: "Read expert real estate tips, market analysis, and property investment guides for Nigeria. Stay informed with Xavorian's blog.",
    h1: "Xavorian Real Estate Blog",
    body: `<p>Expert insights on Nigeria's real estate market. Property investment tips, market trends, and buying guides.</p>`,
  },
  "/how-it-works": {
    title: "How Xavorian Works – Safe Property Transactions in Nigeria",
    description: "Learn how Xavorian protects buyers and sellers with verified listings, escrow payments, and KYC verification. Safe real estate in Nigeria.",
    h1: "How Xavorian Works",
    body: `<p>Xavorian makes real estate safe in Nigeria. Here's how:</p><ol><li>Browse verified listings</li><li>Connect with verified agents</li><li>Pay securely via escrow</li><li>Complete your transaction safely</li></ol>`,
  },
  "/about": {
    title: "About Xavorian – Nigeria's Trust-First Real Estate Marketplace",
    description: "Xavorian is building trust in Nigerian real estate. Learn about our mission to eliminate property scams.",
    h1: "About Xavorian",
    body: `<p>Xavorian is Nigeria's trust-first real estate marketplace, founded to eliminate property scams and build confidence in real estate transactions.</p>`,
  },
  "/contact": {
    title: "Contact Xavorian – Get Help with Real Estate in Nigeria",
    description: "Reach out to Xavorian's support team. We're here to help with property listings, escrow, verification, and more.",
    h1: "Contact Us",
    body: `<p>Have questions? Contact our team for help with listings, payments, verification, or any real estate needs.</p>`,
  },
  "/vision": {
    title: "Our Vision – Building Trust in Nigerian Real Estate | Xavorian",
    description: "Xavorian's vision is to make every property transaction in Nigeria safe, transparent, and trustworthy.",
    h1: "Our Vision",
    body: `<p>We envision a Nigeria where every property transaction is safe, transparent, and trustworthy.</p>`,
  },
  "/faq": {
    title: "Frequently Asked Questions – Xavorian Real Estate",
    description: "Get answers to common questions about buying, selling, renting property on Xavorian. Learn about escrow, KYC, and more.",
    h1: "Frequently Asked Questions",
    body: `<p>Find answers to the most common questions about using Xavorian for your real estate needs.</p>`,
  },
  "/support": {
    title: "Support – Get Help | Xavorian",
    description: "Need help? Contact Xavorian support for assistance with your property transactions.",
    h1: "Support Center",
    body: `<p>Our support team is ready to help you with any issues or questions.</p>`,
  },
  "/login": {
    title: "Log In to Xavorian – Access Your Real Estate Dashboard",
    description: "Log in to your Xavorian account to manage listings, track transactions, and connect with agents.",
    h1: "Log In",
    body: `<p>Access your Xavorian dashboard. Manage your listings, escrow transactions, and messages.</p>`,
  },
  "/signup": {
    title: "Sign Up for Xavorian – Start Buying & Selling Property",
    description: "Create your free Xavorian account. List properties, connect with buyers, and transact safely with escrow.",
    h1: "Create Your Account",
    body: `<p>Join Nigeria's most trusted real estate marketplace. Sign up free and start buying or selling property safely.</p>`,
  },
  "/privacy": {
    title: "Privacy Policy | Xavorian",
    description: "Read Xavorian's privacy policy. Learn how we protect your personal data and real estate transaction information.",
    h1: "Privacy Policy",
    body: `<p>Your privacy matters. Read how Xavorian collects, uses, and protects your personal information.</p>`,
  },
  "/terms": {
    title: "Terms and Conditions | Xavorian",
    description: "Read Xavorian's terms of service for using our real estate marketplace platform.",
    h1: "Terms and Conditions",
    body: `<p>Please read these terms carefully before using Xavorian's real estate marketplace.</p>`,
  },
  "/disclaimer": {
    title: "Disclaimer | Xavorian",
    description: "Xavorian's legal disclaimer regarding property listings and transactions.",
    h1: "Disclaimer",
    body: `<p>Important legal information about using Xavorian's platform.</p>`,
  },
  // Landing pages
  "/land-for-sale-lagos": {
    title: "Land for Sale in Lagos – Verified Plots & Parcels | Xavorian",
    description: "Find verified land for sale in Lagos. Plots in Lekki, Ibeju-Lekki, Victoria Island. Secure purchase with escrow on Xavorian.",
    h1: "Land for Sale in Lagos",
    body: `<p>Browse verified land listings in Lagos. From affordable plots in Ibeju-Lekki to premium parcels in Lekki Phase 1 and Victoria Island.</p><ul><li><a href="${BASE_URL}/location/lagos/lekki">Lekki Land</a></li><li><a href="${BASE_URL}/location/lagos/ibeju-lekki">Ibeju-Lekki Land</a></li></ul>`,
  },
  "/land-for-sale-benin-city": {
    title: "Land for Sale in Benin City – Verified Plots | Xavorian",
    description: "Find verified land for sale in Benin City, Edo State. Plots in GRA, Ugbowo, Ikpoba Hill. Safe transactions with escrow.",
    h1: "Land for Sale in Benin City",
    body: `<p>Explore verified land listings in Benin City. Affordable and premium plots across GRA, Ugbowo, Sapele Road, and more.</p>`,
  },
  "/cheap-land-ibeju-lekki": {
    title: "Cheap Land in Ibeju-Lekki – Affordable Plots | Xavorian",
    description: "Buy affordable land in Ibeju-Lekki, Lagos. Verified plots with proper documentation. Secure purchase via escrow.",
    h1: "Cheap Land in Ibeju-Lekki",
    body: `<p>Discover affordable, verified land in Ibeju-Lekki. Investment-grade plots near the Lekki Free Trade Zone.</p>`,
  },
  "/duplex-for-sale-lekki": {
    title: "Duplex for Sale in Lekki – Luxury Homes | Xavorian",
    description: "Find luxury duplexes for sale in Lekki, Lagos. Verified listings with photos, pricing, and agent contact.",
    h1: "Duplex for Sale in Lekki",
    body: `<p>Browse verified duplex listings in Lekki. Luxury homes with modern amenities in Lagos's most sought-after neighborhood.</p>`,
  },
  "/apartments-for-rent-benin-city": {
    title: "Apartments for Rent in Benin City – Verified Listings | Xavorian",
    description: "Find affordable apartments for rent in Benin City. Verified listings in Ugbowo, GRA, Sapele Road, and more areas.",
    h1: "Apartments for Rent in Benin City",
    body: `<p>Browse verified rental apartments in Benin City. From student-friendly flats to luxury apartments across the city.</p>`,
  },
  "/student-accommodation-benin-city": {
    title: "Student Accommodation in Benin City – Near UNIBEN | Xavorian",
    description: "Find student housing near University of Benin. Affordable rooms, self-contains, and flats in Ugbowo and Ekosodin.",
    h1: "Student Accommodation in Benin City",
    body: `<p>Affordable student accommodation near UNIBEN. Self-contains, shared apartments, and hostels in Ugbowo and surrounding areas.</p>`,
  },
  "/houses-for-rent-ugbowo": {
    title: "Houses for Rent in Ugbowo, Benin City | Xavorian",
    description: "Find houses for rent in Ugbowo, Benin City. Verified listings near UNIBEN. Affordable and premium options.",
    h1: "Houses for Rent in Ugbowo",
    body: `<p>Browse verified houses for rent in Ugbowo, Benin City. Close to University of Benin with various price ranges.</p>`,
  },
  "/property-for-sale-edo-state": {
    title: "Property for Sale in Edo State – Houses, Land & More | Xavorian",
    description: "Find verified property for sale in Edo State. Houses, land, and commercial properties in Benin City and across Edo.",
    h1: "Property for Sale in Edo State",
    body: `<p>Explore all types of property for sale across Edo State. From residential homes to commercial plots, all verified.</p>`,
  },
};

// Location pages metadata generator
function getLocationMeta(city: string, area?: string): { title: string; description: string; h1: string; body: string } {
  const cityName = city.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const areaName = area ? area.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";

  if (area) {
    return {
      title: `Properties in ${areaName}, ${cityName} – For Sale & Rent | Xavorian`,
      description: `Browse verified properties in ${areaName}, ${cityName}. Houses, land, apartments for sale and rent. Safe transactions on Xavorian.`,
      h1: `Properties in ${areaName}, ${cityName}`,
      body: `<p>Explore verified real estate listings in ${areaName}, ${cityName}. Find houses, apartments, and land for sale or rent.</p>
      <p><a href="${BASE_URL}/location/${city}">← Back to all ${cityName} properties</a></p>`,
    };
  }

  return {
    title: `Properties in ${cityName} – Real Estate Listings | Xavorian`,
    description: `Find verified properties in ${cityName}. Houses, apartments, land for sale and rent. Trusted agents and secure escrow.`,
    h1: `Real Estate in ${cityName}`,
    body: `<p>Browse all verified property listings in ${cityName}. Filter by area, price, and property type.</p>
    <p><a href="${BASE_URL}/browse">Browse all properties →</a></p>`,
  };
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderPage(meta: { title: string; description: string; h1: string; body: string }, path: string): string {
  const url = `${BASE_URL}${path}`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta.title,
    description: meta.description,
    url,
    publisher: {
      "@type": "Organization",
      name: "Xavorian",
      url: BASE_URL,
      logo: `${BASE_URL}/favicon.ico`,
    },
  });

  const breadcrumbLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      ...(path !== "/" ? [{ "@type": "ListItem", position: 2, name: meta.h1, item: url }] : []),
    ],
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Xavorian">
  <meta property="og:image" content="${BASE_URL}/favicon.ico">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <script type="application/ld+json">${jsonLd}</script>
  <script type="application/ld+json">${breadcrumbLd}</script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;background:#fafafa;line-height:1.7}
    a{color:#6c3ecf;text-decoration:none}a:hover{text-decoration:underline}
    .c{max-width:1100px;margin:0 auto;padding:0 16px}
    header{background:linear-gradient(135deg,#6c3ecf,#4a1fa0);color:#fff;padding:16px 0}
    header .logo{font-size:1.5rem;font-weight:800}
    header nav a{color:#e0d4f5;margin-left:20px;font-size:.9rem}
    h1{font-size:1.75rem;font-weight:700;margin:24px 0 12px}
    h2{font-size:1.25rem;margin:20px 0 8px;color:#1a1a2e}
    p{margin:8px 0;color:#444}
    ul,ol{margin:8px 0 8px 24px}li{margin:4px 0}
    footer{background:#1a1a2e;color:#aaa;padding:32px 0;margin-top:48px;text-align:center;font-size:.85rem}
    footer a{color:#b39ddb}
  </style>
</head>
<body>
  <header>
    <div class="c" style="display:flex;align-items:center;justify-content:space-between">
      <a href="${BASE_URL}" class="logo" style="color:#fff">Xavorian</a>
      <nav>
        <a href="${BASE_URL}/browse">Browse</a>
        <a href="${BASE_URL}/agents">Agents</a>
        <a href="${BASE_URL}/blog">Blog</a>
        <a href="${BASE_URL}/contact">Contact</a>
      </nav>
    </div>
  </header>
  <main class="c">
    <h1>${escapeHtml(meta.h1)}</h1>
    ${meta.body}
  </main>
  <footer>
    <div class="c">
      <p>&copy; ${new Date().getFullYear()} Xavorian. Nigeria's Trust-First Real Estate Marketplace.</p>
      <p style="margin-top:8px">
        <a href="${BASE_URL}/about">About</a> · <a href="${BASE_URL}/browse">Browse</a> · <a href="${BASE_URL}/agents">Agents</a> · <a href="${BASE_URL}/blog">Blog</a> · <a href="${BASE_URL}/privacy">Privacy</a> · <a href="${BASE_URL}/terms">Terms</a> · <a href="${BASE_URL}/contact">Contact</a>
      </p>
    </div>
  </footer>
  <script>
    if(!navigator.userAgent.match(/bot|crawl|spider|slurp|baidu|yandex|google|bing|semrush|ahrefs|facebook|twitter|whatsapp|telegram|linkedinbot/i)){
      window.location.replace('${url}');
    }
  </script>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let path = url.searchParams.get("path") || "/";

  // Normalize
  path = "/" + path.replace(/^\/+/, "").replace(/\/+$/, "");
  if (path === "/") path = "/";

  // Check static routes first
  if (ROUTE_META[path]) {
    return new Response(renderPage(ROUTE_META[path], path), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }

  // Check location routes: /location/:city or /location/:city/:area
  const locMatch = path.match(/^\/location\/([^/]+)(?:\/([^/]+))?$/);
  if (locMatch) {
    const meta = getLocationMeta(locMatch[1], locMatch[2]);
    return new Response(renderPage(meta, path), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }

  // Check property routes: /property/:slug
  const propMatch = path.match(/^\/property\/([^/]+)$/);
  if (propMatch) {
    // Delegate to the property-seo-page function
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/property-seo-page?slug=${encodeURIComponent(propMatch[1])}`);
    return new Response(await resp.text(), {
      status: resp.status,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }

  // Check blog routes: /blog/:slug
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: post } = await supabase.from("blog_posts").select("*").eq("slug", blogMatch[1]).eq("status", "published").single();
    if (post) {
      const meta = {
        title: `${post.title} | Xavorian Blog`,
        description: post.excerpt || post.content?.substring(0, 155) || "",
        h1: post.title,
        body: `<p>${escapeHtml(post.excerpt)}</p><article>${post.content}</article>`,
      };
      return new Response(renderPage(meta, path), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
      });
    }
  }

  // Fallback 404
  return new Response(renderPage({
    title: "Page Not Found | Xavorian",
    description: "The page you're looking for doesn't exist.",
    h1: "Page Not Found",
    body: `<p>Sorry, this page doesn't exist. <a href="${BASE_URL}">Go to homepage</a></p>`,
  }, path), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
});

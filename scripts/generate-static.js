#!/usr/bin/env node
/**
 * generate-static.js
 * Regenerates the route config for the site-prerender edge function.
 * Run: node scripts/generate-static.js
 *
 * Add new neighborhoods/areas to the ROUTES array below.
 */

const ROUTES = [
  // Core pages
  { path: "/", title: "Xavorian – Verified Real Estate in Benin City & Nigeria" },
  { path: "/browse", title: "Browse Properties" },
  { path: "/agents", title: "Verified Real Estate Agents" },
  { path: "/blog", title: "Real Estate Blog" },
  { path: "/how-it-works", title: "How Xavorian Works" },
  { path: "/about", title: "About Xavorian" },
  { path: "/contact", title: "Contact Xavorian" },
  { path: "/vision", title: "Our Vision" },
  { path: "/faq", title: "FAQ" },
  { path: "/support", title: "Support" },
  { path: "/privacy", title: "Privacy Policy" },
  { path: "/terms", title: "Terms and Conditions" },
  { path: "/disclaimer", title: "Disclaimer" },

  // Benin City areas — add new areas here
  { path: "/location/benin-city", title: "Properties in Benin City" },
  { path: "/location/benin-city/ugbowo", title: "Properties in Ugbowo, Benin City" },
  { path: "/location/benin-city/gra", title: "Properties in GRA, Benin City" },
  { path: "/location/benin-city/ikpoba-hill", title: "Properties in Ikpoba Hill" },
  { path: "/location/benin-city/sapele-road", title: "Properties in Sapele Road" },
  { path: "/location/benin-city/new-benin", title: "Properties in New Benin" },
  { path: "/location/benin-city/aduwawa", title: "Properties in Aduwawa" },
  { path: "/location/benin-city/uniben-area", title: "Properties in UNIBEN Area" },
  { path: "/location/benin-city/ekosodin", title: "Properties in Ekosodin" },
  { path: "/location/benin-city/oluku", title: "Properties in Oluku" },
  { path: "/location/benin-city/uselu", title: "Properties in Uselu" },

  // Lagos areas
  { path: "/location/lagos", title: "Properties in Lagos" },
  { path: "/location/lagos/lekki", title: "Properties in Lekki" },
  { path: "/location/lagos/ikoyi", title: "Properties in Ikoyi" },
  { path: "/location/lagos/ibeju-lekki", title: "Properties in Ibeju-Lekki" },
  { path: "/location/lagos/yaba", title: "Properties in Yaba" },
  { path: "/location/lagos/victoria-island", title: "Properties in Victoria Island" },

  // Abuja areas
  { path: "/location/abuja", title: "Properties in Abuja" },
  { path: "/location/abuja/maitama", title: "Properties in Maitama" },
  { path: "/location/abuja/wuse", title: "Properties in Wuse" },
  { path: "/location/abuja/garki", title: "Properties in Garki" },

  // Port Harcourt
  { path: "/location/port-harcourt", title: "Properties in Port Harcourt" },

  // Landing pages
  { path: "/land-for-sale-lagos", title: "Land for Sale in Lagos" },
  { path: "/land-for-sale-benin-city", title: "Land for Sale in Benin City" },
  { path: "/cheap-land-ibeju-lekki", title: "Cheap Land in Ibeju-Lekki" },
  { path: "/duplex-for-sale-lekki", title: "Duplex for Sale in Lekki" },
  { path: "/apartments-for-rent-benin-city", title: "Apartments for Rent in Benin City" },
  { path: "/student-accommodation-benin-city", title: "Student Accommodation in Benin City" },
  { path: "/houses-for-rent-ugbowo", title: "Houses for Rent in Ugbowo" },
  { path: "/property-for-sale-edo-state", title: "Property for Sale in Edo State" },
];

console.log("=== Xavorian Route Config ===\n");
console.log(`Total routes: ${ROUTES.length}\n`);
console.log("Routes for sitemap:");
ROUTES.forEach(r => console.log(`  https://www.xavorian.xyz${r.path}`));
console.log("\nTo add a new neighborhood:");
console.log('  1. Add { path: "/location/city/area", title: "..." } to ROUTES above');
console.log("  2. The site-prerender function auto-generates metadata for /location/* routes");
console.log("  3. The dynamic-sitemap function auto-includes all /location/* routes");
console.log("  4. Redeploy edge functions\n");

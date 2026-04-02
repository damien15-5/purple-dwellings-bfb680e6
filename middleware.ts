const BOT_UA = /bot|crawl|spider|slurp|baidu|yandex|googlebot|bingbot|duckduckbot|semrush|ahrefs|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|mj12bot|dotbot|petalbot|bytespider/i;

const PRERENDER_PATHS = [
  /^\/$/,
  /^\/browse$/,
  /^\/agents$/,
  /^\/blog$/,
  /^\/blog\/[^/]+$/,
  /^\/how-it-works$/,
  /^\/about$/,
  /^\/contact$/,
  /^\/vision$/,
  /^\/faq$/,
  /^\/support$/,
  /^\/login$/,
  /^\/signup$/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/disclaimer$/,
  /^\/property\/[^/]+$/,
  /^\/location\/[^/]+$/,
  /^\/location\/[^/]+\/[^/]+$/,
  /^\/land-for-sale-lagos$/,
  /^\/land-for-sale-benin-city$/,
  /^\/cheap-land-ibeju-lekki$/,
  /^\/duplex-for-sale-lekki$/,
  /^\/apartments-for-rent-benin-city$/,
  /^\/student-accommodation-benin-city$/,
  /^\/houses-for-rent-ugbowo$/,
  /^\/property-for-sale-edo-state$/,
];

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = request.headers.get("user-agent") || "";
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip static assets
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|map|json|xml|txt)$/)) {
    return undefined; // pass through
  }

  // Only prerender for bots on matching paths
  if (BOT_UA.test(ua) && PRERENDER_PATHS.some(re => re.test(path))) {
    const prerenderUrl = `https://bmzjeamkuxeksbfjusui.supabase.co/functions/v1/site-prerender?path=${encodeURIComponent(path)}`;
    const resp = await fetch(prerenderUrl);
    return new Response(await resp.text(), {
      status: resp.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Prerendered": "true",
      },
    });
  }

  return undefined; // pass through to SPA
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|static|favicon\\.ico|.*\\..*).*)"],
};

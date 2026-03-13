export default function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  const isBot = /googlebot|bingbot|yandex|twitterbot|facebookexternalhit/i.test(ua)

  if (isBot) {
    const url = new URL(request.url)
    const prerenderUrl = `https://service.prerender.io${url.pathname}`
    
    return fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': 'igan9dQbWYbvjoRPl61G'
      }
    })
  }
}

export const config = {
  matcher: '/((?!api|_next|static|public|favicon).*)'
}

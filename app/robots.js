export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/account/', '/cart/', '/checkout/', '/orders/'],
      },
    ],
    sitemap: 'https://oura-lifestyle.com/sitemap.xml',
    host: 'https://oura-lifestyle.com',
  };
}

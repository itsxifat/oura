/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // reduced from 50mb — no legitimate use case for 50mb
    },
  },

  images: {
    qualities: [75, 80, 85, 90, 95],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ─── Security Headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Stop MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Force HTTPS for 1 year (enable once you have a valid cert)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Restrict browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Basic CSP — tighten further once you audit your inline scripts/styles
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // GTM + GA4 + Google Ads + DoubleClick + Meta Pixel + Conversions API client helper
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'" +
                " https://www.googletagmanager.com https://*.googletagmanager.com" +
                " https://www.google-analytics.com https://ssl.google-analytics.com" +
                " https://www.googleadservices.com https://googleads.g.doubleclick.net" +
                " https://www.google.com" +
                " https://gtm.oura-lifestyle.com" +
                " https://connect.facebook.net" +
                " https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com",
              "font-src 'self' https://fonts.gstatic.com",
              // https: wildcard covers all pixel/beacon img requests
              "img-src 'self' data: blob: https:",
              // GTM + GA4 + Google Ads + DoubleClick + sGTM proxy + Meta Pixel + Conversions API
              "connect-src 'self'" +
                " https://www.googletagmanager.com https://*.googletagmanager.com" +
                " https://www.google-analytics.com https://ssl.google-analytics.com" +
                " https://analytics.google.com https://region1.google-analytics.com" +
                " https://stats.g.doubleclick.net https://cm.g.doubleclick.net" +
                " https://td.doubleclick.net" +
                " https://www.googleadservices.com https://googleads.g.doubleclick.net" +
                " https://adservice.google.com https://www.google.com" +
                " https://gtm.oura-lifestyle.com" +
                " https://www.facebook.com https://connect.facebook.net" +
                " https://unpkg.com",
              // GTM preview/debug iframes + DoubleClick Floodlight + Meta
              "frame-src 'self'" +
                " https://www.googletagmanager.com https://*.googletagmanager.com" +
                " https://td.doubleclick.net https://bid.g.doubleclick.net" +
                " https://gtm.oura-lifestyle.com" +
                " https://www.facebook.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

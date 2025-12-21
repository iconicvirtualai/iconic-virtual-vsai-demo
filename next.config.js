/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Force HTTPS in production on your custom domain
      {
        source: "/:path*",
        has: [{ type: "host", value: "stage.iconicvirtual.ai" }],
        missing: [{ type: "header", key: "x-forwarded-proto" }],
        destination: "https://stage.iconicvirtual.ai/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Tell browsers: always use HTTPS for this domain
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

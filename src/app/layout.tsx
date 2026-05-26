import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from './providers';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: "AniLens - Anime Discovery & Taste Platform",
  description: "Discover anime through a clean, personalized browse experience. Track your taste, play games, and find your next favorite show.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AniLens",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050508",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Satoshi font from Fontshare CDN */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap"
          rel="stylesheet"
        />
        {/* No-flash theme script: runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var accent = localStorage.getItem('anilens-accent') || '#7c6df2';
                  var theme = localStorage.getItem('anilens-theme') || 'dark';
                  document.documentElement.style.setProperty('--accent-color', accent);
                  var rgb = parseInt(accent.slice(1,3),16) + ', ' + parseInt(accent.slice(3,5),16) + ', ' + parseInt(accent.slice(5,7),16);
                  document.documentElement.style.setProperty('--accent-rgb', rgb);
                  if (theme === 'light') document.documentElement.classList.add('light');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <Providers>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

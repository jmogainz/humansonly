import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { Providers } from '@/components/Providers';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: ['300', '400', '500', '600', '700'] });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://humansonly.com'),
  title: {
    default: 'HumansOnly | Cognitive Benchmark',
    template: '%s | HumansOnly',
  },
  description: 'The minimalist cognitive performance benchmark. Train, measure, and compete.',
  applicationName: 'HumansOnly',
  keywords: [
    'humansonly',
    'cognitive test',
    'brain training',
    'benchmark',
    'iq test',
    'reaction time',
    'memory test',
    'focus',
  ],
  authors: [{ name: 'HumansOnly' }],
  creator: 'HumansOnly',
  publisher: 'HumansOnly',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  category: 'productivity',
  classification: 'Cognitive Benchmark',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-light.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-dark.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/pinned-mask.svg',
        color: '#000000',
      },
    ],
  },
  openGraph: {
    title: 'HumansOnly | Cognitive Benchmark',
    description: 'The minimalist cognitive performance benchmark. Train, measure, and compete.',
    siteName: 'HumansOnly',
    type: 'website',
    locale: 'en_US',
    url: 'https://humansonly.com',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'HumansOnly Benchmark',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HumansOnly | Cognitive Benchmark',
    description: 'The minimalist cognitive performance benchmark.',
    images: ['/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'HumansOnly',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

const themeBootstrap = `
(() => {
  try {
    const stored = localStorage.getItem('humansonly_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.dataset.theme = 'dark';
      const darkIcon = document.querySelector('link[href="/favicon-dark.svg"]');
      if (darkIcon) darkIcon.removeAttribute('media');
      const lightIcon = document.querySelector('link[href="/favicon-light.svg"]');
      if (lightIcon) lightIcon.setAttribute('media', '(prefers-color-scheme: none)');
    } else {
      document.documentElement.dataset.theme = 'light';
      const lightIcon = document.querySelector('link[href="/favicon-light.svg"]');
      if (lightIcon) lightIcon.removeAttribute('media');
      const darkIcon = document.querySelector('link[href="/favicon-dark.svg"]');
      if (darkIcon) darkIcon.setAttribute('media', '(prefers-color-scheme: none)');
    }
  } catch {
    // Default to light for minimal look if JS fails/SSR match
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jetBrainsMono.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

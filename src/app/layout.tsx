import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'HumansOnly',
  description: 'A complete cognitive benchmark platform with global leaderboards.',
  metadataBase: new URL('https://humansonly.io'),
};

const themeBootstrap = `
(() => {
  try {
    const stored = localStorage.getItem('humansonly_theme');
    document.documentElement.dataset.theme = stored === 'light' ? 'light' : 'dark';
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <Providers>
          <div className="backgroundGlow" aria-hidden />
          <Header />
          <main>{children}</main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

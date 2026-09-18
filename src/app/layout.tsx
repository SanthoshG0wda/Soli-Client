import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { RouteGuard } from '@/components/auth/route-guard';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Soli | AI Legal Intelligence',
  description: 'Specialized legal research workspace for Indian criminal law and cybercrime analysis.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="antialiased bg-[#FAF9F5] text-[#1F1E1D] selection:bg-[#CC6242]/15 selection:text-[#1F1E1D]">
        <AuthProvider>
          <RouteGuard>{children}</RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}

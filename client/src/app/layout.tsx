import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Header } from './_navigation/header';
import { Sidebar } from './_navigation/sidebar/components/sidebar';
import { ReactQueryProvider } from './_provider/react-query-provider';
import './global.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: '튤립',
  description:
    'I can calculate the motion of heavenly bodies, but not the madness of men.',
  icons: {
    icon: '/img/logo_icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NuqsAdapter>
          <ReactQueryProvider>
            <ThemeProvider>
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex flex-1 flex-col py-24 px-8 bg-gray/20">
                  {children}
                </main>
              </div>
            </ThemeProvider>
            <Toaster expand />
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}

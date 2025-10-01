import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { TenantProvider } from '@/contexts/tenant-context';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduMyles - School Management System',
  description: 'Modular multi-tenant school management platform',
  keywords: ['education', 'school', 'management', 'students', 'teachers', 'administration'],
  authors: [{ name: 'Myles Corp Ltd' }],
  creator: 'Myles Corp Ltd',
  publisher: 'Myles Corp Ltd',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'EduMyles',
    title: 'EduMyles - School Management System',
    description: 'Modular multi-tenant school management platform',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduMyles - School Management System',
    description: 'Modular multi-tenant school management platform',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang=\"en\" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute=\"class\"
          defaultTheme=\"system\"
          enableSystem
          disableTransitionOnChange
        >
          <TenantProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { TenantProvider } from '@/contexts/tenant-context';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'EduMyles - Modern School Management Platform',
    template: '%s | EduMyles',
  },
  description: 'Comprehensive, modular school management system with multi-tenant architecture. Manage academics, finances, communications, and more.',
  keywords: [
    'school management',
    'education software', 
    'student information system',
    'academic management',
    'educational technology',
    'school administration',
  ],
  authors: [
    {
      name: 'Myles Corp Ltd',
      url: 'https://mylescorp.com',
    },
  ],
  creator: 'Myles Corp Ltd',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://edumyles.com',
    siteName: 'EduMyles',
    title: 'EduMyles - Modern School Management Platform',
    description: 'Comprehensive, modular school management system with multi-tenant architecture.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EduMyles - Modern School Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduMyles - Modern School Management Platform',
    description: 'Comprehensive, modular school management system with multi-tenant architecture.',
    images: ['/og-image.png'],
  },
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
  verification: {
    google: 'google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
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
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { AccessibilityApplier } from '@/components/accessibility/AccessibilityApplier';
import { PWARegister } from '@/components/PWARegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AccessibilityApplier />
          <PWARegister />
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

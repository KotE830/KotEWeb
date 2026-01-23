'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { TranslationProvider } from '@/hooks/useTranslation';
import './styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <TranslationProvider>
          <div className="App">
            <Header />
            <main className="main-content">
              {children}
            </main>
            <Footer />
          </div>
        </TranslationProvider>
      </body>
    </html>
  );
}


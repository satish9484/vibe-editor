import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { auth } from '@/auth';
import { ThemeProvider } from '@/components/providers/theme-providers';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from 'next-auth/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Vibe Code Editor',
  description: 'A collaborative code editor built with Next.js and Socket.io',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang='en' suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Clean up browser extension attributes before React hydration
                (function() {
                  // Run immediately when script loads
                  function cleanupExtensions() {
                    const body = document.body;
                    if (body) {
                      // Remove common browser extension attributes
                      const extensionAttributes = [
                        'cz-shortcut-listen',
                        'data-new-gr-c-s-check-loaded',
                        'data-gr-ext-installed',
                        'data-grammarly-shadow-root',
                        'data-grammarly-ignore',
                        'spellcheck',
                        'data-ms-editor'
                      ];
                      
                      extensionAttributes.forEach(attr => {
                        if (body.hasAttribute(attr)) {
                          body.removeAttribute(attr);
                        }
                      });
                    }
                  }
                  
                  // Clean up immediately if body exists
                  if (document.body) {
                    cleanupExtensions();
                  } else {
                    // Wait for body to be available
                    document.addEventListener('DOMContentLoaded', cleanupExtensions);
                  }
                  
                  // Also clean up on any DOM mutations
                  if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver(function(mutations) {
                      mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.target === document.body) {
                          cleanupExtensions();
                        }
                      });
                    });
                    
                    // Start observing when body is available
                    if (document.body) {
                      observer.observe(document.body, { attributes: true });
                    } else {
                      document.addEventListener('DOMContentLoaded', function() {
                        observer.observe(document.body, { attributes: true });
                      });
                    }
                  }
                })();
              `,
            }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
            <div className='flex flex-col min-h-screen'>
              <Toaster />
              <div className='flex-1'>{children}</div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'InfoMorph — One Source. Infinite Forms.',
  description:
    'AI-Powered Multimodal Content Transformation and Verification Platform. Transforms one authoritative source into multiple grounded, traceable communication outputs while preserving factual consistency.',
  keywords: [
    'InfoMorph',
    'Content Transformation',
    'Source Grounding',
    'Cross-Output Consistency',
    'Multi-Channel Distribution',
    'AI Publishing'
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8FAF8] text-[#172019] antialiased min-h-screen flex flex-col selection:bg-[#8DBF67]/30 selection:text-[#274221]">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

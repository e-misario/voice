import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'E-MIS@RIO SAS — SaaS de Voz con IA, TTS y Clonación de Voz',
  description:
    'Plataforma empresarial de Voz con Inteligencia Artificial, TTS neuronal de alta fidelidad, clonación de voz de marca y reuniones bilingües con motor VoiceStudio.',
  keywords: ['Voz IA', 'VoiceStudio', 'TTS', 'Clonación de Voz', 'E-MIS@RIO SAS', 'Multi-tenant'],
  authors: [{ name: 'E-MIS@RIO SAS' }],
  metadataBase: new URL('https://voice.e-misario.com'),
  openGraph: {
    title: 'E-MIS@RIO SAS — SaaS de Voz con IA',
    description: 'Voz sintética hiperrealista y clonación zero-shot con VoiceStudio.',
    url: 'https://voice.e-misario.com',
    siteName: 'E-MIS@RIO SAS Voice AI',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full">
      <body className={`${inter.className} min-h-full bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}

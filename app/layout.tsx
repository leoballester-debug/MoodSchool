import type {Metadata} from 'next';
import { Newsreader, Manrope } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MoodSchool',
  description: 'Tu diario de estado de ánimo diario',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${newsreader.variable} ${manrope.variable} dark`}>
      <body className="font-body antialiased selection:bg-primary selection:text-on-primary min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

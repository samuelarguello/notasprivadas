import './globals.css';
import type { Metadata } from 'next';

import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'CUNEF - Notas privadas',
  description: 'Envia notas privadas cifradas y temporales.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children} <Analytics /></body>
    </html>
  );
}

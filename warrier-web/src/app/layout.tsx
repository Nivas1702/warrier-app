import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WARRIER | Smart Warranty Bill Guardian & EMI Tracker',
  description:
    'Intelligent product warranty expiration tracker with Gemini AI bill photo receipt scanner, payment mode tracking, and late fee avoidance reminders.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AISP Spec Writer',
  description:
    'Write product specifications, analyze them with AISP, and generate tests.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

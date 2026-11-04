import Script from 'next/script';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Printosk 2.0 — Automated Self-Service Printing Kiosk',
  description: 'Upload documents, pay online, and print instantly at any Printosk kiosk using your smartphone.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col justify-between">
        {children}
        {/* Load Razorpay Checkout SDK Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

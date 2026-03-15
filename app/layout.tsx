import type {Metadata} from "next";
import {Cormorant_Garamond, Manrope} from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "2cents",
    template: "%s | 2cents",
  },
  description: "Ein persönlicher Essay-Blog über Kultur, Technologie und Alltag.",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html suppressHydrationWarning>
      <body className={`${serif.variable} ${sans.variable} bg-site text-site-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}

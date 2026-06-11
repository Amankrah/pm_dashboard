import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const bodySans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nkabom Activity Map",
  description:
    "Nkabom Collaborative faculty activity mapping and programme dashboard",
  icons: {
    icon: [{ url: "/brand/nkabom-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/nkabom-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displaySerif.variable} ${bodySans.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

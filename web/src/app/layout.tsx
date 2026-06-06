import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

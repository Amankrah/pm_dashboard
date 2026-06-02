import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nkabom Activity Map",
  description:
    "Nkabom Collaborative — faculty activity mapping and programme dashboard",
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

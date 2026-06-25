import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WearAll – Your AI Stylist",
  description: "AI-powered smart styling app and virtual wardrobe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

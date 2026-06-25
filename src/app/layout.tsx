import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Closet — Your AI Stylist",
  description: "Tell me about your day; I'll dress you from your own closet.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Closet",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="h-full bg-[#F9FAFB] flex justify-center">
        {/* Mobile shell: constrained to 390px on desktop, full-screen on mobile */}
        <div className="w-full max-w-[390px] min-h-full bg-[#F9FAFB] relative flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.08)]">
          {children}
        </div>
      </body>
    </html>
  );
}

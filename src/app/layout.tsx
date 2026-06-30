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
      <body className="h-full bg-[#FBF9F6] iphone-body">
        <div className="iphone-frame">
          {/* Side buttons — visible only on desktop via CSS */}
          <div className="iphone-btn iphone-silent" />
          <div className="iphone-btn iphone-vol-up" />
          <div className="iphone-btn iphone-vol-down" />
          <div className="iphone-btn iphone-power" />
          {/* App shell */}
          <div className="iphone-screen w-full max-w-[390px] min-h-full bg-[#FBF9F6] relative flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
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
  themeColor: "#C97B5A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="h-full bg-[#FBF7F2] flex justify-center">
        {/* Mobile shell: constrained to 390px on desktop, full-screen on mobile */}
        <div className="w-full max-w-[390px] min-h-full bg-[#FBF7F2] relative flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.08)]">
          {children}
        </div>
      </body>
    </html>
  );
}

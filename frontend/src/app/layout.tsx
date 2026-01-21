import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "BASEFLIP | Retro USDC Coin Flip",
  description: "High stakes, retro vibes. Flip USDC on Base with only 1% house edge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen relative">
        <Providers>
          <div className="crt-overlay" />
          <div className="scanline" />
          <main className="relative z-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

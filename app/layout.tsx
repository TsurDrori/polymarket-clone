import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/features/categories/components/Footer";
import { Header } from "@/features/categories/components/Header";
import { Providers } from "./Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polymarket Clone",
  description: "Prediction markets across politics, sports, and crypto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Header />
        <Providers>{children}</Providers>
        <Footer />
      </body>
    </html>
  );
}

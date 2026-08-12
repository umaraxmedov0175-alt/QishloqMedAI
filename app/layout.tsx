import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegistration } from "./ui/PwaRegistration";
import { LanguageProvider } from "@/lib/i18n";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tomir AI — Masofaviy tibbiy yordam va diagnostika",
  description: "Masofaviy hududlar uchun shifokor nazoratidagi diagnostika va tibbiy koordinatsiya tizimi.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Tomir AI — Masofaviy tibbiy yordam va diagnostika",
    description: "Masofaviy hududlar uchun shifokor nazoratidagi diagnostika va tibbiy koordinatsiya tizimi.",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomir AI — Masofaviy tibbiy yordam va diagnostika",
    description: "Masofaviy hududlar uchun shifokor nazoratidagi diagnostika va tibbiy koordinatsiya tizimi.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <PwaRegistration />
        <LanguageProvider>{children}</LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

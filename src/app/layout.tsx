import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "USDT/VES Monitor - Precios en Vivo",
  description: "Monitor en tiempo real del precio USDT/VES. Datos de compra y venta desde CryptoYa con historial de movimientos.",
  keywords: ["USDT", "VES", "CriptoYa", "Bolívar", "Venezuela", "P2P", "crypto", "monitor"],
  authors: [{ name: "USDT/VES Monitor" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "USDT/VES Monitor",
    description: "Monitor en tiempo real del precio USDT/VES",
    url: "https://chat.z.ai",
    siteName: "USDT/VES Monitor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "USDT/VES Monitor",
    description: "Monitor en tiempo real del precio USDT/VES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

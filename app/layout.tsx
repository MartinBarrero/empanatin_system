import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Empanatin",
  description: "Sistema de gestión de ventas — Empanatin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 py-5 text-center backdrop-blur">
          <a href="#hero" className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Empana<span className="text-accent">tin</span>
          </a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

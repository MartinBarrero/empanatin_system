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
        <header className="border-b border-border bg-surface px-6 py-4 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Empana<span className="text-accent">tin</span>
          </h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

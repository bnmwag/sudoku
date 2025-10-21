import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sudoku",
  description: "A simple Sudoku game.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div id="confetti-portal" />
        {children}
        <div className="fixed inset-x-0 bottom-5 text-center">
          <p className="text-[10px] opacity-50 uppercase">
            Visit on{" "}
            <a
              href="https://github.com/bnmwag/sudoku"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              github
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}

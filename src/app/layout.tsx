import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/accessibility/skip-link";
import { AudioProvider } from "@/components/audio/audio-provider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RuleShift AI",
  description:
    "A browser-based adventure where every decision can rewrite the rules.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} ${unbounded.variable}`}
      >
        <AudioProvider>
          <SkipLink />
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}

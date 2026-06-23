import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { siteConfig } from "./lib/site";
import Header from "./components/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Jamaican acronyms",
    "Jamaica acronyms",
    "Jamaican abbreviations",
    "Jamaica acronym directory",
    "what does it stand for Jamaica",
    "JA acronyms",
    "Jamaica government acronyms",
    "Acronyms JA",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_JM",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "reference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-JM"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div
          className="min-h-screen bg-[#fcfdfd] text-slate-800 flex flex-col font-sans selection:bg-[#adc2d2]/40 selection:text-[#1a1a1a]"
          id="app-layout-root"
        >
          <Header />

          <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
            {children}
          </main>

          {/* Footer Disclaimer */}
          <footer className="w-full border-t border-[#e0e0e0] py-5 mt-auto shrink-0 bg-[#fcfdfd]">
            <p className="text-[11px] text-slate-400 text-center font-light leading-relaxed px-4 text-pretty">
              Disclaimer: The information listed in this acronym directory represents public reference material gathered for educational purposes.
            </p>
          </footer>
        </div>
        <Script
          src={process.env.NEXT_PUBLIC_UMAMI_SRC}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

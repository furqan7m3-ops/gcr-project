import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";

import { getSystemSettings } from "@/lib/system-settings";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Academic serif reserved for page titles and major headings (Tailwind's
// font-serif, see globals.css); everything else stays on Geist Sans.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// The tab title follows the admin-editable platform name (Admin > Settings),
// so it always matches what the navbar shows.
const FALLBACK_PLATFORM_NAME = "Elevate Institute of Tourism & Hospitality Management";

export async function generateMetadata(): Promise<Metadata> {
  // The root layout also wraps pages prerendered at build time (e.g.
  // /_not-found), when the database isn't reachable on Railway - fall back to
  // the default name rather than failing the build (or a page's metadata).
  const platformName = await getSystemSettings()
    .then((settings) => settings.platformName)
    .catch(() => FALLBACK_PLATFORM_NAME);
  return {
    title: platformName,
    description: `${platformName} - classroom management platform`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ classNames: { toast: "font-sans rounded-lg shadow-md" } }}
        />
      </body>
    </html>
  );
}

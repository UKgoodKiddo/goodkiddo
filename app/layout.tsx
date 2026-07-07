import type { Metadata, Viewport } from "next";
import { Nunito, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PwaBoot } from "@/components/pwa-boot";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "goodKiddo",
    template: "%s | goodKiddo",
  },
  description:
    "A parent-controlled reward app where children collect boops using NFC Boopers.",
  applicationName: "goodKiddo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "goodKiddo",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-icon.png",
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff8659",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaBoot />
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Nunito, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { InstallPromptBanner } from "@/components/install-prompt-banner";
import { PwaBoot } from "@/components/pwa-boot";
import { getSiteUrl } from "@/lib/site-url";

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

const parentThemeScript = `(function(){try{if(!window.location.pathname.startsWith("/parent"))return;var hour=(new Date()).getHours();var phase=hour>=19||hour<6?"night":"day";document.documentElement.setAttribute("data-parent-theme",phase)}catch(e){document.documentElement.setAttribute("data-parent-theme","day")}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
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
      data-parent-theme="day"
      className={`${nunito.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="parent-theme-bootstrap" strategy="beforeInteractive">
          {parentThemeScript}
        </Script>
        <PwaBoot />
        <InstallPromptBanner />
        {children}
      </body>
    </html>
  );
}

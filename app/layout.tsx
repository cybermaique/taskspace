import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { ToastProvider } from "@/components/ui/toast";
import { getCurrentProfile } from "@/lib/auth";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: { default: "Taskspace", template: "%s · Taskspace" },
    description: translate(locale, "Organizador pessoal de tarefas e anotações."),
    icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#141518" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Rendering the accent on the server avoids a color flash on first paint.
  const [profile, locale] = await Promise.all([getCurrentProfile(), getLocale()]);

  return (
    <html
      lang={locale}
      data-accent={profile?.accent_color ?? "teal"}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh overflow-x-clip">
        <I18nProvider initialLocale={locale}>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700', '800', '900']
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700']
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '700']
});

export const metadata = {
  title: "Kerala 2026 - Hub",
  description: "Official Kerala Legislative Assembly Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased bg-background text-foreground", 
        playfair.variable, 
        dmSans.variable, 
        jetbrainsMono.variable
      )}
    >
      <body>
        <ThemeProvider>
          {/* Main public wrapper replacing dashboard shell */}
          <div className="relative flex min-h-screen flex-col bg-bg">
            <Header />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

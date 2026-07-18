// app/layout.tsx
import type { Metadata } from "next"
import { Alexandria, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import SiteFooter from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/components/user-provider"
import AnalyticsScripts from "@/components/analytics-scripts"
import AIAssistant from "@/components/ai-assistant"

const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://my-news-web-site.vercel.app"),
  title: {
    default: "Code Craft Core — منصة التعلم التفاعلية والألعاب البرمجية",
    template: "%s | Code Craft Core"
  },
  description: "انطلق في رحلة تعلم تفاعلية وممتعة للبرمجة. اكسب العملات، واصل خط التعلّم، واصنع مستقبلك التقني.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-google46d76b733011031b.html",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${alexandria.variable} ${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <AIAssistant />
            <SiteFooter />
            <AnalyticsScripts />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

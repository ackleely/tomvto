import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AccentProvider } from "@/components/accent-provider"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "TOMVTO - Viability Classifier",
  description: "AI-powered tomato seed viability classification and prediction system",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AccentProvider />
          <div className="flex h-screen overflow-hidden">
            <Suspense fallback={<div>Loading...</div>}>
              <AppSidebar />
            </Suspense>
            <div className="flex flex-1 flex-col overflow-hidden">
              <Suspense fallback={<div>Loading...</div>}>
                <AppHeader />
              </Suspense>
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

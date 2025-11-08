import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Real-Time Posture Detection',
  description: 'Monitor your posture in real-time using AI-powered pose detection with MediaPipe Tasks',
  keywords: ['posture', 'pose detection', 'health', 'wellness', 'MediaPipe', 'AI'],
  authors: [{ name: 'HTN 2025' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-dvh bg-gradient-to-br from-background to-muted/40">
            <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">AI</span>
                  <span>Posture</span>
                </Link>
                <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                  <Link href="#features" className="hover:text-foreground">Features</Link>
                  <Link href="#how-it-works" className="hover:text-foreground">How it works</Link>
                  <Link href="#privacy" className="hover:text-foreground">Privacy</Link>
                </nav>
                <div className="flex items-center gap-2">
                  <ModeToggle />
                </div>
              </div>
            </header>
            <Separator className="hidden" />
            <main className="container mx-auto px-4 py-8">{children}</main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              Built with Next.js, MediaPipe, and shadcn/ui
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

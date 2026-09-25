import type {Metadata, Viewport} from 'next'
import {IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4} from 'next/font/google'
import {ThemeProvider} from 'next-themes'
import './globals.css'
import {SvgDefs} from '@/components/seal'
import {SiteFooter} from '@/components/site-footer'
import {SiteHeader} from '@/components/site-header'

const serif = Source_Serif_4({subsets: ['latin'], variable: '--font-source-serif', display: 'swap'})
const sans = IBM_Plex_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans', display: 'swap'})
const mono = IBM_Plex_Mono({subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex-mono', display: 'swap'})

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {default: 'Cryptid Field Office · Department of Unexplained Sightings', template: '%s · Cryptid Field Office'},
  description:
    'A deadpan bureau that takes every unexplained sighting seriously. File a report, watch an AI investigator triage it, and follow the case from intake to a stamped verdict.',
  applicationName: 'Cryptid Field Office',
  openGraph: {
    type: 'website',
    siteName: 'Cryptid Field Office',
    title: 'Cryptid Field Office',
    description: 'File a sighting. Watch an AI triage it. A person signs it off.',
  },
  twitter: {card: 'summary_large_image'},
}

export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#f4eee1'},
    {media: '(prefers-color-scheme: dark)', color: '#111315'},
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <SvgDefs />
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}

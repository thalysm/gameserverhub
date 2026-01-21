import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: 'GameServerHub - Game Server Management',
  description: 'Manage your dedicated game servers in one place',
  generator: 'GameServerHub',
  icons: {
    icon: [
      { url: '/gamehub.png' },
      { url: '/gamehub.svg', type: 'image/svg+xml' },
    ],
    apple: '/gamehub.png',
  },
}

import { LayoutProvider } from "@/components/layout-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <LayoutProvider>
          {children}
        </LayoutProvider>
        <Analytics />
      </body>
    </html>
  )
}

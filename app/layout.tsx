import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TechWriter AI',
  description: 'AI-powered technical writing assistant — docs, UX copy, web copy, blogs, and humanizer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-950 antialiased`}>
        {children}
      </body>
    </html>
  )
}

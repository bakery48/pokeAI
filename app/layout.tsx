import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/shared/Nav'

export const metadata: Metadata = {
  title: 'PokeAI Coach',
  description: 'ポケモンチャンピオンズ AIコーチングシステム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}

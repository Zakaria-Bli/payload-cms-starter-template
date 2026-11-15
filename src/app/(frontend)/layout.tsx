import type { Metadata } from 'next'
import React from 'react'

import { env } from '@/lib/env'

import './styles.css'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SERVER_URL),
  title: { default: 'Payload Starter', template: '%s | Payload Starter' },
  description: 'A Next.js app powered by Payload CMS.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}

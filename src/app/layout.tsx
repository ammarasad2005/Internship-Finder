import type { Metadata } from 'next'
import './globals.css'
import styles from './layout.module.css'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Internship Finder',
  description: 'AI-powered internship discovery platform for students.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className={styles.appShell}>
          <header className={styles.header}>
            <Link href="/" className={styles.logo}>
              Internship Finder
            </Link>
            <nav className={styles.nav}>
              <Link href="/auth/login" className={styles.navLink}>Log In</Link>
              <Link href="/auth/signup" className={styles.navButton}>Sign Up</Link>
            </nav>
          </header>
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}

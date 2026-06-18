import styles from './page.module.css'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Discover Internships with AI</h1>
      <p className={styles.description}>
        Upload your resume and let our intelligent research agent find the perfect internship opportunities for you.
      </p>
      <div className={styles.cta}>
        <Link href="/auth/signup" className={styles.primaryButton}>
          Get Started
        </Link>
      </div>
    </div>
  )
}

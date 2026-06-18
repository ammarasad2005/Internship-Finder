import styles from './dashboard.module.css'

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Welcome to your protected area.</p>
      
      <div className={styles.card}>
        <p className={styles.cardText}>
          Your Profile Confidence Score and Research Settings will appear here.
        </p>
      </div>
    </div>
  )
}

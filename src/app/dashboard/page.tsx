import styles from './dashboard.module.css'
import { createClient } from '@/lib/supabase/server'
import { ProfileService } from '@/features/onboarding/services/profile.service'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profileData = await ProfileService.getProfile(user.id)

  if (!profileData || !profileData.profile) {
    redirect('/onboarding')
  }

  const { profile, skills, projects } = profileData

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Welcome back, {profile.first_name || 'Student'}.</p>
      
      <div className={styles.card}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Profile Status</h2>
        <p className={styles.cardText} style={{ marginBottom: '1rem' }}>
          Confidence Score: <strong style={{ color: 'var(--primary)' }}>{profile.confidence_score}%</strong>
        </p>
        
        <h3 style={{ fontSize: '1rem', marginTop: '1rem' }}>Extracted Skills ({skills.length})</h3>
        <ul className={styles.cardText} style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          {skills.map((s: any) => <li key={s.id}>{s.skill_name}</li>)}
          {skills.length === 0 && <li>None found.</li>}
        </ul>

        <h3 style={{ fontSize: '1rem' }}>Extracted Projects ({projects.length})</h3>
        <ul className={styles.cardText} style={{ marginLeft: '1.5rem' }}>
          {projects.map((p: any) => <li key={p.id}>{p.project_name}</li>)}
          {projects.length === 0 && <li>None found.</li>}
        </ul>
      </div>
    </div>
  )
}

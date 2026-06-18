import styles from './dashboard.module.css'
import { createClient } from '@/lib/supabase/server'
import { ProfileService } from '@/features/onboarding/services/profile.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StartSessionButton } from '@/features/research/components/StartSessionButton'

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
  
  // Fetch sessions
  let sessions: any[] = [];
  try {
    const supabaseClient = await createClient(); 
    const { data } = await supabaseClient.from('search_sessions').select('*').eq('profile_id', user.id).order('created_at', { ascending: false });
    sessions = data || [];
  } catch(e) {
    console.error(e);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Welcome back, {profile.first_name || 'Student'}.</p>
      
      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Profile Status</h2>
          <p className={styles.cardText} style={{ marginBottom: '1rem' }}>
            Confidence Score: <strong style={{ color: 'var(--primary)' }}>{profile.confidence_score}%</strong>
          </p>
          <StartSessionButton profileId={user.id} />
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Research Sessions</h2>
          {sessions.length === 0 ? (
            <p className={styles.cardText}>No research sessions yet.</p>
          ) : (
            <div className={styles.sessionList}>
              {sessions.map(session => (
                <Link key={session.id} href={`/dashboard/sessions/${session.id}`} className={styles.sessionItem}>
                  <div className={styles.sessionHeader}>
                    <span className={styles.sessionDate}>{new Date(session.created_at).toLocaleDateString()}</span>
                    <span className={`${styles.statusBadge} ${styles[session.status]}`}>{session.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

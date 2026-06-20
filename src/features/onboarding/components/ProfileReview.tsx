import styles from './onboarding.module.css';
import { OnboardingState } from '../types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProfileService } from '../services/profile.service';
import { createClient } from '@/lib/supabase/client';

interface Props {
  state: OnboardingState;
}

export function ProfileReview({ state }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(state.profile.email_notifications_enabled ?? true);
  const [notificationThreshold, setNotificationThreshold] = useState(state.profile.notification_threshold ?? 75);

  const handleFinish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const profileData = {
        first_name: state.profile.first_name,
        last_name: state.profile.last_name,
        location_preference: state.profile.location_preference,
        remote_preference: state.profile.remote_preference as "remote" | "hybrid" | "onsite" | "no_preference" | null | undefined,
        duration_preference: state.profile.duration_preference,
        paid_preference: state.profile.paid_preference,
        confidence_score: state.profile.confidence_score,
        email_notifications_enabled: emailNotifications,
        notification_threshold: notificationThreshold,
      };

      const skillsData = state.skills.map(s => ({
        skill_name: s.skill_name,
        source: s.source
      }));

      const projectsData = state.projects.map(p => ({
        project_name: p.project_name,
        description: p.description,
        technologies: p.technologies,
        source: p.source
      }));

      await ProfileService.saveOnboardingProfile(user.id, profileData, skillsData, projectsData);
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Profile Complete!</h2>
      <p className={styles.subtitle}>Here is what our AI extracted.</p>
      
      <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <h3>Skills:</h3>
        <ul>
          {state.skills.map((s, i) => <li key={i}>{s.skill_name} ({s.source})</li>)}
          {state.skills.length === 0 && <li>None detected</li>}
        </ul>
        <h3 style={{ marginTop: '1rem' }}>Projects:</h3>
        <ul>
          {state.projects.map((p, i) => <li key={i}>{p.project_name}</li>)}
          {state.projects.length === 0 && <li>None detected</li>}
        </ul>
        <h3 style={{ marginTop: '1rem' }}>Confidence Score:</h3>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar} style={{ width: `${state.profile.confidence_score || 0}%` }} />
        </div>
        <div className={styles.confidenceText}>{state.profile.confidence_score || 0}%</div>
      </div>

      <div style={{ textAlign: 'left', marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Notification Preferences</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <label htmlFor="emailNotif" style={{ cursor: 'pointer', fontWeight: 500 }}>Receive Email Matches</label>
          <input 
            type="checkbox" 
            id="emailNotif"
            checked={emailNotifications} 
            onChange={(e) => setEmailNotifications(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </div>

        {emailNotifications && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="threshold" style={{ fontWeight: 500 }}>
              Match Quality Threshold: {notificationThreshold}%
            </label>
            <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
              Only send emails for internships matching this score or higher.
            </p>
            <input 
              type="range" 
              id="threshold"
              min="50" max="90" step="5"
              value={notificationThreshold}
              onChange={(e) => setNotificationThreshold(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', marginTop: '0.5rem' }}
            />
          </div>
        )}
      </div>

      {error && <div className={styles.error} style={{marginBottom: '1rem'}}>{error}</div>}

      <button className={styles.primaryButton} onClick={handleFinish} disabled={isSaving}>
        {isSaving ? 'Saving Profile...' : 'Go to Dashboard'}
      </button>
    </div>
  );
}

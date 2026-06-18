import styles from './onboarding.module.css';
import { OnboardingState } from '../types';
import { useRouter } from 'next/navigation';

interface Props {
  state: OnboardingState;
}

export function ProfileReview({ state }: Props) {
  const router = useRouter();

  const handleFinish = () => {
    // Navigate to dashboard
    router.push('/dashboard');
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

      <button className={styles.primaryButton} onClick={handleFinish}>
        Go to Dashboard
      </button>
    </div>
  );
}

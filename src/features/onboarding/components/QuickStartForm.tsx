import styles from './onboarding.module.css';
import { useState } from 'react';

interface Props {
  onComplete: (mockData: any) => void;
  onBack: () => void;
}

export function QuickStartForm({ onComplete, onBack }: Props) {
  const [domain, setDomain] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      profile: { duration_preference: '3 months' },
      skills: [{ id: '3', skill_name: domain, source: 'manual' }],
      projects: []
    });
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Quick Start</h2>
      <p className={styles.subtitle}>Manually input your core interests.</p>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Primary Interest / Domain</label>
          <input 
            className={styles.input}
            type="text" 
            placeholder="e.g. Frontend Development, Data Science" 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
        </div>
        <button className={styles.primaryButton} type="submit">Continue</button>
      </form>
      <button className={styles.secondaryButton} onClick={onBack}>Back</button>
    </div>
  );
}

import styles from './onboarding.module.css';
import { useState } from 'react';

interface Props {
  onComplete: (mockData: any) => void;
  onBack: () => void;
}

export function LinkedInInput({ onComplete, onBack }: Props) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      onComplete({
        profile: { first_name: 'Student' },
        skills: [{ id: '2', skill_name: 'Python', source: 'linkedin' }],
        projects: []
      });
    }, 1500);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Connect LinkedIn</h2>
      <p className={styles.subtitle}>Paste your public profile URL.</p>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>LinkedIn URL</label>
          <input 
            className={styles.input}
            type="url" 
            placeholder="https://linkedin.com/in/username" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <button className={styles.primaryButton} type="submit" disabled={isProcessing}>
          {isProcessing ? 'Extracting Profile...' : 'Continue'}
        </button>
      </form>
      <button className={styles.secondaryButton} onClick={onBack} disabled={isProcessing}>Back</button>
    </div>
  );
}

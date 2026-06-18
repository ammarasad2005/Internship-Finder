import styles from './onboarding.module.css';
import { OnboardingMethod } from '../types';

interface Props {
  onSelect: (method: OnboardingMethod) => void;
}

export function MethodSelector({ onSelect }: Props) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>How would you like to start?</h2>
      <p className={styles.subtitle}>Choose a method to build your profile.</p>
      
      <div className={styles.methodGrid}>
        <button className={styles.methodButton} onClick={() => onSelect('resume')}>
          <span className={styles.methodTitle}>Upload Resume (PDF)</span>
          <span className={styles.methodDesc}>Fastest way to build a comprehensive profile.</span>
        </button>
        
        <button className={styles.methodButton} onClick={() => onSelect('linkedin')}>
          <span className={styles.methodTitle}>LinkedIn Profile URL</span>
          <span className={styles.methodDesc}>We'll extract your work history and skills.</span>
        </button>
        
        <button className={styles.methodButton} onClick={() => onSelect('quickstart')}>
          <span className={styles.methodTitle}>Quick Start</span>
          <span className={styles.methodDesc}>Manually enter a few core skills and preferences.</span>
        </button>
      </div>
    </div>
  );
}

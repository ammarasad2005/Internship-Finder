import styles from './ScoreBar.module.css';
import { getMatchQualityLabel } from '../types/ui';

interface ScoreBarProps {
  score: number | null;
}

function getTierClass(score: number | null): string {
  const label = getMatchQualityLabel(score);
  switch (label) {
    case 'Excellent Match': return 'excellent';
    case 'Strong Match': return 'strong';
    case 'Good Match': return 'good';
    case 'Possible Match': return 'possible';
    default: return 'low';
  }
}

export function ScoreBar({ score }: ScoreBarProps) {
  const tier = getTierClass(score);
  const displayScore = score ?? 0;
  const label = getMatchQualityLabel(score);

  return (
    <div>
      <div className={styles.meta}>
        <span className={`${styles.label} ${styles[tier]}`}>{label}</span>
        <span className={styles.score}>{displayScore}/100</span>
      </div>
      <div className={styles.bar} role="progressbar" aria-valuenow={displayScore} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`${styles.fill} ${styles[tier]}`}
          style={{ width: `${displayScore}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

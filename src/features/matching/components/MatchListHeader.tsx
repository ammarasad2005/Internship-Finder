import styles from './MatchListHeader.module.css';

interface MatchListHeaderProps {
  totalMatches: number;
  sessionId: string;
}

export function MatchListHeader({ totalMatches, sessionId: _sessionId }: MatchListHeaderProps) {
  const appliedCount = 0; // Will be reactive in Phase 15; server-rendered count here is initial snapshot
  
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>Your Matches</h1>
        <p className={styles.subtitle}>
          {totalMatches === 0
            ? 'No matches were found above the relevance threshold for this session.'
            : `${totalMatches} internship${totalMatches !== 1 ? 's' : ''} matched your profile`}
        </p>
      </div>

      {totalMatches > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalMatches}</span>
            <span className={styles.statLabel}>Matches</span>
          </div>
        </div>
      )}
    </div>
  );
}

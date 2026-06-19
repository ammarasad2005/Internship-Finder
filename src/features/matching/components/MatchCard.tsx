'use client';

import { useState } from 'react';
import { MatchWithInternship, UserFeedback } from '../types/ui';
import { ScoreBar } from './ScoreBar';
import { TagList } from './TagList';
import { FeedbackButtons } from './FeedbackButtons';
import styles from './MatchCard.module.css';

interface MatchCardProps {
  match: MatchWithInternship;
}

export function MatchCard({ match }: MatchCardProps) {
  // Local feedback state drives the card's visual state optimistically
  const [feedback, setFeedback] = useState<UserFeedback | null>(match.user_feedback);

  const { internship } = match;

  return (
    <article
      className={`${styles.card} ${feedback === 'rejected' ? styles.rejected : ''}`}
      aria-label={`Match: ${internship.role_title} at ${internship.company_name}`}
    >
      {/* Header: role, company, location */}
      <header className={styles.header}>
        <div className={styles.roleLine}>
          <h2 className={styles.roleTitle}>{internship.role_title}</h2>
          <span className={styles.companyName}>at {internship.company_name}</span>
        </div>
        {internship.location && (
          <span className={styles.locationBadge}>{internship.location}</span>
        )}
      </header>

      {/* Semantic score bar */}
      <div className={styles.scoreSection}>
        <ScoreBar score={match.semantic_score} />
      </div>

      {/* AI explanation */}
      {match.explanation && (
        <div className={styles.explanation}>
          <p className={styles.explanationLabel}>Why this matches you</p>
          <p>{match.explanation}</p>
        </div>
      )}

      {/* Matched skill tags */}
      <div>
        <p className={styles.tagsLabel}>Matched Skills</p>
        <TagList tags={internship.tags} />
      </div>

      <hr className={styles.divider} />

      {/* Feedback actions */}
      <div className={styles.actions}>
        <FeedbackButtons
          matchId={match.id}
          sessionId={match.session_id}
          applicationUrl={internship.application_url}
          initialFeedback={match.user_feedback}
          onFeedbackChange={setFeedback}
        />
      </div>

      {/* No application link notice */}
      {!internship.application_url && (
        <p className={styles.noLinkNotice}>
          No direct application link available — search for this role on the company's careers page.
        </p>
      )}
    </article>
  );
}

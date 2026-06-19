'use client';

import { useState, useTransition } from 'react';
import { recordMatchFeedback } from '../actions/feedback.action';
import { UserFeedback } from '../types/ui';
import styles from './FeedbackButtons.module.css';

interface FeedbackButtonsProps {
  matchId: string;
  sessionId: string;
  applicationUrl: string | null;
  initialFeedback: UserFeedback | null;
  /** Called when feedback state changes — allows parent MatchCard to react */
  onFeedbackChange: (newFeedback: UserFeedback | null) => void;
}

export function FeedbackButtons({
  matchId,
  sessionId,
  applicationUrl,
  initialFeedback,
  onFeedbackChange,
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<UserFeedback | null>(initialFeedback);
  const [isPending, startTransition] = useTransition();

  const handleFeedback = (newFeedback: UserFeedback | null) => {
    // Optimistic update: update local state immediately
    setFeedback(newFeedback);
    onFeedbackChange(newFeedback);

    startTransition(async () => {
      const result = await recordMatchFeedback(matchId, newFeedback, sessionId);
      if (!result.success) {
        // Revert on failure
        setFeedback(feedback);
        onFeedbackChange(feedback);
        console.error('[FeedbackButtons] Feedback failed:', result.error);
      }
    });
  };

  // Rejected state: show minimal undo-only UI
  if (feedback === 'rejected') {
    return (
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.undoBtn}`}
          onClick={() => handleFeedback(null)}
          disabled={isPending}
          aria-label="Undo rejection"
        >
          {isPending ? <span className={`${styles.spinner} ${styles.spinnerDark}`} /> : '↩'} Undo
        </button>
      </div>
    );
  }

  // Applied state: show badge + undo
  if (feedback === 'applied') {
    return (
      <div className={styles.actions}>
        <span className={styles.appliedBadge} role="status">
          ✓ Applied
        </span>
        <button
          className={`${styles.btn} ${styles.undoBtn}`}
          onClick={() => handleFeedback(null)}
          disabled={isPending}
          aria-label="Undo applied status"
        >
          {isPending ? <span className={`${styles.spinner} ${styles.spinnerDark}`} /> : 'Undo'}
        </button>
      </div>
    );
  }

  // Default / Saved state: show all action buttons
  return (
    <div className={styles.actions}>
      {/* Apply — opens application URL + records feedback */}
      {applicationUrl ? (
        <a
          href={applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.btn} ${styles.applyBtn}`}
          onClick={() => handleFeedback('applied')}
          aria-label="Apply to this internship"
        >
          {isPending ? <span className={styles.spinner} /> : null}
          Apply ↗
        </a>
      ) : (
        <button
          className={`${styles.btn} ${styles.applyBtn}`}
          onClick={() => handleFeedback('applied')}
          disabled={isPending}
          aria-label="Mark as applied"
        >
          {isPending ? <span className={styles.spinner} /> : null}
          Mark Applied
        </button>
      )}

      {/* Save */}
      <button
        className={`${styles.btn} ${styles.saveBtn} ${feedback === 'saved' ? styles.saved : ''}`}
        onClick={() => handleFeedback(feedback === 'saved' ? null : 'saved')}
        disabled={isPending}
        aria-label={feedback === 'saved' ? 'Remove from saved' : 'Save this internship'}
        aria-pressed={feedback === 'saved'}
      >
        {feedback === 'saved' ? '★ Saved' : '☆ Save'}
      </button>

      {/* Reject */}
      <button
        className={`${styles.btn} ${styles.rejectBtn}`}
        onClick={() => handleFeedback('rejected')}
        disabled={isPending}
        aria-label="Reject this match"
      >
        ✕ Not for me
      </button>
    </div>
  );
}

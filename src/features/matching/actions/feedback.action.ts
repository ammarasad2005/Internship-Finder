'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserFeedback } from '../types/ui';

/**
 * Records user feedback (applied / saved / rejected) on a match.
 *
 * Security: The UPDATE is filtered by both the match `id` AND
 * `profile_id = auth.uid()` (enforced by RLS), so a user can
 * never mutate another user's match row.
 *
 * Persistence rule: Only `user_feedback` is updated. All other
 * columns (semantic_score, explanation) are untouched.
 */
export async function recordMatchFeedback(
  matchId: string,
  feedback: UserFeedback | null,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('matches')
    .update({ user_feedback: feedback })
    .eq('id', matchId)
    .eq('profile_id', user.id); // Belt-and-suspenders on top of RLS

  if (error) {
    console.error('[feedback.action] Failed to record feedback:', error);
    return { success: false, error: error.message };
  }

  // Revalidate the matches page so any server-rendered data is fresh
  revalidatePath(`/dashboard/sessions/${sessionId}/matches`);

  return { success: true };
}

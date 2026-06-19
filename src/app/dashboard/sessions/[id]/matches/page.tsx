import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MatchService } from '@/features/matching/services/MatchService';
import { MatchListHeader } from '@/features/matching/components/MatchListHeader';
import { MatchCard } from '@/features/matching/components/MatchCard';
import styles from './matches.module.css';

export default async function MatchesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const matches = await MatchService.getSessionMatches(params.id, user.id);

  return (
    <div className={styles.container}>
      <div>
        <Link href={`/dashboard/sessions/${params.id}`} className={styles.backLink}>
          &larr; Back to Session
        </Link>
      </div>

      <MatchListHeader totalMatches={matches.length} sessionId={params.id} />

      {matches.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔍</span>
          <h3 className={styles.emptyTitle}>No Matches Found</h3>
          <p className={styles.emptyText}>
            We couldn't find any internships matching your profile for this session. Make sure your profile has complete details and tags.
          </p>
        </div>
      ) : (
        <div className={styles.matchList}>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

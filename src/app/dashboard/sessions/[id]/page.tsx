import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SessionDetail } from '@/features/research/components/SessionDetail';

export default async function SessionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return (
    <div style={{ width: '100%' }}>
      <SessionDetail sessionId={params.id} />
    </div>
  );
}

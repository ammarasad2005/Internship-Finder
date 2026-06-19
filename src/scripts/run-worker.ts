import { WorkerLifecycle } from '@/features/worker/core/WorkerLifecycle';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

async function main() {
  const args = process.argv.slice(2);
  let sessionId = '';
  let profileId = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sessionId' && i + 1 < args.length) {
      sessionId = args[i + 1];
    }
    if (args[i] === '--profileId' && i + 1 < args.length) {
      profileId = args[i + 1];
    }
  }

  if (!sessionId || !profileId) {
    console.error('Usage: run-worker.ts --sessionId <session-id> --profileId <profile-id>');
    process.exit(1);
  }

  console.log(`[Worker Script] Initializing execution...`);
  console.log(`- Session ID: ${sessionId}`);
  console.log(`- Profile ID: ${profileId}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in environment variables.');
    process.exit(1);
  }

  // Create privileged Supabase service-role client to bypass RLS policies
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  try {
    console.log(`[Worker Script] Executing WorkerLifecycle...`);
    await WorkerLifecycle.runSession(sessionId, profileId, supabase);
    console.log(`[Worker Script] WorkerLifecycle completed successfully.`);
    process.exit(0);
  } catch (error: any) {
    console.error(`[Worker Script] WorkerLifecycle encountered an error:`, error);
    process.exit(1);
  }
}

main();

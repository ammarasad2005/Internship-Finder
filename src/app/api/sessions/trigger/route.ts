import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId } = await request.json();
    if (!profileId || profileId !== user.id) {
      return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
    }

    // 1. Create a session in database with state 'pending'
    const { data: session, error: sessionError } = await supabase
      .from('search_sessions')
      .insert({ profile_id: profileId, status: 'pending' })
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: `Failed to create session: ${sessionError?.message}` }, { status: 500 });
    }

    // 2. Publish initial event
    await supabase.from('research_session_events').insert({
      session_id: session.id,
      event_type: 'session_created',
      message: 'Research session initialized and queued.',
    });

    // 3. Dispatch a GitHub repository_dispatch event
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const pat = process.env.GITHUB_PAT;

    if (!owner || !repo || !pat) {
      console.error('[API Trigger] GitHub dispatch credentials missing in environment.');
      return NextResponse.json({
        success: false,
        error: 'GitHub dispatcher configuration missing on server.',
        sessionId: session.id
      }, { status: 500 });
    }

    const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
    const response = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${pat}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'Internship-Finder-App'
      },
      body: JSON.stringify({
        event_type: 'trigger-worker',
        client_payload: {
          session_id: session.id,
          profile_id: profileId
        }
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('[API Trigger] GitHub dispatch failed:', response.status, responseText);
      return NextResponse.json({
        success: false,
        error: `GitHub Dispatch failed with status ${response.status}`,
        sessionId: session.id
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id
    });

  } catch (err: any) {
    console.error('[API Trigger] Error triggering session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

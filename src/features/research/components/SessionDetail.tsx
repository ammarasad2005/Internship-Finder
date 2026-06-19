'use client'

import { useEffect, useState } from 'react';
import { SessionService } from '../services/session.service';
import { ResearchSession, ResearchEvent } from '../types';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await SessionService.getSessionDetails(sessionId);
        setSession(data.session);
        setEvents(data.events);
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const supabase = createClient();
    
    // Subscribe to new events
    const eventSub = supabase.channel('events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'research_session_events', filter: `session_id=eq.${sessionId}` }, (payload) => {
        setEvents(prev => [...prev, payload.new as ResearchEvent]);
      }).subscribe();

    // Subscribe to session status changes
    const sessionSub = supabase.channel('session')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'search_sessions', filter: `id=eq.${sessionId}` }, (payload) => {
        setSession(payload.new as ResearchSession);
      }).subscribe();

    return () => {
      supabase.removeChannel(eventSub);
      supabase.removeChannel(sessionSub);
    };
  }, [sessionId]);

  if (loading) return <div>Loading session data...</div>;
  if (!session) return <div>Session not found.</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>&larr; Back to Dashboard</Link>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Research Session</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Status:</span>
          <span style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: session.status === 'completed' ? '#dcfce7' : session.status === 'failed' ? '#fee2e2' : session.status === 'running' ? '#dbeafe' : 'var(--border)',
            color: session.status === 'completed' ? '#166534' : session.status === 'failed' ? '#991b1b' : session.status === 'running' ? '#1e40af' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'uppercase'
          }}>
            {session.status}
          </span>
        </div>

        {session.status === 'completed' && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href={`/dashboard/sessions/${sessionId}/matches`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
            >
              View Matches &rarr;
            </Link>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Timeline Events</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        {events.length === 0 && <p style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Waiting for worker to start...</p>}
        {events.map((evt, idx) => (
          <div key={evt.id} style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
              {idx !== events.length - 1 && <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--border)', margin: '4px 0' }} />}
            </div>
            <div style={{ paddingBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                {new Date(evt.created_at).toLocaleTimeString()} - {evt.event_type}
              </p>
              <p style={{ color: 'var(--foreground)', fontSize: '0.875rem', fontWeight: 500 }}>{evt.message}</p>
            </div>
          </div>
        ))}
        {session.status === 'running' && (
          <div style={{ display: 'flex', gap: '1rem', opacity: 0.5 }}>
             <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
             <p style={{ fontSize: '0.875rem' }}>Worker is executing...</p>
          </div>
        )}
      </div>
    </div>
  );
}

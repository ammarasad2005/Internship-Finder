'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionService } from '../services/session.service';
import { MockWorker } from '@/features/worker/MockWorker';

export function StartSessionButton({ profileId }: { profileId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const session = await SessionService.createSession(profileId);
      // Simulate the worker picking it up immediately in the background
      MockWorker.start(session.id, profileId);
      // Redirect to the detail page
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleStart} 
      disabled={isLoading}
      style={{
        backgroundColor: 'var(--primary)',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        fontSize: '1rem',
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        width: '100%'
      }}
    >
      {isLoading ? 'Starting...' : 'Start New Discovery'}
    </button>
  );
}

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function StartSessionButton({ profileId }: { profileId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to trigger search session');
      }

      const data = await response.json();
      
      // Redirect to the detail page
      router.push(`/dashboard/sessions/${data.sessionId}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to start session');
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

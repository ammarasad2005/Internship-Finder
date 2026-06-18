import styles from './onboarding.module.css';
import { useState } from 'react';
import { OnboardingState } from '../types';

interface Props {
  state: OnboardingState;
  onComplete: (mockData: any) => void;
}

export function ConversationalUI({ state, onComplete }: Props) {
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: "Your profile is a bit light. To find the best internships, I need to know a bit more. What programming languages do you enjoy using the most?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "Great! I've added those to your profile. Let's review what we have so far." }]);
      
      // Complete conversation after one turn for mock
      setTimeout(() => {
        onComplete({
          skills: [{ id: '4', skill_name: 'JavaScript', source: 'ai_enrichment' }]
        });
      }, 1500);
    }, 1000);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Let's chat</h2>
      <p className={styles.subtitle}>Answer a few questions to complete your profile.</p>
      
      <div style={{ marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'ai' ? styles.chatBubbleAi : styles.chatBubbleUser}>
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          className={styles.input}
          style={{ flex: 1 }}
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
        />
        <button className={styles.primaryButton} style={{ width: 'auto', marginTop: 0 }} type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

import styles from './onboarding.module.css';
import { useState } from 'react';

interface Props {
  onComplete: (mockData: any) => void;
  onBack: () => void;
}

export function ResumeUpload({ onComplete, onBack }: Props) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    // Mock the upload and parsing delay
    setTimeout(() => {
      onComplete({
        profile: { first_name: 'Ammar', location_preference: 'Lahore' },
        skills: [{ id: '1', skill_name: 'React', source: 'resume_parse' }],
        projects: [{ id: '1', project_name: 'Portfolio', description: 'Next.js website', technologies: ['Next.js'], source: 'resume_parse' }]
      });
    }, 1500);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Upload Your Resume</h2>
      <p className={styles.subtitle}>We will securely extract your skills and projects.</p>
      
      <div className={styles.fileArea}>
        {isUploading ? 'Parsing document using AI...' : 'Drag and drop your PDF here, or click to browse.'}
      </div>
      
      <button 
        className={styles.primaryButton} 
        onClick={handleUpload} 
        disabled={isUploading}
      >
        {isUploading ? 'Processing...' : 'Upload File'}
      </button>
      <button className={styles.secondaryButton} onClick={onBack} disabled={isUploading}>Back</button>
    </div>
  );
}

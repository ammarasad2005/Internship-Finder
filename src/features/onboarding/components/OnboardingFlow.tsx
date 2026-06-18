'use client'

import styles from './onboarding.module.css';
import { useState } from 'react';
import { OnboardingState, OnboardingMethod } from '../types';
import { calculateConfidenceScore, CONFIDENCE_THRESHOLD } from '../utils/confidenceScore';

import { MethodSelector } from './MethodSelector';
import { ResumeUpload } from './ResumeUpload';
import { LinkedInInput } from './LinkedInInput';
import { QuickStartForm } from './QuickStartForm';
import { ConversationalUI } from './ConversationalUI';
import { ProfileReview } from './ProfileReview';

export function OnboardingFlow() {
  const [state, setState] = useState<OnboardingState>({
    method: null,
    profile: { confidence_score: 0 },
    skills: [],
    projects: [],
    step: 'method_selection'
  });

  const handleMethodSelect = (method: OnboardingMethod) => {
    setState(s => ({ ...s, method, step: 'data_collection' }));
  };

  const handleDataCollected = (mockData: any) => {
    const newProfile = { ...state.profile, ...mockData.profile };
    const newSkills = [...state.skills, ...(mockData.skills || [])];
    const newProjects = [...state.projects, ...(mockData.projects || [])];
    
    const score = calculateConfidenceScore(newProfile, newSkills, newProjects);
    newProfile.confidence_score = score;

    if (score >= CONFIDENCE_THRESHOLD) {
      setState(s => ({ ...s, profile: newProfile, skills: newSkills, projects: newProjects, step: 'review' }));
    } else {
      setState(s => ({ ...s, profile: newProfile, skills: newSkills, projects: newProjects, step: 'conversational_enrichment' }));
    }
  };

  const handleConversationalEnrichment = (mockData: any) => {
    const newSkills = [...state.skills, ...(mockData.skills || [])];
    const score = calculateConfidenceScore(state.profile, newSkills, state.projects);
    const newProfile = { ...state.profile, confidence_score: score };

    setState(s => ({ ...s, profile: newProfile, skills: newSkills, step: 'review' }));
  };

  const handleBack = () => {
    setState(s => ({ ...s, method: null, step: 'method_selection' }));
  };

  return (
    <div className={styles.container}>
      {state.step === 'method_selection' && (
        <MethodSelector onSelect={handleMethodSelect} />
      )}

      {state.step === 'data_collection' && state.method === 'resume' && (
        <ResumeUpload onComplete={handleDataCollected} onBack={handleBack} />
      )}
      
      {state.step === 'data_collection' && state.method === 'linkedin' && (
        <LinkedInInput onComplete={handleDataCollected} onBack={handleBack} />
      )}

      {state.step === 'data_collection' && state.method === 'quickstart' && (
        <QuickStartForm onComplete={handleDataCollected} onBack={handleBack} />
      )}

      {state.step === 'conversational_enrichment' && (
        <ConversationalUI state={state} onComplete={handleConversationalEnrichment} />
      )}

      {state.step === 'review' && (
        <ProfileReview state={state} />
      )}
    </div>
  );
}

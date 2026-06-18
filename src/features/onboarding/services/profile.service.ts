import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type SkillInsert = Database['public']['Tables']['profile_skills']['Insert'];
type ProjectInsert = Database['public']['Tables']['profile_projects']['Insert'];

export class ProfileService {
  /**
   * Persists the fully constructed profile, skills, and projects to Supabase.
   */
  static async saveOnboardingProfile(
    userId: string,
    profileData: Partial<ProfileInsert>,
    skillsData: Omit<SkillInsert, 'profile_id'>[],
    projectsData: Omit<ProjectInsert, 'profile_id'>[]
  ) {
    const supabase = createClient();

    // 1. Upsert Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw new Error(`Profile save failed: ${profileError.message}`);

    // 2. Insert Skills (delete existing to prevent duplicates during testing)
    await supabase.from('profile_skills').delete().eq('profile_id', userId);
    
    if (skillsData.length > 0) {
      const skillsToInsert = skillsData.map(s => ({ ...s, profile_id: userId }));
      const { error: skillsError } = await supabase
        .from('profile_skills')
        .insert(skillsToInsert);
      
      if (skillsError) throw new Error(`Skills save failed: ${skillsError.message}`);
    }

    // 3. Insert Projects
    await supabase.from('profile_projects').delete().eq('profile_id', userId);
    
    if (projectsData.length > 0) {
      const projectsToInsert = projectsData.map(p => ({ ...p, profile_id: userId }));
      const { error: projectsError } = await supabase
        .from('profile_projects')
        .insert(projectsToInsert);
      
      if (projectsError) throw new Error(`Projects save failed: ${projectsError.message}`);
    }

    return true;
  }

  /**
   * Fetches the user's complete profile from the database.
   */
  static async getProfile(userId: string) {
    const supabase = createClient();
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) return null;

    const { data: skills } = await supabase
      .from('profile_skills')
      .select('*')
      .eq('profile_id', userId);

    const { data: projects } = await supabase
      .from('profile_projects')
      .select('*')
      .eq('profile_id', userId);

    return { profile, skills: skills || [], projects: projects || [] };
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Enums: {
      search_session_status: 'pending' | 'in_progress' | 'completed' | 'failed'
      remote_preference_type: 'remote' | 'hybrid' | 'onsite' | 'no_preference'
      source_type_enum: 'official_career_page' | 'job_board' | 'linkedin' | 'other'
      cache_type_enum: 'domain_expansion' | 'resume_parse' | 'skill_extraction' | 'other'
      user_feedback_type: 'applied' | 'rejected' | 'saved'
    }
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          location_preference: string | null
          remote_preference: Database['public']['Enums']['remote_preference_type'] | null
          duration_preference: string | null
          paid_preference: boolean | null
          confidence_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          location_preference?: string | null
          remote_preference?: Database['public']['Enums']['remote_preference_type'] | null
          duration_preference?: string | null
          paid_preference?: boolean | null
          confidence_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          location_preference?: string | null
          remote_preference?: Database['public']['Enums']['remote_preference_type'] | null
          duration_preference?: string | null
          paid_preference?: boolean | null
          confidence_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      profile_skills: {
        Row: {
          id: string
          profile_id: string
          skill_name: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          skill_name: string
          source: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          skill_name?: string
          source?: string
          created_at?: string
        }
      }
      profile_projects: {
        Row: {
          id: string
          profile_id: string
          project_name: string
          description: string | null
          technologies: string[] | null
          project_url: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          project_name: string
          description?: string | null
          technologies?: string[] | null
          project_url?: string | null
          source: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          project_name?: string
          description?: string | null
          technologies?: string[] | null
          project_url?: string | null
          source?: string
          created_at?: string
        }
      }
    }
  }
}

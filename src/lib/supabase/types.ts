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
      search_session_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
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
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
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
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
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
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
      }
      search_sessions: {
        Row: {
          id: string
          profile_id: string
          status: Database['public']['Enums']['search_session_status']
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          status?: Database['public']['Enums']['search_session_status']
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          status?: Database['public']['Enums']['search_session_status']
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
      }
      internships: {
        Row: {
          id: string
          canonical_key: string
          company_name: string
          role_title: string
          location: string | null
          description: string | null
          application_url: string | null
          tags: string[] | null
          is_active: boolean
          discovered_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          canonical_key: string
          company_name: string
          role_title: string
          location?: string | null
          description?: string | null
          application_url?: string | null
          tags?: string[] | null
          is_active?: boolean
          discovered_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          canonical_key?: string
          company_name?: string
          role_title?: string
          location?: string | null
          description?: string | null
          application_url?: string | null
          tags?: string[] | null
          is_active?: boolean
          discovered_at?: string
          updated_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
      }
      internship_sources: {
        Row: {
          id: string
          internship_id: string
          source_url: string
          source_type: Database['public']['Enums']['source_type_enum']
          is_primary: boolean
          first_seen_at: string
        }
        Insert: {
          id?: string
          internship_id: string
          source_url: string
          source_type: Database['public']['Enums']['source_type_enum']
          is_primary?: boolean
          first_seen_at?: string
        }
        Update: {
          id?: string
          internship_id?: string
          source_url?: string
          source_type?: Database['public']['Enums']['source_type_enum']
          is_primary?: boolean
          first_seen_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
      }
      matches: {
        Row: {
          id: string
          profile_id: string
          internship_id: string
          session_id: string
          semantic_score: number | null
          explanation: string | null
          user_feedback: Database['public']['Enums']['user_feedback_type'] | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          internship_id: string
          session_id: string
          semantic_score?: number | null
          explanation?: string | null
          user_feedback?: Database['public']['Enums']['user_feedback_type'] | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          internship_id?: string
          session_id?: string
          semantic_score?: number | null
          explanation?: string | null
          user_feedback?: Database['public']['Enums']['user_feedback_type'] | null
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

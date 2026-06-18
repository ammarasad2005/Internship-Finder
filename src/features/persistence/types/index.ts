export interface InternshipRow {
  canonical_key: string;
  company_name: string;
  role_title: string;
  location: string;
  description: string;
  tags: string[];
  is_active: boolean;
  // Let Supabase handle discovered_at and updated_at
}

export interface InternshipSourceRow {
  internship_id: string;
  source_url: string;
  source_type: 'official_career_page' | 'job_board' | 'linkedin' | 'other';
  is_primary: boolean;
  // Let Supabase handle first_seen_at
}

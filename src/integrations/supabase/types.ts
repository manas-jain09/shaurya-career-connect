export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      class_x_details: {
        Row: {
          board: string
          cgpa_scale: number | null
          created_at: string
          id: string
          is_cgpa: boolean
          marks: number
          marksheet_url: string | null
          passing_year: number
          school_name: string
          student_id: string
          updated_at: string
        }
        Insert: {
          board: string
          cgpa_scale?: number | null
          created_at?: string
          id?: string
          is_cgpa?: boolean
          marks: number
          marksheet_url?: string | null
          passing_year: number
          school_name: string
          student_id: string
          updated_at?: string
        }
        Update: {
          board?: string
          cgpa_scale?: number | null
          created_at?: string
          id?: string
          is_cgpa?: boolean
          marks?: number
          marksheet_url?: string | null
          passing_year?: number
          school_name?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_x_details_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_xii_details: {
        Row: {
          board: string
          cgpa_scale: number | null
          created_at: string
          id: string
          is_cgpa: boolean
          marks: number
          marksheet_url: string | null
          passing_year: number
          school_name: string
          student_id: string
          updated_at: string
        }
        Insert: {
          board: string
          cgpa_scale?: number | null
          created_at?: string
          id?: string
          is_cgpa?: boolean
          marks: number
          marksheet_url?: string | null
          passing_year: number
          school_name: string
          student_id: string
          updated_at?: string
        }
        Update: {
          board?: string
          cgpa_scale?: number | null
          created_at?: string
          id?: string
          is_cgpa?: boolean
          marks?: number
          marksheet_url?: string | null
          passing_year?: number
          school_name?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_xii_details_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_code: string
          created_at: string
          id: string
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          company_code: string
          created_at?: string
          id?: string
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          company_code?: string
          created_at?: string
          id?: string
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      graduation_details: {
        Row: {
          cgpa_scale: number | null
          college_name: string
          course: string
          created_at: string
          division: string | null
          has_backlog: boolean
          id: string
          is_cgpa: boolean
          marks: number
          marksheet_url: string | null
          passing_year: number
          student_id: string
          updated_at: string
        }
        Insert: {
          cgpa_scale?: number | null
          college_name: string
          course: string
          created_at?: string
          division?: string | null
          has_backlog?: boolean
          id?: string
          is_cgpa?: boolean
          marks: number
          marksheet_url?: string | null
          passing_year: number
          student_id: string
          updated_at?: string
        }
        Update: {
          cgpa_scale?: number | null
          college_name?: string
          course?: string
          created_at?: string
          division?: string | null
          has_backlog?: boolean
          id?: string
          is_cgpa?: boolean
          marks?: number
          marksheet_url?: string | null
          passing_year?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graduation_details_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          job_id: string
          offer_letter_url: string | null
          resume_url: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          job_id: string
          offer_letter_url?: string | null
          resume_url?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          job_id?: string
          offer_letter_url?: string | null
          resume_url?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          allow_backlog: boolean
          application_deadline: string
          cgpa_scale: number | null
          company_code: string | null
          company_id: string | null
          company_name: string
          created_at: string
          description: string
          eligible_courses: string[] | null
          eligible_passing_years: number[] | null
          id: string
          location: string
          min_class_x_cgpa: number | null
          min_class_x_marks: number | null
          min_class_xii_cgpa: number | null
          min_class_xii_marks: number | null
          min_graduation_cgpa: number | null
          min_graduation_marks: number | null
          package: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_backlog?: boolean
          application_deadline: string
          cgpa_scale?: number | null
          company_code?: string | null
          company_id?: string | null
          company_name: string
          created_at?: string
          description: string
          eligible_courses?: string[] | null
          eligible_passing_years?: number[] | null
          id?: string
          location: string
          min_class_x_cgpa?: number | null
          min_class_x_marks?: number | null
          min_class_xii_cgpa?: number | null
          min_class_xii_marks?: number | null
          min_graduation_cgpa?: number | null
          min_graduation_marks?: number | null
          package: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_backlog?: boolean
          application_deadline?: string
          cgpa_scale?: number | null
          company_code?: string | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          description?: string
          eligible_courses?: string[] | null
          eligible_passing_years?: number[] | null
          id?: string
          location?: string
          min_class_x_cgpa?: number | null
          min_class_x_marks?: number | null
          min_class_xii_cgpa?: number | null
          min_class_xii_marks?: number | null
          min_graduation_cgpa?: number | null
          min_graduation_marks?: number | null
          package?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          file_url: string
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          address: string | null
          agreed_to_policies: boolean | null
          created_at: string
          department: string | null
          dob: string
          first_name: string
          flagged_sections: string[] | null
          gender: string
          id: string
          is_blocked: boolean | null
          is_eligible: boolean | null
          is_frozen: boolean | null
          is_verified: boolean
          last_name: string
          phone: string
          placement_interest: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string
        }
        Insert: {
          address?: string | null
          agreed_to_policies?: boolean | null
          created_at?: string
          department?: string | null
          dob: string
          first_name: string
          flagged_sections?: string[] | null
          gender: string
          id?: string
          is_blocked?: boolean | null
          is_eligible?: boolean | null
          is_frozen?: boolean | null
          is_verified?: boolean
          last_name: string
          phone: string
          placement_interest?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
        }
        Update: {
          address?: string | null
          agreed_to_policies?: boolean | null
          created_at?: string
          department?: string | null
          dob?: string
          first_name?: string
          flagged_sections?: string[] | null
          gender?: string
          id?: string
          is_blocked?: boolean | null
          is_eligible?: boolean | null
          is_frozen?: boolean | null
          is_verified?: boolean
          last_name?: string
          phone?: string
          placement_interest?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          password: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_job_eligibility: {
        Args: { p_student_id: string; p_job_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

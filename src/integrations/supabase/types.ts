export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          doctor_id: string
          fee: number
          id: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id: string
          fee: number
          id?: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string
          fee?: number
          id?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_specializations: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon_name: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          about: string | null
          admin_notes: string | null
          appointment_duration: number | null
          areas_of_expertise: string[] | null
          availability: string | null
          available_days: string[] | null
          available_time_end: string | null
          available_time_start: string | null
          bio: string | null
          city: string | null
          clinic_address: string | null
          clinic_name: string | null
          cnic_url: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string
          date_of_birth: string | null
          degree_certificate_url: string | null
          email: string | null
          emergency_available: boolean | null
          experience_years: number | null
          followup_fee: number | null
          full_name: string
          gender: string | null
          hospital_name: string | null
          id: string
          is_featured: boolean | null
          languages_spoken: string[] | null
          online_consultation_fee: number | null
          phone: string | null
          photo_url: string | null
          pmc_certificate_url: string | null
          pmc_number: string
          preferred_platform: string | null
          privacy_accepted: boolean | null
          qualification: string | null
          rating: number | null
          registration_council: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          services_offered: string[] | null
          specialization_id: string | null
          status: string
          sub_specialty: string | null
          terms_accepted: boolean | null
          updated_at: string
          user_id: string | null
          video_consultation: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          about?: string | null
          admin_notes?: string | null
          appointment_duration?: number | null
          areas_of_expertise?: string[] | null
          availability?: string | null
          available_days?: string[] | null
          available_time_end?: string | null
          available_time_start?: string | null
          bio?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          cnic_url?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          degree_certificate_url?: string | null
          email?: string | null
          emergency_available?: boolean | null
          experience_years?: number | null
          followup_fee?: number | null
          full_name: string
          gender?: string | null
          hospital_name?: string | null
          id?: string
          is_featured?: boolean | null
          languages_spoken?: string[] | null
          online_consultation_fee?: number | null
          phone?: string | null
          photo_url?: string | null
          pmc_certificate_url?: string | null
          pmc_number: string
          preferred_platform?: string | null
          privacy_accepted?: boolean | null
          qualification?: string | null
          rating?: number | null
          registration_council?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          specialization_id?: string | null
          status?: string
          sub_specialty?: string | null
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string | null
          video_consultation?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          about?: string | null
          admin_notes?: string | null
          appointment_duration?: number | null
          areas_of_expertise?: string[] | null
          availability?: string | null
          available_days?: string[] | null
          available_time_end?: string | null
          available_time_start?: string | null
          bio?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          cnic_url?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          degree_certificate_url?: string | null
          email?: string | null
          emergency_available?: boolean | null
          experience_years?: number | null
          followup_fee?: number | null
          full_name?: string
          gender?: string | null
          hospital_name?: string | null
          id?: string
          is_featured?: boolean | null
          languages_spoken?: string[] | null
          online_consultation_fee?: number | null
          phone?: string | null
          photo_url?: string | null
          pmc_certificate_url?: string | null
          pmc_number?: string
          preferred_platform?: string | null
          privacy_accepted?: boolean | null
          qualification?: string | null
          rating?: number | null
          registration_council?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          specialization_id?: string | null
          status?: string
          sub_specialty?: string | null
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string | null
          video_consultation?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "doctor_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          created_at: string
          discounted_price: number | null
          id: string
          is_available: boolean | null
          lab_id: string
          price: number
          test_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discounted_price?: number | null
          id?: string
          is_available?: boolean | null
          lab_id: string
          price: number
          test_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discounted_price?: number | null
          id?: string
          is_available?: boolean | null
          lab_id?: string
          price?: number
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_tests_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          branches: Json | null
          cities: string[] | null
          closing_time: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          featured_order: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          name: string
          opening_time: string | null
          popular_tests: string[] | null
          rating: number | null
          review_count: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          branches?: Json | null
          cities?: string[] | null
          closing_time?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          featured_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          opening_time?: string | null
          popular_tests?: string[] | null
          rating?: number | null
          review_count?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          branches?: Json | null
          cities?: string[] | null
          closing_time?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          featured_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          opening_time?: string | null
          popular_tests?: string[] | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          availed_at: string | null
          created_at: string
          discount_percentage: number | null
          discounted_total: number
          id: string
          is_availed: boolean | null
          lab_id: string
          notes: string | null
          original_total: number
          pdf_url: string | null
          prescription_id: string | null
          qr_code_url: string | null
          status: Database["public"]["Enums"]["order_status"]
          tests: Json
          unique_id: string
          updated_at: string
          user_id: string
          validity_date: string
        }
        Insert: {
          availed_at?: string | null
          created_at?: string
          discount_percentage?: number | null
          discounted_total: number
          id?: string
          is_availed?: boolean | null
          lab_id: string
          notes?: string | null
          original_total: number
          pdf_url?: string | null
          prescription_id?: string | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tests?: Json
          unique_id: string
          updated_at?: string
          user_id: string
          validity_date: string
        }
        Update: {
          availed_at?: string | null
          created_at?: string
          discount_percentage?: number | null
          discounted_total?: number
          id?: string
          is_availed?: boolean | null
          lab_id?: string
          notes?: string | null
          original_total?: number
          pdf_url?: string | null
          prescription_id?: string | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tests?: Json
          unique_id?: string
          updated_at?: string
          user_id?: string
          validity_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          admin_notes: string | null
          approved_tests: Json | null
          created_at: string
          id: string
          image_url: string
          lab_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["prescription_status"]
          unique_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_tests?: Json | null
          created_at?: string
          id?: string
          image_url: string
          lab_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          unique_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_tests?: Json | null
          created_at?: string
          id?: string
          image_url?: string
          lab_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          unique_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          gender: string | null
          id: string
          medical_history: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_history?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_history?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_cards: {
        Row: {
          bg_color: string | null
          created_at: string
          display_order: number | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          created_at?: string
          display_order?: number | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          created_at?: string
          display_order?: number | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          display_order: number | null
          doctor_discount_percentage: number | null
          hospital_discount_percentage: number | null
          id: string
          image_position_x: number | null
          image_position_y: number | null
          image_url: string | null
          is_active: boolean | null
          name: string
          price_range: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          doctor_discount_percentage?: number | null
          hospital_discount_percentage?: number | null
          id?: string
          image_position_x?: number | null
          image_position_y?: number | null
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_range?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          doctor_discount_percentage?: number | null
          hospital_discount_percentage?: number | null
          id?: string
          image_position_x?: number | null
          image_position_y?: number | null
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_range?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      surgery_inquiries: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          phone: string
          question: string | null
          status: string
          surgery_id: string | null
          surgery_name: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          question?: string | null
          status?: string
          surgery_id?: string | null
          surgery_name: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          question?: string | null
          status?: string
          surgery_id?: string | null
          surgery_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgery_inquiries_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sample_type: string | null
          slug: string
          turnaround_time: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sample_type?: string | null
          slug: string
          turnaround_time?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sample_type?: string | null
          slug?: string
          turnaround_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "patient" | "lab" | "moderator" | "lab_admin"
      appointment_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      consultation_type: "physical" | "online"
      order_status: "pending" | "confirmed" | "completed" | "cancelled"
      prescription_status: "pending_review" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "patient", "lab", "moderator", "lab_admin"],
      appointment_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      consultation_type: ["physical", "online"],
      order_status: ["pending", "confirmed", "completed", "cancelled"],
      prescription_status: ["pending_review", "approved", "rejected"],
    },
  },
} as const

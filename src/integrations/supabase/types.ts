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
          consultation_notes: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          doctor_id: string
          fee: number
          id: string
          notes: string | null
          patient_id: string
          prescription_uploaded_at: string | null
          prescription_url: string | null
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
          consultation_notes?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id: string
          fee: number
          id?: string
          notes?: string | null
          patient_id: string
          prescription_uploaded_at?: string | null
          prescription_url?: string | null
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
          consultation_notes?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string
          fee?: number
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_uploaded_at?: string | null
          prescription_url?: string | null
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
      cities: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          province_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          province_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          province_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
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
          featured_order: number | null
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
          featured_order?: number | null
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
          featured_order?: number | null
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
      emergency_nursing_requests: {
        Row: {
          accepted_nurse_id: string | null
          accepted_offer_id: string | null
          admin_notes: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          city: string | null
          completed_at: string | null
          created_at: string
          id: string
          location_address: string | null
          location_lat: number
          location_lng: number
          notes: string | null
          patient_id: string
          patient_name: string
          patient_offer_price: number | null
          patient_phone: string
          patient_rating: number | null
          patient_review: string | null
          services_needed: string[]
          status: Database["public"]["Enums"]["emergency_request_status"]
          tip_amount: number | null
          updated_at: string
          urgency: Database["public"]["Enums"]["emergency_urgency"]
        }
        Insert: {
          accepted_nurse_id?: string | null
          accepted_offer_id?: string | null
          admin_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          location_address?: string | null
          location_lat: number
          location_lng: number
          notes?: string | null
          patient_id: string
          patient_name: string
          patient_offer_price?: number | null
          patient_phone: string
          patient_rating?: number | null
          patient_review?: string | null
          services_needed?: string[]
          status?: Database["public"]["Enums"]["emergency_request_status"]
          tip_amount?: number | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["emergency_urgency"]
        }
        Update: {
          accepted_nurse_id?: string | null
          accepted_offer_id?: string | null
          admin_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          location_address?: string | null
          location_lat?: number
          location_lng?: number
          notes?: string | null
          patient_id?: string
          patient_name?: string
          patient_offer_price?: number | null
          patient_phone?: string
          patient_rating?: number | null
          patient_review?: string | null
          services_needed?: string[]
          status?: Database["public"]["Enums"]["emergency_request_status"]
          tip_amount?: number | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["emergency_urgency"]
        }
        Relationships: []
      }
      hero_settings: {
        Row: {
          background_gradient: string | null
          badge_text: string | null
          content_ratio: number | null
          created_at: string
          hero_alignment: string | null
          hero_border_radius: number | null
          hero_image_url: string | null
          hero_margin_bottom: number | null
          hero_margin_top: number | null
          hero_max_width: number | null
          hero_min_height: number | null
          hero_padding_x: number | null
          hero_padding_y: number | null
          hero_shadow_intensity: number | null
          id: string
          image_blend_mode: string | null
          image_fade_intensity: number | null
          image_gradient_direction: string | null
          image_height: number | null
          image_mask_type: string | null
          image_overlay_color: string | null
          image_overlay_opacity: number | null
          image_position_x: number | null
          image_position_y: number | null
          image_soft_edges: boolean | null
          image_width: number | null
          is_active: boolean | null
          page_background_color: string | null
          search_placeholder: string | null
          title_highlight: string
          title_line1: string
          title_line2: string
          trust_badges: Json | null
          typing_words: string[] | null
          updated_at: string
        }
        Insert: {
          background_gradient?: string | null
          badge_text?: string | null
          content_ratio?: number | null
          created_at?: string
          hero_alignment?: string | null
          hero_border_radius?: number | null
          hero_image_url?: string | null
          hero_margin_bottom?: number | null
          hero_margin_top?: number | null
          hero_max_width?: number | null
          hero_min_height?: number | null
          hero_padding_x?: number | null
          hero_padding_y?: number | null
          hero_shadow_intensity?: number | null
          id?: string
          image_blend_mode?: string | null
          image_fade_intensity?: number | null
          image_gradient_direction?: string | null
          image_height?: number | null
          image_mask_type?: string | null
          image_overlay_color?: string | null
          image_overlay_opacity?: number | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_soft_edges?: boolean | null
          image_width?: number | null
          is_active?: boolean | null
          page_background_color?: string | null
          search_placeholder?: string | null
          title_highlight?: string
          title_line1?: string
          title_line2?: string
          trust_badges?: Json | null
          typing_words?: string[] | null
          updated_at?: string
        }
        Update: {
          background_gradient?: string | null
          badge_text?: string | null
          content_ratio?: number | null
          created_at?: string
          hero_alignment?: string | null
          hero_border_radius?: number | null
          hero_image_url?: string | null
          hero_margin_bottom?: number | null
          hero_margin_top?: number | null
          hero_max_width?: number | null
          hero_min_height?: number | null
          hero_padding_x?: number | null
          hero_padding_y?: number | null
          hero_shadow_intensity?: number | null
          id?: string
          image_blend_mode?: string | null
          image_fade_intensity?: number | null
          image_gradient_direction?: string | null
          image_height?: number | null
          image_mask_type?: string | null
          image_overlay_color?: string | null
          image_overlay_opacity?: number | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_soft_edges?: boolean | null
          image_width?: number | null
          is_active?: boolean | null
          page_background_color?: string | null
          search_placeholder?: string | null
          title_highlight?: string
          title_line1?: string
          title_line2?: string
          trust_badges?: Json | null
          typing_words?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          accent_color: string | null
          background_color: string | null
          background_gradient: string | null
          card_border_radius: number | null
          card_height: number | null
          card_shadow: string | null
          card_width: string | null
          columns_desktop: number | null
          columns_mobile: number | null
          columns_tablet: number | null
          created_at: string
          custom_content: Json | null
          display_order: number | null
          id: string
          image_border_radius: number | null
          image_fit: string | null
          image_height: number | null
          image_position_x: number | null
          image_position_y: number | null
          image_width: string | null
          is_visible: boolean | null
          items_gap: number | null
          max_items: number | null
          section_key: string
          section_padding_x: number | null
          section_padding_y: number | null
          section_type: string | null
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          background_gradient?: string | null
          card_border_radius?: number | null
          card_height?: number | null
          card_shadow?: string | null
          card_width?: string | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          columns_tablet?: number | null
          created_at?: string
          custom_content?: Json | null
          display_order?: number | null
          id?: string
          image_border_radius?: number | null
          image_fit?: string | null
          image_height?: number | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_width?: string | null
          is_visible?: boolean | null
          items_gap?: number | null
          max_items?: number | null
          section_key: string
          section_padding_x?: number | null
          section_padding_y?: number | null
          section_type?: string | null
          subtitle?: string | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          background_gradient?: string | null
          card_border_radius?: number | null
          card_height?: number | null
          card_shadow?: string | null
          card_width?: string | null
          columns_desktop?: number | null
          columns_mobile?: number | null
          columns_tablet?: number | null
          created_at?: string
          custom_content?: Json | null
          display_order?: number | null
          id?: string
          image_border_radius?: number | null
          image_fit?: string | null
          image_height?: number | null
          image_position_x?: number | null
          image_position_y?: number | null
          image_width?: string | null
          is_visible?: boolean | null
          items_gap?: number | null
          max_items?: number | null
          section_key?: string
          section_padding_x?: number | null
          section_padding_y?: number | null
          section_type?: string | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hospital_doctors: {
        Row: {
          created_at: string
          department: string | null
          doctor_id: string
          end_year: number | null
          hospital_id: string
          id: string
          is_current: boolean | null
          is_primary: boolean | null
          schedule: string | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          doctor_id: string
          end_year?: number | null
          hospital_id: string
          id?: string
          is_current?: boolean | null
          is_primary?: boolean | null
          schedule?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          doctor_id?: string
          end_year?: number | null
          hospital_id?: string
          id?: string
          is_current?: boolean | null
          is_primary?: boolean | null
          schedule?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          bed_count: number | null
          city: string | null
          closing_time: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          departments: string[] | null
          description: string | null
          display_order: number | null
          emergency_available: boolean | null
          facilities: string[] | null
          featured_order: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          name: string
          opening_time: string | null
          rating: number | null
          review_count: number | null
          slug: string
          specialties: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bed_count?: number | null
          city?: string | null
          closing_time?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          departments?: string[] | null
          description?: string | null
          display_order?: number | null
          emergency_available?: boolean | null
          facilities?: string[] | null
          featured_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          opening_time?: string | null
          rating?: number | null
          review_count?: number | null
          slug: string
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bed_count?: number | null
          city?: string | null
          closing_time?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          departments?: string[] | null
          description?: string | null
          display_order?: number | null
          emergency_available?: boolean | null
          facilities?: string[] | null
          featured_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          opening_time?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
      medical_stores: {
        Row: {
          admin_notes: string | null
          area: string
          city: string
          closing_time: string | null
          cnic: string | null
          cover_image_url: string | null
          created_at: string
          delivery_available: boolean | null
          email: string | null
          featured_order: number | null
          full_address: string
          google_maps_url: string | null
          id: string
          is_24_hours: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          license_number: string
          location_lat: number | null
          location_lng: number | null
          logo_url: string | null
          name: string
          opening_time: string | null
          owner_name: string
          phone: string
          rating: number | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          area: string
          city: string
          closing_time?: string | null
          cnic?: string | null
          cover_image_url?: string | null
          created_at?: string
          delivery_available?: boolean | null
          email?: string | null
          featured_order?: number | null
          full_address: string
          google_maps_url?: string | null
          id?: string
          is_24_hours?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          license_number: string
          location_lat?: number | null
          location_lng?: number | null
          logo_url?: string | null
          name: string
          opening_time?: string | null
          owner_name: string
          phone: string
          rating?: number | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          area?: string
          city?: string
          closing_time?: string | null
          cnic?: string | null
          cover_image_url?: string | null
          created_at?: string
          delivery_available?: boolean | null
          email?: string | null
          featured_order?: number | null
          full_address?: string
          google_maps_url?: string | null
          id?: string
          is_24_hours?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          license_number?: string
          location_lat?: number | null
          location_lng?: number | null
          logo_url?: string | null
          name?: string
          opening_time?: string | null
          owner_name?: string
          phone?: string
          rating?: number | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      medicine_orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          dispatched_at: string | null
          estimated_delivery_time: string | null
          estimated_price: number | null
          final_price: number | null
          id: string
          medicines: Json | null
          notes: string | null
          pharmacy_confirmed_at: string | null
          pharmacy_notes: string | null
          prepared_at: string | null
          prescription_url: string | null
          status: string
          store_id: string
          unique_id: string
          updated_at: string
          user_confirmed_at: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          dispatched_at?: string | null
          estimated_delivery_time?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          medicines?: Json | null
          notes?: string | null
          pharmacy_confirmed_at?: string | null
          pharmacy_notes?: string | null
          prepared_at?: string | null
          prescription_url?: string | null
          status?: string
          store_id: string
          unique_id: string
          updated_at?: string
          user_confirmed_at?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          dispatched_at?: string | null
          estimated_delivery_time?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          medicines?: Json | null
          notes?: string | null
          pharmacy_confirmed_at?: string | null
          pharmacy_notes?: string | null
          prepared_at?: string | null
          prescription_url?: string | null
          status?: string
          store_id?: string
          unique_id?: string
          updated_at?: string
          user_confirmed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "medical_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_bookings: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          notes: string | null
          nurse_id: string
          nurse_notes: string | null
          patient_address: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string
          preferred_date: string
          preferred_time: string
          service_needed: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          nurse_id: string
          nurse_notes?: string | null
          patient_address?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone: string
          preferred_date: string
          preferred_time: string
          service_needed: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          nurse_id?: string
          nurse_notes?: string | null
          patient_address?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string
          preferred_date?: string
          preferred_time?: string
          service_needed?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurse_bookings_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_emergency_tracking: {
        Row: {
          arrived_at: string | null
          current_lat: number
          current_lng: number
          id: string
          nurse_id: string
          request_id: string
          service_started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          current_lat: number
          current_lng: number
          id?: string
          nurse_id: string
          request_id: string
          service_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          current_lat?: number
          current_lng?: number
          id?: string
          nurse_id?: string
          request_id?: string
          service_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurse_emergency_tracking_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_emergency_tracking_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_nursing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_hospitals: {
        Row: {
          created_at: string
          department: string | null
          end_year: number | null
          hospital_id: string
          id: string
          is_current: boolean | null
          nurse_id: string
          schedule: string | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          end_year?: number | null
          hospital_id: string
          id?: string
          is_current?: boolean | null
          nurse_id: string
          schedule?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          end_year?: number | null
          hospital_id?: string
          id?: string
          is_current?: boolean | null
          nurse_id?: string
          schedule?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurse_hospitals_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_hospitals_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_offers: {
        Row: {
          created_at: string
          distance_km: number | null
          eta_minutes: number
          id: string
          message: string | null
          nurse_id: string
          nurse_lat: number | null
          nurse_lng: number | null
          offered_price: number
          request_id: string
          status: Database["public"]["Enums"]["nurse_offer_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          eta_minutes: number
          id?: string
          message?: string | null
          nurse_id: string
          nurse_lat?: number | null
          nurse_lng?: number | null
          offered_price: number
          request_id: string
          status?: Database["public"]["Enums"]["nurse_offer_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          eta_minutes?: number
          id?: string
          message?: string | null
          nurse_id?: string
          nurse_lat?: number | null
          nurse_lng?: number | null
          offered_price?: number
          request_id?: string
          status?: Database["public"]["Enums"]["nurse_offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurse_offers_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_nursing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      nurses: {
        Row: {
          admin_notes: string | null
          area_of_service: string | null
          available_days: string[] | null
          available_shifts: string[] | null
          background_check_consent: boolean | null
          certificate_urls: string[] | null
          certifications: string[] | null
          city: string | null
          cnic: string | null
          created_at: string
          current_employment: string | null
          date_of_birth: string | null
          degree_certificate_url: string | null
          department_experience: string[] | null
          email: string | null
          emergency_available: boolean | null
          ethics_accepted: boolean | null
          experience_years: number | null
          featured_order: number | null
          fee_negotiable: boolean | null
          full_name: string
          gender: string | null
          home_visit_radius: number | null
          id: string
          institute_name: string | null
          is_featured: boolean | null
          languages_spoken: string[] | null
          monthly_package_fee: number | null
          per_hour_fee: number | null
          per_visit_fee: number | null
          phone: string | null
          photo_url: string | null
          pnc_card_url: string | null
          pnc_expiry_date: string | null
          pnc_number: string
          previous_workplaces: string[] | null
          qualification: string
          rating: number | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          services_offered: string[]
          status: string
          terms_accepted: boolean | null
          updated_at: string
          user_id: string | null
          whatsapp_number: string | null
          year_of_completion: number | null
        }
        Insert: {
          admin_notes?: string | null
          area_of_service?: string | null
          available_days?: string[] | null
          available_shifts?: string[] | null
          background_check_consent?: boolean | null
          certificate_urls?: string[] | null
          certifications?: string[] | null
          city?: string | null
          cnic?: string | null
          created_at?: string
          current_employment?: string | null
          date_of_birth?: string | null
          degree_certificate_url?: string | null
          department_experience?: string[] | null
          email?: string | null
          emergency_available?: boolean | null
          ethics_accepted?: boolean | null
          experience_years?: number | null
          featured_order?: number | null
          fee_negotiable?: boolean | null
          full_name: string
          gender?: string | null
          home_visit_radius?: number | null
          id?: string
          institute_name?: string | null
          is_featured?: boolean | null
          languages_spoken?: string[] | null
          monthly_package_fee?: number | null
          per_hour_fee?: number | null
          per_visit_fee?: number | null
          phone?: string | null
          photo_url?: string | null
          pnc_card_url?: string | null
          pnc_expiry_date?: string | null
          pnc_number: string
          previous_workplaces?: string[] | null
          qualification: string
          rating?: number | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[]
          status?: string
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string | null
          whatsapp_number?: string | null
          year_of_completion?: number | null
        }
        Update: {
          admin_notes?: string | null
          area_of_service?: string | null
          available_days?: string[] | null
          available_shifts?: string[] | null
          background_check_consent?: boolean | null
          certificate_urls?: string[] | null
          certifications?: string[] | null
          city?: string | null
          cnic?: string | null
          created_at?: string
          current_employment?: string | null
          date_of_birth?: string | null
          degree_certificate_url?: string | null
          department_experience?: string[] | null
          email?: string | null
          emergency_available?: boolean | null
          ethics_accepted?: boolean | null
          experience_years?: number | null
          featured_order?: number | null
          fee_negotiable?: boolean | null
          full_name?: string
          gender?: string | null
          home_visit_radius?: number | null
          id?: string
          institute_name?: string | null
          is_featured?: boolean | null
          languages_spoken?: string[] | null
          monthly_package_fee?: number | null
          per_hour_fee?: number | null
          per_visit_fee?: number | null
          phone?: string | null
          photo_url?: string | null
          pnc_card_url?: string | null
          pnc_expiry_date?: string | null
          pnc_number?: string
          previous_workplaces?: string[] | null
          qualification?: string
          rating?: number | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[]
          status?: string
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string | null
          whatsapp_number?: string | null
          year_of_completion?: number | null
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
          lab_id: string | null
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
          lab_id?: string | null
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
          lab_id?: string | null
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
      provinces: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
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
      app_role:
        | "admin"
        | "patient"
        | "lab"
        | "moderator"
        | "lab_admin"
        | "pharmacy"
      appointment_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      consultation_type: "physical" | "online"
      emergency_request_status:
        | "live"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      emergency_urgency: "critical" | "within_1_hour" | "scheduled"
      nurse_offer_status: "pending" | "accepted" | "rejected" | "expired"
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
      app_role: [
        "admin",
        "patient",
        "lab",
        "moderator",
        "lab_admin",
        "pharmacy",
      ],
      appointment_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      consultation_type: ["physical", "online"],
      emergency_request_status: [
        "live",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      emergency_urgency: ["critical", "within_1_hour", "scheduled"],
      nurse_offer_status: ["pending", "accepted", "rejected", "expired"],
      order_status: ["pending", "confirmed", "completed", "cancelled"],
      prescription_status: ["pending_review", "approved", "rejected"],
    },
  },
} as const

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          ai_speech_count: number
          ai_text_count: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_speech_count?: number
          ai_text_count?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_speech_count?: number
          ai_text_count?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointment_settings: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          end_time: string
          id: string
          slot_duration: number
          start_time: string
          updated_at: string
          user_id: string
          working_days: Json
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          end_time?: string
          id?: string
          slot_duration?: number
          start_time?: string
          updated_at?: string
          user_id: string
          working_days?: Json
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          end_time?: string
          id?: string
          slot_duration?: number
          start_time?: string
          updated_at?: string
          user_id?: string
          working_days?: Json
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          id: string
          patient_id: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          id?: string
          patient_id: string
          reason: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          id?: string
          patient_id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          completed: boolean
          created_at: string
          deadline_date: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          deadline_date: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          deadline_date?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string
          document_date: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          patient_id: string
          review_status: string
          upload_date: string
          user_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          description: string
          document_date: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          patient_id: string
          review_status?: string
          upload_date?: string
          user_id: string
          visit_id: string
        }
        Update: {
          created_at?: string
          description?: string
          document_date?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          patient_id?: string
          review_status?: string
          upload_date?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          investigations: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          investigations?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          investigations?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          source: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          source?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          source?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      patient_drafts: {
        Row: {
          created_at: string
          current_step: number
          draft_data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          accidents_injuries: string | null
          address: string | null
          alcohol_consumption: string
          allergic_history_drug: Json | null
          allergic_history_env: Json | null
          allergic_history_food: Json | null
          birth_history: string | null
          blood_group: string | null
          childhood_illnesses: string | null
          completion_status: string
          contact_number: string
          created_at: string
          date_of_birth: string
          developmental_history: string | null
          diet: string | null
          email: string | null
          exercise_habits: string | null
          family_history: string | null
          first_name: string
          gender: string
          health_card_number: string | null
          hospitalization_history: string | null
          id: string
          last_name: string
          living_environment: string | null
          medical_history_ongoing: string | null
          medical_history_past: string | null
          menstrual_pregnancy_history: string | null
          mental_health_history: string | null
          occupation: string | null
          ongoing_medications: Json | null
          photo_url: string | null
          preventive_screening_history: string | null
          recreational_drug_use: string | null
          smoking_status: string
          supplements: Json | null
          surgical_history: string | null
          updated_at: string
          user_id: string
          vaccinations: Json | null
        }
        Insert: {
          accidents_injuries?: string | null
          address?: string | null
          alcohol_consumption: string
          allergic_history_drug?: Json | null
          allergic_history_env?: Json | null
          allergic_history_food?: Json | null
          birth_history?: string | null
          blood_group?: string | null
          childhood_illnesses?: string | null
          completion_status?: string
          contact_number: string
          created_at?: string
          date_of_birth: string
          developmental_history?: string | null
          diet?: string | null
          email?: string | null
          exercise_habits?: string | null
          family_history?: string | null
          first_name: string
          gender: string
          health_card_number?: string | null
          hospitalization_history?: string | null
          id?: string
          last_name: string
          living_environment?: string | null
          medical_history_ongoing?: string | null
          medical_history_past?: string | null
          menstrual_pregnancy_history?: string | null
          mental_health_history?: string | null
          occupation?: string | null
          ongoing_medications?: Json | null
          photo_url?: string | null
          preventive_screening_history?: string | null
          recreational_drug_use?: string | null
          smoking_status: string
          supplements?: Json | null
          surgical_history?: string | null
          updated_at?: string
          user_id: string
          vaccinations?: Json | null
        }
        Update: {
          accidents_injuries?: string | null
          address?: string | null
          alcohol_consumption?: string
          allergic_history_drug?: Json | null
          allergic_history_env?: Json | null
          allergic_history_food?: Json | null
          birth_history?: string | null
          blood_group?: string | null
          childhood_illnesses?: string | null
          completion_status?: string
          contact_number?: string
          created_at?: string
          date_of_birth?: string
          developmental_history?: string | null
          diet?: string | null
          email?: string | null
          exercise_habits?: string | null
          family_history?: string | null
          first_name?: string
          gender?: string
          health_card_number?: string | null
          hospitalization_history?: string | null
          id?: string
          last_name?: string
          living_environment?: string | null
          medical_history_ongoing?: string | null
          medical_history_past?: string | null
          menstrual_pregnancy_history?: string | null
          mental_health_history?: string | null
          occupation?: string | null
          ongoing_medications?: Json | null
          photo_url?: string | null
          preventive_screening_history?: string | null
          recreational_drug_use?: string | null
          smoking_status?: string
          supplements?: Json | null
          surgical_history?: string | null
          updated_at?: string
          user_id?: string
          vaccinations?: Json | null
        }
        Relationships: []
      }
      prescription_settings: {
        Row: {
          barcode_enabled: boolean
          body_font: string
          body_font_size: number
          body_text_color: string
          created_at: string
          footer_font_size: number
          footer_line_enabled: boolean
          footer_text_color: string
          header_background_color: string
          header_font: string
          header_left_lines: Json
          header_line_spacing: number
          header_right_lines: Json
          id: string
          logo_height: number | null
          logo_path: string | null
          logo_position: string | null
          logo_width: number | null
          paper_size: string
          signature_height: number | null
          signature_path: string | null
          signature_position: string | null
          signature_width: number | null
          updated_at: string
          use_own_letterhead: boolean
          user_id: string
        }
        Insert: {
          barcode_enabled?: boolean
          body_font?: string
          body_font_size?: number
          body_text_color?: string
          created_at?: string
          footer_font_size?: number
          footer_line_enabled?: boolean
          footer_text_color?: string
          header_background_color?: string
          header_font?: string
          header_left_lines?: Json
          header_line_spacing?: number
          header_right_lines?: Json
          id?: string
          logo_height?: number | null
          logo_path?: string | null
          logo_position?: string | null
          logo_width?: number | null
          paper_size?: string
          signature_height?: number | null
          signature_path?: string | null
          signature_position?: string | null
          signature_width?: number | null
          updated_at?: string
          use_own_letterhead?: boolean
          user_id: string
        }
        Update: {
          barcode_enabled?: boolean
          body_font?: string
          body_font_size?: number
          body_text_color?: string
          created_at?: string
          footer_font_size?: number
          footer_line_enabled?: boolean
          footer_text_color?: string
          header_background_color?: string
          header_font?: string
          header_left_lines?: Json
          header_line_spacing?: number
          header_right_lines?: Json
          id?: string
          logo_height?: number | null
          logo_path?: string | null
          logo_position?: string | null
          logo_width?: number | null
          paper_size?: string
          signature_height?: number | null
          signature_path?: string | null
          signature_position?: string | null
          signature_width?: number | null
          updated_at?: string
          use_own_letterhead?: boolean
          user_id?: string
        }
        Relationships: []
      }
      prescription_snippets: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          clinic_address: string | null
          clinic_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          license_number: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soap_export_settings: {
        Row: {
          assessment_color: string
          body_font: string
          body_font_size: number
          body_text_color: string
          created_at: string
          footer_enabled: boolean
          footer_text: string | null
          footer_text_color: string
          header_background_color: string
          header_text_color: string
          header_title: string
          id: string
          logo_enabled: boolean
          logo_height: number | null
          logo_path: string | null
          logo_width: number | null
          objective_color: string
          plan_color: string
          subjective_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_color?: string
          body_font?: string
          body_font_size?: number
          body_text_color?: string
          created_at?: string
          footer_enabled?: boolean
          footer_text?: string | null
          footer_text_color?: string
          header_background_color?: string
          header_text_color?: string
          header_title?: string
          id?: string
          logo_enabled?: boolean
          logo_height?: number | null
          logo_path?: string | null
          logo_width?: number | null
          objective_color?: string
          plan_color?: string
          subjective_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_color?: string
          body_font?: string
          body_font_size?: number
          body_text_color?: string
          created_at?: string
          footer_enabled?: boolean
          footer_text?: string | null
          footer_text_color?: string
          header_background_color?: string
          header_text_color?: string
          header_title?: string
          id?: string
          logo_enabled?: boolean
          logo_height?: number | null
          logo_path?: string | null
          logo_width?: number | null
          objective_color?: string
          plan_color?: string
          subjective_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sticky_notes: {
        Row: {
          color: string
          content: string
          created_at: string
          id: string
          position_x: number
          position_y: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          position_x?: number
          position_y?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          position_x?: number
          position_y?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sub_user_permissions: {
        Row: {
          can_access_ai_tools: boolean
          can_access_appointments: boolean
          can_access_clinical_docs: boolean
          can_access_knowledge_base: boolean
          can_access_patients: boolean
          can_access_settings: boolean
          can_create_appointments: boolean
          can_create_patients: boolean
          can_create_visits: boolean
          can_delete_appointments: boolean
          can_delete_patients: boolean
          can_delete_visits: boolean
          can_edit_appointments: boolean
          can_edit_patients: boolean
          can_edit_visits: boolean
          can_export: boolean
          created_at: string
          id: string
          sub_user_id: string
          updated_at: string
        }
        Insert: {
          can_access_ai_tools?: boolean
          can_access_appointments?: boolean
          can_access_clinical_docs?: boolean
          can_access_knowledge_base?: boolean
          can_access_patients?: boolean
          can_access_settings?: boolean
          can_create_appointments?: boolean
          can_create_patients?: boolean
          can_create_visits?: boolean
          can_delete_appointments?: boolean
          can_delete_patients?: boolean
          can_delete_visits?: boolean
          can_edit_appointments?: boolean
          can_edit_patients?: boolean
          can_edit_visits?: boolean
          can_export?: boolean
          created_at?: string
          id?: string
          sub_user_id: string
          updated_at?: string
        }
        Update: {
          can_access_ai_tools?: boolean
          can_access_appointments?: boolean
          can_access_clinical_docs?: boolean
          can_access_knowledge_base?: boolean
          can_access_patients?: boolean
          can_access_settings?: boolean
          can_create_appointments?: boolean
          can_create_patients?: boolean
          can_create_visits?: boolean
          can_delete_appointments?: boolean
          can_delete_patients?: boolean
          can_delete_visits?: boolean
          can_edit_appointments?: boolean
          can_edit_patients?: boolean
          can_edit_visits?: boolean
          can_export?: boolean
          created_at?: string
          id?: string
          sub_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_user_permissions_sub_user_id_fkey"
            columns: ["sub_user_id"]
            isOneToOne: false
            referencedRelation: "sub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_users: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          owner_id: string
          status: string
          sub_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          owner_id: string
          status?: string
          sub_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          owner_id?: string
          status?: string
          sub_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number | null
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          appointment_reminders: boolean | null
          autosave_enabled: boolean | null
          created_at: string
          date_format: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          reminder_time: number | null
          theme: string | null
          time_format: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean | null
          autosave_enabled?: boolean | null
          created_at?: string
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          reminder_time?: number | null
          theme?: string | null
          time_format?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean | null
          autosave_enabled?: boolean | null
          created_at?: string
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          reminder_time?: number | null
          theme?: string | null
          time_format?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visit_versions: {
        Row: {
          created_at: string
          id: string
          prescription: string | null
          soap_assessment: string | null
          soap_objective: string | null
          soap_plan: string | null
          soap_subjective: string | null
          user_id: string
          version_number: number
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prescription?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          user_id: string
          version_number: number
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prescription?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          user_id?: string
          version_number?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_versions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string
          hpi: string | null
          id: string
          investigation: string | null
          patient_id: string
          physical_examination: string | null
          prescription: string | null
          reason_for_visit: string
          ros: string | null
          soap_assessment: string | null
          soap_objective: string | null
          soap_plan: string | null
          soap_subjective: string | null
          status: string
          updated_at: string
          user_id: string
          visit_date: string
          visit_type: string
          vital_signs_bmi: string | null
          vital_signs_bp: string | null
          vital_signs_general_appearance: string | null
          vital_signs_height: string | null
          vital_signs_pulse: string | null
          vital_signs_respiratory_rate: string | null
          vital_signs_spo2: string | null
          vital_signs_temp: string | null
          vital_signs_weight: string | null
        }
        Insert: {
          created_at?: string
          hpi?: string | null
          id?: string
          investigation?: string | null
          patient_id: string
          physical_examination?: string | null
          prescription?: string | null
          reason_for_visit: string
          ros?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          status?: string
          updated_at?: string
          user_id: string
          visit_date?: string
          visit_type: string
          vital_signs_bmi?: string | null
          vital_signs_bp?: string | null
          vital_signs_general_appearance?: string | null
          vital_signs_height?: string | null
          vital_signs_pulse?: string | null
          vital_signs_respiratory_rate?: string | null
          vital_signs_spo2?: string | null
          vital_signs_temp?: string | null
          vital_signs_weight?: string | null
        }
        Update: {
          created_at?: string
          hpi?: string | null
          id?: string
          investigation?: string | null
          patient_id?: string
          physical_examination?: string | null
          prescription?: string | null
          reason_for_visit?: string
          ros?: string | null
          soap_assessment?: string | null
          soap_objective?: string | null
          soap_plan?: string | null
          soap_subjective?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visit_date?: string
          visit_type?: string
          vital_signs_bmi?: string | null
          vital_signs_bp?: string | null
          vital_signs_general_appearance?: string | null
          vital_signs_height?: string | null
          vital_signs_pulse?: string | null
          vital_signs_respiratory_rate?: string | null
          vital_signs_spo2?: string | null
          vital_signs_temp?: string | null
          vital_signs_weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_reset_attempts: { Args: never; Returns: undefined }
      get_effective_user_id: { Args: never; Returns: string }
      get_or_create_ai_usage: {
        Args: { p_user_id: string }
        Returns: {
          ai_speech_count: number
          ai_text_count: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_owner_id_for_sub_user: {
        Args: { p_user_id: string }
        Returns: string
      }
      increment_ai_usage: {
        Args: { p_type: string; p_user_id: string }
        Returns: boolean
      }
      is_sub_user_of: { Args: { p_owner_id: string }; Returns: boolean }
      is_sub_user_owner: {
        Args: { p_sub_user_record_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "owner" | "sub_user"
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
      user_role: ["owner", "sub_user"],
    },
  },
} as const

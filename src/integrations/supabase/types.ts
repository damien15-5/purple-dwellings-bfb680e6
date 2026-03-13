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
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_credentials: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
          second_password_hash: string
          telegram_username: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
          second_password_hash: string
          telegram_username?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          second_password_hash?: string
          telegram_username?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      ai_chat_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_support_tickets: {
        Row: {
          created_at: string | null
          description: string
          id: string
          issue: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          ticket_number: string
          title: string
          updated_at: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          issue: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          ticket_number: string
          title: string
          updated_at?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          issue?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          ticket_number?: string
          title?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          escrow_id: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          escrow_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          escrow_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          content: string
          created_at: string
          excerpt: string
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          buyer_unread: number | null
          created_at: string
          id: string
          last_message: string | null
          last_message_time: string | null
          property_id: string | null
          seller_id: string
          seller_unread: number | null
        }
        Insert: {
          buyer_id: string
          buyer_unread?: number | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_time?: string | null
          property_id?: string | null
          seller_id: string
          seller_unread?: number | null
        }
        Update: {
          buyer_id?: string
          buyer_unread?: number | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_time?: string | null
          property_id?: string | null
          seller_id?: string
          seller_unread?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_service_tickets: {
        Row: {
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_number: string | null
          updated_at: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_number?: string | null
          updated_at?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string | null
          updated_at?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      escrow_disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          escrow_id: string | null
          id: string
          raised_by: string
          reason: string
          resolution_action: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          escrow_id?: string | null
          id?: string
          raised_by: string
          reason: string
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          escrow_id?: string | null
          id?: string
          raised_by?: string
          reason?: string
          resolution_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_disputes_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_documents: {
        Row: {
          created_at: string
          document_type: string
          escrow_id: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          escrow_id?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          escrow_id?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_documents_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_fees: {
        Row: {
          created_at: string
          fee_percentage: number
          fixed_fee: number | null
          id: string
          max_amount: number | null
          min_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_percentage: number
          fixed_fee?: number | null
          id?: string
          max_amount?: number | null
          min_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_percentage?: number
          fixed_fee?: number | null
          id?: string
          max_amount?: number | null
          min_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          atara_fee: number | null
          buyer_confirmed: boolean | null
          buyer_id: string
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          escrow_fee: number
          id: string
          inspection_end_date: string | null
          inspection_start_date: string | null
          offer_amount: number | null
          offer_message: string | null
          offer_status: string | null
          pay_later: boolean | null
          pay_later_reminder_sent: boolean | null
          payment_confirmed_deadline: string | null
          payment_method: string | null
          payment_timing: string | null
          payment_verified_at: string | null
          paystack_access_code: string | null
          paystack_reference: string | null
          paystack_verified_at: string | null
          platform_fee: number | null
          property_id: string | null
          release_reason: string | null
          release_requested_at: string | null
          release_requested_by: string | null
          seller_confirmed: boolean | null
          seller_id: string
          seller_responded_at: string | null
          seller_response: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          terms: string | null
          total_amount: number
          transaction_amount: number
          transfer_reference: string | null
          transfer_status: string | null
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          atara_fee?: number | null
          buyer_confirmed?: boolean | null
          buyer_id: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          escrow_fee: number
          id?: string
          inspection_end_date?: string | null
          inspection_start_date?: string | null
          offer_amount?: number | null
          offer_message?: string | null
          offer_status?: string | null
          pay_later?: boolean | null
          pay_later_reminder_sent?: boolean | null
          payment_confirmed_deadline?: string | null
          payment_method?: string | null
          payment_timing?: string | null
          payment_verified_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          paystack_verified_at?: string | null
          platform_fee?: number | null
          property_id?: string | null
          release_reason?: string | null
          release_requested_at?: string | null
          release_requested_by?: string | null
          seller_confirmed?: boolean | null
          seller_id: string
          seller_responded_at?: string | null
          seller_response?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          terms?: string | null
          total_amount: number
          transaction_amount: number
          transfer_reference?: string | null
          transfer_status?: string | null
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          atara_fee?: number | null
          buyer_confirmed?: boolean | null
          buyer_id?: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          escrow_fee?: number
          id?: string
          inspection_end_date?: string | null
          inspection_start_date?: string | null
          offer_amount?: number | null
          offer_message?: string | null
          offer_status?: string | null
          pay_later?: boolean | null
          pay_later_reminder_sent?: boolean | null
          payment_confirmed_deadline?: string | null
          payment_method?: string | null
          payment_timing?: string | null
          payment_verified_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          paystack_verified_at?: string | null
          platform_fee?: number | null
          property_id?: string | null
          release_reason?: string | null
          release_requested_at?: string | null
          release_requested_by?: string | null
          seller_confirmed?: boolean | null
          seller_id?: string
          seller_responded_at?: string | null
          seller_response?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          terms?: string | null
          total_amount?: number
          transaction_amount?: number
          transfer_reference?: string | null
          transfer_status?: string | null
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          document_image_url: string | null
          extracted_data: Json | null
          full_name: string | null
          gender: string | null
          id: string
          identity_number: string | null
          identity_type: string | null
          kyc_reference: string | null
          lga: string | null
          nationality: string | null
          phone: string | null
          selfie_url: string | null
          state: string | null
          status: string | null
          submitted_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_image_url?: string | null
          extracted_data?: Json | null
          full_name?: string | null
          gender?: string | null
          id?: string
          identity_number?: string | null
          identity_type?: string | null
          kyc_reference?: string | null
          lga?: string | null
          nationality?: string | null
          phone?: string | null
          selfie_url?: string | null
          state?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          document_image_url?: string | null
          extracted_data?: Json | null
          full_name?: string | null
          gender?: string | null
          id?: string
          identity_number?: string | null
          identity_type?: string | null
          kyc_reference?: string | null
          lga?: string | null
          nationality?: string | null
          phone?: string | null
          selfie_url?: string | null
          state?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          message_type: string | null
          offer_amount: number | null
          offer_status: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          offer_amount?: number | null
          offer_status?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          offer_amount?: number | null
          offer_status?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          description: string
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          escrow_id: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          paystack_reference: string
          status: string
          tx_hash: string | null
          webhook_data: Json | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          escrow_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          paystack_reference: string
          status: string
          tx_hash?: string | null
          webhook_data?: Json | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          escrow_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          paystack_reference?: string
          status?: string
          tx_hash?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_name: string | null
          account_number: string | null
          account_type: Database["public"]["Enums"]["account_type"] | null
          age: number | null
          avatar_url: string | null
          bank_name: string | null
          bank_verified: boolean | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_verified_badge: boolean | null
          notification_email: boolean | null
          notification_messages: boolean | null
          notification_offers: boolean | null
          notification_push: boolean | null
          notification_telegram: boolean | null
          paystack_subaccount_code: string | null
          phone: string | null
          telegram_username: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          age?: number | null
          avatar_url?: string | null
          bank_name?: string | null
          bank_verified?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_verified_badge?: boolean | null
          notification_email?: boolean | null
          notification_messages?: boolean | null
          notification_offers?: boolean | null
          notification_push?: boolean | null
          notification_telegram?: boolean | null
          paystack_subaccount_code?: string | null
          phone?: string | null
          telegram_username?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          account_type?: Database["public"]["Enums"]["account_type"] | null
          age?: number | null
          avatar_url?: string | null
          bank_name?: string | null
          bank_verified?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_verified_badge?: boolean | null
          notification_email?: boolean | null
          notification_messages?: boolean | null
          notification_offers?: boolean | null
          notification_push?: boolean | null
          notification_telegram?: boolean | null
          paystack_subaccount_code?: string | null
          phone?: string | null
          telegram_username?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          agency_fee: number | null
          agreement_fee: number | null
          amenities: string[] | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          clicks: number | null
          condition: string | null
          created_at: string
          daily_price: number | null
          description: string
          documents: Json | null
          flooring_type: string | null
          furnishing_status: string | null
          has_accessibility: boolean | null
          has_air_conditioning: boolean | null
          has_balcony: boolean | null
          has_cctv: boolean | null
          has_elevator: boolean | null
          has_gatehouse: boolean | null
          has_gym: boolean | null
          has_internet: boolean | null
          has_playground: boolean | null
          has_pop_ceiling: boolean | null
          has_power_supply: boolean | null
          has_receipt: boolean | null
          has_security: boolean | null
          has_swimming_pool: boolean | null
          has_wardrobes: boolean | null
          has_water_heater: boolean | null
          has_water_supply: boolean | null
          id: string
          images: string[] | null
          is_pet_friendly: boolean | null
          is_verified: boolean | null
          kitchen_type: string | null
          kitchens: number | null
          land_size: number | null
          listing_type: string | null
          location_link: string | null
          monthly_price: number | null
          other_property_type: string | null
          parking_spaces: number | null
          price: number
          property_type: string
          rent_duration: string | null
          service_fee: number | null
          slug: string | null
          state: string | null
          status: string
          street: string | null
          title: string
          title_type: string | null
          toilets: number | null
          updated_at: string
          user_id: string
          video_url: string | null
          views: number | null
          weekly_price: number | null
          year_built: number | null
        }
        Insert: {
          address: string
          agency_fee?: number | null
          agreement_fee?: number | null
          amenities?: string[] | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          clicks?: number | null
          condition?: string | null
          created_at?: string
          daily_price?: number | null
          description: string
          documents?: Json | null
          flooring_type?: string | null
          furnishing_status?: string | null
          has_accessibility?: boolean | null
          has_air_conditioning?: boolean | null
          has_balcony?: boolean | null
          has_cctv?: boolean | null
          has_elevator?: boolean | null
          has_gatehouse?: boolean | null
          has_gym?: boolean | null
          has_internet?: boolean | null
          has_playground?: boolean | null
          has_pop_ceiling?: boolean | null
          has_power_supply?: boolean | null
          has_receipt?: boolean | null
          has_security?: boolean | null
          has_swimming_pool?: boolean | null
          has_wardrobes?: boolean | null
          has_water_heater?: boolean | null
          has_water_supply?: boolean | null
          id?: string
          images?: string[] | null
          is_pet_friendly?: boolean | null
          is_verified?: boolean | null
          kitchen_type?: string | null
          kitchens?: number | null
          land_size?: number | null
          listing_type?: string | null
          location_link?: string | null
          monthly_price?: number | null
          other_property_type?: string | null
          parking_spaces?: number | null
          price: number
          property_type: string
          rent_duration?: string | null
          service_fee?: number | null
          slug?: string | null
          state?: string | null
          status?: string
          street?: string | null
          title: string
          title_type?: string | null
          toilets?: number | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          views?: number | null
          weekly_price?: number | null
          year_built?: number | null
        }
        Update: {
          address?: string
          agency_fee?: number | null
          agreement_fee?: number | null
          amenities?: string[] | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          clicks?: number | null
          condition?: string | null
          created_at?: string
          daily_price?: number | null
          description?: string
          documents?: Json | null
          flooring_type?: string | null
          furnishing_status?: string | null
          has_accessibility?: boolean | null
          has_air_conditioning?: boolean | null
          has_balcony?: boolean | null
          has_cctv?: boolean | null
          has_elevator?: boolean | null
          has_gatehouse?: boolean | null
          has_gym?: boolean | null
          has_internet?: boolean | null
          has_playground?: boolean | null
          has_pop_ceiling?: boolean | null
          has_power_supply?: boolean | null
          has_receipt?: boolean | null
          has_security?: boolean | null
          has_swimming_pool?: boolean | null
          has_wardrobes?: boolean | null
          has_water_heater?: boolean | null
          has_water_supply?: boolean | null
          id?: string
          images?: string[] | null
          is_pet_friendly?: boolean | null
          is_verified?: boolean | null
          kitchen_type?: string | null
          kitchens?: number | null
          land_size?: number | null
          listing_type?: string | null
          location_link?: string | null
          monthly_price?: number | null
          other_property_type?: string | null
          parking_spaces?: number | null
          price?: number
          property_type?: string
          rent_duration?: string | null
          service_fee?: number | null
          slug?: string | null
          state?: string | null
          status?: string
          street?: string | null
          title?: string
          title_type?: string | null
          toilets?: number | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          views?: number | null
          weekly_price?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      property_promotions: {
        Row: {
          amount_paid: number
          created_at: string
          days_promoted: number
          expires_at: string
          id: string
          is_active: boolean
          paystack_reference: string | null
          promotion_id: string
          property_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          days_promoted: number
          expires_at: string
          id?: string
          is_active?: boolean
          paystack_reference?: string | null
          promotion_id: string
          property_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          days_promoted?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          paystack_reference?: string | null
          promotion_id?: string
          property_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_promotions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_transactions: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          payment_timing: string
          payment_verified_at: string | null
          paystack_access_code: string | null
          paystack_reference: string | null
          property_id: string | null
          seller_account_name: string | null
          seller_account_number: string | null
          seller_bank_name: string | null
          seller_id: string
          status: string
          transaction_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_timing?: string
          payment_verified_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          property_id?: string | null
          seller_account_name?: string | null
          seller_account_number?: string | null
          seller_bank_name?: string | null
          seller_id: string
          status?: string
          transaction_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_timing?: string
          payment_verified_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          property_id?: string | null
          seller_account_name?: string | null
          seller_account_number?: string | null
          seller_bank_name?: string | null
          seller_id?: string
          status?: string
          transaction_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_properties: {
        Row: {
          created_at: string | null
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_admin_actions: {
        Row: {
          action: string
          admin_chat_id: number
          admin_username: string | null
          created_at: string
          details: string | null
          id: string
        }
        Insert: {
          action: string
          admin_chat_id: number
          admin_username?: string | null
          created_at?: string
          details?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_chat_id?: number
          admin_username?: string | null
          created_at?: string
          details?: string | null
          id?: string
        }
        Relationships: []
      }
      telegram_admin_chats: {
        Row: {
          admin_id: string
          chat_id: number
          created_at: string | null
          id: string
          is_active: boolean | null
          reply_target_user_id: string | null
          username: string | null
        }
        Insert: {
          admin_id: string
          chat_id: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reply_target_user_id?: string | null
          username?: string | null
        }
        Update: {
          admin_id?: string
          chat_id?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reply_target_user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      telegram_notifications: {
        Row: {
          chat_id: number
          delivered: boolean | null
          id: string
          message_text: string
          message_type: string
          reference_id: string | null
          reference_type: string | null
          sent_at: string | null
        }
        Insert: {
          chat_id: number
          delivered?: boolean | null
          id?: string
          message_text: string
          message_type: string
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
        }
        Update: {
          chat_id?: number
          delivered?: boolean | null
          id?: string
          message_text?: string
          message_type?: string
          reference_id?: string | null
          reference_type?: string | null
          sent_at?: string | null
        }
        Relationships: []
      }
      telegram_user_links: {
        Row: {
          chat_id: number
          created_at: string | null
          id: string
          is_verified: boolean | null
          user_id: string
          username: string | null
          verification_code: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          user_id: string
          username?: string | null
          verification_code?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          user_id?: string
          username?: string | null
          verification_code?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          tx_hash: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          tx_hash: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          tx_hash?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          id: string
          total_listings: number | null
          total_revenue: number | null
          total_sales: number | null
          total_views: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          total_listings?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          total_listings?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_property_views: {
        Row: {
          bedrooms: number | null
          city: string | null
          id: string
          listing_type: string | null
          price: number | null
          property_id: string
          property_type: string | null
          state: string | null
          user_id: string
          viewed_at: string
        }
        Insert: {
          bedrooms?: number | null
          city?: string | null
          id?: string
          listing_type?: string | null
          price?: number | null
          property_id: string
          property_type?: string | null
          state?: string | null
          user_id: string
          viewed_at?: string
        }
        Update: {
          bedrooms?: number | null
          city?: string | null
          id?: string
          listing_type?: string | null
          price?: number | null
          property_id?: string
          property_type?: string | null
          state?: string | null
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      create_notification: {
        Args: {
          p_description: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      generate_cs_ticket_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      get_published_property_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "buyer" | "seller" | "agent"
      app_role:
        | "buyer"
        | "seller"
        | "agent"
        | "admin"
        | "customer_service"
        | "super_admin"
        | "sub_admin"
      dispute_status:
        | "pending"
        | "under_review"
        | "resolved_buyer"
        | "resolved_seller"
        | "resolved_partial"
      escrow_status:
        | "pending_payment"
        | "funded"
        | "inspection_period"
        | "completed"
        | "disputed"
        | "cancelled"
        | "refunded"
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
      account_type: ["buyer", "seller", "agent"],
      app_role: [
        "buyer",
        "seller",
        "agent",
        "admin",
        "customer_service",
        "super_admin",
        "sub_admin",
      ],
      dispute_status: [
        "pending",
        "under_review",
        "resolved_buyer",
        "resolved_seller",
        "resolved_partial",
      ],
      escrow_status: [
        "pending_payment",
        "funded",
        "inspection_period",
        "completed",
        "disputed",
        "cancelled",
        "refunded",
      ],
    },
  },
} as const

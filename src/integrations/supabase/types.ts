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
          payment_verified_at: string | null
          paystack_access_code: string | null
          paystack_reference: string | null
          paystack_verified_at: string | null
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
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
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
          payment_verified_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          paystack_verified_at?: string | null
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
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
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
          payment_verified_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          paystack_verified_at?: string | null
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
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string | null
          id: string
          identity_number: string | null
          identity_type: string | null
          status: string | null
          submitted_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          identity_number?: string | null
          identity_type?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          identity_number?: string | null
          identity_type?: string | null
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
          account_type: Database["public"]["Enums"]["account_type"] | null
          age: number | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          age?: number | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          age?: number | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          condition: string | null
          created_at: string
          description: string
          documents: Json | null
          id: string
          images: string[] | null
          is_verified: boolean | null
          price: number
          property_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          year_built: number | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          condition?: string | null
          created_at?: string
          description: string
          documents?: Json | null
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          price: number
          property_type: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          condition?: string | null
          created_at?: string
          description?: string
          documents?: Json | null
          id?: string
          images?: string[] | null
          is_verified?: boolean | null
          price?: number
          property_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          year_built?: number | null
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
      app_role: "buyer" | "seller" | "agent" | "admin" | "customer_service"
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
      app_role: ["buyer", "seller", "agent", "admin", "customer_service"],
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

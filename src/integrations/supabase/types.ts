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
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_threads: {
        Row: {
          created_at: string | null
          id: string
          role: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_pdfs: {
        Row: {
          chunks: Json[] | null
          content: string | null
          created_at: string | null
          file_path: string
          filename: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          mime_type: string | null
          processed_at: string | null
          size_bytes: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          chunks?: Json[] | null
          content?: string | null
          created_at?: string | null
          file_path: string
          filename: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processed_at?: string | null
          size_bytes?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          chunks?: Json[] | null
          content?: string | null
          created_at?: string | null
          file_path?: string
          filename?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processed_at?: string | null
          size_bytes?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_urls: {
        Row: {
          chunks: Json[] | null
          content: string | null
          created_at: string
          id: string
          is_active: boolean | null
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          chunks?: Json[] | null
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          chunks?: Json[] | null
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      knowledge_web: {
        Row: {
          chunks: Json[] | null
          content: string | null
          created_at: string
          id: string
          is_active: boolean | null
          post_date: string | null
          source_type: string
          subreddit: string | null
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          chunks?: Json[] | null
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          post_date?: string | null
          source_type: string
          subreddit?: string | null
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          chunks?: Json[] | null
          content?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          post_date?: string | null
          source_type?: string
          subreddit?: string | null
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          citations: Json[] | null
          created_at: string | null
          id: string
          is_ai: boolean
          role: string | null
          text: string
          thread_id: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          citations?: Json[] | null
          created_at?: string | null
          id?: string
          is_ai?: boolean
          role?: string | null
          text: string
          thread_id?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          citations?: Json[] | null
          created_at?: string | null
          id?: string
          is_ai?: boolean
          role?: string | null
          text?: string
          thread_id?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_credits: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          is_purchased: boolean | null
          remaining_questions: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_purchased?: boolean | null
          remaining_questions: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_purchased?: boolean | null
          remaining_questions?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_question: {
        Args: {
          user_id_param: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

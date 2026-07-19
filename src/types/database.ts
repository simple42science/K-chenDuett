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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      equipment: {
        Row: {
          capabilities: string[]
          category: string
          created_at: string
          household_id: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          capabilities?: string[]
          category?: string
          created_at?: string
          household_id: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          capabilities?: string[]
          category?: string
          created_at?: string
          household_id?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_recipes: {
        Row: {
          created_at: string
          created_by: string | null
          household_id: string
          recipe_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          household_id: string
          recipe_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          household_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          expires_at: string
          household_id: string
          id: string
          invited_by: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          expires_at: string
          household_id: string
          id?: string
          invited_by?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_by?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          household_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          household_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string
          consumed_at: string | null
          created_at: string
          created_by: string | null
          expires_on: string | null
          household_id: string
          id: string
          name: string
          normalized_name: string
          notes: string | null
          opened_on: string | null
          quantity: number
          status: string
          storage_location_id: string
          unit: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          category?: string
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          household_id: string
          id?: string
          name: string
          normalized_name: string
          notes?: string | null
          opened_on?: string | null
          quantity: number
          status?: string
          storage_location_id: string
          unit: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          category?: string
          consumed_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          household_id?: string
          id?: string
          name?: string
          normalized_name?: string
          notes?: string | null
          opened_on?: string | null
          quantity?: number
          status?: string
          storage_location_id?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_household_fk"
            columns: ["storage_location_id", "household_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id", "household_id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          action: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          household_id: string
          id: string
          item_id: string | null
          item_name: string
          quantity_after: number | null
          quantity_before: number | null
          reversed_by_transaction_id: string | null
          reversible_until: string | null
          unit: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          household_id: string
          id?: string
          item_id?: string | null
          item_name: string
          quantity_after?: number | null
          quantity_before?: number | null
          reversed_by_transaction_id?: string | null
          reversible_until?: string | null
          unit?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          household_id?: string
          id?: string
          item_id?: string | null
          item_name?: string
          quantity_after?: number | null
          quantity_before?: number | null
          reversed_by_transaction_id?: string | null
          reversible_until?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_reversed_by_transaction_id_fkey"
            columns: ["reversed_by_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          is_optional: boolean
          name: string
          normalized_name: string
          quantity: number | null
          recipe_id: string
          sort_order: number
          unit: string | null
        }
        Insert: {
          id?: string
          is_optional?: boolean
          name: string
          normalized_name: string
          quantity?: number | null
          recipe_id: string
          sort_order?: number
          unit?: string | null
        }
        Update: {
          id?: string
          is_optional?: boolean
          name?: string
          normalized_name?: string
          quantity?: number | null
          recipe_id?: string
          sort_order?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          active_minutes: number
          created_at: string
          created_by: string | null
          description: string
          diet_tags: string[]
          effort_level: string
          equipment_requirements: string[]
          household_id: string | null
          id: string
          leftover_tips: string
          meal_types: string[]
          servings: number
          source: string
          steps: Json
          title: string
          total_minutes: number
          updated_at: string
        }
        Insert: {
          active_minutes: number
          created_at?: string
          created_by?: string | null
          description?: string
          diet_tags?: string[]
          effort_level: string
          equipment_requirements?: string[]
          household_id?: string | null
          id?: string
          leftover_tips?: string
          meal_types?: string[]
          servings?: number
          source?: string
          steps?: Json
          title: string
          total_minutes: number
          updated_at?: string
        }
        Update: {
          active_minutes?: number
          created_at?: string
          created_by?: string | null
          description?: string
          diet_tags?: string[]
          effort_level?: string
          equipment_requirements?: string[]
          household_id?: string | null
          id?: string
          leftover_tips?: string
          meal_types?: string[]
          servings?: number
          source?: string
          steps?: Json
          title?: string
          total_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          created_at: string
          household_id: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_household_invitation: {
        Args: { invitation_token_hash: string }
        Returns: string
      }
      can_manage_recipe: {
        Args: { target_recipe_id: string; target_user_id: string }
        Returns: boolean
      }
      can_read_recipe: {
        Args: { target_recipe_id: string; target_user_id: string }
        Returns: boolean
      }
      change_inventory_quantity: {
        Args: {
          expected_version: number
          quantity_delta: number
          target_item_id: string
        }
          Returns: Json
        }
        create_inventory_item: {
          Args: {
            item_category: string
            item_expires_on?: string | null
            item_name: string
            item_notes?: string | null
            item_opened_on?: string | null
            item_quantity: number
            item_unit: string
            target_household_id: string
            target_storage_location_id: string
          }
          Returns: Json
        }
      create_household: { Args: { household_name: string }; Returns: string }
      create_household_invitation: {
        Args: {
          invitation_expires_at?: string
          invitation_token_hash: string
          target_household_id: string
        }
        Returns: string
      }
      delete_household: {
        Args: { confirmation_name: string; target_household_id: string }
        Returns: undefined
      }
      delete_inventory_item: {
        Args: { expected_version: number; target_item_id: string }
        Returns: Json
      }
      is_household_member: {
        Args: { target_household_id: string; target_user_id: string }
        Returns: boolean
      }
        leave_household: {
        Args: { target_household_id: string }
          Returns: undefined
        }
        merge_inventory_items: {
          Args: {
            source_expected_version: number
            source_item_id: string
            target_expected_version: number
            target_item_id: string
          }
          Returns: Json
        }
      normalize_name: { Args: { value: string }; Returns: string }
        undo_inventory_transaction: {
        Args: { target_transaction_id: string }
          Returns: Json
        }
        update_inventory_item: {
          Args: {
            expected_version: number
            item_category: string
            item_expires_on?: string | null
            item_name: string
            item_notes?: string | null
            item_opened_on?: string | null
            item_quantity: number
            item_unit: string
            target_item_id: string
            target_storage_location_id: string
          }
          Returns: Json
        }
      users_share_household: {
        Args: { first_user_id: string; second_user_id: string }
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
    Enums: {},
  },
} as const

// src/lib/types/database.types.ts
// Database modellari uchun types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          phone: string
          email: string | null
          username: string
          store_name: string
          plan_type: 'free' | 'plus' | 'pro'
          plan_expires_at: string | null
          is_active: boolean
          is_admin: boolean
          phone_verified: boolean
          sms_enabled: boolean
          push_enabled: boolean
          language: string
          locale_settings: Json
          deletion_requested_at: string | null
          deletion_reason: string | null
          auth_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name: string
          phone: string
          email?: string | null
          username: string
          store_name: string
          plan_type?: 'free' | 'plus' | 'pro'
          plan_expires_at?: string | null
          is_active?: boolean
          is_admin?: boolean
          phone_verified?: boolean
          sms_enabled?: boolean
          push_enabled?: boolean
          language?: string
          locale_settings?: Json
          deletion_requested_at?: string | null
          deletion_reason?: string | null
          auth_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          phone?: string
          email?: string | null
          username?: string
          store_name?: string
          plan_type?: 'free' | 'plus' | 'pro'
          plan_expires_at?: string | null
          is_active?: boolean
          is_admin?: boolean
          phone_verified?: boolean
          sms_enabled?: boolean
          push_enabled?: boolean
          language?: string
          locale_settings?: Json
          deletion_requested_at?: string | null
          deletion_reason?: string | null
          auth_id?: string | null
        }
      }
      folders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          name: string
          order_index: number
          is_default: boolean
          color: string
          icon: string
          version: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          name: string
          order_index?: number
          is_default?: boolean
          color?: string
          icon?: string
          version?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          name?: string
          order_index?: number
          is_default?: boolean
          color?: string
          icon?: string
          version?: number
        }
      }
      debts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          folder_id: string | null
          debtor_name: string
          debtor_phone: string
          amount: number
          paid_amount: number
          remaining_amount?: number // computed
          debt_date: string
          due_date: string | null
          status: 'pending' | 'paid' | 'overdue' | 'blacklisted' | 'deleted'
          note: string | null
          order_index: number
          reminder_sent: boolean
          last_reminder_at: string | null
          deleted_at: string | null
          version: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          folder_id?: string | null
          debtor_name: string
          debtor_phone: string
          amount: number
          paid_amount?: number
          debt_date?: string
          due_date?: string | null
          status?: 'pending' | 'paid' | 'overdue' | 'blacklisted' | 'deleted'
          note?: string | null
          order_index?: number
          reminder_sent?: boolean
          last_reminder_at?: string | null
          deleted_at?: string | null
          version?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          folder_id?: string | null
          debtor_name?: string
          debtor_phone?: string
          amount?: number
          paid_amount?: number
          debt_date?: string
          due_date?: string | null
          status?: 'pending' | 'paid' | 'overdue' | 'blacklisted' | 'deleted'
          note?: string | null
          order_index?: number
          reminder_sent?: boolean
          last_reminder_at?: string | null
          deleted_at?: string | null
          version?: number
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          debt_id: string
          amount: number
          payment_date: string
          note: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          debt_id: string
          amount: number
          payment_date?: string
          note?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          debt_id?: string
          amount?: number
          payment_date?: string
          note?: string | null
        }
      }
      sms_credits: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          balance: number
          total_purchased: number
          total_used: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          balance?: number
          total_purchased?: number
          total_used?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          balance?: number
          total_purchased?: number
          total_used?: number
        }
      }
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type Folder = Database['public']['Tables']['folders']['Row']
export type Debt = Database['public']['Tables']['debts']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type SMSCredit = Database['public']['Tables']['sms_credits']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type FolderInsert = Database['public']['Tables']['folders']['Insert']
export type DebtInsert = Database['public']['Tables']['debts']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type FolderUpdate = Database['public']['Tables']['folders']['Update']
export type DebtUpdate = Database['public']['Tables']['debts']['Update']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']
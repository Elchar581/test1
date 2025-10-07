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
      admin_users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'moderator' | 'viewer'
          is_active: boolean
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'admin' | 'moderator' | 'viewer'
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'moderator' | 'viewer'
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
      }
      project_users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          is_active: boolean
          reports_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string | null
          is_active?: boolean
          reports_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          is_active?: boolean
          reports_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      trash_locations: {
        Row: {
          id: string
          user_id: string | null
          latitude: number
          longitude: number
          description: string
          trash_type: 'plastic' | 'metal' | 'glass' | 'organic' | 'electronic' | 'mixed' | 'other'
          status: 'reported' | 'in_progress' | 'cleaned' | 'rejected'
          priority: 'low' | 'medium' | 'high'
          image_url: string | null
          created_at: string
          updated_at: string
          cleaned_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          latitude: number
          longitude: number
          description: string
          trash_type: 'plastic' | 'metal' | 'glass' | 'organic' | 'electronic' | 'mixed' | 'other'
          status?: 'reported' | 'in_progress' | 'cleaned' | 'rejected'
          priority?: 'low' | 'medium' | 'high'
          image_url?: string | null
          created_at?: string
          updated_at?: string
          cleaned_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          latitude?: number
          longitude?: number
          description?: string
          trash_type?: 'plastic' | 'metal' | 'glass' | 'organic' | 'electronic' | 'mixed' | 'other'
          status?: 'reported' | 'in_progress' | 'cleaned' | 'rejected'
          priority?: 'low' | 'medium' | 'high'
          image_url?: string | null
          created_at?: string
          updated_at?: string
          cleaned_at?: string | null
        }
      }
      system_logs: {
        Row: {
          id: string
          log_level: 'info' | 'warning' | 'error' | 'critical'
          action: string
          user_id: string | null
          entity_type: string | null
          entity_id: string | null
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          log_level: 'info' | 'warning' | 'error' | 'critical'
          action: string
          user_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          log_level?: 'info' | 'warning' | 'error' | 'critical'
          action?: string
          user_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
    }
  }
}

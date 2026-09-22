/**
 * Database types for the `public` schema.
 *
 * These mirror `supabase/migrations/*`. In a linked project they are regenerated
 * with `supabase gen types typescript`; until a project is linked they are
 * maintained here by hand and kept in sync with the migrations (a single source
 * of truth for the typed Supabase client).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Enum unions (app schema enums, surfaced to the API as text).
export type MembershipRole =
  | 'ORGANIZATION_OWNER'
  | 'ORGANIZATION_ADMIN'
  | 'CONTENT_EDITOR'
  | 'ANALYST';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type MessageStateDb =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'PARTIALLY_FAILED'
  | 'FAILED'
  | 'CANCELLED';
export type ScheduleKindDb = 'now' | 'once' | 'daily' | 'weekly';
export type PushPlatform = 'ios' | 'android' | 'web';
export type DeliveryJobStatus =
  | 'PENDING'
  | 'RESOLVING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
export type DeliveryStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT_TO_PROVIDER'
  | 'DELIVERED'
  | 'FAILED'
  | 'TOKEN_INVALID'
  | 'SKIPPED';

type Timestamped = { created_at: string; updated_at: string };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_locale: string;
          is_platform_admin: boolean;
        } & Timestamped;
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_locale?: string;
          is_platform_admin?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          category: string | null;
          country: string | null;
          default_locale: string;
          verification_status: VerificationStatus;
          is_suspended: boolean;
          created_by: string | null;
        } & Timestamped;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          category?: string | null;
          country?: string | null;
          default_locale?: string;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          role: MembershipRole;
        } & Timestamped;
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          role?: MembershipRole;
        };
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>;
        Relationships: [];
      };
      channels: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          is_default: boolean;
          is_archived: boolean;
        } & Timestamped;
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          is_default?: boolean;
          is_archived?: boolean;
        };
        Update: Partial<Database['public']['Tables']['channels']['Insert']>;
        Relationships: [];
      };
      organization_followers: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          active: boolean;
          language: string | null;
          location: string | null;
          tags: string[];
          signup_source: string | null;
          followed_at: string;
          unfollowed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          active?: boolean;
          language?: string | null;
          location?: string | null;
          tags?: string[];
          signup_source?: string | null;
        };
        Update: Partial<Database['public']['Tables']['organization_followers']['Insert']>;
        Relationships: [];
      };
      channel_subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          channel_id: string;
          profile_id: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          channel_id: string;
          profile_id: string;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['channel_subscriptions']['Insert']>;
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          profile_id: string;
          platform: PushPlatform;
          install_id: string;
          device_name: string | null;
          app_version: string | null;
          locale: string | null;
          last_seen_at: string;
        } & Timestamped;
        Insert: {
          id?: string;
          profile_id: string;
          platform: PushPlatform;
          install_id: string;
          device_name?: string | null;
          app_version?: string | null;
          locale?: string | null;
        };
        Update: Partial<Database['public']['Tables']['devices']['Insert']>;
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          device_id: string;
          profile_id: string;
          provider: string;
          token: string;
          is_valid: boolean;
          invalidated_at: string | null;
          invalidation_reason: string | null;
        } & Timestamped;
        Insert: {
          id?: string;
          device_id: string;
          profile_id: string;
          provider?: string;
          token: string;
          is_valid?: boolean;
        };
        Update: Partial<Database['public']['Tables']['push_tokens']['Insert']>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          profile_id: string;
          organization_id: string | null;
          channel_id: string | null;
          notifications_enabled: boolean;
          quiet_hours_start: number | null;
          quiet_hours_end: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          organization_id?: string | null;
          channel_id?: string | null;
          notifications_enabled?: boolean;
          quiet_hours_start?: number | null;
          quiet_hours_end?: number | null;
        };
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          organization_id: string;
          default_locale: string;
          state: MessageStateDb;
          segment_id: string | null;
          image_asset_id: string | null;
          audio_asset_id: string | null;
          video_url: string | null;
          link_url: string | null;
          cta_label: string | null;
          cta_url: string | null;
          scheduled_at: string | null;
          expires_at: string | null;
          created_by: string | null;
          locked_at: string | null;
        } & Timestamped;
        Insert: {
          id?: string;
          organization_id: string;
          default_locale?: string;
          state?: MessageStateDb;
          segment_id?: string | null;
          video_url?: string | null;
          link_url?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          scheduled_at?: string | null;
          expires_at?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      segments: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          match_mode: 'all' | 'any';
          created_by: string | null;
        } & Timestamped;
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          match_mode?: 'all' | 'any';
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['segments']['Insert']>;
        Relationships: [];
      };
      join_links: {
        Row: {
          id: string;
          organization_id: string;
          code: string;
          channel_id: string | null;
          campaign: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          code: string;
          channel_id?: string | null;
          campaign?: string | null;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['join_links']['Insert']>;
        Relationships: [];
      };
      delivery_jobs: {
        Row: {
          id: string;
          organization_id: string;
          message_id: string;
          status: DeliveryJobStatus;
          idempotency_key: string;
          audience_size: number | null;
          sent_count: number;
          failed_count: number;
          started_at: string | null;
          completed_at: string | null;
          error: string | null;
        } & Timestamped;
        Insert: {
          id?: string;
          organization_id: string;
          message_id: string;
          idempotency_key: string;
          status?: DeliveryJobStatus;
        };
        Update: Partial<Database['public']['Tables']['delivery_jobs']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: {
          p_name: string;
          p_slug: string;
          p_description?: string | null;
          p_category?: string | null;
          p_country?: string | null;
          p_default_locale?: string;
        };
        Returns: Database['public']['Tables']['organizations']['Row'];
      };
      follow_organization: {
        Args: { p_organization_id: string; p_language?: string | null; p_signup_source?: string | null };
        Returns: Database['public']['Tables']['organization_followers']['Row'];
      };
      unfollow_organization: {
        Args: { p_organization_id: string };
        Returns: undefined;
      };
      enqueue_message: {
        Args: { p_message_id: string };
        Returns: Database['public']['Tables']['delivery_jobs']['Row'];
      };
    };
    Enums: {
      membership_role: MembershipRole;
      verification_status: VerificationStatus;
      message_state: MessageStateDb;
      schedule_kind: ScheduleKindDb;
      push_platform: PushPlatform;
      delivery_job_status: DeliveryJobStatus;
      delivery_status: DeliveryStatus;
    };
  };
}

// Convenience helpers.
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type DbEnums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

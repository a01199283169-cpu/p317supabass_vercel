export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      blocks: {
        Row: {
          checked: boolean;
          content: string;
          created_at: string;
          id: string;
          order: number;
          page_id: string;
          type: Database["public"]["Enums"]["block_type"];
          updated_at: string;
        };
        Insert: {
          checked?: boolean;
          content?: string;
          created_at?: string;
          id?: string;
          order?: number;
          page_id: string;
          type?: Database["public"]["Enums"]["block_type"];
          updated_at?: string;
        };
        Update: {
          checked?: boolean;
          content?: string;
          created_at?: string;
          id?: string;
          order?: number;
          page_id?: string;
          type?: Database["public"]["Enums"]["block_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          icon: string;
          id: string;
          order: number;
          parent_id: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          icon?: string;
          id?: string;
          order?: number;
          parent_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          icon?: string;
          id?: string;
          order?: number;
          parent_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      block_type:
        | "paragraph"
        | "heading1"
        | "heading2"
        | "heading3"
        | "bulletList"
        | "numberedList"
        | "todo"
        | "quote"
        | "code"
        | "divider";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type DbPage = Database["public"]["Tables"]["pages"]["Row"];
export type DbBlock = Database["public"]["Tables"]["blocks"]["Row"];

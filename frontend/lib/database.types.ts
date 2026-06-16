export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "recruiter";

export interface BlindSpot {
  title: string;
  note: string;
}

export interface ReviewScore {
  label: string;
  value: number;
  note: string;
}

export interface ReviewEvaluation {
  title: string;
  note: string;
}

export interface ReviewData {
  overall: number;
  scores: ReviewScore[];
  strengths: ReviewEvaluation[];
  weaknesses: ReviewEvaluation[];
  summary: string;
  skills?: Array<{
    name: string;
    value: number;
    verified: boolean;
    evidence: string;
  }>;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          student_id: string;
          target_role: string;
          code_quality_score: number;
          logic_score: number;
          blind_spots: BlindSpot[];
          sandbox_test_pass: boolean;
          verification_uuid: string;
          github_url: string | null;
          review_data: ReviewData;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          target_role: string;
          code_quality_score: number;
          logic_score: number;
          blind_spots?: BlindSpot[];
          sandbox_test_pass?: boolean;
          verification_uuid?: string;
          github_url?: string | null;
          review_data?: ReviewData;
          created_at?: string;
        };
        Update: {
          target_role?: string;
          code_quality_score?: number;
          logic_score?: number;
          blind_spots?: BlindSpot[];
          sandbox_test_pass?: boolean;
          github_url?: string | null;
          review_data?: ReviewData;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_assessment_by_verification_uuid: {
        Args: { p_verification_uuid: string };
        Returns: Database["public"]["Tables"]["assessments"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
export type AssessmentInsert = Database["public"]["Tables"]["assessments"]["Insert"];

export interface SubmissionInput {
  githubUrl?: string;
  fileName?: string;
  targetRole?: string;
}

export interface MissionBrief {
  id: string;
  project: string;
  company: string;
  companyTag: string;
  manager: string;
  managerTitle: string;
  role: string;
  status: string;
  day: number;
  timeline: number;
  summary: string;
  requirements: string[];
  constraints: string[];
  acceptance: string[];
  readme: string;
}

export interface ApiError {
  error: string;
}

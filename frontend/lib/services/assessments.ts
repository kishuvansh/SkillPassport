import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Assessment,
  AssessmentInsert,
  Database,
  ReviewData,
  SubmissionInput,
} from "@/lib/database.types";
import { review as mockReview, skills as mockSkills } from "@/lib/data";
import { vetSubmission } from "@/lib/agents/vetting-agent";

type Client = SupabaseClient<Database>;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Uses LLM / sandbox pipeline via vetting-agent.
 */
export async function analyzeSubmission(input: SubmissionInput): Promise<Omit<AssessmentInsert, "student_id">> {
  // Use the vetting agent to get a real review
  const report = await vetSubmission({
    githubUrl: input.githubUrl || "https://github.com/octocat/Hello-World", // default fallback if empty
    targetRole: input.targetRole || "Junior AI Engineer",
  });

  const codeQuality = report.code_quality_score;
  const logic = report.logic_score;
  const sandboxPass = logic >= 70 && codeQuality >= 65;

  const reviewData: ReviewData = {
    overall: Math.round(((codeQuality + logic) / 2) / 10 * 10) / 10,
    scores: [
      { label: "Logic & Problem Solving", value: logic / 10, note: "Evaluated by AI" },
      { label: "Code Quality", value: codeQuality / 10, note: "Evaluated by AI" }
    ],
    strengths: [
      { title: "AI Assessment", note: "See detailed notes." }
    ],
    weaknesses: report.blind_spots.map(b => ({ title: "Blind Spot", note: b })),
    summary: report.review_data.detailed_notes || "Completed review.",
    skills: mockSkills.map((skill) => ({
      ...skill,
      verified: sandboxPass && skill.verified,
    })),
  };

  return {
    target_role: input.targetRole ?? "Junior AI Engineer",
    code_quality_score: codeQuality,
    logic_score: logic,
    blind_spots: report.blind_spots.map((item) => ({
      title: "Identified Issue",
      note: item,
    })),
    sandbox_test_pass: sandboxPass,
    github_url: input.githubUrl ?? null,
    review_data: reviewData,
  };
}


export async function createAssessment(
  supabase: Client,
  studentId: string,
  input: SubmissionInput
): Promise<Assessment> {
  const payload = await analyzeSubmission(input);

  const { data, error } = await supabase
    .from("assessments")
    .insert({ ...payload, student_id: studentId })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listAssessments(
  supabase: Client,
  studentId: string
): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAssessmentById(
  supabase: Client,
  studentId: string,
  assessmentId: string
): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLatestAssessment(
  supabase: Client,
  studentId: string
): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAssessmentByVerificationUuid(
  supabase: Client,
  verificationUuid: string
): Promise<Assessment | null> {
  const { data, error } = await supabase.rpc(
    "get_assessment_by_verification_uuid",
    { p_verification_uuid: verificationUuid }
  );

  if (error) throw error;
  return data?.[0] ?? null;
}

export function formatPassportId(verificationUuid: string): string {
  return `CSAI-${verificationUuid.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function computePercentile(assessment: Assessment): number {
  const avg =
    (assessment.code_quality_score + assessment.logic_score) / 2;
  return clamp(Math.round(avg * 0.95 + (assessment.sandbox_test_pass ? 8 : 0)), 40, 99);
}

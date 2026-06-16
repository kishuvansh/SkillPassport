import type { Assessment, Profile, ReviewData } from "@/lib/database.types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data as T;
}

export async function submitAssessment(input: {
  githubUrl?: string;
  fileName?: string;
  targetRole?: string;
}): Promise<Assessment> {
  const response = await fetch("/api/assessments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ assessment: Assessment }>(response);
  return data.assessment;
}

export async function fetchLatestAssessment(): Promise<Assessment | null> {
  const response = await fetch("/api/assessments?latest=true");
  const data = await parseJson<{ assessment: Assessment | null }>(response);
  return data.assessment;
}

export async function fetchAssessment(id: string): Promise<Assessment> {
  const response = await fetch(`/api/assessments?id=${encodeURIComponent(id)}`);
  const data = await parseJson<{ assessment: Assessment }>(response);
  return data.assessment;
}

export async function fetchProfile(): Promise<{ profile: Profile; email: string | undefined }> {
  const response = await fetch("/api/profile");
  return parseJson(response);
}

export async function fetchPublicPassport(uuid: string): Promise<{
  assessment: {
    target_role: string;
    code_quality_score: number;
    logic_score: number;
    blind_spots: Array<{ title: string; note: string }>;
    sandbox_test_pass: boolean;
    verification_uuid: string;
    created_at: string;
    review_data: ReviewData;
  };
  student: { full_name: string };
}> {
  const response = await fetch(`/api/assessments/verify/${encodeURIComponent(uuid)}`);
  return parseJson(response);
}

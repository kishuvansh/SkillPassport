import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAssessmentByVerificationUuid } from "@/lib/services/assessments";
import { getProfile } from "@/lib/services/profiles";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      return NextResponse.json({ error: "Verification UUID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const assessment = await getAssessmentByVerificationUuid(supabase, uuid);

    if (!assessment) {
      return NextResponse.json({ error: "Passport not found" }, { status: 404 });
    }

    const profile = await getProfile(supabase, assessment.student_id);

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        target_role: assessment.target_role,
        code_quality_score: assessment.code_quality_score,
        logic_score: assessment.logic_score,
        blind_spots: assessment.blind_spots,
        sandbox_test_pass: assessment.sandbox_test_pass,
        verification_uuid: assessment.verification_uuid,
        created_at: assessment.created_at,
        review_data: assessment.review_data,
      },
      student: profile
        ? { full_name: profile.full_name }
        : { full_name: "CareerSim Student" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

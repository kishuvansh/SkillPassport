import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAssessment,
  getAssessmentById,
  getLatestAssessment,
  listAssessments,
} from "@/lib/services/assessments";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("id");

    if (assessmentId) {
      const assessment = await getAssessmentById(supabase, user.id, assessmentId);
      if (!assessment) {
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
      }
      return NextResponse.json({ assessment });
    }

    const latest = searchParams.get("latest") === "true";
    if (latest) {
      const assessment = await getLatestAssessment(supabase, user.id);
      return NextResponse.json({ assessment });
    }

    const assessments = await listAssessments(supabase, user.id);
    return NextResponse.json({ assessments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const githubUrl =
      typeof body.githubUrl === "string" ? body.githubUrl.trim() : undefined;
    const fileName =
      typeof body.fileName === "string" ? body.fileName.trim() : undefined;
    const targetRole =
      typeof body.targetRole === "string" ? body.targetRole.trim() : undefined;

    if (!githubUrl && !fileName) {
      return NextResponse.json(
        { error: "Provide a GitHub URL or uploaded file name" },
        { status: 400 }
      );
    }

    const assessment = await createAssessment(supabase, user.id, {
      githubUrl,
      fileName,
      targetRole,
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

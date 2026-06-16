"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import {
  Reveal,
  ProgressBar,
  Icon,
  Card,
  Badge,
  CountUp,
  Logo,
} from "@/components/ui/components";
import { fetchPublicPassport } from "@/lib/api/client";
import { computePercentile, formatPassportId } from "@/lib/services/assessments";
import type { ReviewData } from "@/lib/database.types";
import { Skill } from "@/lib/data";

function PublicPassportContent() {
  const params = useParams<{ uuid: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPublicPassport>> | null>(null);

  useEffect(() => {
    if (!params.uuid) return;

    fetchPublicPassport(params.uuid)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Passport not found"))
      .finally(() => setLoading(false));
  }, [params.uuid]);

  if (loading) {
    return (
      <div className="app-page" style={{ textAlign: "center", paddingTop: 120 }}>
        <span className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-page" style={{ textAlign: "center", paddingTop: 120 }}>
        <h1 style={{ fontSize: 24 }}>Passport not found</h1>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>{error ?? "Invalid verification link."}</p>
      </div>
    );
  }

  const { assessment, student } = data;
  const review = assessment.review_data as ReviewData;
  const skills: Skill[] = review.skills ?? [];
  const verified = skills.filter((s) => s.verified).length;
  const avg = skills.length
    ? Math.round(skills.reduce((a, s) => a + s.value, 0) / skills.length)
    : Math.round((assessment.code_quality_score + assessment.logic_score) / 2);
  const percentile = computePercentile({
    ...assessment,
    id: "",
    student_id: "",
    github_url: null,
  });

  return (
    <div className="app-page">
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Logo size={28} />
        <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 14 }}>Public skill passport · recruiter view</p>
      </div>

      <Reveal style={{ maxWidth: 720, margin: "0 auto" }}>
        <Card className="pad-lg" style={{ textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Verified candidate</div>
              <h1 style={{ fontSize: 28, marginTop: 8 }}>{student.full_name}</h1>
              <p style={{ color: "var(--text-dim)", marginTop: 4 }}>{assessment.target_role}</p>
            </div>
            <Badge color="var(--good)"><Icon name="shield" size={12} /> Verified</Badge>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 24 }}>
            {[
              { n: avg, l: "Avg score" },
              { n: verified, l: "Verified skills", suf: skills.length ? `/${skills.length}` : "" },
              { n: percentile, l: "Percentile", suf: "th" },
            ].map((x, i) => (
              <div key={i} style={{ background: "var(--elevated)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}><CountUp to={x.n} suffix={x.suf || ""} /></div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{x.l}</div>
              </div>
            ))}
          </div>

          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 20 }}>
            ID · {formatPassportId(assessment.verification_uuid)}
          </p>

          {skills.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Verified skills</h3>
              {skills.map((s) => (
                <div key={s.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span>{s.value}</span>
                  </div>
                  <ProgressBar value={s.value} height={4} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default function PublicPassportPage() {
  return (
    <Suspense fallback={<div className="app-page" style={{ minHeight: "60vh" }} />}>
      <PublicPassportContent />
    </Suspense>
  );
}

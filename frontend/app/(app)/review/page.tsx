"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Reveal,
  Card,
  ScoreRing,
  Icon,
  Button,
} from "@/components/ui/components";
import { review as fallbackReview, ScoreItem } from "@/lib/data";
import { fetchAssessment, fetchLatestAssessment } from "@/lib/api/client";
import type { Assessment, ReviewData } from "@/lib/database.types";
import { computePercentile } from "@/lib/services/assessments";

interface ScoreCardProps {
  s: ScoreItem;
  delay: number;
}

function ScoreCard({ s, delay }: ScoreCardProps) {
  const color = s.value >= 8 ? "var(--good)" : s.value >= 7 ? "var(--c-amber)" : "var(--bad)";
  return (
    <Reveal delay={delay}>
      <Card className="pad score-card" style={{ height: "100%", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <ScoreRing value={s.value} max={10} size={92} stroke={7} color={color} decimals={1} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6, textAlign: "center" }}>{s.label}</div>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 6, lineHeight: 1.45 }}>{s.note}</p>
      </Card>
    </Reveal>
  );
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");

    (async () => {
      try {
        const data = id ? await fetchAssessment(id) : await fetchLatestAssessment();
        setAssessment(data);
      } catch {
        setAssessment(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  const review: ReviewData = assessment?.review_data ?? fallbackReview;
  const percentile = assessment ? computePercentile(assessment) : 91;

  if (loading) {
    return (
      <div className="app-page" style={{ textAlign: "center", paddingTop: 120 }}>
        <span className="spinner" />
        <p style={{ color: "var(--muted)", marginTop: 16 }}>Loading review…</p>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Reveal>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 30 }}>
          <div style={{ textAlign: "left" }}>
            <div className="eyebrow">AI Reviewer · Aisha Khan</div>
            <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 12 }}>Submission review</h1>
            <p style={{ color: "var(--text-dim)", fontSize: 16, marginTop: 8 }}>
              {assessment?.target_role ?? "Hospital Support Chatbot"} · evaluated against industry standards
            </p>
          </div>
          <Card className="pad" style={{ display: "flex", alignItems: "center", gap: 18, textAlign: "left" }}>
            <ScoreRing value={review.overall} max={10} size={96} stroke={8} color="var(--accent)" decimals={1} />
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: ".08em" }}>Overall score</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>Strong submit</div>
              <div style={{ fontSize: 13, color: "var(--good)", marginTop: 2 }}>Top {100 - percentile}% for this mission</div>
            </div>
          </Card>
        </div>
      </Reveal>

      <div className="score-grid" style={{ marginBottom: 22 }}>
        {review.scores.map((s, i) => <ScoreCard key={s.label} s={s} delay={i * 70} />)}
      </div>

      <Reveal delay={120}>
        <Card className="pad-lg" style={{ marginBottom: 22, textAlign: "left" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in oklch,var(--accent) 16%,transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="sparkles" size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="mw-panel-title" style={{ margin: "4px 0 8px" }}>Reviewer summary</div>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--text-dim)" }}>{review.summary}</p>
              {assessment && (
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
                  Sandbox tests: {assessment.sandbox_test_pass ? "Passed" : "Failed"} ·
                  Code quality {assessment.code_quality_score}/100 · Logic {assessment.logic_score}/100
                </p>
              )}
            </div>
          </div>
        </Card>
      </Reveal>

      <div className="sw-grid">
        <Reveal delay={160}>
          <Card className="pad-lg" style={{ height: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
              <Icon name="check" size={18} style={{ color: "var(--good)" }} />
              <h3 style={{ fontSize: 17 }}>Strengths</h3>
            </div>
            {review.strengths.map((s, i) => (
              <div className="sw-item" key={i}>
                <div className="sw-ic" style={{ background: "color-mix(in oklch,var(--good) 16%,transparent)", color: "var(--good)" }}><Icon name="check" size={15} /></div>
                <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.title}</div><div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{s.note}</div></div>
              </div>
            ))}
          </Card>
        </Reveal>
        <Reveal delay={210}>
          <Card className="pad-lg" style={{ height: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
              <Icon name="zap" size={18} style={{ color: "var(--c-amber)" }} />
              <h3 style={{ fontSize: 17 }}>Areas to improve</h3>
            </div>
            {review.weaknesses.map((s, i) => (
              <div className="sw-item" key={i}>
                <div className="sw-ic" style={{ background: "color-mix(in oklch,var(--c-amber) 16%,transparent)", color: "var(--c-amber)" }}><Icon name="arrowRight" size={15} /></div>
                <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.title}</div><div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{s.note}</div></div>
              </div>
            ))}
          </Card>
        </Reveal>
      </div>

      <Reveal delay={260}>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 32 }}>
          <Button variant="primary" size="lg" icon="award" onClick={() => router.push("/passport")}>View skill passport</Button>
          <Button variant="secondary" size="lg" icon="trending" onClick={() => router.push("/report")}>Employability report</Button>
        </div>
      </Reveal>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="app-page" style={{ minHeight: "60vh" }} />}>
      <ReviewContent />
    </Suspense>
  );
}

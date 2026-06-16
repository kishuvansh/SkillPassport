"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Reveal,
  Icon,
  Button,
  Card,
  ProgressBar,
} from "@/components/ui/components";
import { analysisStages } from "@/lib/data";
import { submitAssessment } from "@/lib/api/client";
import type { Assessment } from "@/lib/database.types";

function SubmissionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "Junior AI Engineer";
  const [phase, setPhase] = useState<"form" | "analyzing">("form");
  const [stage, setStage] = useState(0);
  const [github, setGithub] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const assessmentRef = useRef<Assessment | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (phase !== "analyzing") return;

    if (stage >= analysisStages.length && assessmentRef.current) {
      const t = setTimeout(
        () => router.push(`/review?id=${assessmentRef.current!.id}`),
        600
      );
      return () => clearTimeout(t);
    }

    if (stage >= analysisStages.length) return;

    const t = setTimeout(() => setStage((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [phase, stage, router]);

  const handleSubmit = async () => {
    setError(null);
    setPhase("analyzing");
    setStage(0);
    assessmentRef.current = null;

    try {
      const assessment = await submitAssessment({
        githubUrl: github || undefined,
        fileName: file ?? undefined,
        targetRole: role,
      });
      assessmentRef.current = assessment;
      setStage((s) => (s >= analysisStages.length ? s : analysisStages.length));
    } catch (err) {
      setPhase("form");
      setStage(0);
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  if (phase === "analyzing") {
    return (
      <div className="app-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="glow" style={{ opacity: .55 }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 620, margin: "0 auto", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg,var(--accent),var(--accent-soft))", color: "#0a0a0f", boxShadow: "0 14px 40px -12px color-mix(in oklch,var(--accent) 70%,transparent)" }}>
              <Icon name="cpu" size={30} />
            </div>
            <h1 style={{ fontSize: 28 }}>Analyzing your submission</h1>
            <p style={{ color: "var(--text-dim)", marginTop: 10 }}>Our agents are reviewing your repository and running sandbox tests.</p>
          </div>
          {analysisStages.map((s, i) => {
            const st = stage > i ? "done" : stage === i ? "active" : "pending";
            return (
              <div className={`analysis-line ${st}`} key={i}>
                {st === "done" ? <Icon name="check" size={16} /> : st === "active" ? <span className="spinner" /> : <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--border)" }} />}
                <span className="ml-2">{s}</span>
                {st === "done" && <span className="mono" style={{ marginLeft: "auto", fontSize: 12, color: "var(--good)" }}>✓</span>}
              </div>
            );
          })}
          <div style={{ marginTop: 20 }}>
            <ProgressBar value={(Math.min(stage, analysisStages.length) / analysisStages.length) * 100} height={4} />
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0].name);
    } else {
      setFile(null);
    }
  };

  return (
    <div className="app-page">
      <Reveal>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="eyebrow">Submit your work</div>
            <h1 style={{ fontSize: "clamp(28px,4vw,40px)", marginTop: 12 }}>Ship it for review</h1>
            <p style={{ color: "var(--text-dim)", fontSize: 16, marginTop: 12 }}>
              Link your repository or upload your project. Our AI reviewer evaluates exactly like a hiring engineer would.
            </p>
          </div>

          <Card className="pad-lg" style={{ textAlign: "left" }}>
            <div className="mw-panel-title">Repository URL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 11, padding: "0 14px" }}>
              <Icon name="git" size={18} style={{ color: "var(--muted)" }} />
              <input className="chat-input" style={{ border: "none", background: "transparent", padding: "13px 0" }}
                value={github} onChange={(e) => setGithub(e.target.value)} placeholder="github.com/username/project" />
            </div>

            <div className="mw-panel-title" style={{ marginTop: 28 }}>Or upload project files</div>
            <label style={{ display: "block", cursor: "pointer" }}>
              <input type="file" style={{ display: "none" }} onChange={handleFileChange} />
              <div style={{ border: "1.5px dashed var(--border-strong)", borderRadius: 14, padding: "36px 20px", textAlign: "center",
                background: "var(--elevated)", transition: "all .2s" }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--elevated-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Icon name={file ? "fileText" : "upload"} size={22} style={{ color: file ? "var(--good)" : "var(--muted)" }} />
                </div>
                {file ? (
                  <div>
                    <div style={{ fontWeight: 600 }}>{file}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Ready to submit · click to replace</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600 }}>Drag &amp; drop or click to upload</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>ZIP, up to 50MB</div>
                  </div>
                )}
              </div>
            </label>

            {error && (
              <p style={{ color: "var(--bad)", fontSize: 14, marginTop: 16 }}>{error}</p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
              <Button
                variant="primary"
                size="lg"
                icon="cpu"
                onClick={handleSubmit}
                disabled={!github && !file}
              >
                Submit for AI review
              </Button>
              <Button variant="ghost" size="lg" onClick={() => router.push("/mission")}>Back to mission</Button>
            </div>
          </Card>
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 18 }}>
            <Icon name="lock" size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            Submissions are analyzed and stored securely in Supabase.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

import { Suspense } from "react";
export default function SubmissionPage() {
  return (
    <Suspense fallback={<div className="app-page" style={{ minHeight: "60vh" }} />}>
      <SubmissionPageContent />
    </Suspense>
  );
}

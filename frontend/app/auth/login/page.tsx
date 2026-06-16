"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Icon, Logo, Reveal } from "@/components/ui/components";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    authError ? "Authentication failed. Please try again." : null
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glow" style={{ opacity: 0.45 }} />
      <Reveal style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/"><Logo size={32} /></Link>
          <h1 style={{ fontSize: 28, marginTop: 20 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ color: "var(--text-dim)", marginTop: 8 }}>
            {mode === "signin"
              ? "Sign in to continue your CareerSim journey."
              : "Start building verified skills employers can trust."}
          </p>
        </div>

        <Card className="pad-lg" style={{ textAlign: "left" }}>
          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div style={{ marginBottom: 16 }}>
                <label className="mw-panel-title" htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  className="chat-input"
                  style={{ width: "100%", marginTop: 8 }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aryan Sharma"
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="mw-panel-title" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="chat-input"
                style={{ width: "100%", marginTop: 8 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="mw-panel-title" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="chat-input"
                style={{ width: "100%", marginTop: 8 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            {message && (
              <div style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 10,
                background: "color-mix(in oklch, var(--c-amber) 12%, transparent)",
                color: "var(--text-dim)",
                fontSize: 14,
              }}>
                {message}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
            {mode === "signin" ? (
              <>No account?{" "}
                <button type="button" onClick={() => setMode("signup")} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Sign up
                </button>
              </>
            ) : (
              <>Already registered?{" "}
                <button type="button" onClick={() => setMode("signin")} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </Card>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
          <Icon name="lock" size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
          Secured with Supabase Auth
        </p>
      </Reveal>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="app-page" style={{ minHeight: "100vh" }} />}>
      <LoginForm />
    </Suspense>
  );
}

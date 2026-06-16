"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchProfile } from "@/lib/api/client";
import { getInitials } from "@/lib/services/profiles";
import { Icon, Logo } from "@/components/ui/components";
import type { Profile } from "@/lib/database.types";

export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assessmentCount, setAssessmentCount] = useState(0);

  useEffect(() => {
    fetchProfile()
      .then(({ profile: p }) => setProfile(p))
      .catch(() => setProfile(null));

    fetch("/api/assessments")
      .then((res) => res.ok ? res.json() : { assessments: [] })
      .then((data) => setAssessmentCount(data.assessments?.length ?? 0))
      .catch(() => setAssessmentCount(0));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const items = [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "careers", label: "Careers", icon: "compass" },
    { id: "mission", label: "Mission", icon: "briefcase" },
    { id: "review", label: "Review", icon: "fileText" },
    { id: "passport", label: "Passport", icon: "award" },
    { id: "report", label: "Report", icon: "trending" },
  ];

  const initials = profile ? getInitials(profile.full_name) : "CS";
  const streak = Math.max(assessmentCount, 1);

  return (
    <header className="appnav">
      <Link href="/">
        <Logo size={26} />
      </Link>
      <nav className="appnav-links">
        {items.map((it) => {
          const href = `/${it.id}`;
          const active = pathname === href;
          return (
            <Link key={it.id} href={href} className={`appnav-link ${active ? "active" : ""}`}>
              <Icon name={it.icon} size={15} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="appnav-right">
        <div className="appnav-streak">
          <Icon name="flame" size={14} style={{ color: "var(--c-amber)" }} /> {streak}
        </div>
        <button
          type="button"
          className="avatar avatar-me"
          onClick={handleSignOut}
          title={profile?.full_name ? `Sign out (${profile.full_name})` : "Sign out"}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}

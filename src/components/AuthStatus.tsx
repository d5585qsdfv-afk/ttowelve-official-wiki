"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSession, onAuthStateChange, signOut } from "@/lib/supabase/auth";
import { getSupabase } from "@/lib/supabase/browser";

export function AuthStatus() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | undefined;
    const load = async () => {
      try {
        const { data } = await getSession();
        if (mounted) setSession(data.session);
        if (data.session) {
          const { data: currentRole } = await getSupabase().rpc("current_role");
          if (mounted) setRole(typeof currentRole === "string" ? currentRole : null);
        } else if (mounted) setRole(null);
        const authState = onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          if (!nextSession) setRole(null);
          else void getSupabase().rpc("current_role").then(({ data: nextRole }) => setRole(typeof nextRole === "string" ? nextRole : null));
        });
        subscription = authState.data.subscription;
      } catch { if (mounted) setConfigured(false); }
    };
    void load();
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  if (!configured) return <Link className="header-link" href="/auth">ログイン</Link>;
  if (!session) return <Link className="header-link" href="/auth">ログイン</Link>;

  const label = session.user.user_metadata?.display_name || session.user.email || "アカウント";
  return <span className="auth-status"><Link className="auth-name" title={label} href="/account">{label}</Link>{role === "admin" && <><Link className="header-link" href="/admin">管理</Link><Link className="header-link" href="/admin/wiki">Wiki編集</Link></>}<button className="header-button" type="button" onClick={() => { void signOut(); }}>ログアウト</button></span>;
}

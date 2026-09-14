"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("認証を確認しています…");

  useEffect(() => {
    let active = true;
    const finish = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await getSupabase().auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage("認証を完了できませんでした。ログインをやり直してください。");
          return;
        }
      }
      window.location.replace("/");
    };
    finish().catch(() => { if (active) setMessage("認証を完了できませんでした。ログインをやり直してください。"); });
    return () => { active = false; };
  }, []);

  return (
    <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: "4rem 1.5rem" }}>
      <p>{message}</p>
    </main>
  );
}

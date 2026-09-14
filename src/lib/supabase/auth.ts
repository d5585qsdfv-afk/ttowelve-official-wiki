import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabase } from "./browser";

export const signUp = (email: string, password: string, displayName?: string) =>
  getSupabase().auth.signUp({ email, password, options: { data: { display_name: displayName?.trim() || "Player" } } });

export const signIn = (email: string, password: string) => getSupabase().auth.signInWithPassword({ email, password });

export const signInWithMagicLink = (email: string) => getSupabase().auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: typeof window === "undefined" ? undefined : `${window.location.origin}/auth/callback`,
    shouldCreateUser: true,
  },
});

export const signInWithOAuth = (provider: "google" | "github" | "discord") =>
  getSupabase().auth.signInWithOAuth({
    provider,
    options: { redirectTo: typeof window === "undefined" ? undefined : `${window.location.origin}/auth/callback` },
  });

export const signInWithGoogle = () => signInWithOAuth("google");

export const signOut = () => getSupabase().auth.signOut();

export const sendPasswordReset = (email: string) =>
  getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: typeof window === "undefined" ? undefined : `${window.location.origin}/auth/reset`,
  });

export const getSession = () => getSupabase().auth.getSession();
export const onAuthStateChange = (listener: (event: AuthChangeEvent, session: Session | null) => void) => getSupabase().auth.onAuthStateChange(listener);

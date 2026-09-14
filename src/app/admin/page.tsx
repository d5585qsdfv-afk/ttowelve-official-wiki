"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase/browser";

type Account = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  role: "guest" | "user" | "contributor" | "editor" | "admin";
  profile: { display_name?: string; avatar_path?: string | null; bio?: string | null } | null;
  customization: { profile_key: string; display_title: string; introduction: string; badge?: string | null; theme: string; is_active: boolean } | null;
};

type ProfileDraft = {
  role: Account["role"];
  profileKey: string;
  displayTitle: string;
  introduction: string;
  badge: string;
  theme: string;
  active: boolean;
};

type AuditLog = { id: number; actor_user_id: string | null; action: string; target_type: string; target_id: string | null; metadata: Record<string, unknown>; created_at: string };

const roles = ["guest", "user", "contributor", "editor", "admin"] as const;

function draftFor(account: Account): ProfileDraft {
  return {
    role: account.role,
    profileKey: account.customization?.profile_key ?? `account-${account.id.slice(0, 8)}`,
    displayTitle: account.customization?.display_title ?? "",
    introduction: account.customization?.introduction ?? "",
    badge: account.customization?.badge ?? "",
    theme: account.customization?.theme ?? "default",
    active: account.customization?.is_active ?? true,
  };
}

export default function AdminPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<ProfileDraft>({ role: "user", profileKey: "", displayTitle: "", introduction: "", badge: "", theme: "default", active: true });
  const [message, setMessage] = useState("アカウント一覧を読み込んでいます…");
  const [busy, setBusy] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const selected = useMemo(() => accounts.find((account) => account.id === selectedId) ?? null, [accounts, selectedId]);

  const load = useCallback(async () => {
    try {
      const [{ data, error }, auditResult] = await Promise.all([
        getSupabase().functions.invoke("admin-users", { body: { page: 1, per_page: 100 } }),
        getSupabase().from("audit_logs").select("id,actor_user_id,action,target_type,target_id,metadata,created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      if (error) throw error;
      if (auditResult.error) throw auditResult.error;
      const nextAccounts = (data?.users ?? []) as Account[];
      setAccounts(nextAccounts);
      setAuditLogs((auditResult.data ?? []) as AuditLog[]);
      if (!selectedId && nextAccounts[0]) {
        setSelectedId(nextAccounts[0].id);
        setDraft(draftFor(nextAccounts[0]));
      }
      setMessage(`${nextAccounts.length}件のアカウント`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "管理データを取得できません。管理者権限を確認してください。"); }
  }, [selectedId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function selectAccount(account: Account) {
    setSelectedId(account.id);
    setDraft(draftFor(account));
  }

  async function updateRole() {
    if (!selected) return;
    setBusy(true); setMessage("Roleを更新しています…");
    try {
      const { error } = await getSupabase().functions.invoke("admin-role", { body: { user_id: selected.id, role: draft.role } });
      if (error) throw error;
      setMessage("Roleを更新しました。"); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Roleを更新できません。"); }
    finally { setBusy(false); }
  }

  async function updateProfile() {
    if (!selected) return;
    setBusy(true); setMessage("固有プロフィールを保存しています…");
    try {
      const { error } = await getSupabase().functions.invoke("admin-profile", { body: { user_id: selected.id, profile_key: draft.profileKey, display_title: draft.displayTitle, introduction: draft.introduction, badge: draft.badge || null, theme: draft.theme, is_active: draft.active } });
      if (error) throw error;
      setMessage("固有プロフィールを保存しました。"); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "プロフィールを保存できません。"); }
    finally { setBusy(false); }
  }

  return <main id="main-content" className="admin-page"><header className="page-heading"><div><p className="kicker">ADMIN / ACCOUNT CONTROL</p><h1>アカウント管理</h1><p>Role とアカウント固有プロフィールを管理します。操作は DB 側でも admin 権限を検証し、Audit Log に記録します。</p></div></header><div className="admin-layout"><section className="info-panel" aria-labelledby="account-list-title"><h2 id="account-list-title" className="section-title">アカウント一覧</h2><p className="form-message" role="status">{message}</p><div className="admin-account-list">{accounts.map((account) => <button type="button" className="admin-account" data-selected={account.id === selectedId} key={account.id} onClick={() => selectAccount(account)}><strong>{account.profile?.display_name || "Player"}</strong><span>{account.email || "OAuth account"}</span><small>{account.role}</small></button>)}{!accounts.length && <p className="result-count">表示できるアカウントがありません。</p>}</div></section><section className="info-panel" aria-labelledby="account-edit-title"><h2 id="account-edit-title" className="section-title">{selected ? `${selected.profile?.display_name || "Player"} の設定` : "アカウントを選択"}</h2>{selected ? <><p className="admin-account-id">{selected.email || "OAuth account"}<br /><small>{selected.id}</small></p><label><span>Role</span><select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as Account["role"] })}>{roles.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><button className="primary admin-action" type="button" disabled={busy} onClick={() => { void updateRole(); }}>Roleを保存</button><hr className="admin-rule" /><h3>アカウント固有プロフィール</h3><label><span>Profile key（一意）</span><input value={draft.profileKey} onChange={(event) => setDraft({ ...draft, profileKey: event.target.value })} maxLength={81} /></label><label><span>表示タイトル</span><input value={draft.displayTitle} onChange={(event) => setDraft({ ...draft, displayTitle: event.target.value })} maxLength={120} /></label><label><span>紹介文</span><textarea value={draft.introduction} onChange={(event) => setDraft({ ...draft, introduction: event.target.value })} maxLength={2000} rows={5} /></label><div className="form-grid"><label><span>Badge</span><input value={draft.badge} onChange={(event) => setDraft({ ...draft, badge: event.target.value })} maxLength={80} /></label><label><span>Theme</span><input value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })} maxLength={40} /></label></div><label className="checkbox-label"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />プロフィールを有効にする</label><button className="primary admin-action" type="button" disabled={busy} onClick={() => { void updateProfile(); }}>固有プロフィールを保存</button></> : <p className="result-count">左の一覧からアカウントを選択してください。</p>}</section></div><section className="info-panel admin-audit-panel" aria-labelledby="audit-title"><h2 id="audit-title" className="section-title">最近のAudit Log</h2><div className="audit-list">{auditLogs.map((log) => <div className="audit-row" key={log.id}><strong>{log.action}</strong><span>{log.target_type}{log.target_id ? ` / ${log.target_id.slice(0, 12)}` : ""}</span><time dateTime={log.created_at}>{new Date(log.created_at).toLocaleString("ja-JP")}</time></div>)}{!auditLogs.length && <p className="result-count">Audit Logはまだありません。</p>}</div></section></main>;
}

import { getSupabase } from "./browser";

export type ProposalStatus = "open" | "accepted" | "rejected" | "withdrawn";

export type WikiProposal = {
  id: string;
  page_id: string | null;
  game_id: string;
  proposer_user_id: string;
  title: string;
  summary: string;
  content: Record<string, unknown>;
  status: ProposalStatus;
  reviewer_user_id: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchWikiProposals() {
  return getSupabase().from("wiki_edit_proposals").select("*").order("created_at", { ascending: false }) as unknown as Promise<{ data: WikiProposal[] | null; error: Error | null }>;
}

export async function createWikiProposal(input: {
  page_id?: string | null;
  game_id: string;
  proposer_user_id: string;
  title: string;
  summary: string;
  content: Record<string, unknown>;
}) {
  return getSupabase().from("wiki_edit_proposals").insert({ ...input, page_id: input.page_id || null, status: "open" }).select("*").single();
}

export async function reviewWikiProposal(id: string, reviewerUserId: string, status: Exclude<ProposalStatus, "open">, reviewNote: string) {
  return getSupabase().from("wiki_edit_proposals").update({ status, reviewer_user_id: reviewerUserId, review_note: reviewNote.trim() || null }).eq("id", id).select("*").single();
}

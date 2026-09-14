-- Wiki assets are intentionally public at read time because published Wiki
-- pages are public. Upload, update, delete, and object listing remain limited
-- to authenticated editor/admin users by the policies in the initial schema.
update storage.buckets
set public = true
where id = 'wiki-assets';

-- A contributor may only withdraw an open proposal. Only an editor/admin may
-- review it, preventing contributors from self-approving their own changes.
drop policy if exists proposals_owner_update on public.wiki_edit_proposals;
create policy proposals_owner_withdraw on public.wiki_edit_proposals for update to authenticated
  using (proposer_user_id = auth.uid() and status = 'open')
  with check (proposer_user_id = auth.uid() and status = 'withdrawn');
drop policy if exists proposals_editor_review on public.wiki_edit_proposals;
create policy proposals_editor_review on public.wiki_edit_proposals for update to authenticated
  using (public.has_role('editor'))
  with check (public.has_role('editor') and reviewer_user_id = auth.uid());

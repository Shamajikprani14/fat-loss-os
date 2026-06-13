-- =============================================================================
-- Fat Loss OS — Storage bucket + policies for progress photos
-- Migration: 0003_storage.sql
-- =============================================================================
-- Files are stored under a per-user folder: `${auth.uid()}/<filename>`.
-- Policies restrict access to the owning folder. Bucket is private.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "progress_photos_read_own" on storage.objects;
create policy "progress_photos_read_own" on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_insert_own" on storage.objects;
create policy "progress_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_delete_own" on storage.objects;
create policy "progress_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

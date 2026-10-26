-- Storage for homepage section images.
-- Run this migration in the same Supabase project used by the Admin CMS and storefront.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homepage-images', 'homepage-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view homepage images" on storage.objects;
create policy "Public can view homepage images"
on storage.objects for select
to public
using (bucket_id = 'homepage-images');

drop policy if exists "Admins can upload homepage images" on storage.objects;
create policy "Admins can upload homepage images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'homepage-images' and public.is_admin());

drop policy if exists "Admins can update homepage images" on storage.objects;
create policy "Admins can update homepage images"
on storage.objects for update
to authenticated
using (bucket_id = 'homepage-images' and public.is_admin())
with check (bucket_id = 'homepage-images' and public.is_admin());

drop policy if exists "Admins can delete homepage images" on storage.objects;
create policy "Admins can delete homepage images"
on storage.objects for delete
to authenticated
using (bucket_id = 'homepage-images' and public.is_admin());

-- Run in the renteria-fotos Supabase SQL Editor, NOT in Cloudflare D1.
BEGIN;
CREATE TABLE IF NOT EXISTS public.catalog_photos (
  machine_id text PRIMARY KEY CHECK (machine_id ~ '^[a-zA-Z0-9_-]{1,100}$'),
  object_key text CHECK (object_key IS NULL OR object_key ~ '^catalog/[a-f0-9-]{36}\.(jpg|png|webp)$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_photos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.catalog_photos TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('renteria-fotos', 'renteria-fotos', false, 5000000, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
COMMIT;

SELECT id, public, file_size_limit FROM storage.buckets WHERE id='renteria-fotos';

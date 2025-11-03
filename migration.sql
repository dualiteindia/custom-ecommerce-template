-- 1) Extensions required
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- optional, useful
-- Add any other extensions your target requires.

-- 2) Schemas (ensure needed schemas exist)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS public; -- usually exists

-- 3) Auth: users (core)
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid,
  id uuid PRIMARY KEY,
  aud varchar,
  role varchar,
  email varchar,
  encrypted_password varchar,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar,
  confirmation_sent_at timestamptz,
  recovery_token varchar,
  recovery_sent_at timestamptz,
  email_change_token_new varchar,
  email_change varchar,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone text DEFAULT NULL,
  phone_confirmed_at timestamptz,
  phone_change text DEFAULT '',
  phone_change_token varchar DEFAULT '',
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current varchar DEFAULT '',
  email_change_confirm_status smallint DEFAULT 0 CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2),
  banned_until timestamptz,
  reauthentication_token varchar DEFAULT '',
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz,
  is_anonymous boolean DEFAULT false
);

-- 4) Auth: other tables (minimal necessary defs)
CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id text,
  user_id uuid,
  identity_data jsonb,
  provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED
);

CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  factor_id uuid,
  aal aal_level, -- assumes enum exists; adapt if not present
  not_after timestamptz,
  refreshed_at timestamp,
  user_agent text,
  ip inet,
  tag text,
  oauth_client_id uuid
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  instance_id uuid,
  id bigint PRIMARY KEY,
  token varchar UNIQUE,
  user_id varchar,
  revoked boolean,
  created_at timestamptz,
  updated_at timestamptz,
  parent varchar,
  session_id uuid
);

-- 5) Storage: buckets & objects & prefixes minimal
CREATE TYPE IF NOT EXISTS storage.buckettype AS ENUM ('STANDARD','ANALYTICS');

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  owner_id text,
  type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
  version text,
  owner_id text,
  user_metadata jsonb,
  level integer
);

CREATE TABLE IF NOT EXISTS storage.prefixes (
  bucket_id text,
  name text,
  level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (bucket_id, name, level)
);

-- 6) Realtime: messages & subscription minimal
CREATE TABLE IF NOT EXISTS realtime.messages (
  topic text,
  extension text,
  payload jsonb,
  event text,
  private boolean DEFAULT false,
  updated_at timestamp DEFAULT now(),
  inserted_at timestamp DEFAULT now(),
  id uuid DEFAULT gen_random_uuid(),
  PRIMARY KEY (inserted_at, id)
);

CREATE TABLE IF NOT EXISTS realtime.subscription (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subscription_id uuid,
  entity regclass,
  filters realtime.user_defined_filter[] DEFAULT '{}',
  claims jsonb,
  claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED,
  created_at timestamp DEFAULT timezone('utc'::text, now())
);

-- 7) Public: example tables (products, profiles, orders, order_items, shipping_addresses, user_roles)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  price numeric,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  role text DEFAULT 'customer'::text
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  total_price numeric,
  status text DEFAULT 'Pending'::text,
  created_at timestamptz DEFAULT now(),
  shipping_address_id uuid
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  quantity integer,
  price numeric
);

CREATE TABLE IF NOT EXISTS public.shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid,
  recipient_name text,
  street_address text,
  city text,
  state text,
  postal_code text,
  country text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid,
  role text,
  PRIMARY KEY (user_id, role)
);

-- 8) Foreign keys (create if referenced tables exist)
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);

ALTER TABLE IF EXISTS public.orders
  ADD CONSTRAINT IF NOT EXISTS orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE IF EXISTS public.orders
  ADD CONSTRAINT IF NOT EXISTS orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.shipping_addresses(id);

ALTER TABLE IF EXISTS public.order_items
  ADD CONSTRAINT IF NOT EXISTS order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE IF EXISTS public.order_items
  ADD CONSTRAINT IF NOT EXISTS order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE IF EXISTS storage.objects
  ADD CONSTRAINT IF NOT EXISTS objects_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);

ALTER TABLE IF EXISTS storage.prefixes
  ADD CONSTRAINT IF NOT EXISTS prefixes_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);

-- 9) Enable RLS where your source had it enabled
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.prefixes ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- 10) Helper functions for RLS (security definer)
CREATE OR REPLACE FUNCTION public.get_user_profile_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM auth.users WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_profile_id() FROM anon, authenticated;

-- 11) Example RLS policies (adapt as needed)

-- Auth.users: allow user to SELECT their own row (authenticated)
DROP POLICY IF EXISTS "Users can view themselves" ON auth.users;
CREATE POLICY "Users can view themselves" ON auth.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update themselves" ON auth.users;
CREATE POLICY "Users can update themselves" ON auth.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Public.profiles: allow users to manage their own profile
DROP POLICY IF EXISTS "Profiles owner" ON public.profiles;
CREATE POLICY "Profiles owner" ON public.profiles
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Public.orders: users can create orders for themselves and see their orders
DROP POLICY IF EXISTS "Orders create" ON public.orders;
CREATE POLICY "Orders create" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Orders select" ON public.orders;
CREATE POLICY "Orders select" ON public.orders
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Orders update" ON public.orders;
CREATE POLICY "Orders update" ON public.orders
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Public.order_items: allow access only when parent order belongs to user
DROP POLICY IF EXISTS "Order items select" ON public.order_items;
CREATE POLICY "Order items select" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Order items insert" ON public.order_items;
CREATE POLICY "Order items insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = (SELECT auth.uid())));

-- Storage: buckets/objects policies (allow owner_id match)
DROP POLICY IF EXISTS "Buckets owner" ON storage.buckets;
CREATE POLICY "Buckets owner" ON storage.buckets
  FOR ALL TO authenticated
  USING (owner_id IS NOT DISTINCT FROM (SELECT auth.uid())::text)
  WITH CHECK (owner_id IS NOT DISTINCT FROM (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Objects owner" ON storage.objects;
CREATE POLICY "Objects owner" ON storage.objects
  FOR ALL TO authenticated
  USING (owner_id IS NOT DISTINCT FROM (SELECT auth.uid())::text)
  WITH CHECK (owner_id IS NOT DISTINCT FROM (SELECT auth.uid())::text);

-- Realtime.messages: allow authenticated to SELECT/INSERT on topics they belong to — example using topic pattern and a room_members table would be ideal.
-- Simple policy allowing SELECT/INSERT on non-private messages:
DROP POLICY IF EXISTS "Realtime messages read" ON realtime.messages;
CREATE POLICY "Realtime messages read" ON realtime.messages
  FOR SELECT TO authenticated
  USING (private = false OR (private = true AND (SELECT auth.uid()) IS NOT NULL));

DROP POLICY IF EXISTS "Realtime messages insert" ON realtime.messages;
CREATE POLICY "Realtime messages insert" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 12) Index recommendations (create if not exists)
CREATE INDEX IF NOT EXISTS idx_public_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_public_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner_id ON storage.objects (owner_id);
CREATE INDEX IF NOT EXISTS idx_public_profiles_id ON public.profiles (id);

-- 13) Final notes and safety
-- This script intentionally avoids DROP statements. If you want to DROP and re-create, request explicit destructive migration.
-- Review ENUM types (e.g., auth.aal_level) — if they don't exist on target DB, create them before creating dependent tables.
-- After applying, run tests: create a test user, verify RLS: SELECT on profiles/orders returns only that user's rows.

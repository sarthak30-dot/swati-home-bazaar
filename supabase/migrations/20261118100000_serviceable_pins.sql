-- Brings the repo in line with the live database: `serviceable_pins` already
-- exists in production (and in src/integrations/supabase/types.ts) but never
-- had a migration, so rebuilding from this repo silently broke delivery checks.
-- Idempotent: safe to run against a database that already has the table.

CREATE TABLE IF NOT EXISTS public.serviceable_pins (
  pin        text PRIMARY KEY CHECK (pin ~ '^[1-9][0-9]{5}$'),
  area_name  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.serviceable_pins TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.serviceable_pins TO authenticated;
GRANT ALL ON public.serviceable_pins TO service_role;
ALTER TABLE public.serviceable_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "serviceable pins public read" ON public.serviceable_pins;
CREATE POLICY "serviceable pins public read" ON public.serviceable_pins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "serviceable pins admin write" ON public.serviceable_pins;
CREATE POLICY "serviceable pins admin write" ON public.serviceable_pins
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.serviceable_pins (pin, area_name)
VALUES ('110006', 'Chandni Chowk')
ON CONFLICT (pin) DO NOTHING;

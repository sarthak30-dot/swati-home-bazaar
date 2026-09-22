-- Bulk / wholesale enquiries captured from the public /bulk-orders form.
-- Submitted by anonymous visitors; readable only by admin staff.

CREATE TYPE public.bulk_enquiry_status AS ENUM ('new','contacted','quoted','closed');

CREATE TABLE public.bulk_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  phone text NOT NULL,
  email text,
  city text,
  pin text,
  department text,
  quantity text,
  message text,
  status public.bulk_enquiry_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The public form posts as `anon`, so this is the first table in the schema to
-- grant anon anything beyond SELECT. Deliberately no SELECT for anon: a
-- submitter must not be able to read back the enquiry list, which also means
-- client inserts cannot use a RETURNING clause (no `.select()` chain).
GRANT INSERT ON public.bulk_enquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.bulk_enquiries TO authenticated;
GRANT ALL ON public.bulk_enquiries TO service_role;
ALTER TABLE public.bulk_enquiries ENABLE ROW LEVEL SECURITY;

-- Anonymous submitters can only ever create a fresh 'new' enquiry (never
-- forge 'contacted'/'quoted'/'closed' to hide from admin triage) and every
-- free-text field is bounded, so a scripted flood can't fill the table with
-- unbounded rows. This mirrors what the client form already validates —
-- duplicated here because RLS is the actual enforcement boundary, not the UI.
CREATE POLICY "bulk enquiries public insert" ON public.bulk_enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND length(trim(name)) BETWEEN 1 AND 120
    AND length(trim(phone)) BETWEEN 1 AND 20
    AND (company IS NULL OR length(company) <= 150)
    AND (email IS NULL OR length(email) <= 150)
    AND (city IS NULL OR length(city) <= 80)
    AND (pin IS NULL OR length(pin) <= 10)
    AND (department IS NULL OR length(department) <= 80)
    AND (quantity IS NULL OR length(quantity) <= 40)
    AND length(coalesce(message, '')) <= 2000
  );

-- Reads and triage are admin-only, via the same SECURITY DEFINER helper the
-- rest of the schema uses (has_role is REVOKEd from anon, so anon cannot even
-- probe it).
CREATE POLICY "bulk enquiries admin read" ON public.bulk_enquiries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "bulk enquiries admin update" ON public.bulk_enquiries
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Admin list is ordered newest-first and filtered by status.
CREATE INDEX bulk_enquiries_created_at_idx ON public.bulk_enquiries (created_at DESC);
CREATE INDEX bulk_enquiries_status_idx ON public.bulk_enquiries (status);

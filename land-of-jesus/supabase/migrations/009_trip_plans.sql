-- Private, cross-device pilgrim plans. Apply after 008.
BEGIN;

CREATE TABLE public.trip_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  start_date date,
  days integer NOT NULL DEFAULT 1 CHECK (days BETWEEN 1 AND 14),
  stops jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(stops) = 'array' AND jsonb_array_length(stops) <= 50 AND octet_length(stops::text) <= 16384),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX trip_plans_user_updated_idx ON public.trip_plans (user_id, updated_at DESC);
CREATE TRIGGER update_trip_plans_updated_at
  BEFORE UPDATE ON public.trip_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.trip_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trip_plans FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_plans TO authenticated;
CREATE POLICY trip_plans_own ON public.trip_plans FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMIT;

-- Staff applications and non-payment sponsor enquiries. Apply after 009.
BEGIN;

CREATE TABLE public.church_staff_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_email text NOT NULL,
  church_slug text NOT NULL REFERENCES public.churches(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, church_slug)
);
CREATE INDEX church_staff_requests_church_status_idx ON public.church_staff_requests (church_slug, status);
CREATE TRIGGER update_church_staff_requests_updated_at BEFORE UPDATE ON public.church_staff_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.church_staff_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.church_staff_requests FROM anon, authenticated;
GRANT SELECT ON public.church_staff_requests TO authenticated;

CREATE OR REPLACE FUNCTION loj.can_review_staff_request(p_church_slug text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT loj.is_admin() OR EXISTS (
    SELECT 1 FROM public.church_members cm
    JOIN public.churches c ON c.id = cm.church_id
    WHERE c.slug = p_church_slug AND cm.user_id = auth.uid()
      AND cm.role = 'CHURCH_MANAGER' AND cm.status = 'ACTIVE'
  );
$$;
REVOKE EXECUTE ON FUNCTION loj.can_review_staff_request(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION loj.can_review_staff_request(text) TO authenticated;

CREATE POLICY church_staff_requests_read ON public.church_staff_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR loj.can_review_staff_request(church_slug));

CREATE OR REPLACE FUNCTION public.request_church_staff(p_church_slug text)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  requester text;
  inserted_id uuid;
BEGIN
  SELECT email INTO requester FROM auth.users WHERE id = auth.uid();
  IF requester IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.churches WHERE slug = p_church_slug AND is_published
  ) THEN RETURN false; END IF;

  IF EXISTS (
    SELECT 1 FROM public.church_members cm
    JOIN public.churches c ON c.id = cm.church_id
    WHERE c.slug = p_church_slug AND cm.user_id = auth.uid()
  ) THEN RETURN false; END IF;

  INSERT INTO public.church_staff_requests (user_id, requester_email, church_slug)
  VALUES (auth.uid(), requester, p_church_slug)
  ON CONFLICT (user_id, church_slug) DO UPDATE
    SET status = 'PENDING', requester_email = EXCLUDED.requester_email
    WHERE church_staff_requests.status = 'REJECTED'
  RETURNING id INTO inserted_id;
  RETURN inserted_id IS NOT NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.request_church_staff(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_church_staff(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_church_staff_request(p_request_id uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  requested public.church_staff_requests%ROWTYPE;
  target_church_id uuid;
  affected_rows integer;
BEGIN
  SELECT * INTO requested FROM public.church_staff_requests
  WHERE id = p_request_id AND status = 'PENDING' FOR UPDATE;
  IF NOT FOUND OR NOT loj.can_review_staff_request(requested.church_slug) THEN RETURN false; END IF;
  SELECT id INTO target_church_id FROM public.churches WHERE slug = requested.church_slug;
  IF target_church_id IS NULL THEN RETURN false; END IF;

  -- A previous suspension requires an operator to resolve it; an application
  -- must never silently reinstate a suspended account.
  IF EXISTS (SELECT 1 FROM public.church_members WHERE church_id = target_church_id
    AND user_id = requested.user_id AND status = 'SUSPENDED') THEN RETURN false; END IF;

  INSERT INTO public.church_members (church_id, user_id, role, status)
  VALUES (target_church_id, requested.user_id, 'CHURCH_EDITOR', 'ACTIVE')
  ON CONFLICT (church_id, user_id) DO UPDATE SET status = 'ACTIVE'
    WHERE church_members.role = 'CHURCH_EDITOR';
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows = 0 THEN RETURN false; END IF;
  UPDATE public.church_staff_requests SET status = 'APPROVED' WHERE id = p_request_id;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.approve_church_staff_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_church_staff_request(uuid) TO authenticated;

CREATE TABLE public.sponsor_interests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_slug text NOT NULL REFERENCES public.projects(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  amount_usd integer NOT NULL CHECK (amount_usd BETWEEN 1 AND 100000000),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 2000),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_slug)
);
CREATE TRIGGER update_sponsor_interests_updated_at BEFORE UPDATE ON public.sponsor_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sponsor_interests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sponsor_interests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sponsor_interests TO authenticated;
CREATE POLICY sponsor_interests_read_own ON public.sponsor_interests FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY sponsor_interests_insert_own ON public.sponsor_interests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'PENDING' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.slug = project_slug AND p.is_published
  ));
CREATE POLICY sponsor_interests_update_own ON public.sponsor_interests FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND status = 'PENDING' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.slug = project_slug AND p.is_published
  ));

COMMIT;

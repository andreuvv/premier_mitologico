-- Fuerza la lista blanca en el servidor y deja de exponer
-- la lista de correos autorizados.
CREATE OR REPLACE FUNCTION public.is_email_allowed(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails ae
    WHERE lower(trim(ae.email)) = lower(trim(p_email))
  );
$$;
REVOKE ALL ON FUNCTION public.is_email_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_allowed(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.allowed_emails ae
    WHERE lower(trim(ae.email)) = lower(trim(NEW.email))
  ) THEN
    RAISE EXCEPTION 'email_not_allowed' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.profiles (id, username, is_public)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Anyone can check if their email is whitelisted" ON public.allowed_emails;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id AND (select public.is_email_allowed((select auth.email()))));

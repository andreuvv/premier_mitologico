-- Saved places where tournaments are played, offered as a list in the admin.
-- Tournaments keep their own copy of name/address (location_name/location_address),
-- so editing a venue later never rewrites past tournaments.
CREATE TABLE public.tournament_venues (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (btrim(name) <> ''),
  address text NOT NULL CHECK (btrim(address) <> ''),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY tournament_venues_select ON public.tournament_venues FOR SELECT USING (true);
CREATE POLICY tournament_venues_admin_insert ON public.tournament_venues FOR INSERT WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY tournament_venues_admin_update ON public.tournament_venues FOR UPDATE USING ((select public.is_tournament_admin())) WITH CHECK ((select public.is_tournament_admin()));
CREATE POLICY tournament_venues_admin_delete ON public.tournament_venues FOR DELETE USING ((select public.is_tournament_admin()));

INSERT INTO public.tournament_venues (name, address) VALUES
  ('Pitxillix', 'Las Tórtolas 3273, Macul, Santiago'),
  ('Weshes', 'Jorge Quevedo 5464, Macul, Santiago');

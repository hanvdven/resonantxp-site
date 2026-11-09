-- ============================================================================================================
-- Boodschappen (resonantxp.com/boodschappen): gedeelde huishoudens, in hetzelfde Supabase-project als het spel.
-- Eenmalig uitvoeren in Supabase → SQL Editor → New query → plakken → Run. Veilig om nogmaals te draaien.
--
-- Model: een huishouden (bv. Han + Nele) heeft leden en één gedeeld gegevensdocument (jsonb). De app voegt
-- wijzigingen zelf samen (drieweg-merge) en slaat op met een versienummer (rev): heeft iemand anders net
-- opgeslagen, dan weigert bs_save, haalt de app de nieuwe versie op, voegt samen en probeert opnieuw.
-- Toegang: Row Level Security — alleen leden van een huishouden kunnen het zien of wijzigen. Lid worden kan
-- alleen met de geheime uitnodigingscode (24 tekens), via bs_join_household.
-- Raakt geen tabellen van het spel (alles heeft het voorvoegsel bs_).
-- ============================================================================================================

create table if not exists public.bs_households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Huishouden',
  invite_code text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.bs_members (
  household_id uuid not null references public.bs_households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists bs_members_user on public.bs_members(user_id);

create table if not exists public.bs_docs (
  household_id uuid primary key references public.bs_households(id) on delete cascade,
  data         jsonb not null default '{}'::jsonb,
  rev          bigint not null default 0,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id) on delete set null
);

alter table public.bs_households enable row level security;
alter table public.bs_members    enable row level security;
alter table public.bs_docs       enable row level security;

-- Lidmaatschap opzoeken zonder dat RLS zichzelf aanroept (security definer, vaste search_path).
create or replace function public.bs_is_member(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bs_members where household_id = h and user_id = auth.uid());
$$;

drop policy if exists "bs households: leden lezen"   on public.bs_households;
drop policy if exists "bs households: leden wijzigen" on public.bs_households;
drop policy if exists "bs members: leden lezen"      on public.bs_members;
drop policy if exists "bs members: zelf vertrekken"  on public.bs_members;
drop policy if exists "bs docs: leden lezen"         on public.bs_docs;
create policy "bs households: leden lezen"    on public.bs_households for select using (public.bs_is_member(id));
create policy "bs households: leden wijzigen" on public.bs_households for update using (public.bs_is_member(id)) with check (public.bs_is_member(id));
create policy "bs members: leden lezen"       on public.bs_members    for select using (public.bs_is_member(household_id));
create policy "bs members: zelf vertrekken"   on public.bs_members    for delete using (user_id = auth.uid());
create policy "bs docs: leden lezen"          on public.bs_docs       for select using (public.bs_is_member(household_id));
-- Schrijven op bs_docs gaat alleen via bs_save (versiecontrole); aanmaken van huishoudens/leden alleen via de functies.

-- Nieuw huishouden met jou als lid, gevuld met je huidige gegevens. Anonieme sessies (van het spel) mogen dit niet.
create or replace function public.bs_create_household(p_name text, p_data jsonb)
returns table (household_id uuid, invite_code text, rev bigint)
language plpgsql security definer set search_path = public as $$
declare h public.bs_households;
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Log eerst in met e-mail of Google';
  end if;
  insert into public.bs_households (name, created_by) values (coalesce(nullif(trim(p_name), ''), 'Huishouden'), auth.uid()) returning * into h;
  insert into public.bs_members (household_id, user_id) values (h.id, auth.uid());
  insert into public.bs_docs (household_id, data, rev, updated_by) values (h.id, coalesce(p_data, '{}'::jsonb), 1, auth.uid());
  return query select h.id, h.invite_code, 1::bigint;
end $$;

-- Lid worden met de uitnodigingscode uit de deellink.
create or replace function public.bs_join_household(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Log eerst in met e-mail of Google';
  end if;
  select id into h from public.bs_households where invite_code = p_code;
  if h is null then raise exception 'Deze uitnodiging bestaat niet (meer)'; end if;
  insert into public.bs_members (household_id, user_id) values (h, auth.uid()) on conflict do nothing;
  return h;
end $$;

-- Opslaan met versiecontrole: lukt alleen als p_rev nog de huidige versie is. Geeft de nieuwe rev, of -1 bij
-- een botsing (dan haalt de app de nieuwste versie op, voegt samen en probeert het opnieuw).
create or replace function public.bs_save(p_household uuid, p_data jsonb, p_rev bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare new_rev bigint;
begin
  if not public.bs_is_member(p_household) then raise exception 'Geen lid van dit huishouden'; end if;
  if pg_column_size(p_data) > 5000000 then raise exception 'Gegevens te groot'; end if;
  update public.bs_docs set data = p_data, rev = rev + 1, updated_at = now(), updated_by = auth.uid()
   where household_id = p_household and rev = p_rev
  returning rev into new_rev;
  return coalesce(new_rev, -1);
end $$;

-- Nieuwe uitnodigingscode (de oude deellink werkt dan niet meer).
create or replace function public.bs_new_invite(p_household uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.bs_is_member(p_household) then raise exception 'Geen lid van dit huishouden'; end if;
  update public.bs_households set invite_code = encode(extensions.gen_random_bytes(12), 'hex') where id = p_household returning invite_code into c;
  return c;
end $$;

revoke all on function public.bs_create_household(text, jsonb), public.bs_join_household(text), public.bs_save(uuid, jsonb, bigint),
  public.bs_new_invite(uuid), public.bs_is_member(uuid) from public, anon;
grant execute on function public.bs_create_household(text, jsonb), public.bs_join_household(text), public.bs_save(uuid, jsonb, bigint),
  public.bs_new_invite(uuid), public.bs_is_member(uuid) to authenticated;

-- Live bijwerken: wijzigingen aan bs_docs doorgeven via Realtime (RLS bepaalt wie ze ontvangt).
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bs_docs') then
    alter publication supabase_realtime add table public.bs_docs;
  end if;
end $$;

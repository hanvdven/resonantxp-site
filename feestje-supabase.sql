-- =====================================================================
--  Tussenstand voor het feest (resonantxp.com/feestje-tv en /feestje-beheer)
--  Alles heeft het voorvoegsel fj_: het staat naast andere apps (bs_ = boodschappen) in hetzelfde project.
--
--  Zo gebruik je dit:
--  1. Maak een gratis project op supabase.com (regio: Frankfurt of Londen).
--  2. De tijdelijke pincode is VERANDER-MIJ: log daarmee in op /feestje-beheer en kies
--     meteen je eigen (minstens 6 tekens; de pincode is het enige slot).
--  3. Supabase → SQL Editor → New query → plak dit hele bestand → Run.
--  4. Project Settings → API: kopieer de Project URL en de publishable key
--     naar SUPABASE.url en SUPABASE.key bovenaan feestje-db.js.
--  Je kunt dit script gerust opnieuw draaien: het maakt niets dubbel en laat je pincode staan.
--
--  Beveiliging: iedereen mag de stand LEZEN (de tv heeft geen login).
--  SCHRIJVEN kan alleen via de functies onderaan, die eerst de pincode
--  controleren. De pincode staat gehasht (bcrypt) in een tabel die
--  niemand van buitenaf kan lezen.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists fj_ridders (
  id      bigint generated always as identity primary key,
  naam    text   not null check (char_length(naam) between 1 and 60),
  wapen   jsonb  not null default '{}',     -- { t1, t2, div, ch, c } zoals de wapenmaker op /feestje
  gemaakt timestamptz not null default now()
);

create table if not exists fj_spelen (
  id       bigint generated always as identity primary key,
  naam     text   not null unique check (char_length(naam) between 1 and 30),
  volgorde int    not null default 0
);

create table if not exists fj_punten (
  ridder_id bigint not null references fj_ridders on delete cascade,
  spel_id   bigint not null references fj_spelen  on delete cascade,
  punten    int    not null default 0 check (punten between -1000 and 100000),
  primary key (ridder_id, spel_id)
);

create table if not exists fj_geheim (
  id       int  primary key default 1 check (id = 1),   -- precies één rij
  pin_hash text not null
);

-- Row Level Security: alles dicht, behalve lezen van de drie publieke tabellen
alter table fj_ridders enable row level security;
alter table fj_spelen  enable row level security;
alter table fj_punten  enable row level security;
alter table fj_geheim  enable row level security;          -- geen policies = niemand (behalve de functies)

drop policy if exists "iedereen leest" on fj_ridders;
drop policy if exists "iedereen leest" on fj_spelen;
drop policy if exists "iedereen leest" on fj_punten;
create policy "iedereen leest" on fj_ridders for select using (true);
create policy "iedereen leest" on fj_spelen  for select using (true);
create policy "iedereen leest" on fj_punten  for select using (true);

-- ---------------------------------------------------------------------
--  Functies. "security definer" = ze draaien met de rechten van de eigenaar,
--  dus ze mogen schrijven; daarom controleert elke schrijffunctie de pincode.
-- ---------------------------------------------------------------------
create or replace function fj_pin_juist(p_pin text) returns boolean      -- intern, niet publiek
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from fj_geheim where pin_hash = extensions.crypt(p_pin, pin_hash));
$$;

create or replace function fj_pin_ok(p_pin text) returns boolean          -- voor het inlogscherm
language plpgsql security definer set search_path = public as $$
begin
  if fj_pin_juist(p_pin) then return true; end if;
  perform pg_sleep(1);                                    -- raden vertragen
  return false;
end $$;

create or replace function fj_eis_pin(p_pin text) returns void            -- intern, niet publiek
language plpgsql security definer set search_path = public as $$
begin
  if not fj_pin_juist(p_pin) then
    perform pg_sleep(1);
    raise exception 'Verkeerde pincode' using errcode = '28000';
  end if;
end $$;

-- alles in één keer, voor de tv (één verzoek per keer verversen)
create or replace function fj_stand() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'ridders', coalesce((select json_agg(json_build_object('id', id, 'naam', naam, 'wapen', wapen) order by id) from fj_ridders), '[]'),
    'spelen',  coalesce((select json_agg(json_build_object('id', id, 'naam', naam, 'volgorde', volgorde) order by volgorde, id) from fj_spelen), '[]'),
    'punten',  coalesce((select json_agg(json_build_object('ridder_id', ridder_id, 'spel_id', spel_id, 'punten', punten)) from fj_punten), '[]')
  );
$$;

create or replace function fj_zet_punten(p_pin text, p_ridder bigint, p_spel bigint, p_punten int) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform fj_eis_pin(p_pin);
  insert into fj_punten (ridder_id, spel_id, punten) values (p_ridder, p_spel, p_punten)
  on conflict (ridder_id, spel_id) do update set punten = excluded.punten;
end $$;

create or replace function fj_voeg_ridder(p_pin text, p_naam text, p_wapen jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare nieuw bigint;
begin
  perform fj_eis_pin(p_pin);
  insert into fj_ridders (naam, wapen) values (trim(p_naam), coalesce(p_wapen, '{}')) returning id into nieuw;
  return nieuw;
end $$;

create or replace function fj_wijzig_ridder(p_pin text, p_id bigint, p_naam text, p_wapen jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform fj_eis_pin(p_pin);
  update fj_ridders set naam = trim(p_naam), wapen = coalesce(p_wapen, wapen) where id = p_id;
end $$;

create or replace function fj_verwijder_ridder(p_pin text, p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform fj_eis_pin(p_pin);
  delete from fj_ridders where id = p_id;
end $$;

create or replace function fj_voeg_spel(p_pin text, p_naam text) returns bigint
language plpgsql security definer set search_path = public as $$
declare nieuw bigint;
begin
  perform fj_eis_pin(p_pin);
  insert into fj_spelen (naam, volgorde) values (trim(p_naam), (select coalesce(max(volgorde), 0) + 1 from fj_spelen)) returning id into nieuw;
  return nieuw;
end $$;

create or replace function fj_wijzig_pin(p_oud text, p_nieuw text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform fj_eis_pin(p_oud);
  if char_length(coalesce(p_nieuw, '')) < 6 then raise exception 'De nieuwe pincode moet minstens 6 tekens hebben'; end if;
  update fj_geheim set pin_hash = extensions.crypt(p_nieuw, extensions.gen_salt('bf')) where id = 1;
end $$;

-- wie mag welke functie aanroepen: de website (rol anon) alleen deze
-- alleen onze eigen functies (nooit "all functions": dat raakt ook andere apps in hetzelfde project)
revoke execute on function fj_pin_juist(text), fj_eis_pin(text), fj_pin_ok(text), fj_stand(), fj_zet_punten(text, bigint, bigint, int),
  fj_voeg_ridder(text, text, jsonb), fj_wijzig_ridder(text, bigint, text, jsonb), fj_verwijder_ridder(text, bigint), fj_voeg_spel(text, text),
  fj_wijzig_pin(text, text)
  from public, anon, authenticated;
grant execute on function fj_stand(), fj_pin_ok(text), fj_zet_punten(text, bigint, bigint, int),
  fj_voeg_ridder(text, text, jsonb), fj_wijzig_ridder(text, bigint, text, jsonb),
  fj_verwijder_ridder(text, bigint), fj_voeg_spel(text, text), fj_wijzig_pin(text, text) to anon, authenticated;

-- de spelen van de avond (aanvullen kan later via /feestje-beheer)
insert into fj_spelen (naam, volgorde) values
  ('Wapen', 1), ('Kostuum', 2), ('Zwaard', 3), ('Boog', 4), ('Dobbelen', 5), ('Proeverij', 6), ('Quiz', 7)
on conflict (naam) do update set volgorde = excluded.volgorde;   -- opnieuw draaien zet de volgorde van het programma terug

-- de tijdelijke pincode VERANDER-MIJ (bcrypt-hash). Wijzig hem meteen op /feestje-beheer.
-- Opnieuw draaien laat een gewijzigde pincode staan (do nothing).
insert into fj_geheim (id, pin_hash) values (1, extensions.crypt('VERANDER-MIJ', extensions.gen_salt('bf')))
on conflict (id) do nothing;

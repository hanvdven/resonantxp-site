-- =====================================================================
--  Tussenstand voor het feest (resonantxp.com/feestje-tv en /feestje-beheer)
--
--  Zo gebruik je dit:
--  1. Maak een gratis project op supabase.com (regio: Frankfurt of Londen).
--  2. Verander hieronder VERANDER-MIJ in je eigen pincode
--     (liever een woord of 6+ tekens dan 4 cijfers: de pincode is het enige slot).
--  3. Supabase → SQL Editor → New query → plak dit hele bestand → Run.
--  4. Project Settings → API: kopieer de Project URL en de publishable key
--     naar SUPABASE.url en SUPABASE.key bovenaan feestje-db.js.
--  Je kunt dit script gerust opnieuw draaien: het maakt niets dubbel
--  (behalve de pincode, die wordt dan overschreven).
--
--  Beveiliging: iedereen mag de stand LEZEN (de tv heeft geen login).
--  SCHRIJVEN kan alleen via de functies onderaan, die eerst de pincode
--  controleren. De pincode staat gehasht (bcrypt) in een tabel die
--  niemand van buitenaf kan lezen.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists ridders (
  id      bigint generated always as identity primary key,
  naam    text   not null check (char_length(naam) between 1 and 60),
  wapen   jsonb  not null default '{}',     -- { t1, t2, div, ch, c } zoals de wapenmaker op /feestje
  gemaakt timestamptz not null default now()
);

create table if not exists spelen (
  id       bigint generated always as identity primary key,
  naam     text   not null unique check (char_length(naam) between 1 and 30),
  volgorde int    not null default 0
);

create table if not exists punten (
  ridder_id bigint not null references ridders on delete cascade,
  spel_id   bigint not null references spelen  on delete cascade,
  punten    int    not null default 0 check (punten between -1000 and 100000),
  primary key (ridder_id, spel_id)
);

create table if not exists geheim (
  id       int  primary key default 1 check (id = 1),   -- precies één rij
  pin_hash text not null
);

-- Row Level Security: alles dicht, behalve lezen van de drie publieke tabellen
alter table ridders enable row level security;
alter table spelen  enable row level security;
alter table punten  enable row level security;
alter table geheim  enable row level security;          -- geen policies = niemand (behalve de functies)

drop policy if exists "iedereen leest" on ridders;
drop policy if exists "iedereen leest" on spelen;
drop policy if exists "iedereen leest" on punten;
create policy "iedereen leest" on ridders for select using (true);
create policy "iedereen leest" on spelen  for select using (true);
create policy "iedereen leest" on punten  for select using (true);

-- ---------------------------------------------------------------------
--  Functies. "security definer" = ze draaien met de rechten van de eigenaar,
--  dus ze mogen schrijven; daarom controleert elke schrijffunctie de pincode.
-- ---------------------------------------------------------------------
create or replace function pin_juist(p_pin text) returns boolean      -- intern, niet publiek
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from geheim where pin_hash = extensions.crypt(p_pin, pin_hash));
$$;

create or replace function pin_ok(p_pin text) returns boolean          -- voor het inlogscherm
language plpgsql security definer set search_path = public as $$
begin
  if pin_juist(p_pin) then return true; end if;
  perform pg_sleep(1);                                    -- raden vertragen
  return false;
end $$;

create or replace function eis_pin(p_pin text) returns void            -- intern, niet publiek
language plpgsql security definer set search_path = public as $$
begin
  if not pin_juist(p_pin) then
    perform pg_sleep(1);
    raise exception 'Verkeerde pincode' using errcode = '28000';
  end if;
end $$;

-- alles in één keer, voor de tv (één verzoek per keer verversen)
create or replace function stand() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'ridders', coalesce((select json_agg(json_build_object('id', id, 'naam', naam, 'wapen', wapen) order by id) from ridders), '[]'),
    'spelen',  coalesce((select json_agg(json_build_object('id', id, 'naam', naam, 'volgorde', volgorde) order by volgorde, id) from spelen), '[]'),
    'punten',  coalesce((select json_agg(json_build_object('ridder_id', ridder_id, 'spel_id', spel_id, 'punten', punten)) from punten), '[]')
  );
$$;

create or replace function zet_punten(p_pin text, p_ridder bigint, p_spel bigint, p_punten int) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform eis_pin(p_pin);
  insert into punten (ridder_id, spel_id, punten) values (p_ridder, p_spel, p_punten)
  on conflict (ridder_id, spel_id) do update set punten = excluded.punten;
end $$;

create or replace function voeg_ridder(p_pin text, p_naam text, p_wapen jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare nieuw bigint;
begin
  perform eis_pin(p_pin);
  insert into ridders (naam, wapen) values (trim(p_naam), coalesce(p_wapen, '{}')) returning id into nieuw;
  return nieuw;
end $$;

create or replace function wijzig_ridder(p_pin text, p_id bigint, p_naam text, p_wapen jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform eis_pin(p_pin);
  update ridders set naam = trim(p_naam), wapen = coalesce(p_wapen, wapen) where id = p_id;
end $$;

create or replace function verwijder_ridder(p_pin text, p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform eis_pin(p_pin);
  delete from ridders where id = p_id;
end $$;

create or replace function voeg_spel(p_pin text, p_naam text) returns bigint
language plpgsql security definer set search_path = public as $$
declare nieuw bigint;
begin
  perform eis_pin(p_pin);
  insert into spelen (naam, volgorde) values (trim(p_naam), (select coalesce(max(volgorde), 0) + 1 from spelen)) returning id into nieuw;
  return nieuw;
end $$;

-- wie mag welke functie aanroepen: de website (rol anon) alleen deze
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function stand(), pin_ok(text), zet_punten(text, bigint, bigint, int),
  voeg_ridder(text, text, jsonb), wijzig_ridder(text, bigint, text, jsonb),
  verwijder_ridder(text, bigint), voeg_spel(text, text) to anon, authenticated;

-- de spelen van de avond (aanvullen kan later via /feestje-beheer)
insert into spelen (naam, volgorde) values
  ('Kostuum', 1), ('Zwaard', 2), ('Boog', 3), ('Dobbelen', 4), ('Quiz', 5)
on conflict (naam) do nothing;

-- de pincode (bcrypt-hash; de pincode zelf wordt nergens bewaard)
insert into geheim (id, pin_hash) values (1, extensions.crypt('VERANDER-MIJ', extensions.gen_salt('bf')))
on conflict (id) do update set pin_hash = excluded.pin_hash;

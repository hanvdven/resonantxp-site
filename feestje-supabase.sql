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

-- =====================================================================
--  De quiz (feestje-quiz voor de spelers, feestje-beheer voor de quizmaster, feestje-tv)
--  Drie soorten vragen:
--    keuze  vier antwoorden (A–D), eventueel met een afbeelding op de tv
--           punten: 100 voor goed + 1 per seconde sneller dan 30 s (klok van de database, niet van de gsm's)
--    woord  vrij intypen; goed als het (zonder hoofdletters, spaties en accenten) in de lijst van goede antwoorden staat
--           punten: als bij keuze
--    getal  een schatting; wie het dichtst zit krijgt 100, dan 80, 60, 40, 20 (gelijke afstand = gelijke punten)
--  De juiste antwoorden zijn voor spelers onleesbaar tot de quizmaster ze toont.
--  Opnieuw draaien mag: de quiztabellen worden dan leeggemaakt en opnieuw aangelegd (de vragen laadt u daarna opnieuw).
-- =====================================================================
drop table if exists fj_antwoorden, fj_vragen, fj_quiz cascade;
create table fj_vragen (
  nr         int  primary key,
  soort      text not null default 'keuze' check (soort in ('keuze', 'woord', 'getal')),
  vraag      text not null,
  afbeelding text,                                -- pad op de site, bv. 'feestje-img/quiz/komeet.webp' (alleen op de tv)
  antwoorden jsonb,                               -- keuze: ["…", "…", "…", "…"]
  juist      jsonb not null                       -- keuze: 0–3 · woord: ["leeuw", "lion"] (vergeleken via fj_norm) · getal: 695
);
create table fj_quiz (
  id      int  primary key default 1 check (id = 1),
  nr      int  not null default 0,
  fase    text not null default 'uit' check (fase in ('uit', 'wacht', 'open', 'dicht', 'uitslag')),
  geopend timestamptz
);
create table fj_antwoorden (
  nr        int    not null,
  ridder_id bigint not null references fj_ridders on delete cascade,
  keuze     int    check (keuze between 0 and 3),   -- keuze
  waarde    text,                                   -- woord of getal, zoals ingetypt
  punten    int    not null default 0,
  tijd      timestamptz not null default now(),
  primary key (nr, ridder_id)
);
alter table fj_vragen     enable row level security;   -- geen policies: alleen via de functies hieronder
alter table fj_quiz       enable row level security;
alter table fj_antwoorden enable row level security;
insert into fj_quiz (id) values (1) on conflict (id) do nothing;

-- normaliseren: kleine letters, zonder accenten, spaties en leestekens ("Groš!" → "gros")
create or replace function fj_norm(t text) returns text
language sql immutable as $$
  select regexp_replace(lower(translate(coalesce(t, ''),
    'áàâäãåčćçďéèêëěíìîïľĺňñóòôöõřŕšśťúùûüůýÿžźÁÀÂÄÃÅČĆÇĎÉÈÊËĚÍÌÎÏĽĹŇÑÓÒÔÖÕŘŔŠŚŤÚÙÛÜŮÝŸŽŹ',
    'aaaaaacccdeeeeeiiiillnnooooorrsstuuuuuyyzzaaaaaacccdeeeeeiiiillnnooooorrsstuuuuuyyzz')), '[^a-z0-9]', '', 'g');
$$;

-- het juiste antwoord om te tonen: keuze → het nummer, woord → het eerste goede woord, getal → het getal
create or replace function fj_quiz_juist(v fj_vragen) returns jsonb
language sql immutable as $$ select case when v.soort = 'woord' then v.juist->0 else v.juist end $$;

-- wat iedereen mag zien (tv en spelers); het juiste antwoord pas in de fase 'uitslag'
create or replace function fj_quiz_toestand() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'fase', q.fase, 'nr', q.nr, 'totaal', (select count(*) from fj_vragen),
    'soort', case when q.fase <> 'uit' then v.soort end,
    'vraag', case when q.fase <> 'uit' then v.vraag end,
    'afbeelding', case when q.fase <> 'uit' then v.afbeelding end,
    'antwoorden', case when q.fase <> 'uit' then v.antwoorden end,
    'verstreken', case when q.geopend is not null then extract(epoch from now() - q.geopend) end,
    'aantal', (select count(*) from fj_antwoorden a where a.nr = q.nr),
    'ridders', (select count(*) from fj_ridders),
    'juist', case when q.fase = 'uitslag' then fj_quiz_juist(v) end,
    'uitslag', case when q.fase = 'uitslag' then coalesce((select json_agg(json_build_object('ridder_id', a.ridder_id, 'keuze', a.keuze, 'waarde', a.waarde, 'punten', a.punten)
                                                           order by a.punten desc, a.tijd) from fj_antwoorden a where a.nr = q.nr), '[]') end,
    'stand', case when q.fase = 'uitslag' or (q.fase = 'uit' and q.nr > 0) then coalesce((select json_agg(json_build_object('ridder_id', t.ridder_id, 'punten', t.som) order by t.som desc)
                                                           from (select ridder_id, sum(punten) som from fj_antwoorden group by ridder_id) t), '[]') end)
  from fj_quiz q left join fj_vragen v on v.nr = q.nr where q.id = 1;
$$;

-- een speler antwoordt (één keer per vraag; alleen terwijl de vraag open staat).
-- p_keuze voor keuzevragen, p_tekst voor woord en getal. Een getal krijgt zijn punten pas bij 'toon' (rangorde).
create or replace function fj_quiz_antwoord(p_ridder bigint, p_keuze int, p_tekst text) returns boolean
language plpgsql security definer set search_path = public as $$
declare q fj_quiz; v fj_vragen; sec numeric; snel int; pt int := 0;
begin
  select * into q from fj_quiz where id = 1;
  if q.fase <> 'open' then return false; end if;
  select * into v from fj_vragen where nr = q.nr;
  if not exists (select 1 from fj_ridders where id = p_ridder) then return false; end if;
  sec := extract(epoch from now() - q.geopend); snel := greatest(0, 30 - floor(sec))::int;
  if v.soort = 'keuze' then
    if p_keuze is null or p_keuze not between 0 and 3 then return false; end if;
    if p_keuze = (v.juist #>> '{}')::int then pt := 100 + snel; end if;
  elsif v.soort = 'woord' then
    if fj_norm(p_tekst) = '' then return false; end if;
    if exists (select 1 from jsonb_array_elements_text(v.juist) g where fj_norm(g) = fj_norm(p_tekst)) then pt := 100 + snel; end if;
  else
    if p_tekst !~ '^\s*-?[0-9]+([.,][0-9]+)?\s*$' then return false; end if;
  end if;
  insert into fj_antwoorden (nr, ridder_id, keuze, waarde, punten)
  values (q.nr, p_ridder, case when v.soort = 'keuze' then p_keuze end, case when v.soort <> 'keuze' then left(trim(p_tekst), 60) end, pt)
  on conflict (nr, ridder_id) do nothing;
  return found;
end $$;

-- de quizmaster: start · open · sluit · toon · volgende · stop · reset
create or replace function fj_quiz_stap(p_pin text, p_actie text) returns json
language plpgsql security definer set search_path = public as $$
declare q fj_quiz; v fj_vragen; totaal int; quiz_spel bigint;
begin
  perform fj_eis_pin(p_pin);
  select * into q from fj_quiz where id = 1;
  select * into v from fj_vragen where nr = q.nr;
  select count(*) into totaal from fj_vragen;
  if p_actie = 'start' and totaal > 0 then update fj_quiz set nr = 1, fase = 'wacht', geopend = null where id = 1;
  elsif p_actie = 'open' and q.fase = 'wacht' then update fj_quiz set fase = 'open', geopend = now() where id = 1;
  elsif p_actie = 'sluit' and q.fase = 'open' then update fj_quiz set fase = 'dicht' where id = 1;
  elsif p_actie = 'toon' and q.fase in ('open', 'dicht') then
    update fj_quiz set fase = 'uitslag' where id = 1;
    if v.soort = 'getal' then        -- schatting: rangorde op afstand (gelijke afstand = gelijke plaats)
      update fj_antwoorden a set punten = greatest(0, 100 - 20 * (r.plaats - 1))
      from (select ridder_id, rank() over (order by abs(replace(waarde, ',', '.')::numeric - (v.juist #>> '{}')::numeric)) plaats
            from fj_antwoorden where nr = q.nr) r
      where a.nr = q.nr and a.ridder_id = r.ridder_id;
    end if;
    -- de punten van alle vragen samen naar de kolom Quiz van de tussenstand
    select id into quiz_spel from fj_spelen where naam = 'Quiz';
    if quiz_spel is not null then
      insert into fj_punten (ridder_id, spel_id, punten)
      select ridder_id, quiz_spel, sum(punten) from fj_antwoorden group by ridder_id
      on conflict (ridder_id, spel_id) do update set punten = excluded.punten;
    end if;
  elsif p_actie = 'volgende' then
    if q.nr < totaal then update fj_quiz set nr = q.nr + 1, fase = 'wacht', geopend = null where id = 1;
    else update fj_quiz set fase = 'uit' where id = 1; end if;
  elsif p_actie = 'stop' then update fj_quiz set fase = 'uit' where id = 1;
  elsif p_actie = 'reset' then
    delete from fj_antwoorden where true;   -- "where true": Supabase (pg-safeupdate) weigert een DELETE zonder WHERE
    update fj_quiz set nr = 0, fase = 'uit', geopend = null where id = 1;
    delete from fj_punten where spel_id = (select id from fj_spelen where naam = 'Quiz');
  end if;
  return fj_quiz_meester(p_pin);
end $$;

-- wat de quizmaster ziet: ook het juiste antwoord en wie al antwoordde
create or replace function fj_quiz_meester(p_pin text) returns json
language plpgsql security definer set search_path = public as $$
declare uit json;
begin
  perform fj_eis_pin(p_pin);
  select json_build_object('fase', q.fase, 'nr', q.nr, 'totaal', (select count(*) from fj_vragen), 'soort', v.soort, 'vraag', v.vraag,
    'afbeelding', v.afbeelding, 'antwoorden', v.antwoorden, 'juist', fj_quiz_juist(v),
    'verstreken', extract(epoch from now() - q.geopend), 'ridders', (select count(*) from fj_ridders),
    'antwoorden_van', coalesce((select json_agg(a.ridder_id) from fj_antwoorden a where a.nr = q.nr), '[]'))
  into uit from fj_quiz q left join fj_vragen v on v.nr = q.nr where q.id = 1;
  return uit;
end $$;

-- vragen laden (vervangt alle vragen en begint opnieuw):
-- [{"soort": "keuze", "vraag": "…", "afbeelding": "…", "antwoorden": [4×"…"], "juist": 0}, {"soort": "woord", …, "juist": ["leeuw", "lion"]}, {"soort": "getal", …, "juist": 695}]
create or replace function fj_quiz_laad(p_pin text, p_vragen jsonb) returns int
language plpgsql security definer set search_path = public as $$
begin
  perform fj_eis_pin(p_pin);
  delete from fj_antwoorden where true; delete from fj_vragen where true;   -- "where true": zie pg-safeupdate hierboven
  insert into fj_vragen (nr, soort, vraag, afbeelding, antwoorden, juist)
  select ord, coalesce(e->>'soort', 'keuze'), e->>'vraag', e->>'afbeelding', e->'antwoorden', e->'juist'
  from jsonb_array_elements(p_vragen) with ordinality as t(e, ord);
  update fj_quiz set nr = 0, fase = 'uit', geopend = null where id = 1;
  delete from fj_punten where spel_id = (select id from fj_spelen where naam = 'Quiz');
  return (select count(*) from fj_vragen);
end $$;

revoke execute on function fj_norm(text), fj_quiz_juist(fj_vragen), fj_quiz_toestand(), fj_quiz_antwoord(bigint, int, text), fj_quiz_stap(text, text),
  fj_quiz_meester(text), fj_quiz_laad(text, jsonb) from public, anon, authenticated;
grant execute on function fj_quiz_toestand(), fj_quiz_antwoord(bigint, int, text), fj_quiz_stap(text, text), fj_quiz_meester(text), fj_quiz_laad(text, jsonb)
  to anon, authenticated;

-- =====================================================================
--  Spotify koppelen via de gsm (zonder typen op de tv)
--  De tv maakt een geheime code van 128 bits en toont ze als QR-code. De gsm logt in bij Spotify en zet de
--  refresh-token hier onder die code; de tv haalt hem één keer op (en dan is de rij weg). Na 15 minuten verdwijnt
--  een rij sowieso. Niemand kan de tabel lezen: alleen wie de code kent, krijgt de token, en maar één keer.
-- =====================================================================
create table if not exists fj_spotify_koppel (
  id      text primary key check (length(id) between 32 and 64),
  token   text not null check (length(token) < 2000),
  gemaakt timestamptz not null default now()
);
alter table fj_spotify_koppel enable row level security;   -- geen policies: alleen via de functies hieronder

create or replace function fj_spotify_zet(p_id text, p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from fj_spotify_koppel where gemaakt < now() - interval '15 minutes';
  if p_id !~ '^[0-9a-f]{32,64}$' or coalesce(p_token, '') = '' then return false; end if;
  insert into fj_spotify_koppel (id, token) values (p_id, p_token)
  on conflict (id) do update set token = excluded.token, gemaakt = now();
  return true;
end $$;

create or replace function fj_spotify_haal(p_id text) returns text
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  delete from fj_spotify_koppel where id = p_id and gemaakt > now() - interval '15 minutes' returning token into t;
  return t;
end $$;

revoke execute on function fj_spotify_zet(text, text), fj_spotify_haal(text) from public, anon, authenticated;
grant execute on function fj_spotify_zet(text, text), fj_spotify_haal(text) to anon, authenticated;

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
--    getal  een schatting; punten = (100 + max(0, 30 − t)) · max(0, 1 − |ln(g / a)|), met g = gok, a = antwoord,
--           t = seconden; de log-afstand maakt "dubbel zo veel" even erg als "half zo veel", en vanaf een factor e ernaast: 0
--    meer   meerdere antwoorden (bv. de vier edelstenen van Mucha): 50 punten per verschillend juist antwoord
--  Lidwoorden vooraan tellen niet ("de leeuw" = "leeuw"). De quizmaster kan elk antwoord achteraf goed- of afkeuren.
--  De juiste antwoorden zijn voor spelers onleesbaar tot de quizmaster ze toont.
--  Opnieuw draaien mag: de quiztabellen worden dan leeggemaakt en opnieuw aangelegd (de vragen laadt u daarna opnieuw).
-- =====================================================================
drop table if exists fj_antwoorden, fj_vragen, fj_quiz cascade;
create table fj_vragen (
  nr         int  primary key,
  ronde      text,                                -- bv. 'Tsjechië'; opeenvolgende vragen met dezelfde ronde horen samen
  soort      text not null default 'keuze' check (soort in ('keuze', 'woord', 'getal', 'meer')),
  vraag      text not null,
  afbeelding text,                                -- pad op de site, bv. 'feestje-img/quiz/komeet.webp' (alleen op de tv)
  antwoorden jsonb,                               -- keuze: ["…", "…", "…", "…"] · meer: de namen van de invulvakjes, bv. ["geel", "rood", …]
  tijd       int  not null default 30 check (tijd between 10 and 300),   -- bedenktijd in seconden; daarna toont de quiz vanzelf het antwoord
  juist      jsonb not null                       -- keuze: 0–3 · woord: ["leeuw", "lion"] · getal: 695 · meer: [["topaas", "topaz"], ["robijn", "ruby"], …]
);
create table fj_quiz (
  id      int  primary key default 1 check (id = 1),
  nr      int  not null default 0,
  fase    text not null default 'uit' check (fase in ('uit', 'intro', 'wacht', 'open', 'dicht', 'uitslag', 'stand')),   -- intro = beginscherm met QR-code; stand = tussenstand na een ronde
  geopend timestamptz
);
create table fj_antwoorden (
  nr        int    not null,
  ridder_id bigint not null references fj_ridders on delete cascade,
  keuze     int    check (keuze between 0 and 3),   -- keuze
  waarde    text,                                   -- woord of getal, zoals ingetypt (meer: gescheiden door "|")
  punten    int    not null default 0,
  oordeel   numeric check (oordeel in (0, 0.5, 1)),  -- de quizmaster: 1 = goed, 0,5 = half, 0 = fout; null = automatisch
  tijd      timestamptz not null default now(),
  primary key (nr, ridder_id)
);
alter table fj_vragen     enable row level security;   -- geen policies: alleen via de functies hieronder
alter table fj_quiz       enable row level security;
alter table fj_antwoorden enable row level security;
insert into fj_quiz (id) values (1) on conflict (id) do nothing;

-- uitbreiding (veilig op een bestaande database): soort 'meer' en het oordeel van de quizmaster
alter table fj_vragen drop constraint if exists fj_vragen_soort_check;
alter table fj_vragen add constraint fj_vragen_soort_check check (soort in ('keuze', 'woord', 'getal', 'meer'));
alter table fj_antwoorden add column if not exists oordeel boolean;
-- rondes met een tussenstand
alter table fj_vragen add column if not exists ronde text;
alter table fj_quiz drop constraint if exists fj_quiz_fase_check;
alter table fj_quiz add constraint fj_quiz_fase_check check (fase in ('uit', 'intro', 'wacht', 'open', 'dicht', 'uitslag', 'stand'));
-- het oordeel van de quizmaster: 1 = goed, 0,5 = half, 0 = fout (was ja/nee). Alleen omzetten als het nog ja/nee is.
do $$ begin
  if (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'fj_antwoorden' and column_name = 'oordeel') = 'boolean' then
    alter table fj_antwoorden alter column oordeel type numeric using case when oordeel then 1 when not oordeel then 0 end;
  end if;
end $$;
alter table fj_antwoorden drop constraint if exists fj_antwoorden_oordeel_check;
alter table fj_antwoorden add constraint fj_antwoorden_oordeel_check check (oordeel in (0, 0.5, 1));
-- wie speelt er mee? De gsm meldt zich bij elke oproep van de toestand (om de 1,5 s); wie 15 s niets liet horen
-- (pagina dicht, gsm in slaap), telt niet meer mee. Hebben alle spelers geantwoord, dan verschijnt het antwoord meteen.
create table if not exists fj_quiz_spelers (
  ridder_id bigint primary key references fj_ridders on delete cascade,
  gezien    timestamptz not null default now()
);
alter table fj_quiz_spelers enable row level security;   -- geen policies: alleen via de functies hieronder
-- bedenktijd per vraag
alter table fj_vragen add column if not exists tijd int not null default 30;
alter table fj_vragen drop constraint if exists fj_vragen_tijd_check;
alter table fj_vragen add constraint fj_vragen_tijd_check check (tijd between 10 and 300);

-- normaliseren: kleine letters, zonder accenten, zonder lidwoord vooraan, zonder spaties en leestekens
-- ("Groš!" → "gros", "De Leeuw" → "leeuw", "een leeuw" → "leeuw", "the lion" → "lion")
create or replace function fj_norm(t text) returns text
language sql immutable as $$
  select regexp_replace(regexp_replace(lower(translate(trim(coalesce(t, '')),
    'áàâäãåčćçďéèêëěíìîïľĺňñóòôöõřŕšśťúùûüůýÿžźÁÀÂÄÃÅČĆÇĎÉÈÊËĚÍÌÎÏĽĹŇÑÓÒÔÖÕŘŔŠŚŤÚÙÛÜŮÝŸŽŹ',
    'aaaaaacccdeeeeeiiiillnnooooorrsstuuuuuyyzzaaaaaacccdeeeeeiiiillnnooooorrsstuuuuuyyzz')),
    '^(de|het|een|n|t|the|a|an|der|die|das|ein|eine|le|la|les|l|un|une)[^a-z0-9]+', ''), '[^a-z0-9]', '', 'g');
$$;

-- soort 'meer': hoeveel verschillende juiste antwoorden zitten er in een ingevulde lijst ("topaas|robijn|ruby")?
create or replace function fj_quiz_meer(v fj_vragen, p_tekst text) returns int
language sql immutable as $$
  select count(*)::int from jsonb_array_elements(v.juist) as goed(varianten)
  where exists (select 1 from regexp_split_to_table(coalesce(p_tekst, ''), '\|') as ingevuld(w), jsonb_array_elements_text(goed.varianten) as var(g)
                where fj_norm(w) <> '' and fj_norm(w) = fj_norm(var.g));
$$;

-- het juiste antwoord om te tonen: keuze → het nummer, woord → het eerste goede woord, getal → het getal
create or replace function fj_quiz_juist(v fj_vragen) returns jsonb
language sql immutable as $$ select case when v.soort = 'woord' then v.juist->0
  when v.soort = 'meer' then (select jsonb_agg(x->0) from jsonb_array_elements(v.juist) x) else v.juist end $$;

-- wat iedereen mag zien (tv en spelers); het juiste antwoord pas in de fase 'uitslag'
-- de quizpunten van alle vragen samen naar de kolom Quiz van de tussenstand
create or replace function fj_quiz_naar_stand() returns void
language plpgsql security definer set search_path = public as $$
declare quiz_spel bigint;
begin
  select id into quiz_spel from fj_spelen where naam = 'Quiz';
  if quiz_spel is not null then
    insert into fj_punten (ridder_id, spel_id, punten)
    select ridder_id, quiz_spel, sum(punten) from fj_antwoorden group by ridder_id
    on conflict (ridder_id, spel_id) do update set punten = excluded.punten;
  end if;
end $$;

-- de klok: de quiz toont vanzelf het antwoord als de bedenktijd om is, of als elke speler (gsm de laatste 15 s gezien)
-- al geantwoord heeft. Er draait geen server: elke oproep van de toestand (tv, gsm's, beheer, om de paar seconden)
-- kijkt eerst even. Eén UPDATE met de voorwaarde erin: twee gelijktijdige oproepen zetten de stap hooguit één keer.
create or replace function fj_quiz_klok() returns void
language plpgsql security definer set search_path = public as $$
begin
  update fj_quiz q set fase = 'uitslag' from fj_vragen v
  where q.id = 1 and v.nr = q.nr and q.fase in ('open', 'dicht') and (
    q.geopend <= now() - make_interval(secs => v.tijd)
    or (exists (select 1 from fj_antwoorden a where a.nr = q.nr)
        and not exists (select 1 from fj_quiz_spelers s where s.gezien > now() - interval '15 seconds'
                        and not exists (select 1 from fj_antwoorden a where a.nr = q.nr and a.ridder_id = s.ridder_id))));
  if found then perform fj_quiz_naar_stand(); end if;
end $$;

-- volatile (niet stable): de toestand kan de klok een stap laten zetten. p_ridder: de gsm van een speler meldt zich.
drop function if exists fj_quiz_toestand();   -- de oude versie zonder speler
create or replace function fj_quiz_toestand(p_ridder bigint default null) returns json
language plpgsql volatile security definer set search_path = public as $$
declare uit json;
begin
  if p_ridder is not null and exists (select 1 from fj_ridders where id = p_ridder) then
    insert into fj_quiz_spelers (ridder_id, gezien) values (p_ridder, now()) on conflict (ridder_id) do update set gezien = now();
  end if;
  perform fj_quiz_klok();
  select json_build_object(
    'fase', q.fase, 'nr', q.nr, 'totaal', (select count(*) from fj_vragen),
    'ronde', v.ronde, 'rondes', (select json_agg(coalesce(w.ronde, '') order by w.nr) from fj_vragen w),
    'soort', case when q.fase <> 'uit' then v.soort end,
    'vraag', case when q.fase <> 'uit' then v.vraag end,
    'afbeelding', case when q.fase <> 'uit' then v.afbeelding end,
    'antwoorden', case when q.fase <> 'uit' then v.antwoorden end,
    'tijd', coalesce(v.tijd, 30),
    'verstreken', case when q.geopend is not null then extract(epoch from now() - q.geopend) end,
    'aantal', (select count(*) from fj_antwoorden a where a.nr = q.nr),
    'ridders', (select count(*) from fj_ridders),
    'spelers', (select count(*) from fj_quiz_spelers where gezien > now() - interval '15 seconds'),
    'aanwezig', coalesce((select json_agg(ridder_id order by ridder_id) from fj_quiz_spelers where gezien > now() - interval '15 seconds'), '[]'),   -- hun schilden op het beginscherm
    'van', case when q.fase in ('open', 'dicht') then coalesce((select json_agg(a.ridder_id order by a.tijd) from fj_antwoorden a where a.nr = q.nr), '[]') end,   -- wie al antwoordde (niet wat)
    'juist', case when q.fase = 'uitslag' then fj_quiz_juist(v) end,
    'uitslag', case when q.fase = 'uitslag' then coalesce((select json_agg(json_build_object('ridder_id', a.ridder_id, 'keuze', a.keuze, 'waarde', a.waarde, 'punten', a.punten,
                                                           'sec', floor(extract(epoch from a.tijd - q.geopend)))
                                                           order by a.punten desc, a.tijd) from fj_antwoorden a where a.nr = q.nr), '[]') end,
    'stand', case when q.fase in ('uitslag', 'stand') or (q.fase = 'uit' and q.nr > 0) then coalesce((select json_agg(json_build_object('ridder_id', t.ridder_id, 'punten', t.som) order by t.som desc)
                                                           from (select ridder_id, sum(punten) som from fj_antwoorden group by ridder_id) t), '[]') end)
  into uit from fj_quiz q left join fj_vragen v on v.nr = q.nr where q.id = 1;
  return uit;
end $$;

-- een speler antwoordt (één keer per vraag; alleen terwijl de vraag open staat).
-- p_keuze voor keuzevragen, p_tekst voor woord, getal en meer.
create or replace function fj_quiz_antwoord(p_ridder bigint, p_keuze int, p_tekst text) returns boolean
language plpgsql security definer set search_path = public as $$
declare q fj_quiz; v fj_vragen; sec numeric; snel int; pt int := 0; gok numeric; echt numeric; gelukt boolean;   -- niet "g": botst met de alias g hieronder
begin
  perform fj_quiz_klok();   -- na de bedenktijd: te laat
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
  elsif v.soort = 'meer' then
    if fj_norm(replace(p_tekst, '|', '')) = '' then return false; end if;
    pt := 50 * fj_quiz_meer(v, p_tekst);
  else
    if p_tekst !~ '^\s*-?[0-9]+([.,][0-9]+)?\s*$' then return false; end if;
    gok := replace(trim(p_tekst), ',', '.')::numeric; echt := (v.juist #>> '{}')::numeric;
    if gok > 0 and echt > 0 then pt := round((100 + snel) * greatest(0, 1 - abs(ln(gok / echt)))); end if;   -- log-afstand
  end if;
  insert into fj_antwoorden (nr, ridder_id, keuze, waarde, punten)
  values (q.nr, p_ridder, case when v.soort = 'keuze' then p_keuze end, case when v.soort <> 'keuze' then left(trim(p_tekst), 200) end, pt)
  on conflict (nr, ridder_id) do nothing;
  gelukt := found;          -- bewaren: PERFORM hieronder zet FOUND opnieuw
  perform fj_quiz_klok();   -- was dit de laatste speler? dan meteen de uitslag
  return gelukt;
end $$;

-- de quizmaster: start · open · sluit · toon · volgende · stop · reset
create or replace function fj_quiz_stap(p_pin text, p_actie text) returns json
language plpgsql security definer set search_path = public as $$
declare q fj_quiz; v fj_vragen; totaal int;
begin
  perform fj_eis_pin(p_pin);
  perform fj_quiz_klok();
  select * into q from fj_quiz where id = 1;
  select * into v from fj_vragen where nr = q.nr;
  select count(*) into totaal from fj_vragen;
  -- start: eerst het beginscherm (nr 0); "volgende" gaat daarna naar vraag 1
  if p_actie = 'start' and totaal > 0 then update fj_quiz set nr = 0, fase = 'intro', geopend = null where id = 1;
  elsif p_actie = 'open' and q.fase = 'wacht' then update fj_quiz set fase = 'open', geopend = now() where id = 1;
  elsif p_actie = 'sluit' and q.fase = 'open' then update fj_quiz set fase = 'dicht' where id = 1;
  elsif p_actie = 'toon' and q.fase in ('open', 'dicht') then
    update fj_quiz set fase = 'uitslag' where id = 1;
    perform fj_quiz_naar_stand();
  elsif p_actie = 'volgende' then
    if q.fase = 'uitslag' and q.nr < totaal and v.ronde is not null
       and (select w.ronde from fj_vragen w where w.nr = q.nr + 1) is distinct from v.ronde then
      update fj_quiz set fase = 'stand' where id = 1;            -- einde van een ronde: eerst de tussenstand
    elsif q.nr < totaal then update fj_quiz set nr = q.nr + 1, fase = 'wacht', geopend = null where id = 1;
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
  perform fj_quiz_klok();
  select json_build_object('fase', q.fase, 'nr', q.nr, 'totaal', (select count(*) from fj_vragen), 'soort', v.soort, 'vraag', v.vraag, 'tijd', coalesce(v.tijd, 30),
    'ronde', v.ronde, 'rondes', (select json_agg(coalesce(w.ronde, '') order by w.nr) from fj_vragen w),
    'afbeelding', v.afbeelding, 'antwoorden', v.antwoorden, 'juist', fj_quiz_juist(v),
    'verstreken', extract(epoch from now() - q.geopend), 'ridders', (select count(*) from fj_ridders),
    'spelers', (select count(*) from fj_quiz_spelers where gezien > now() - interval '15 seconds'),
    'antwoorden_van', coalesce((select json_agg(a.ridder_id) from fj_antwoorden a where a.nr = q.nr), '[]'),
    'alle', coalesce((select json_agg(json_build_object('ridder_id', a.ridder_id, 'keuze', a.keuze, 'waarde', a.waarde, 'punten', a.punten, 'oordeel', a.oordeel,
                        'sec', round(extract(epoch from a.tijd - q.geopend)::numeric, 1)) order by a.tijd) from fj_antwoorden a where a.nr = q.nr), '[]'),
    'volgende', (select json_build_object('nr', w.nr, 'ronde', w.ronde, 'soort', w.soort, 'tijd', w.tijd, 'vraag', w.vraag, 'afbeelding', w.afbeelding, 'antwoorden', w.antwoorden, 'juist', fj_quiz_juist(w))
                 from fj_vragen w where w.nr = case when q.fase = 'uit' and q.nr = 0 then 1 else q.nr + 1 end))
  into uit from fj_quiz q left join fj_vragen v on v.nr = q.nr where q.id = 1;
  return uit;
end $$;

-- de quizmaster beoordeelt een antwoord op de huidige vraag: 1 = goed, 0,5 = half, 0 = fout; null = terug naar automatisch.
-- Goed: 100 + de snelheidsbonus van dat antwoord (meer: het maximum, 50 per mogelijk antwoord); half: de helft daarvan.
-- Getal: niet van toepassing (daar beslist de afstand).
drop function if exists fj_quiz_keur(text, bigint, boolean);   -- de oude versie (goed/fout als ja/nee)
create or replace function fj_quiz_keur(p_pin text, p_ridder bigint, p_oordeel numeric) returns json
language plpgsql security definer set search_path = public as $$
declare q fj_quiz; v fj_vragen; a fj_antwoorden; snel int; auto int; max int;
begin
  perform fj_eis_pin(p_pin);
  select * into q from fj_quiz where id = 1;
  select * into v from fj_vragen where nr = q.nr;
  select * into a from fj_antwoorden where nr = q.nr and ridder_id = p_ridder;
  if a.ridder_id is null or v.soort = 'getal' or (p_oordeel is not null and p_oordeel not in (0, 0.5, 1)) then return fj_quiz_meester(p_pin); end if;
  snel := greatest(0, 30 - floor(extract(epoch from a.tijd - q.geopend)))::int;
  auto := case v.soort when 'keuze' then case when a.keuze = (v.juist #>> '{}')::int then 100 + snel else 0 end
                       when 'woord' then case when exists (select 1 from jsonb_array_elements_text(v.juist) g where fj_norm(g) = fj_norm(a.waarde)) then 100 + snel else 0 end
                       else 50 * fj_quiz_meer(v, a.waarde) end;
  max := case when v.soort = 'meer' then 50 * jsonb_array_length(v.juist) else 100 + snel end;
  update fj_antwoorden set oordeel = p_oordeel,
    punten = case when p_oordeel is null then auto else round(max * p_oordeel) end
  where nr = q.nr and ridder_id = p_ridder;
  if q.fase in ('uitslag', 'stand') then perform fj_quiz_naar_stand(); end if;   -- de tussenstand meteen bijwerken
  return fj_quiz_meester(p_pin);
end $$;

-- vragen laden (vervangt alle vragen en begint opnieuw):
-- [{"soort": "keuze", "vraag": "…", "afbeelding": "…", "antwoorden": [4×"…"], "juist": 0}, {"soort": "woord", …, "juist": ["leeuw", "lion"]}, {"soort": "getal", …, "juist": 695}]
create or replace function fj_quiz_laad(p_pin text, p_vragen jsonb) returns int
language plpgsql security definer set search_path = public as $$
begin
  perform fj_eis_pin(p_pin);
  delete from fj_antwoorden where true; delete from fj_vragen where true;   -- "where true": zie pg-safeupdate hierboven
  insert into fj_vragen (nr, ronde, soort, vraag, afbeelding, antwoorden, tijd, juist)
  select ord, e->>'ronde', coalesce(e->>'soort', 'keuze'), e->>'vraag', e->>'afbeelding', e->'antwoorden', coalesce((e->>'tijd')::int, 30), e->'juist'
  from jsonb_array_elements(p_vragen) with ordinality as t(e, ord);
  update fj_quiz set nr = 0, fase = 'uit', geopend = null where id = 1;
  delete from fj_punten where spel_id = (select id from fj_spelen where naam = 'Quiz');
  return (select count(*) from fj_vragen);
end $$;

revoke execute on function fj_norm(text), fj_quiz_juist(fj_vragen), fj_quiz_meer(fj_vragen, text), fj_quiz_naar_stand(), fj_quiz_klok(), fj_quiz_toestand(bigint), fj_quiz_antwoord(bigint, int, text),
  fj_quiz_stap(text, text), fj_quiz_meester(text), fj_quiz_keur(text, bigint, numeric), fj_quiz_laad(text, jsonb) from public, anon, authenticated;
grant execute on function fj_quiz_toestand(bigint), fj_quiz_antwoord(bigint, int, text), fj_quiz_stap(text, text), fj_quiz_meester(text), fj_quiz_keur(text, bigint, numeric),
  fj_quiz_laad(text, jsonb) to anon, authenticated;

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

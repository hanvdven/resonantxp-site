'use strict';
/* De Kennisproef: vijf rondes (de derde met zes vragen), met na elke ronde een tussenstand.
   Laden in de database: /feestje-beheer → Quiz leiden → "Vragen laden".

   ronde: de naam van de ronde; opeenvolgende vragen met dezelfde naam horen samen.
   soort: 'keuze' (vier antwoorden; juist = 0, 1, 2 of 3), 'woord' (juist = lijst van goede antwoorden; hoofdletters,
   accenten, spaties, leestekens en een lidwoord vooraan tellen niet), 'getal' (een schatting; juist = het getal; punten =
   (100 + max(0, 30 − t)) · max(0, 1 − |ln(gok / antwoord)|)) of 'meer' (meerdere antwoorden; juist = per antwoord een
   lijst varianten; 50 punten per juist antwoord, in welk vakje ook; antwoorden = de namen van de invulvakjes).
   Als quizmaster kunt u elk antwoord achteraf goed- of afkeuren.
   tijd: bedenktijd in seconden (standaard 30); daarna toont de quiz vanzelf het juiste antwoord.
   afbeelding: groot op de tv, klein op de gsm. Bij foto's onder een CC-licentie staat de naamsvermelding in het beeld.
   Elke vraag begint met een zinnetje context, zodat ook wie het antwoord niet weet, iets opsteekt.
   Let op: wie de broncode van de site leest, kan de antwoorden hier zien. Voor een feest aanvaardbaar. */
const QUIZ_VRAGEN = [
  /* ---------- Ronde I · Tsjechië ---------- */
  { ronde: 'Tsjechië', soort: 'keuze', afbeelding: 'feestje-img/quiz/sedlec.webp',
    vraag: 'In Sedlec, vlak bij Kuttenberg, hangt een kroonluchter waarin elk bot van het menselijk lichaam zit. Hij hangt in een ossuarium. Wat is dat?',
    antwoorden: ['Een knekelhuis', 'Een kerkschat', 'Een wijnkelder', 'Een kloostertuin'], juist: 0 },
  { ronde: 'Tsjechië', soort: 'keuze', afbeelding: 'feestje-img/quiz/plzen.webp',
    vraag: 'In 1842 brouwde de Beierse brouwer Josef Groll in een Boheemse stad een helder, goudgeel bier dat de hele wereld veroverde. Welke soort bier komt oorspronkelijk uit Plzeň?',
    antwoorden: ['Grolsch', 'Lambiek', 'Pils', 'Weizen'], juist: 2 },
  { ronde: 'Tsjechië', soort: 'keuze', afbeelding: 'feestje-img/quiz/malesov-bed.webp',
    vraag: 'In de burcht van Malešov, bij Kuttenberg, staat een middeleeuws bed dat opvallend hoog is. Waarom?',
    antwoorden: ['Om dichter bij de hemel te slapen', 'Zodat de hond eronder kon slapen', 'Tegen overstromingen', 'Omdat men rechtop zittend sliep'], juist: 1 },
  { ronde: 'Tsjechië', soort: 'woord', afbeelding: 'feestje-img/quiz/hus.webp',
    vraag: 'Jan Hus werd in 1415 in Konstanz verbrand. Op de brandstapel zou hij gezegd hebben: "Vandaag braadt u een …, maar over honderd jaar komt er een zwaan die u niet kunt verbranden." Welk dier betekent "hus" in het Tsjechisch?',
    juist: ['gans', 'ganzen', 'goose', 'husa'] },
  { ronde: 'Tsjechië', soort: 'meer', tijd: 60, antwoorden: ['geel', 'rood', 'roze', 'groen'], afbeelding: 'feestje-img/quiz/mucha.webp',
    vraag: 'Alfons Mucha, geboren in Moravië, werd in Parijs beroemd met zijn art-nouveau-affiches. In 1900 schilderde hij vier panelen: elk stelt een edelsteen voor. Welke? (Let op de kleuren.)',
    juist: [['topaas', 'topaz', 'topase', 'topas'], ['robijn', 'ruby', 'rubis', 'rubin'], ['amethist', 'amethyst', 'amethyste', 'ametist'], ['smaragd', 'emerald', 'emeraude', 'smaragt']] },

  /* ---------- Ronde II · Middeleeuwen in België ---------- */
  { ronde: 'Middeleeuwen in België', soort: 'keuze', afbeelding: 'feestje-img/quiz/sporen.webp',
    vraag: 'Na de Guldensporenslag van 1302 hingen de Vlamingen honderden gulden sporen van Franse ridders op in de Onze-Lieve-Vrouwekerk van Kortrijk. Wat gebeurde er tachtig jaar later mee?',
    antwoorden: ['Ze werden omgesmolten tot munten', 'Ze werden aan de paus geschonken', 'Ze hangen er nog altijd', 'De Fransen namen ze terug en staken Kortrijk in brand'], juist: 3 },
  { ronde: 'Middeleeuwen in België', soort: 'keuze', afbeelding: 'feestje-img/quiz/universiteit.webp',
    vraag: 'De Leuvense universiteit, de oudste van de Nederlanden, werd in 1425 gesticht met toestemming van paus Martinus V. Op vraag van welke hertog van Brabant?',
    antwoorden: ['Filips de Goede', 'Karel de Stoute', 'Jan IV', 'Jan zonder Vrees'], juist: 2 },
  { ronde: 'Middeleeuwen in België', soort: 'woord', afbeelding: 'feestje-img/quiz/belfort.webp',
    vraag: 'Op de grootste klok van het Gentse belfort stond: "Mijn naam is …; als ik klep, dan is \'t brand, en als ik luid, dan is \'t storm in Vlaanderland." Hoe heette de klok?',
    juist: ['Roeland', 'Roland', 'Roelandt'] },
  { ronde: 'Middeleeuwen in België', soort: 'getal', afbeelding: 'feestje-img/quiz/stadhuis.webp',
    vraag: 'Het gotische stadhuis van Leuven is een stenen kantwerk vol nissen, en sinds de 19e eeuw staat er in elke nis een beeld. Hoeveel beelden staan er op de gevels?',
    juist: 236 },
  { ronde: 'Middeleeuwen in België', soort: 'keuze', afbeelding: 'feestje-img/quiz/blijde-inkomst.webp',
    vraag: 'In 1356 moesten hertogin Johanna en haar man Wenceslaus in Leuven een charter zweren voor ze over Brabant mochten heersen: de Blijde Inkomst. Wat stond erin?',
    antwoorden: ['De rechten en vrijheden van de Brabanders', 'Het programma van de feesten', 'De belasting op bier', 'De route van de processie'], juist: 0 },

  /* ---------- Ronde III · Europa rond 1400 ---------- */
  { ronde: 'Europa rond 1400', soort: 'keuze', afbeelding: 'feestje-img/wonder/f065.webp',
    vraag: 'In de winter van 1401 op 1402 zag heel Europa dit wonderteken; een kroniekschrijver sprak van een staart als van een pauw. Wat stond er aan de hemel?',
    antwoorden: ['Het noorderlicht', 'Een vallende ster', 'Een zonsverduistering', 'Een komeet'], juist: 3 },
  { ronde: 'Europa rond 1400', soort: 'keuze', afbeelding: 'feestje-img/quiz/wenceslaus.webp',
    vraag: 'In 1400 zetten de keurvorsten van het Heilig Roomse Rijk hun koning af als "nutteloos": hij bleef liever jagen en drinken in Praag. Wie was het?',
    antwoorden: ['Sigismund', 'Wenceslaus IV', 'Karel IV', 'Ruprecht van de Palts'], juist: 1 },
  { ronde: 'Europa rond 1400', soort: 'keuze', afbeelding: 'feestje-img/quiz/avignon.webp',
    vraag: 'Rond 1400 had de kerk twee pausen tegelijk, die elkaar over en weer in de ban deden: één in Rome, en één in …',
    antwoorden: ['Parijs', 'Avignon', 'Konstanz', 'Aken'], juist: 1 },
  { ronde: 'Europa rond 1400', soort: 'keuze', afbeelding: 'feestje-img/quiz/hus-konstanz.webp',
    vraag: 'In 1403 verbood de universiteit van Praag de leer van de Engelse hervormer Wyclif. De prediker Jan Hus bleef hem verdedigen, en werd daarvoor in 1415 in Konstanz verbrand. Welk van deze vier deed Hus NIET?',
    antwoorden: ['Een Tsjechische bijbelvertaling herzien', 'De háček (ˇ) in het Tsjechische schrift invoeren', '95 stellingen op een kerkdeur spijkeren', 'Rector van de universiteit van Praag worden'], juist: 2 },
  { ronde: 'Europa rond 1400', soort: 'woord', afbeelding: 'feestje-img/quiz/defenestratie.webp',
    vraag: 'Op 30 juli 1419 bestormden hussieten het stadhuis van de Praagse Nieuwe Stad en gooiden de raadsheren uit het raam. Koning Wenceslaus IV stierf kort daarna, naar verluidt van schrik. Voor uit het raam gooien bestaat sindsdien een apart woord. Welk?',
    juist: ['defenestratie', 'defenestratio', 'defenestration', 'defenestrace', 'defenestreren', 'defenestrering', 'defenestratie van praag'] },
  { ronde: 'Europa rond 1400', soort: 'getal', afbeelding: 'feestje-img/quiz/munt-leuven.webp',
    vraag: 'De Luxemburgers regeerden in Praag én in Brabant: Wenceslaus, halfbroer van keizer Karel IV, liet als hertog van Brabant deze munt slaan in Leuven. Hoeveel kilometer ligt Leuven hemelsbreed van Praag?',
    juist: 693 },

  /* ---------- Ronde IV · Kingdom Come (ook te raden zonder het spel te kennen) ---------- */
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/fortuna.webp',
    vraag: 'Hans Kapoen en Hendrik van Skalitz zeggen het vaak tegen elkaar: "Fortuna audentes iuvat." Wat betekent dat?',
    antwoorden: ['Het geluk is met de dapperen', 'Wie zwijgt, stemt toe', 'Ik kwam, zag en overwon', 'Pluk de dag'], juist: 0 },
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/paard.webp',
    vraag: 'Hendriks trouwe paard heet in het Engels "Pebbles". Wat betekent die naam?',
    antwoorden: ['Haverkorrels', 'Hoefijzers', 'Kiezelsteentjes', 'Rozijntjes'], juist: 2 },
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/trosky.webp',
    vraag: 'Kingdom Come II begint bij de burcht Trosky: twee torens, elk op een uitgedoofde vulkaanpijp. De torens heten Panna en Baba. Wat betekent dat?',
    antwoorden: ['De koning en de koningin', 'De zon en de maan', 'Het zwaard en het schild', 'De maagd en het oude wijf'], juist: 3 },
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/groschen.webp',
    vraag: 'In Kingdom Come II kom je in Kuttenberg, rond 1400 na Praag de rijkste stad van Bohemen. Waaraan dankte ze dat?',
    antwoorden: ['Zoutmijnen', 'Zilvermijnen', 'Wijnbouw', 'Glasblazerijen'], juist: 1 },
  { ronde: 'Kingdom Come', soort: 'getal', afbeelding: 'feestje-img/quiz/harnas.webp',
    vraag: 'Aan het eind van het spel loopt Hendrik rond in een volledig plaatharnas. Hoeveel kilo woog zo\'n harnas rond 1400 ongeveer?',
    juist: 25 },

  /* ---------- Ronde V · Legenden en folklore ---------- */
  { ronde: 'Legenden en folklore', soort: 'woord', afbeelding: 'feestje-img/quiz/zizka-tabor.webp',
    vraag: 'Jan Žižka, de eenogige aanvoerder van de hussieten (hier zijn standbeeld in Tábor), verloor nooit een veldslag. Volgens de legende liet hij na zijn dood iets maken van zijn eigen huid, zodat zijn vijanden ook dan nog zouden vluchten. Wat?',
    juist: ['trommel', 'trom', 'drum', 'trommelvel', 'tamboer'] },
  { ronde: 'Legenden en folklore', soort: 'keuze', afbeelding: 'feestje-img/quiz/heraldiek.webp',
    vraag: 'Rond 1405 schilderde de heraut Beyeren dit wapenboek. De heraldiek heeft eigen namen voor kleuren: keel is rood, azuur is blauw, sinopel is groen. En sabel?',
    antwoorden: ['Zandkleur', 'Zwart', 'Zilver', 'Paars'], juist: 1 },
  { ronde: 'Legenden en folklore', soort: 'keuze', afbeelding: 'feestje-img/quiz/reynaert.webp',
    vraag: 'In het Vlaamse dierenepos "Van den vos Reynaerde" uit de 13e eeuw daagt de koning, een leeuw, de vos voor zijn hof. Hoe heet die koning?',
    antwoorden: ['Bruun', 'Isegrim', 'Nobel', 'Tibeert'], juist: 2 },
  { ronde: 'Legenden en folklore', soort: 'keuze', afbeelding: 'feestje-img/quiz/beiaard.webp',
    vraag: 'Het reuzenpaard Ros Beiaard droeg vier broers tegelijk op zijn rug, en trekt nog altijd door Dendermonde. Hoe heten die broers?',
    antwoorden: ['De vier Heemskinderen', 'De vier Evangelisten', 'De vier Gebroeders Grimm', 'De vier Musketiers'], juist: 0 },
  { ronde: 'Legenden en folklore', soort: 'getal', afbeelding: 'feestje-img/wonder/f127.webp',
    vraag: 'Volgens het Augsburger Wunderzeichenbuch vlogen er in 1533 dagenlang draken boven Bohemen, groot en klein, met een kroon op de kop. Hoeveel tegelijk, soms?',
    juist: 400 },
];

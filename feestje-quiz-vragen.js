'use strict';
/* De Kennisproef: vijf rondes van vijf vragen, met na elke ronde een tussenstand.
   Laden in de database: /feestje-beheer → Quiz leiden → "Vragen laden".

   ronde: de naam van de ronde; opeenvolgende vragen met dezelfde naam horen samen.
   soort: 'keuze' (vier antwoorden; juist = 0, 1, 2 of 3), 'woord' (juist = lijst van goede antwoorden; hoofdletters,
   accenten, spaties, leestekens en een lidwoord vooraan tellen niet), 'getal' (een schatting; juist = het getal; punten =
   (100 + max(0, 30 − t)) · max(0, 1 − |ln(gok / antwoord)|)) of 'meer' (meerdere antwoorden; juist = per antwoord een
   lijst varianten; 50 punten per juist antwoord). Als quizmaster kunt u elk antwoord achteraf goed- of afkeuren.
   afbeelding: groot op de tv, klein op de gsm. Bij foto's onder een CC-licentie staat de naamsvermelding in het beeld.
   Elke vraag begint met een zinnetje context, zodat ook wie het antwoord niet weet, iets opsteekt.
   Let op: wie de broncode van de site leest, kan de antwoorden hier zien. Voor een feest aanvaardbaar. */
const QUIZ_VRAGEN = [
  /* ---------- Ronde I · Tsjechië ---------- */
  { ronde: 'Tsjechië', soort: 'keuze', afbeelding: 'feestje-img/quiz/sedlec.webp',
    vraag: 'In Sedlec, vlak bij Kuttenberg, hangt een kroonluchter waarin elk bot van het menselijk lichaam zit. Hij hangt in een ossuarium. Wat is dat?',
    antwoorden: ['Een knekelhuis', 'Een kerkschat', 'Een wijnkelder', 'Een kloostertuin'], juist: 0 },
  { ronde: 'Tsjechië', soort: 'woord', afbeelding: 'feestje-img/quiz/plzen.webp',
    vraag: 'In 1842 brouwde de Beierse brouwer Josef Groll in een Boheemse stad een helder, goudgeel bier dat de hele wereld veroverde. Welke soort bier komt oorspronkelijk uit Plzeň?',
    juist: ['pils', 'pilsner', 'pilsener', 'pilsen', 'pilsje', 'pils bier'] },
  { ronde: 'Tsjechië', soort: 'keuze', afbeelding: 'feestje-img/quiz/malesov-bed.webp',
    vraag: 'In de burcht van Malešov, bij Kuttenberg, staat een middeleeuws bed dat opvallend hoog is. Waarom?',
    antwoorden: ['Zodat de hond eronder kon slapen', 'Om dichter bij de hemel te slapen', 'Tegen overstromingen', 'Omdat men rechtop zittend sliep'], juist: 0 },
  { ronde: 'Tsjechië', soort: 'woord', afbeelding: 'feestje-img/quiz/hus.webp',
    vraag: 'Jan Hus werd in 1415 in Konstanz verbrand. Op de brandstapel zou hij gezegd hebben: "Vandaag braadt u een …, maar over honderd jaar komt er een zwaan die u niet kunt verbranden." Welk dier betekent "hus" in het Tsjechisch?',
    juist: ['gans', 'ganzen', 'goose', 'husa'] },
  { ronde: 'Tsjechië', soort: 'meer', afbeelding: 'feestje-img/quiz/mucha.webp',
    vraag: 'Alfons Mucha, geboren in Moravië, werd in Parijs beroemd met zijn art-nouveau-affiches. In 1900 schilderde hij vier panelen: elk stelt een edelsteen voor. Welke? (Let op de kleuren.)',
    juist: [['topaas', 'topaz', 'topase', 'topas'], ['robijn', 'ruby', 'rubis', 'rubin'], ['amethist', 'amethyst', 'amethyste', 'ametist'], ['smaragd', 'emerald', 'emeraude', 'smaragt']] },

  /* ---------- Ronde II · Middeleeuwen in België ---------- */
  { ronde: 'Middeleeuwen in België', soort: 'keuze', afbeelding: 'feestje-img/quiz/sporen.webp',
    vraag: 'Na de Guldensporenslag van 1302 hingen de Vlamingen honderden gulden sporen van Franse ridders op in de Onze-Lieve-Vrouwekerk van Kortrijk. Wat gebeurde er tachtig jaar later mee?',
    antwoorden: ['De Fransen namen ze terug en staken Kortrijk in brand', 'Ze werden omgesmolten tot munten', 'Ze werden aan de paus geschonken', 'Ze hangen er nog altijd'], juist: 0 },
  { ronde: 'Middeleeuwen in België', soort: 'keuze', afbeelding: 'feestje-img/quiz/universiteit.webp',
    vraag: 'De Leuvense universiteit, de oudste van de Nederlanden, werd in 1425 gesticht met toestemming van paus Martinus V. Op vraag van welke hertog van Brabant?',
    antwoorden: ['Jan IV', 'Filips de Goede', 'Karel de Stoute', 'Jan zonder Vrees'], juist: 0 },
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
    antwoorden: ['Een komeet', 'Het noorderlicht', 'Een vallende ster', 'Een zonsverduistering'], juist: 0 },
  { ronde: 'Europa rond 1400', soort: 'keuze', afbeelding: 'feestje-img/quiz/wenceslaus.webp',
    vraag: 'In 1400 zetten de keurvorsten van het Heilig Roomse Rijk hun koning af als "nutteloos": hij bleef liever jagen en drinken in Praag. Wie was het?',
    antwoorden: ['Wenceslaus IV', 'Sigismund', 'Karel IV', 'Ruprecht van de Palts'], juist: 0 },
  { ronde: 'Europa rond 1400', soort: 'keuze', afbeelding: 'feestje-img/quiz/avignon.webp',
    vraag: 'Rond 1400 had de kerk twee pausen tegelijk, die elkaar over en weer in de ban deden: één in Rome, en één in …',
    antwoorden: ['Avignon', 'Parijs', 'Konstanz', 'Aken'], juist: 0 },
  { ronde: 'Europa rond 1400', soort: 'keuze', afbeelding: 'feestje-img/quiz/bayezid.webp',
    vraag: 'In 1402 versloeg een Turks-Mongoolse veroveraar bij Ankara de Ottomaanse sultan Bayezid, en nam hem gevangen. Wie was die veroveraar?',
    antwoorden: ['Timoer Lenk', 'Dzjengis Khan', 'Saladin', 'Attila'], juist: 0 },
  { ronde: 'Europa rond 1400', soort: 'getal', afbeelding: 'feestje-img/quiz/zhenghe.webp',
    vraag: 'In 1405, terwijl Bohemen in onrust was, vertrok de Chinese admiraal Zheng He met 28.000 man op zijn eerste grote zeereis. Met hoeveel schepen?',
    juist: 317 },

  /* ---------- Ronde IV · Kingdom Come (ook te raden zonder het spel te kennen) ---------- */
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/fortuna.webp',
    vraag: 'Hans Kapoen en Hendrik van Skalitz zeggen het vaak tegen elkaar: "Fortuna audentes iuvat." Wat betekent dat?',
    antwoorden: ['Het geluk is met de dapperen', 'Wie zwijgt, stemt toe', 'Ik kwam, zag en overwon', 'Pluk de dag'], juist: 0 },
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/paard.webp',
    vraag: 'Hendriks trouwe paard heet in het Engels "Pebbles". Wat betekent die naam?',
    antwoorden: ['Kiezelsteentjes', 'Haverkorrels', 'Hoefijzers', 'Rozijntjes'], juist: 0 },
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/trosky.webp',
    vraag: 'Kingdom Come II begint bij de burcht Trosky, met twee torens: Panna (de maagd) en Baba (het oude wijf). Waarop staan die torens?',
    antwoorden: ['Op twee uitgedoofde vulkaanpijpen', 'Op twee grafheuvels', 'Op de rand van een meteorietkrater', 'Op twee eilandjes in een meer'], juist: 0 },
  { ronde: 'Kingdom Come', soort: 'keuze', afbeelding: 'feestje-img/quiz/groschen.webp',
    vraag: 'In Kingdom Come II kom je in Kuttenberg, rond 1400 na Praag de rijkste stad van Bohemen. Waaraan dankte ze dat?',
    antwoorden: ['Zilvermijnen', 'Zoutmijnen', 'Wijnbouw', 'Glasblazerijen'], juist: 0 },
  { ronde: 'Kingdom Come', soort: 'getal', afbeelding: 'feestje-img/quiz/harnas.webp',
    vraag: 'Aan het eind van het spel loopt Hendrik rond in een volledig plaatharnas. Hoeveel kilo woog zo\'n harnas rond 1400 ongeveer?',
    juist: 25 },

  /* ---------- Ronde V · Legenden en folklore ---------- */
  { ronde: 'Legenden en folklore', soort: 'woord', afbeelding: 'feestje-img/quiz/zizka.webp',
    vraag: 'Jan Žižka, de eenogige aanvoerder van de hussieten, verloor nooit een veldslag. Volgens de legende liet hij na zijn dood iets maken van zijn eigen huid, zodat zijn vijanden ook dan nog zouden vluchten. Wat?',
    juist: ['trommel', 'trom', 'drum', 'trommelvel', 'tamboer'] },
  { ronde: 'Legenden en folklore', soort: 'woord', afbeelding: 'feestje-img/quiz/golem.webp',
    vraag: 'Volgens een Praagse legende kneedde rabbi Löw uit klei van de Moldau een reus die de joodse wijk moest beschermen. Hoe heet die reus?',
    juist: ['golem'] },
  { ronde: 'Legenden en folklore', soort: 'keuze', afbeelding: 'feestje-img/quiz/reynaert.webp',
    vraag: 'In het Vlaamse dierenepos "Van den vos Reynaerde" uit de 13e eeuw daagt de koning, een leeuw, de vos voor zijn hof. Hoe heet die koning?',
    antwoorden: ['Nobel', 'Bruun', 'Isegrim', 'Tibeert'], juist: 0 },
  { ronde: 'Legenden en folklore', soort: 'keuze', afbeelding: 'feestje-img/quiz/beiaard.webp',
    vraag: 'Het reuzenpaard Ros Beiaard droeg vier broers tegelijk op zijn rug, en trekt nog altijd door Dendermonde. Hoe heten die broers?',
    antwoorden: ['De vier Heemskinderen', 'De vier Evangelisten', 'De vier Gebroeders Grimm', 'De vier Musketiers'], juist: 0 },
  { ronde: 'Legenden en folklore', soort: 'getal', afbeelding: 'feestje-img/wonder/f127.webp',
    vraag: 'Volgens het Augsburger Wunderzeichenbuch vlogen er in 1533 dagenlang draken boven Bohemen, groot en klein, met een kroon op de kop. Hoeveel tegelijk, soms?',
    juist: 400 },
];

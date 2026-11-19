'use strict';
/* De quizvragen: een voorstel, pas gerust aan. Laden in de database: /feestje-beheer → Quiz leiden → "Vragen laden".
   soort: 'keuze' (vier antwoorden; juist = 0, 1, 2 of 3), 'woord' (juist = lijst van goede antwoorden; hoofdletters,
   accenten, spaties, leestekens en een lidwoord vooraan tellen niet), 'getal' (een schatting; juist = het getal; punten =
   (100 + max(0, 30 − t)) · max(0, 1 − |ln(gok / antwoord)|)) of 'meer' (meerdere antwoorden; juist = per antwoord een lijst varianten; 50 punten per juist antwoord).
   Als quizmaster kunt u elk antwoord achteraf goed- of afkeuren (✓ / ✗ in het beheer).
   afbeelding: verschijnt groot op de tv en klein op de gsm. Bronnen van de foto's staan in de afbeelding zelf.
   Let op: wie de broncode van de site leest, kan de antwoorden hier zien. Voor een feest aanvaardbaar. */
const QUIZ_VRAGEN = [
  { soort: 'keuze', vraag: 'Deze komeet stond aan de hemel, twee jaar voor het verhaal van Kingdom Come begint. In welk jaar?',
    afbeelding: 'feestje-img/wonder/f065.webp', antwoorden: ['1348', '1401', '1453', '1492'], juist: 1 },
  { soort: 'keuze', vraag: 'Hoe heet de smidszoon die we in Kingdom Come volgen?', antwoorden: ['Hans Capon', 'Radzig Kobyla', 'Hendrik van Skalitz', 'Jan Žižka'], juist: 2 },
  { soort: 'keuze', vraag: 'Met deze zilveren munt betaal je in Kingdom Come. Hoe heet hij?',
    afbeelding: 'feestje-img/quiz/groschen.webp', antwoorden: ['Florijn', 'Dukaat', 'Praagse groschen', 'Penning'], juist: 2 },
  { soort: 'woord', vraag: 'Welk dier staat er op het wapen van Bohemen?', juist: ['leeuw', 'leeuwen', 'lion', 'lev', 'löwe', 'loewe'] },
  { soort: 'keuze', vraag: 'Van welke stad is dit wapen?', afbeelding: 'feestje-img/quiz/wapen-leuven.svg', antwoorden: ['Leuven', 'Brussel', 'Mechelen', 'Gent'], juist: 0 },
  { soort: 'getal', vraag: 'Hoeveel kilometer is het in vogelvlucht van Leuven naar Praag?', juist: 695 },
  { soort: 'keuze', vraag: 'Wiens wapen is dit? Hij nam in 1402 zijn halfbroer, de koning van Bohemen, gevangen.',
    afbeelding: 'feestje-img/quiz/wapen-sigismund.svg', antwoorden: ['Karel IV', 'Wenceslaus IV', 'Sigismund', 'Jan Žižka'], juist: 2 },
  { soort: 'keuze', vraag: 'Welke stad was in de middeleeuwen de zilverstad van Bohemen?', antwoorden: ['Praag', 'Kuttenberg', 'Brno', 'Pilsen'], juist: 1 },
  { soort: 'keuze', vraag: 'Welke koning liet deze brug over de Moldau bouwen?',
    afbeelding: 'feestje-img/quiz/brug.webp', antwoorden: ['Karel IV', 'Wenceslaus IV', 'Rudolf II', 'Ottokar II'], juist: 0 },
  { soort: 'woord', vraag: 'Hoe heet het paard van Hendrik in het eerste Kingdom Come?', juist: ['Pebbles', 'Oblázek', 'Keitje', 'Kiezel', 'Kiezeltje'] },
  { soort: 'keuze', vraag: 'Wie wordt hier in 1415 in Konstanz op de brandstapel gezet?',
    afbeelding: 'feestje-img/quiz/hus.webp', antwoorden: ['Jan Hus', 'Jan Žižka', 'Maarten Luther', 'John Wyclif'], juist: 0 },
  { soort: 'getal', vraag: 'Volgens het Wunderzeichenbuch vlogen er in 1533 boven Bohemen soms meer dan … draken tegelijk. Hoeveel?',
    afbeelding: 'feestje-img/wonder/f127.webp', juist: 400 },
  { soort: 'meer', vraag: 'Alfons Mucha, de beroemdste Boheemse schilder, maakte in 1900 deze vier panelen: elk stelt een edelsteen voor. Welke? (Let op de kleuren.)',
    afbeelding: 'feestje-img/quiz/mucha.webp',
    juist: [['topaas', 'topaz', 'topase', 'topas'], ['robijn', 'ruby', 'rubis', 'rubin'], ['amethist', 'amethyst', 'amethyste', 'ametist'], ['smaragd', 'emerald', 'emeraude', 'smaragt']] },
  { soort: 'keuze', vraag: 'Uit welk beroemd getijdenboek komt deze miniatuur?',
    afbeelding: 'feestje-img/quiz/berry.webp', antwoorden: ['Het Book of Kells', 'De Très Riches Heures', 'De Codex Manesse', 'De Gutenbergbijbel'], juist: 1 },
  { soort: 'woord', vraag: 'Naar welke heilige is oudejaarsavond in veel landen genoemd?', juist: ['Silvester', 'Sylvester', 'Sint-Silvester', 'Sint-Sylvester', 'Silvestro'] },
  { soort: 'keuze', vraag: 'Deze burcht met twee torens speelt mee in Kingdom Come II. Hoe heet ze?',
    afbeelding: 'feestje-img/quiz/trosky.webp', antwoorden: ['Karlštejn', 'Trosky', 'Bouzov', 'Kost'], juist: 1 },
  { soort: 'keuze', vraag: 'Wat betekent "Fortuna audentes iuvat"?', antwoorden: ['Het geluk is met de dapperen', 'Wie zwijgt, stemt toe', 'Ik kwam, zag en overwon', 'Pluk de dag'], juist: 0 },
  { soort: 'getal', vraag: 'In welk jaar was het Leuvense stadhuis af?', afbeelding: 'feestje-img/quiz/stadhuis.webp', juist: 1469 },
  { soort: 'keuze', vraag: 'In welk jaar werd de universiteit van Leuven gesticht?', antwoorden: ['1348', '1425', '1517', '1834'], juist: 1 },
  { soort: 'woord', vraag: 'Hoe heet in de wapenkunde de kleur rood? (één woord)', juist: ['keel', 'keelen', 'gules', 'gueules'] },
  { soort: 'keuze', vraag: 'Wat is mede?', antwoorden: ['Een soort bier', 'Honingwijn', 'Appelwijn', 'Kruidenthee'], juist: 1 },
  { soort: 'keuze', vraag: 'Wat deed een schildknaap?', antwoorden: ['Hij beschilderde schilden', 'Hij diende een ridder en leerde het vak', 'Hij bewaakte de schatkist', 'Hij zong aan het hof'], juist: 1 },
];

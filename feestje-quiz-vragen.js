'use strict';
/* De quizvragen: een voorstel, pas gerust aan. Laden in de database: /feestje-beheer → Quiz → "Vragen laden".
   juist = 0, 1, 2 of 3 (het hoeveelste antwoord, vanaf 0).
   Let op: wie de broncode van de site leest, kan de antwoorden hier zien. Voor een feest aanvaardbaar;
   wil u dat niet, laad de vragen dan en haal ze daarna uit dit bestand (ze staan dan alleen nog in de database). */
const QUIZ_VRAGEN = [
  { vraag: 'In welk jaar speelt Kingdom Come: Deliverance zich af?', antwoorden: ['1348', '1403', '1415', '1492'], juist: 1 },
  { vraag: 'Hoe heet de smidszoon die we in Kingdom Come volgen?', antwoorden: ['Hans Capon', 'Radzig Kobyla', 'Hendrik van Skalitz', 'Jan Žižka'], juist: 2 },
  { vraag: 'Welke stad was in de middeleeuwen de zilverstad van Bohemen?', antwoorden: ['Praag', 'Kuttenberg', 'Brno', 'Pilsen'], juist: 1 },
  { vraag: 'Welke koning van Bohemen werd in 1402 gevangengenomen door zijn halfbroer Sigismund?', antwoorden: ['Karel IV', 'Ottokar II', 'Wenceslaus IV', 'Jan van Luxemburg'], juist: 2 },
  { vraag: 'Wat was een Praagse groschen?', antwoorden: ['Een zilveren munt', 'Een bierkroes', 'Een soort brood', 'Een ridderorde'], juist: 0 },
  { vraag: 'Wat drinkt Hendrik in het spel om op te slaan?', antwoorden: ['Mede', 'Heilandsbrandewijn', 'Kruidenwijn', 'Bronwater'], juist: 1 },
  { vraag: 'Welke koning liet in 1357 de stenen brug over de Moldau in Praag bouwen?', antwoorden: ['Karel IV', 'Wenceslaus IV', 'Rudolf II', 'Ottokar II'], juist: 0 },
  { vraag: 'In welk jaar werd de universiteit van Leuven gesticht?', antwoorden: ['1348', '1425', '1517', '1834'], juist: 1 },
  { vraag: 'Hoeveel ogen staan er in totaal op een gewone dobbelsteen?', antwoorden: ['18', '20', '21', '24'], juist: 2 },
  { vraag: 'Welke kleur heet in de wapenkunde "keel"?', antwoorden: ['Blauw', 'Groen', 'Zwart', 'Rood'], juist: 3 },
  { vraag: 'Welk metaal heet in de wapenkunde "argent"?', antwoorden: ['Goud', 'Zilver', 'Brons', 'Tin'], juist: 1 },
  { vraag: 'Waarvan is een maliënkolder gemaakt?', antwoorden: ['Gekookt leer', 'IJzeren ringetjes', 'Gevlochten wol', 'Bronzen platen'], juist: 1 },
  { vraag: 'Hoe heet het paard van Hendrik in het eerste Kingdom Come?', antwoorden: ['Pebbles', 'Bucephalus', 'Rocinante', 'Schaduwvacht'], juist: 0 },
  { vraag: 'Wat is mede?', antwoorden: ['Een soort bier', 'Honingwijn', 'Appelwijn', 'Kruidenthee'], juist: 1 },
  { vraag: 'Welk getijdenboek maakten de gebroeders Limbourg voor de hertog van Berry?', antwoorden: ['Het Book of Kells', 'De Très Riches Heures', 'De Codex Manesse', 'De Gutenbergbijbel'], juist: 1 },
  { vraag: 'Welke Boheemse hervormer stierf in 1415 op de brandstapel in Konstanz?', antwoorden: ['Jan Hus', 'Jan Žižka', 'Maarten Luther', 'John Wyclif'], juist: 0 },
  { vraag: 'In welke streek ligt de burcht Trosky uit Kingdom Come II?', antwoorden: ['Het Ertsgebergte', 'Het Reuzengebergte', 'Het Boheems Paradijs', 'Het Böhmerwald'], juist: 2 },
  { vraag: 'Wat betekent "Fortuna audentes iuvat"?', antwoorden: ['Het geluk is met de dapperen', 'Wie zwijgt, stemt toe', 'Ik kwam, zag en overwon', 'Pluk de dag'], juist: 0 },
  { vraag: 'Naar welke heilige is oudejaarsavond in veel landen genoemd?', antwoorden: ['Sint-Maarten', 'Sint-Silvester', 'Sint-Nicolaas', 'Sint-Joris'], juist: 1 },
  { vraag: 'Wat deed een schildknaap?', antwoorden: ['Hij beschilderde schilden', 'Hij diende een ridder en leerde het vak', 'Hij bewaakte de schatkist', 'Hij zong aan het hof'], juist: 1 },
];

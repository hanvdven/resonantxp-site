'use strict';
/* Het feest: tijden, plaats en programma. Gedeeld door /feestje (uitnodiging), /feestje-tv en /feestje-beheer. */
/* =========================================================
   CONFIG — hier pas je het feest aan
   ========================================================= */
const CONFIG = {
  start:    new Date(Date.UTC(2026, 11, 31, 15, 0)), // 31 dec 2026, 16:00 (CET = UTC+1)
  midnight: new Date(Date.UTC(2026, 11, 31, 23, 0)), // 1 jan 2027, 00:00
  end:      new Date(Date.UTC(2027, 0, 1, 5, 0)),    // tot wanneer "zalig nieuwjaar" blijft staan
  hostsOr: 'Han of Nele',
  location: 'Kessel-Lo',
  locationNote: 'Het precieze adres volgt per bode.',
  rsvp: '',   // bv. 'https://wa.me/32...' of 'mailto:...' (leeg = geen knop)
  kids: 'Jonge schildknapen en jonkvrouwen zijn welkom van 16:00 tot 18:00, voor het wapenschilderen en het toernooi. Daarna is het feest voor volwassenen.', // leeg = regel verbergen
  lat: 50.885, lon: 4.725, // Kessel-Lo, voor de zonnestand op de klok
  annoDomini: 1404,   // het nieuwe jaar zoals op de tv en de uitnodiging: Kingdom Come speelt in 1403, dus om middernacht wordt het 1404
  partyFrom: 16, partyTo: 25, // feestband op de klok, in uren (25 = 01:00 de volgende dag)
  // Het programma: vult "De getijden" én de ruitjes op de klok. Uren als getal (16.5 = 16:30, 24 = middernacht).
  program: [
    [16,    'Wapenschilderen', 'De poort gaat open. Aan de lange tafel schildert u uw wapen op schild of tuniek: verf en karton liggen klaar. Daarna worden de wapens gekeurd, en het mooiste wint.', 'schild'],
    [16.5,  'Het riddertoernooi', 'Zwaardgevecht en boogschieten op het erf, bij het laatste licht, zoals op het toernooi van Kuttenberg. Jonge schildknapen doen mee.', 'arena'],
    [19,    'Het riddermaal', 'De grote ketel gaat open en uw meegebrachte schotels komen op de dis. Aan tafel: de prijs voor het beste kostuum.', 'eten'],
    [21,    'De proeverij', 'Een wedstrijd van de tong. Wat er geproefd wordt, blijft tot dan een verrassing.', 'honing'],
    [23,    'Kennis van het rijk', 'De grote Bohemen-quiz, op uw gsm: van Trosky tot Kuttenberg. Prijs: eeuwige roem, en misschien een extra oliebol.', 'lezen'],
    [24,    'Middernacht', 'De klokken luiden het nieuwe jaar in. Een heilandsbrandewijn om het jaar op te slaan, en oliebollen voor iedereen.', 'ster'],
  ],
};

/* Honger en energie op het tv-scherm volgen het programma (zoals Voeding en Energie in KCD2, 0–100).
   maaltijden: [uur, naam, hoeveel voeding erbij]  ·  oppeppers: [uur, naam, hoeveel energie erbij] */
const LIJF = {
  voeding:  { start: 60, perUur: -7 },   // om 16:00 goed gevuld, daarna zakt het (het riddermaal is pas om 19:00)
  energie:  { start: 100, perUur: -8.5 },
  maaltijden: [[19, 'Het riddermaal', 75], [21, 'De proeverij', 12], [24, 'Oliebollen', 35]],
  oppeppers:  [[24, 'Middernacht en heilandsbrandewijn', 40]],
};

/* Uitleg per spel, voor het tabblad "Spelen" op het tv-scherm. De naam moet gelijk zijn aan die in de database (fj_spelen).
   [naam, icoon uit feestje-img/kcd, uitleg]. Een voorstel: pas gerust aan. */
const UITLEG = [
  ['Wapen', 'schild', 'Schilder uw wapen op schild of tuniek, van 16:00 tot 18:00. Tot 10 punten voor kleur, vorm en heraldiek.'],
  ['Kostuum', 'tuniek', 'Punten voor echtheid, vindingrijkheid en het verhaal erbij. De prijs volgt bij het riddermaal.'],
  ['Zwaard', 'arena', 'Schuimzwaarden op het erf. Een treffer is een punt, een vooraf aangekondigde meesteraanval drie.'],
  ['Boog', 'boog', 'Vijf pijlen op de schijf, zonder vizier, zoals het hoort. De roos is tien punten.'],
  ['Dobbelen', 'dobbel', 'Zes stenen. Een 1 is 100, een 5 is 50, drie gelijke zijn honderd keer de waarde. Wie eerst 2000 heeft, wint groschen.'],
  ['Proeverij', 'honing', 'Proef blind en raad wat het is. Een punt per goed antwoord, en een bonus voor wie het mooist ernaast zit.'],
  ['Quiz', 'lezen', 'Van Trosky tot Kuttenberg, van bier tot boerenwijsheid. Tien vragen per ronde.'],
];

/* Spotify: "nu speelt" op het tv-scherm. Leeg = uit. Client ID van uw eigen app op developer.spotify.com
   (niet geheim). Redirect URI daar: https://resonantxp.com/feestje-tv  (zie feestje-tv.html, Spotify). */
const SPOTIFY = { clientId: '92040bfb176b435d93212aa09fa88051' };

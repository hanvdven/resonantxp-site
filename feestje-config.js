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
  kids: 'Jonge schildknapen en jonkvrouwen zijn welkom van 16:00 tot 18:00, voor het toernooi. Daarna is het feest voor volwassenen.', // leeg = regel verbergen
  lat: 50.885, lon: 4.725, // Kessel-Lo, voor de zonnestand op de klok
  partyFrom: 16, partyTo: 25, // feestband op de klok, in uren (25 = 01:00 de volgende dag)
  // Het programma: vult "De getijden" én de ruitjes op de klok. Uren als getal (16.5 = 16:30, 24 = middernacht).
  program: [
    [16,    'De poort gaat open', 'Welkomstdronk, de kostuumkeuring en het ophangen van de wapenschilden.', 'herberg'],
    [16.5,  'Toernooi bij het laatste licht', 'Zwaardgevecht en boogschieten op het erf, zoals op het toernooi van Kuttenberg. Jonge schildknapen doen mee.', 'arena'],
    [18,    'Het gastmaal', 'De grote ketel gaat open en uw meegebrachte schotels komen erbij op de dis. Kinderen worden rond deze tijd opgehaald.', 'eten'],
    [20,    'Dobbelen om groschen', 'Zes stenen, één kans, insignes toegestaan. Valsspelers belanden in de schandpaal.', 'dobbel'],
    [21.5,  'Kennis van het rijk', 'De grote Bohemen-quiz: van Trosky tot Kuttenberg. Prijs: eeuwige roem, en misschien een extra oliebol.', 'lezen'],
    [23.75, 'De heilandsbrandewijn', 'Eén glaasje voor wie wil, om het jaar op te slaan.', 'brandewijn'],
    [24,    'Middernacht', 'De klokken luiden het nieuwe jaar in. Oliebollen voor iedereen.', 'ster'],
  ],
};

/* Honger en energie op het tv-scherm volgen het programma (zoals Voeding en Energie in KCD2, 0–100).
   maaltijden: [uur, naam, hoeveel voeding erbij]  ·  oppeppers: [uur, naam, hoeveel energie erbij] */
const LIJF = {
  voeding:  { start: 55, perUur: -9 },   // om 16:00 halfvol, daarna zakt het
  energie:  { start: 100, perUur: -8.5 },
  maaltijden: [[18, 'Het gastmaal', 75], [24, 'Oliebollen', 35]],
  oppeppers:  [[23.75, 'Heilandsbrandewijn', 15], [24, 'Middernacht', 25]],
};

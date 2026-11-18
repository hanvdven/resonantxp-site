// Tests voor de dobbelregels: node feestje-dobbel.test.js
const assert = require('assert');
const { score, scoort, besteKeuze, hansStopt } = require('./feestje-dobbel.js');
const gevallen = [
  [[1], 100], [[5], 50], [[1, 5], 150], [[2], null], [[1, 2], null],
  [[2, 2, 2], 200], [[1, 1, 1], 1000], [[5, 5, 5], 500], [[6, 6, 6], 600],
  [[2, 2, 2, 2], 400], [[2, 2, 2, 2, 2], 800], [[2, 2, 2, 2, 2, 2], 1600], [[1, 1, 1, 1], 2000],
  [[1, 2, 3, 4, 5], 500], [[2, 3, 4, 5, 6], 750], [[1, 2, 3, 4, 5, 6], 1500],
  [[1, 2, 3, 4, 5, 5], 550], [[1, 1, 2, 3, 4, 5], 600], [[3, 3, 3, 1], 400], [[3, 3, 3, 2], null],
  [[1, 1, 1, 5, 5, 5], 1500], [[], null],
];
for (const [stenen, verwacht] of gevallen) assert.strictEqual(score(stenen), verwacht, `score(${stenen}) = ${score(stenen)}, verwacht ${verwacht}`);
assert.strictEqual(scoort([2, 3, 4, 6, 6, 2]), false);
assert.strictEqual(scoort([2, 3, 4, 6, 6, 5]), true);
assert.strictEqual(scoort([2, 2, 2, 3, 4, 6]), true);
assert.strictEqual(scoort([2, 3, 4, 6]), false);
// elke worp zonder scorende stenen geeft besteKeuze null, en omgekeerd
for (let i = 0; i < 2000; i++) {
  const w = Array.from({ length: 1 + (i % 6) }, () => 1 + Math.floor(Math.random() * 6));
  assert.strictEqual(scoort(w), besteKeuze(w) !== null, `scoort en besteKeuze verschillen voor ${w}`);
}
assert.deepStrictEqual(besteKeuze([1, 2, 3, 4, 5, 6]).score, 1500);
assert.deepStrictEqual(besteKeuze([5, 2, 2, 3, 4, 6]).score, 750);
assert.strictEqual(hansStopt(300, 2, 0, 2000), true);
assert.strictEqual(hansStopt(300, 4, 0, 2000), false);
assert.strictEqual(hansStopt(100, 5, 1950, 2000), true);
console.log(`dobbelregels: ${gevallen.length + 2010} controles geslaagd`);

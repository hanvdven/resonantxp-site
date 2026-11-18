# Texturen voor de klok en de letters op het tv-scherm (vooraf berekend; de Chromecast hoeft niets te filteren).
#   hout.webp       planken voor de schijf in het midden (5 planken, nerf, kwasten, donkere naden)
#   barst.webp      craquelé over de geschilderde ring (doorzichtig, draait mee met het wiel)
#   goud.webp       gehamerd goud met slijtplekken, voor de randen van de klok
#   sleet-perk.webp spikkels in perkamentkleur: over de inkt gelegd lijkt die versleten
#   sleet-hout.webp dezelfde spikkels in houtkleur, voor de gouden letters op de schijf
# Draaien: python3 feestje-img/tv/klok.py
import numpy as np
from PIL import Image
from pathlib import Path
OUT = Path(__file__).parent

def ruis(h, w, beta, seed, rek=(1, 1)):
    r = np.random.default_rng(seed)
    fy = np.fft.fftfreq(h)[:, None] * rek[0]; fx = np.fft.rfftfreq(w)[None, :] * rek[1]
    f = np.sqrt(fx ** 2 + fy ** 2); f[0, 0] = 1
    spec = (r.normal(size=f.shape) + 1j * r.normal(size=f.shape)) / f ** beta; spec[0, 0] = 0
    n = np.fft.irfft2(spec, s=(h, w)); return (n - n.min()) / (n.max() - n.min())

def webp(arr, naam, mode='RGBA'):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode).save(OUT / naam, 'WEBP', quality=84, method=6); print(naam)

# ---------- hout: 5 verticale planken ----------
N = 640; yy, xx = np.mgrid[0:N, 0:N].astype(float)
rng = np.random.default_rng(7)
plank = np.clip((xx / N * 5.83 - .415).astype(int), -1, 5)           # naden op dezelfde plek als de lijnen in de oude klok
nerf = ruis(N, N, 1.5, 11, rek=(2.5, .12))                              # glad van boven naar onder: lange, golvende vezels
ringen = np.sin(xx / N * 95 + nerf * 22 + plank * 2.1) * .5 + .5         # nerflijnen, verticaal en golvend
fijnnerf = ruis(N, N, .8, 13, rek=(3, .2))
vlek = ruis(N, N, 1.8, 12)
basis = np.array([[92, 60, 33], [104, 68, 37], [86, 55, 30], [99, 64, 35], [90, 58, 32], [96, 62, 34], [88, 57, 31]], float)
kleur = basis[plank + 1]
t = .45 * ringen ** 1.6 + .25 * fijnnerf + .3 * vlek
img = kleur * (.62 + .5 * t[..., None])
# kwasten (knoesten)
for cx, cy, rr in [(170, 420, 16), (455, 190, 12), (330, 560, 9)]:
    d = np.sqrt(((xx - cx) / 1.0) ** 2 + ((yy - cy) / 1.9) ** 2)
    k = np.clip(1 - d / (rr * 2.2), 0, 1)
    img *= (1 - .45 * k[..., None] * (np.sin(d / 2.2) * .5 + .5)[..., None])
# naden tussen de planken
for i in range(6):
    x = (i + .415) / 5.83 * N + (ruis(N, 1, 1.5, 20 + i)[:, 0] - .5) * 3
    d = np.abs(xx - x[:, None])
    img *= (1 - .75 * np.exp(-(d / 1.6) ** 2))[..., None]
    img *= (1 - .18 * np.exp(-(d / 7) ** 2))[..., None]
# donkerder naar de rand (de schijf ligt dieper)
r = np.sqrt((xx - N / 2) ** 2 + (yy - N / 2) ** 2) / (N / 2)
img *= (1 - .45 * np.clip(r - .45, 0, 1) ** 1.4)[..., None]
webp(img, 'hout.webp', 'RGB')

# ---------- craquelé: duidelijk zichtbare haarscheuren met afgebladderde randjes (zoals de ring in KCD2) ----------
N = 800; yy, xx = np.mgrid[0:N, 0:N].astype(float)
w1 = (ruis(N, N, 1.6, 31) - .5) * 30; w2 = (ruis(N, N, 1.6, 32) - .5) * 30
px, py = xx + w1, yy + w2
pts = rng.uniform(0, N, (360, 2))
d1 = np.full((N, N), 1e9); d2 = np.full((N, N), 1e9); wie = np.zeros((N, N), int)
for k, (ax, ay) in enumerate(pts):
    d = np.hypot(px - ax, py - ay)
    m = d < d1; d2 = np.where(m, d1, np.minimum(d2, d)); wie = np.where(m, k, wie); d1 = np.where(m, d, d1)
gap = d2 - d1
lijn = np.exp(-(gap / 1.1) ** 2)                                         # de scheur zelf: donker
licht = np.exp(-((gap - 2.6) / 1.2) ** 2) * .6                            # lichte opstaande rand naast de scheur
schol = (np.random.default_rng(5).uniform(0, 1, len(pts))[wie] - .5) * .16  # elke schol een tikje anders van toon
sterkte = np.clip(ruis(N, N, 1.3, 33) * 1.5 - .15, .35, 1)
bladder = np.clip((ruis(N, N, 1.0, 35) - .74) * 6, 0, 1)                  # plekjes waar de verf eraf is
rgba = np.zeros((N, N, 4))
donker = np.clip(lijn * sterkte * .85 + np.clip(-schol, 0, 1) + bladder * .55, 0, 1)
helder = np.clip(licht * sterkte + np.clip(schol, 0, 1), 0, 1) * (1 - donker)
rgba[..., :3] = (np.array([46, 32, 18]) * donker[..., None] + np.array([255, 250, 238]) * helder[..., None]) / np.maximum(donker + helder, 1e-6)[..., None]
rgba[..., 3] = np.clip(donker + helder * .5, 0, 1) * 255
webp(rgba, 'barst.webp')

# ---------- goud voor de rand: gehamerd, met slijtplekken (tegel, voor een SVG-pattern als lijnkleur) ----------
N = 128
g = .55 * ruis(N, N, 1.2, 51) + .3 * ruis(N, N, .5, 52) + .15 * ruis(N, N, 1.8, 53)
kleur = np.array([120, 84, 26]) + (np.array([250, 222, 140]) - np.array([120, 84, 26])) * g[..., None] ** 1.2
sl = np.clip((ruis(N, N, 1.0, 54) - .78) * 5, 0, 1)
kleur = kleur * (1 - .55 * sl[..., None]) + np.array([60, 40, 18]) * .55 * sl[..., None]
webp(kleur, 'goud.webp', 'RGB')

# ---------- sleet: spikkels die de inkt laten "slijten" ----------
N = 256
fijn = ruis(N, N, .25, 41); grof = ruis(N, N, 1.0, 42); vezel = ruis(N, N, 1.0, 43, rek=(.15, 1.5))
a = np.clip((fijn - .74) * 5, 0, 1) * .9 + np.clip((grof - .66) * 3, 0, 1) * .4 + np.clip((vezel - .78) * 4, 0, 1) * .35
for naam, kleur in [('sleet-perk.webp', [236, 222, 186]), ('sleet-hout.webp', [70, 44, 22])]:
    rgba = np.zeros((N, N, 4)); rgba[..., :3] = kleur; rgba[..., 3] = np.clip(a, 0, 1) * 255
    webp(rgba, naam)

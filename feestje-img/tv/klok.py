# Texturen voor de klok en de letters op het tv-scherm (vooraf berekend; de Chromecast hoeft niets te filteren).
#   hout.webp       planken voor de schijf in het midden (5 planken, nerf, kwasten, donkere naden)
#   barst.webp      craquelé over de geschilderde ring (doorzichtig, draait mee met het wiel)
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

# ---------- craquelé: netwerk van haarscheurtjes (voronoi-randen, verstoord) ----------
N = 800; yy, xx = np.mgrid[0:N, 0:N].astype(float)
w1 = (ruis(N, N, 1.6, 31) - .5) * 26; w2 = (ruis(N, N, 1.6, 32) - .5) * 26
px, py = xx + w1, yy + w2
pts = rng.uniform(0, N, (420, 2))
d1 = np.full((N, N), 1e9); d2 = np.full((N, N), 1e9)
for (ax, ay) in pts:
    d = np.hypot(px - ax, py - ay)
    m = d < d1; d2 = np.where(m, d1, np.minimum(d2, d)); d1 = np.where(m, d, d1)
rand = np.exp(-((d2 - d1) / .9) ** 2)
sterkte = ruis(N, N, 1.4, 33)                                            # niet overal even gebarsten
a = rand * np.clip(sterkte * 1.6 - .3, 0, 1) * .45
slijt = np.clip((ruis(N, N, 1.6, 34) - .6) * 1.5, 0, 1) * .14               # zachte plekjes waar de verf dunner is
rgba = np.zeros((N, N, 4)); rgba[..., :3] = [40, 28, 16]; rgba[..., 3] = np.clip(a + slijt, 0, 1) * 255
webp(rgba, 'barst.webp')

# ---------- sleet: spikkels die de inkt laten "slijten" ----------
N = 256
fijn = ruis(N, N, .25, 41); grof = ruis(N, N, 1.0, 42); vezel = ruis(N, N, 1.0, 43, rek=(.15, 1.5))
a = np.clip((fijn - .74) * 5, 0, 1) * .9 + np.clip((grof - .66) * 3, 0, 1) * .4 + np.clip((vezel - .78) * 4, 0, 1) * .35
for naam, kleur in [('sleet-perk.webp', [236, 222, 186]), ('sleet-hout.webp', [70, 44, 22])]:
    rgba = np.zeros((N, N, 4)); rgba[..., :3] = kleur; rgba[..., 3] = np.clip(a, 0, 1) * 255
    webp(rgba, naam)

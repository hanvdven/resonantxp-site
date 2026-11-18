# Texturen voor het tv-scherm, vooraf berekend (een Chromecast hoeft dan niets te filteren).
import numpy as np
from PIL import Image
OUT = '/home/user/resonantxp-site/feestje-img/tv/'
rng = np.random.default_rng(1403)

def ruis(h, w, beta, seed):
    """Periodieke ruis met spectrum 1/f^beta (FFT): naadloos tegelbaar, genormaliseerd naar 0..1."""
    r = np.random.default_rng(seed)
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.rfftfreq(w)[None, :]
    f = np.sqrt(fx ** 2 + fy ** 2); f[0, 0] = 1
    spec = (r.normal(size=f.shape) + 1j * r.normal(size=f.shape)) / f ** beta
    spec[0, 0] = 0
    n = np.fft.irfft2(spec, s=(h, w))
    return (n - n.min()) / (n.max() - n.min())

def perkament(w, h, marge, naam, seed, vlekken=14):
    W, H = w + 2 * marge, h + 2 * marge
    laag = ruis(H, W, 1.6, seed)                 # wolkige vlekkerigheid
    fijn = ruis(H, W, .7, seed + 1)              # korrel
    vezel = ruis(H, W * 4, 1.1, seed + 2)[:, ::4]  # langgerekte vezels (horizontaal uitgerekt)
    basis = np.array([236, 220, 182], float)     # #ecdcb6
    donker = np.array([196, 160, 104], float)    # bruiner perkament
    z = lambda a: (a - a.mean()) / a.std()
    t = np.clip(.42 + .16 * z(laag) + .09 * z(vezel) + .06 * z(fijn), 0, 1)   # 0 = licht, 1 = bruin
    img = basis[None, None] * (1 - .55 * t[..., None]) + donker[None, None] * (.55 * t[..., None])
    # vossenvlekken (foxing): zachte bruine plekjes
    yy, xx = np.mgrid[0:H, 0:W]
    r2 = np.random.default_rng(seed + 3)
    for _ in range(vlekken):
        cx, cy, rad = r2.uniform(0, W), r2.uniform(0, H), r2.uniform(5, 30)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
        a = np.clip(1 - d, 0, 1) ** 1.3 * r2.uniform(.1, .25)
        img = img * (1 - a[..., None]) + np.array([150, 104, 52])[None, None] * a[..., None]
    # rafelrand: de afstand tot de rand, verstoord met ruis
    rand = ruis(H, W, 1.3, seed + 4) - .5
    dx = np.minimum(xx - marge, W - 1 - marge - xx); dy = np.minimum(yy - marge, H - 1 - marge - yy)
    afst = np.minimum(dx, dy) + rand * 34 + (fijn - .5) * 9
    alpha = np.clip((afst + 3) / 3, 0, 1)
    # donkerder, gebruikte randen
    randtint = np.clip(1 - afst / 70, 0, 1) ** 1.7
    img = img * (1 - .5 * randtint[..., None]) + np.array([120, 80, 38])[None, None] * (.5 * randtint[..., None])
    rgba = np.dstack([np.clip(img, 0, 255), alpha * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(OUT + naam, 'WEBP', quality=86, method=6)
    print(naam, W, H)

perkament(1110, 848, 22, 'perkament.webp', 11)
perkament(680, 150, 14, 'strook.webp', 21, vlekken=4)
perkament(600, 120, 14, 'briefje.webp', 31, vlekken=3)
# het plafond: naadloze, geschilderde kalklaag op nachtblauw (half doorzichtig, ligt over de kleur heen)
n = .6 * ruis(360, 360, 1.5, 41) + .4 * ruis(360, 360, .6, 42)
licht = np.clip((n - .5) * 2, -1, 1)
rgba = np.zeros((360, 360, 4), np.uint8)
rgba[..., :3] = np.where(licht[..., None] > 0, [90, 110, 170], [4, 8, 24])
rgba[..., 3] = (np.abs(licht) * 95).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(OUT + 'plafond.webp', 'WEBP', quality=85, method=6)
print('plafond')

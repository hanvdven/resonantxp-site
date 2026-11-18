# Vooraf berekende texturen voor /feestje (vervangen de SVG-ruisfilters die de browser bij elk scrollen opnieuw rekende).
# Draaien: python3 feestje-img/textuur/maak.py
import numpy as np
from PIL import Image
from pathlib import Path
OUT = Path(__file__).parent

def ruis(h, w, beta, seed):
    """Periodieke 1/f^beta-ruis via FFT: naadloos tegelbaar, 0..1."""
    r = np.random.default_rng(seed)
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.rfftfreq(w)[None, :]
    f = np.sqrt(fx ** 2 + fy ** 2); f[0, 0] = 1
    spec = (r.normal(size=f.shape) + 1j * r.normal(size=f.shape)) / f ** beta; spec[0, 0] = 0
    n = np.fft.irfft2(spec, s=(h, w)); return (n - n.min()) / (n.max() - n.min())

def opslaan(rgb, alpha, naam):
    a = np.clip(alpha, 0, 1)
    img = np.dstack([np.broadcast_to(np.array(rgb, np.uint8), a.shape + (3,)), (a * 255).astype(np.uint8)])
    Image.fromarray(img, 'RGBA').save(OUT / naam, 'WEBP', quality=82, method=6); print(naam)

# korrel: fijne, bruine spikkels (was feTurbulence baseFrequency .8)
g = .6 * ruis(220, 220, .55, 1) + .4 * ruis(220, 220, .2, 4)
opslaan((110, 74, 32), (g - .5) * .45, 'korrel.webp')
# vlekken: grote, zachte bruine wolken over het perkament (was baseFrequency .006)
v = .7 * ruis(600, 600, 1.9, 2) + .3 * ruis(600, 600, 1.3, 3)
opslaan((140, 97, 38), (v - .52) * 1.15, 'vlekken.webp')

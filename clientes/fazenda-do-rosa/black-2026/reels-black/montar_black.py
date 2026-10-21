"""Monta um Reels da Black da Fazenda no estilo "Faltam 02 dias": takes de drone em cortes secos,
texto sobre o vídeo ou em cartão preto (The Seasons Italic + Neue Montreal), palavra a palavra na batida.
(A v1, com texto dentro de cada bloco, está em montar_black_v1.py e roda o plano-bf07.json.)

Uso: python montar_black.py plano.json [--rascunho]

plano.json:
{
  "saida": "final.mp4", "fps": 30, "w": 1080, "h": 1920,
  "audio": {"arquivo": "trilha.wav", "ganho_db": 0},
  "timeline": [                                     # o que está na tela, em sequência
    {"tipo": "take", "src": "x.mp4", "in": 1.2, "out": 2.0, "dur": 0.8, "zoom": [1.0, 1.05], "grade": "forte"},
    {"tipo": "cartao", "dur": 1.0, "fundo": [0,0,0], "drift": [1.0, 0.97]}
  ],
  "textos": [                                       # camadas de texto no tempo global (segundos)
    {"de": 0.0, "ate": 2.4, "sombra": true, "elementos": [
      {"fonte": "script", "txt": "tudo isso", "tam": 200, "cor": "sage", "y": 900, "em": 0.0},
      {"fonte": "bold", "tam": 130, "cor": "cream", "y": 1050, "palavras": [["COM", 0.86], ["50%", 1.03], ["OFF?", 1.21]]},
      {"tam": 100, "y": 935, "partes": [["na ", "regular"], ["Black Friday", "bold"]], "em": 2.46},
      {"fonte": "bold", "txt": "50% OFF", "tam": 235, "cor": "white", "contorno": 4, "y": 1040, "em": 5.35}
    ]}
  ]
}
y = linha de base. "em" = quando o elemento (ou a palavra) entra; entrada com desfoque curto, leve escala e fade
(~130 ms). "sombra" põe uma sombra difusa escura por baixo (legibilidade sobre imagem clara).
A camada some com fade de 120 ms antes de "ate".
"""
import argparse, json, subprocess, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

U = "C:/Users/ASUSB/AppData/Local/Microsoft/Windows/Fonts/"
FONTES = {"script": U + "Fontspring-DEMO-theseasons-it.otf", "scriptb": U + "Fontspring-DEMO-theseasons-bdit.otf",
          "regular": U + "NeueMontreal-Regular.otf", "medium": U + "NeueMontreal-Medium.otf", "bold": U + "NeueMontreal-Bold.otf"}
CORES = {"cream": (243, 243, 231), "sage": (188, 207, 201), "white": (255, 255, 255)}
GRADES = {
    "forte": "curves=all='0/0 0.22/0.16 0.5/0.5 0.78/0.84 1/1',eq=saturation=1.45:contrast=1.08,colorbalance=rs=0.04:bs=-0.03:rm=0.03:bm=-0.04:rh=0.02:bh=-0.02",
    "media": "curves=all='0/0 0.25/0.2 0.5/0.5 0.78/0.83 1/1',eq=saturation=1.3:contrast=1.05,colorbalance=rm=0.02:bm=-0.03",
    "leve": "eq=saturation=1.1:contrast=1.03",
}
ENTRADA = 0.13; SAIDA = 0.12

ap = argparse.ArgumentParser(); ap.add_argument("plano"); ap.add_argument("--rascunho", action="store_true")
a = ap.parse_args()
P = json.load(open(a.plano, encoding="utf8")); base = os.path.dirname(os.path.abspath(a.plano))
W, H, FPS = P.get("w", 1080), P.get("h", 1920), P.get("fps", 30)
def caminho(p): return p if os.path.isabs(p) else os.path.join(base, p)
_fontes = {}
def fonte(nome, tam):
    k = (nome, tam)
    if k not in _fontes: _fontes[k] = ImageFont.truetype(FONTES[nome], tam)
    return _fontes[k]
def suave(u): u = min(1.0, max(0.0, u)); return u * u * (3 - 2 * u)

def pecas(el):
    """Lista de (texto, fonte, t_entrada) que compõem uma linha."""
    if "palavras" in el:
        f = el.get("fonte", "bold"); n = len(el["palavras"])
        return [(w + ("" if i == n - 1 else " "), f, t) for i, (w, t) in enumerate(el["palavras"])]
    if "partes" in el: return [(t, f, el.get("em", 0.0)) for t, f in el["partes"]]
    return [(el["txt"], el.get("fonte", "regular"), el.get("em", 0.0))]

def desenha(img, el, T, escala_bloco=1.0, sombra=False, alpha_bloco=1.0):
    cor = CORES.get(el.get("cor", "cream"), el.get("cor"))
    tam = int(round(el["tam"] * escala_bloco)); ps = pecas(el)
    fs = [fonte(f, tam) for _, f, _ in ps]; largs = [f.getlength(t) for (t, _, _), f in zip(ps, fs)]
    x = el.get("x", W / 2) - sum(largs) / 2; y = el["y"]
    contorno = el.get("contorno", 0)
    for (t, fn, em), f, lg in zip(ps, fs, largs):
        if T < em: x += lg; continue
        u = 1.0 if em <= 0 else suave((T - em) / ENTRADA); al = u * alpha_bloco  # texto que já nasce na tela não anima
        esc = 1.0 + 0.08 * (1 - u); blur = 6 * (1 - u)
        f2 = fonte(fn, int(round(tam * esc))) if esc != 1.0 else f
        asc, _d = f2.getmetrics(); lg2 = f2.getlength(t)
        cx = x + lg / 2 - lg2 / 2  # cresce em volta do próprio centro
        cam = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(cam)
        kw = dict(stroke_width=int(round(contorno * escala_bloco)), stroke_fill=cor + (255,)) if contorno else {}
        d.text((cx, y - asc), t, font=f2, fill=((0, 0, 0, 0) if contorno else cor + (255,)), **kw)
        if blur > 0.3: cam = cam.filter(ImageFilter.GaussianBlur(blur))
        if sombra and not contorno:
            sm = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sm).text((cx + 3, y - asc + 6), t, font=f2, fill=(0, 0, 0, int(210 * al)), stroke_width=3, stroke_fill=(0, 0, 0, int(210 * al)))
            img.alpha_composite(sm.filter(ImageFilter.GaussianBlur(14)))
        if al < 1: cam.putalpha(cam.getchannel("A").point(lambda v: int(v * al)))
        img.alpha_composite(cam); x += lg

def frames_take(src, t_in, t_out, n, grade=None):
    dur = t_out - t_in
    vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}" + (f",{GRADES[grade]}" if grade else "")
    ini0 = max(0, t_in - 0.5)
    proc = subprocess.Popen(["ffmpeg", "-v", "quiet", "-ss", f"{ini0:.3f}", "-i", src, "-t", f"{dur + 1.0:.3f}", "-vf", vf,
                             "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    rr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", src],
                        capture_output=True, text=True).stdout.strip().strip(",").split("/")
    fps_src = float(rr[0]) / max(1.0, float(rr[1]))
    qs = []; sz = W * H * 3
    while True:
        b = proc.stdout.read(sz)
        if len(b) < sz: break
        qs.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
    proc.wait(); ini = t_in - ini0
    idx = [min(len(qs) - 1, int((ini + dur * (k + 0.5) / n) * fps_src)) for k in range(n)]
    return [qs[i] for i in idx]

def zoom(img, z):
    if abs(z - 1) < 1e-3: return img
    h, w = img.shape[:2]; nw, nh = int(w / z), int(h / z); x0, y0 = (w - nw) // 2, (h - nh) // 2
    return cv2.resize(img[y0:y0 + nh, x0:x0 + nw], (w, h), interpolation=cv2.INTER_CUBIC)

saida = caminho(P["saida"]); fps = FPS
enc_args = ["-c:v", "libx264", "-preset", "ultrafast" if a.rascunho else "slow", "-crf", "22" if a.rascunho else "17", "-pix_fmt", "yuv420p"]
au = P.get("audio")
cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-"]
if au: cmd += ["-i", caminho(au["arquivo"]), "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-af", f"volume={au.get('ganho_db', 0)}dB", "-shortest"]
cmd += enc_args + ["-movflags", "+faststart", saida]
enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
camadas = P.get("textos", []); T0 = 0.0; total = 0
for bloco in P["timeline"]:
    n = int(round(bloco["dur"] * fps)); total += n
    if bloco["tipo"] == "take":
        qs = frames_take(caminho(bloco["src"]), bloco["in"], bloco["out"], n, bloco.get("grade")); z0, z1 = bloco.get("zoom", [1.0, 1.0])
    else:
        fundo = np.array(bloco.get("fundo", [0, 0, 0]), np.uint8)
    d0, d1 = bloco.get("drift", [1.0, 1.0])
    for k in range(n):
        u = k / max(1, n - 1); T = T0 + k / fps
        fr = zoom(qs[k], z0 + (z1 - z0) * u) if bloco["tipo"] == "take" else np.full((H, W, 3), fundo, np.uint8)
        ativas = [c for c in camadas if c["de"] <= T < c["ate"]]
        if ativas:
            img = Image.fromarray(fr).convert("RGBA")
            for c in ativas:
                alpha = suave((c["ate"] - T) / SAIDA) if c["ate"] - T < SAIDA else 1.0
                esc = d0 + (d1 - d0) * u if bloco["tipo"] == "cartao" else 1.0
                for el in c["elementos"]: desenha(img, el, T, esc, c.get("sombra", False), alpha)
            fr = np.asarray(img.convert("RGB"))
        enc.stdin.write(np.ascontiguousarray(fr).tobytes())
    T0 += bloco["dur"]
enc.stdin.close(); enc.wait()
print(f"{saida}: {total} quadros, {total / fps:.2f}s")

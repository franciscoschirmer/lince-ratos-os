"""Monta um Reels da Black da Fazenda no estilo "Faltam 02 dias": takes de drone em cortes secos,
cartões pretos com texto (The Seasons Italic + Neue Montreal) e texto em contorno sobre o vídeo.

Uso: python montar_black.py plano.json [--rascunho]

plano.json:
{
  "saida": "final.mp4", "fps": 30, "w": 1080, "h": 1920,
  "audio": {"arquivo": "trilha.wav", "ganho_db": 0},
  "timeline": [
    {"tipo": "take", "src": "x.mp4", "in": 1.2, "out": 2.0, "dur": 0.8, "zoom": [1.0, 1.05],
     "texto": [...opcional, igual ao cartão, com "contorno": true...]},
    {"tipo": "cartao", "dur": 1.0, "fundo": [0,0,0], "drift": [1.0, 0.97],
     "texto": [{"fonte": "script|regular|bold|misto", "txt": "imagina", "tam": 150, "cor": "sage", "y": 860,
                "entra": 0.12, "x": 540, "partes": [["na ", "regular"], ["Black", "bold"]]}]}
  ]
}
y = linha de base do texto (px da saída). "entra" = fade com leve escala no início do bloco.
"sombra": px de sombra borrada atrás do texto (ler sobre vídeo). "escurecer": 0-1, escurece o take numa faixa
suave em volta de "escurecer_y" (default 1000). Regra da Black 2026 (Francisco, 2026-10-21): texto sempre sobre
vídeo, cartão preto não entra; The Seasons só em uma frase curta de gesto, nunca na data nem no fecho.
"""
import argparse, json, subprocess, sys, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

U = "C:/Users/ASUSB/AppData/Local/Microsoft/Windows/Fonts/"
FONTES = {"script": U + "Fontspring-DEMO-theseasons-it.otf", "scriptb": U + "Fontspring-DEMO-theseasons-bdit.otf", "regular": U + "NeueMontreal-Regular.otf",
          "medium": U + "NeueMontreal-Medium.otf", "bold": U + "NeueMontreal-Bold.otf",
          "emoji": "C:/Windows/Fonts/seguiemj.ttf"}  # emoji colorido (Segoe UI Emoji), so em "partes"
CORES = {"cream": (243, 243, 231), "sage": (188, 207, 201), "white": (255, 255, 255)}

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

def desenha_texto(img, el, alpha=1.0, escala=1.0):
    """Desenha um elemento de texto (PIL RGBA) centralizado em x, com a linha de base em y."""
    cor = CORES.get(el.get("cor", "cream"), el.get("cor"))
    partes = el.get("partes") or [[el["txt"], el.get("fonte", "regular")]]
    tam = int(round(el["tam"] * escala)); esp = el.get("esp", 0) * escala
    fs = [fonte(f, tam) for _, f in partes]
    largs = [f.getlength(t) + esp * len(t) for (t, _), f in zip(partes, fs)]
    total = sum(largs); x = el.get("x", W / 2) - total / 2; y = el["y"]
    camada = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(camada)
    contorno = el.get("contorno", 0); sombra = el.get("sombra", 0)
    if sombra:  # sombra: deslocamento em px; desenha o texto em preto, borrado, por baixo
        from PIL import ImageFilter
        sc = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sc); xs = x
        for (t, fn), f, lg in zip(partes, fs, largs):
            asc, _ = f.getmetrics()
            if fn != "emoji": ds.text((xs + sombra, y - asc + sombra), t, font=f, fill=(0, 0, 0, 170))
            xs += lg
        camada.alpha_composite(sc.filter(ImageFilter.GaussianBlur(max(2, sombra * 1.5))))
    for (t, fn), f, lg in zip(partes, fs, largs):
        asc, desc = f.getmetrics()
        if esp:
            cx = x
            for ch in t:
                d.text((cx, y - asc), ch, font=f, fill=cor + (255,), stroke_width=int(contorno * escala) if contorno else 0,
                       stroke_fill=cor + (255,) if contorno else None); cx += f.getlength(ch) + esp
        else:
            if contorno:
                d.text((x, y - asc), t, font=f, fill=(0, 0, 0, 0), stroke_width=int(round(contorno * escala)), stroke_fill=cor + (255,))
            elif fn == "emoji":
                d.text((x, y - asc), t, font=f, embedded_color=True)
            else:
                d.text((x, y - asc), t, font=f, fill=cor + (255,))
        x += lg
    if alpha < 1: camada.putalpha(camada.getchannel("A").point(lambda v: int(v * alpha)))
    img.alpha_composite(camada)

GRADES = {
    "forte": "curves=all='0/0 0.22/0.16 0.5/0.5 0.78/0.84 1/1',eq=saturation=1.45:contrast=1.08,colorbalance=rs=0.04:bs=-0.03:rm=0.03:bm=-0.04:rh=0.02:bh=-0.02",
    "media": "curves=all='0/0 0.25/0.2 0.5/0.5 0.78/0.83 1/1',eq=saturation=1.3:contrast=1.05,colorbalance=rm=0.02:bm=-0.03",
    "leve": "eq=saturation=1.1:contrast=1.03",
}
def frames_take(src, t_in, t_out, n, grade=None):
    """n quadros do trecho [t_in, t_out] do vídeo, reamostrados no tempo (acelera ou desacelera)."""
    dur = t_out - t_in
    vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}" + (f",{GRADES[grade]}" if grade else "")
    proc = subprocess.Popen(["ffmpeg", "-v", "quiet", "-ss", f"{max(0, t_in - 0.5):.3f}", "-i", src, "-t", f"{dur + 1.0:.3f}",
                             "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                            stdout=subprocess.PIPE)
    rr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", src],
                        capture_output=True, text=True).stdout.strip().strip(",").split("/")
    fps_src = float(rr[0]) / max(1.0, float(rr[1]))
    quadros = []; sz = W * H * 3
    while True:
        b = proc.stdout.read(sz)
        if len(b) < sz: break
        quadros.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
    proc.wait()
    ini = t_in - max(0, t_in - 0.5)  # deslocamento dentro do buffer
    idx = [min(len(quadros) - 1, int(round((ini + dur * k / max(1, n - 1 if n > 1 else 1)) * fps_src))) for k in range(n)] if n > 1 else [int(round(ini * fps_src))]
    # amostragem uniforme no tempo de origem (n quadros ao longo de dur)
    idx = [min(len(quadros) - 1, int((ini + dur * (k + 0.5) / n) * fps_src)) for k in range(n)]
    return [quadros[i] for i in idx]

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
t_global = 0.0; total = 0
for bloco in P["timeline"]:
    n = int(round(bloco["dur"] * fps)); total += n
    if bloco["tipo"] == "take":
        qs = frames_take(caminho(bloco["src"]), bloco["in"], bloco["out"], n, bloco.get("grade"))
        z0, z1 = bloco.get("zoom", [1.0, 1.0])
    else:
        fundo = np.array(bloco.get("fundo", [0, 0, 0]), np.uint8)
    for k in range(n):
        u = k / max(1, n - 1)
        if bloco["tipo"] == "take":
            fr = zoom(qs[k], z0 + (z1 - z0) * u)
            esc_ = bloco.get("escurecer", 0)
            if esc_:  # faixa escura suave centrada em "escurecer_y" (default 1000), meia-altura 420 px
                cy = bloco.get("escurecer_y", 1000); yy = np.arange(H, dtype=np.float32)
                peso = np.clip(1 - np.abs(yy - cy) / 420.0, 0, 1) ** 1.5 * esc_
                fr = (fr.astype(np.float32) * (1 - peso)[:, None, None]).astype(np.uint8)
        else:
            fr = np.empty((H, W, 3), np.uint8); fr[:] = fundo
        textos = bloco.get("texto", [])
        if textos:
            img = Image.fromarray(fr).convert("RGBA")
            d0, d1 = bloco.get("drift", [1.0, 1.0]); esc_bloco = d0 + (d1 - d0) * u
            tt = k / fps
            for el in textos:
                ent = el.get("entra", 0.12); atraso = el.get("atraso", 0.0)
                if tt < atraso: continue
                a_ = min(1.0, (tt - atraso) / ent) if ent > 0 else 1.0
                a_ = a_ * a_ * (3 - 2 * a_)  # suave
                esc = esc_bloco * (1.0 + 0.04 * (1 - a_))
                desenha_texto(img, el, alpha=a_, escala=esc)
            fr = np.asarray(img.convert("RGB"))
        enc.stdin.write(np.ascontiguousarray(fr).tobytes())
    t_global += bloco["dur"]
enc.stdin.close(); enc.wait()
print(f"{saida}: {total} quadros, {total / fps:.2f}s")

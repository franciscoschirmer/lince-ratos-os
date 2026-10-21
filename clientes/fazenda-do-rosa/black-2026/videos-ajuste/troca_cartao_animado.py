"""Troca texto de cartão em fundo chapado (preto) que tem animação de escala (zoom).
Mede a caixa do texto em cada quadro e escreve o novo na mesma escala, centralizado e na mesma base.

Uso: python troca_cartao_animado.py ENTRADA SAIDA --area X0 Y0 X1 Y1 --de T --antigo "11 de Maio" \
        --novo "11 de Novembro" --peso Bold --k -3 --ws 3
"""
import argparse, subprocess, json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser(); ap.add_argument("entrada"); ap.add_argument("saida")
ap.add_argument("--area", nargs=4, type=int, required=True); ap.add_argument("--de", type=float, required=True)
ap.add_argument("--antigo", required=True); ap.add_argument("--novo", required=True)
ap.add_argument("--peso", default="Bold"); ap.add_argument("--k", type=float, default=0); ap.add_argument("--ws", type=float, default=0)
ap.add_argument("--limiar", type=int, default=60)
a = ap.parse_args()
FONTE = f"C:/Users/ASUSB/AppData/Local/Microsoft/Windows/Fonts/NeueMontreal-{a.peso}.otf"
j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
    "-of", "json", a.entrada], capture_output=True, text=True).stdout)["streams"][0]
W, H, rate = j["width"], j["height"], j["r_frame_rate"]; n_, d_ = map(int, rate.split("/")); fps = n_ / d_
X0, Y0, X1, Y1 = a.area

BASE = 400  # renderiza grande e reduz por quadro, sem pulo de tamanho inteiro
def render(txt):
    fnt = ImageFont.truetype(FONTE, BASE); k, ws = a.k * BASE / 92, a.ws * BASE / 92
    im = Image.new("L", (int(fnt.getlength(txt) + BASE * 2 + abs(k) * len(txt) + abs(ws) * 4), BASE * 3), 0); d = ImageDraw.Draw(im)
    for i, ch in enumerate(txt):
        d.text((BASE // 2 + fnt.getlength(txt[:i]) + i * k + txt[:i].count(" ") * ws, BASE), ch, font=fnt, fill=255)
    arr = np.array(im); yy, xx = np.where(arr > 0)
    return arr[yy.min():yy.max() + 1, xx.min():xx.max() + 1].astype(np.float32) / 255
velho, novo = render(a.antigo), render(a.novo)
razao = novo.shape[1] / velho.shape[1]  # largura do novo em relação ao antigo, na mesma escala

dec = subprocess.Popen(["ffmpeg", "-v", "quiet", "-i", a.entrada, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", rate, "-i", "-",
    "-i", a.entrada, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
    "-c:a", "copy", "-movflags", "+faststart", a.saida], stdin=subprocess.PIPE)
cor = None; i = 0; trocados = 0
while True:
    b = dec.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    f = np.frombuffer(b, np.uint8).reshape(H, W, 3).copy(); t = i / fps; i += 1
    if t >= a.de:
        reg = f[Y0:Y1, X0:X1]; g = cv2.cvtColor(reg, cv2.COLOR_BGR2GRAY)
        ys, xs = np.where(g > a.limiar)
        if len(xs) > 50:
            bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max(), ys.max()
            txt = g > 200
            if cor is None: cor = np.median(reg[txt], axis=0)
            alfa = float(np.clip(np.percentile(g[txt], 90) / 250, 0, 1)) if txt.any() else float(g.max()) / 250
            fundo = np.median(reg[g < 20], axis=0) if (g < 20).any() else np.zeros(3)
            m = 4; reg[max(0, by0 - m):by1 + m, max(0, bx0 - m):bx1 + m] = fundo  # apaga o antigo
            larg_novo = (bx1 - bx0 + 1) * razao; s = larg_novo / novo.shape[1]
            nv = cv2.resize(novo, (max(1, round(novo.shape[1] * s)), max(1, round(novo.shape[0] * s))), interpolation=cv2.INTER_AREA)
            cx = X0 + (bx0 + bx1 + 1) / 2; oy = Y0 + by1 + 1 - nv.shape[0]; ox = int(round(cx - nv.shape[1] / 2))
            al = (nv * alfa)[..., None]; dst = f[oy:oy + nv.shape[0], ox:ox + nv.shape[1]].astype(np.float32)
            f[oy:oy + nv.shape[0], ox:ox + nv.shape[1]] = (dst * (1 - al) + cor[None, None, :] * al).astype(np.uint8)
            trocados += 1
    enc.stdin.write(f.tobytes())
dec.kill(); enc.stdin.close(); enc.wait()
print(f"quadros trocados: {trocados}")

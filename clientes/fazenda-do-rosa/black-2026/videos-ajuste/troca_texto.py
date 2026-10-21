"""Troca um trecho de texto queimado num MP4 final, sem projeto de edição.

Uso:
  python troca_texto.py ENTRADA SAIDA --janela TA TB --caixa X0 Y0 X1 Y1 \
      --antigo "11/05" --novo "11/11" [--de T] [--ate T] [--alinhar centro] [--fundo-liso]

--janela: trecho (s) em que o texto antigo está parado e opaco; serve pra achar a máscara
          (o texto fica claro em todos os quadros, o fundo não).
--caixa:  área onde procurar o texto antigo.
--antigo: texto antigo, usado pra calibrar peso, tamanho e espaçamento da Neue Montreal.
--de/--ate: só mexe nesse trecho do vídeo (protege outro texto no mesmo lugar).
--forca PESO TAM K X0 Y0: pula a detecção e usa fonte e posição já medidas (canto superior
          esquerdo da tinta do texto antigo); a máscara vem do próprio texto renderizado.
--k-novo: espaçamento do texto novo (padrão: o mesmo do antigo; --largura-igual iguala a largura).
--escuro: texto escuro sobre fundo claro (selo creme).
--fundo-liso: fundo de cor chapada (cartão preto): pinta com a cor do fundo em vez de reconstruir.
A opacidade do texto em cada quadro (fades) é medida contra o fundo reconstruído do próprio quadro.
"""
import argparse, subprocess, sys, json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

FONTES = {p: f"C:/Users/ASUSB/AppData/Local/Microsoft/Windows/Fonts/NeueMontreal-{p}.otf" for p in ("Light", "Regular", "Medium", "Bold")}

ap = argparse.ArgumentParser()
ap.add_argument("entrada"); ap.add_argument("saida")
ap.add_argument("--janela", nargs=2, type=float, required=True)
ap.add_argument("--caixa", nargs=4, type=int, required=True)
ap.add_argument("--antigo", required=True); ap.add_argument("--novo", required=True)
ap.add_argument("--de", type=float, default=0); ap.add_argument("--ate", type=float, default=1e9)
ap.add_argument("--alinhar", default="centro")
ap.add_argument("--fundo-liso", action="store_true")
ap.add_argument("--limiar", type=int, default=160)
ap.add_argument("--largura-igual", action="store_true")
ap.add_argument("--k-novo", type=int)
ap.add_argument("--dilata", type=int, default=5)
ap.add_argument("--forca", nargs=5)
ap.add_argument("--peso", help="trava o peso da fonte (conferido no olho)")
ap.add_argument("--escuro", action="store_true", help="texto escuro sobre fundo claro")
a = ap.parse_args()

def info(p):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height,r_frame_rate", "-of", "json", p], capture_output=True, text=True).stdout)["streams"][0]
    n, d = map(int, j["r_frame_rate"].split("/"))
    return j["width"], j["height"], n / d, j["r_frame_rate"]

W, H, fps, rate = info(a.entrada)
x0, y0, x1, y1 = a.caixa

def quadros(p):
    proc = subprocess.Popen(["ffmpeg", "-v", "quiet", "-i", p, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    sz = W * H * 3
    try:
        while True:
            b = proc.stdout.read(sz)
            if len(b) < sz: break
            yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    finally:
        proc.kill()

def render(txt, peso, tam, k=0, ws=0):
    """Texto com espaçamento extra k (px) entre letras e ws (px) a mais em cada espaço, recortado na tinta."""
    fnt = ImageFont.truetype(FONTES[peso], tam)
    larg = int(fnt.getlength(txt) + (abs(k) + abs(ws)) * len(txt) + tam * 2)
    im = Image.new("L", (larg, tam * 3), 0); d = ImageDraw.Draw(im)
    for i, ch in enumerate(txt):
        d.text((tam // 2 + fnt.getlength(txt[:i]) + i * k + txt[:i].count(" ") * ws, tam), ch, font=fnt, fill=255)
    arr = np.array(im); yy, xx = np.where(arr > 0)
    return arr[yy.min():yy.max() + 1, xx.min():xx.max() + 1]

# 1. máscara do texto antigo (coordenadas do quadro inteiro)
janela = []
for i, f in enumerate(quadros(a.entrada)):
    t = i / fps
    if t < a.janela[0]: continue
    if t > a.janela[1]: break
    janela.append(f[y0:y1, x0:x1].copy())
if a.forca:
    peso, tam, k, fx, fy = a.forca[0], int(a.forca[1]), int(a.forca[2]), int(a.forca[3]), int(a.forca[4]); ws = 0
    r = render(a.antigo, peso, tam, k)
    m = np.zeros((y1 - y0, x1 - x0), np.uint8)
    m[fy - y0:fy - y0 + r.shape[0], fx - x0:fx - x0 + r.shape[1]] = (r > 60).astype(np.uint8)
    print(f"fonte e posição forçadas: {peso} {tam}px k={k} em x={fx} y={fy}")
else:
    mn = None
    for c in janela:
        hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV)
        v = 255 - hsv[..., 2] if a.escuro else hsv[..., 2]
        q = np.where(hsv[..., 1] < 50, v, 0)
        mn = q if mn is None else np.minimum(mn, q)
    m = (mn > a.limiar).astype(np.uint8)
    if not m.any(): sys.exit("texto antigo não encontrado na caixa")
ys, xs = np.where(m > 0)
bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max(), ys.max()
nucleo = cv2.erode(m, np.ones((3, 3), np.uint8))
if nucleo.sum() < 30: nucleo = m.copy()  # traço fino (Light): usa a máscara toda
cor = np.median(np.concatenate([c[nucleo > 0] for c in janela[::max(1, len(janela) // 10)]]), axis=0)
print(f"texto antigo em x={x0+bx0}-{x0+bx1} y={y0+by0}-{y0+by1} cor BGR={cor.astype(int).tolist()}")

# 2. calibra fonte (se não foi forçada)
if not a.forca:
    alvo = m[by0:by1 + 1, bx0:bx1 + 1]
    ker = np.ones((3, 3), np.uint8); al = cv2.dilate(alvo, ker) > 0
    def nota(r):
        rr = cv2.dilate((r > 100).astype(np.uint8), ker) > 0
        h, w = max(rr.shape[0], al.shape[0]), max(rr.shape[1], al.shape[1])
        A = np.zeros((h, w), bool); B = np.zeros((h, w), bool)
        A[h - al.shape[0]:, :al.shape[1]] = al; B[h - rr.shape[0]:, :rr.shape[1]] = rr  # alinha pela base e pela esquerda
        return (A & B).sum() / max(1, (A | B).sum())
    melhor = None
    tem_espaco = " " in a.antigo
    for p in ([a.peso] if a.peso else FONTES):
        tm0 = next(t for t in range(8, 600) if render(a.antigo, p, t).shape[0] >= alvo.shape[0])
        for tm in range(tm0 - 2, tm0 + 3):
            for kk in range(-tm // 5, tm // 10 + 1):
                for ws in (range(-tm // 3, tm // 5 + 1, 2) if tem_espaco else [0]):
                    r = render(a.antigo, p, tm, kk, ws)
                    if abs(r.shape[1] - alvo.shape[1]) > 6: continue
                    n_ = nota(r)
                    if melhor is None or n_ > melhor[0]: melhor = (n_, p, tm, kk, ws, r.shape[1] / alvo.shape[1])
    if melhor is None: sys.exit("calibração falhou: nenhuma combinação com a largura do texto antigo")
    iou, peso, tam, k, ws, ew = melhor
    print(f"fonte Neue Montreal {peso} {tam}px, espaçamento {k}px, espaço entre palavras {ws:+d}px (sobreposição {iou:.2f}, largura {ew:.2f}x)")
    if iou < (0.4 if a.peso else 0.7): sys.exit("calibração fraca (sobreposição < 0.70): medir na mão e usar --forca")
kn = k if a.k_novo is None else a.k_novo
if a.largura_igual:
    kn = min(range(k, k + tam // 3), key=lambda q: abs(render(a.novo, peso, tam, q, ws).shape[1] - (bx1 - bx0 + 1)))
print(f"espaçamento do novo: {kn}px")
novo = render(a.novo, peso, tam, kn, ws).astype(np.float32) / 255
nh, nw = novo.shape
ox = {"direita": x0 + bx1 + 1 - nw, "esquerda": x0 + bx0, "centro": x0 + (bx0 + bx1 + 1 - nw) // 2}[a.alinhar]
oy = y0 + by1 + 1 - nh  # mesma linha de base
if oy < 0 or ox < 0 or ox + nw > W: sys.exit("texto novo não cabe no quadro")

# 3. processa
pad = 14
cx0, cy0 = max(0, min(x0 + bx0, ox) - pad), max(0, min(y0 + by0, oy) - pad)
cx1, cy1 = min(W, max(x0 + bx1, ox + nw) + pad), min(H, max(y0 + by1, oy + nh) + pad)
def recorte(mask_caixa):
    full = np.zeros((H, W), np.uint8); full[y0:y1, x0:x1] = mask_caixa
    return full[cy0:cy1, cx0:cx1]
if a.fundo_liso:  # fundo chapado: apaga o retângulo inteiro do texto antigo
    ret = np.zeros_like(m); mg = a.dilata + 3
    ret[max(0, by0 - mg):by1 + mg + 1, max(0, bx0 - mg):bx1 + mg + 1] = 1
    mk = recorte(ret)
else:
    mk = recorte(cv2.dilate(m, np.ones((a.dilata, a.dilata), np.uint8)))
nk = recorte(nucleo) > 0
anel = (cv2.dilate(mk, np.ones((9, 9), np.uint8)) - mk) > 0 if a.fundo_liso else recorte(cv2.dilate(m, np.ones((15, 15), np.uint8)) - cv2.dilate(m, np.ones((a.dilata + 2, a.dilata + 2), np.uint8))) > 0
cor_g = float(cv2.cvtColor(cor.reshape(1, 1, 3).astype(np.uint8), cv2.COLOR_BGR2GRAY)[0, 0])
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", rate,
    "-i", "-", "-i", a.entrada, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-preset", "slow", "-crf", "16",
    "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", a.saida], stdin=subprocess.PIPE)
trocados = []
for i, f in enumerate(quadros(a.entrada)):
    t = i / fps
    if a.de <= t <= a.ate:
        f = f.copy(); c = f[cy0:cy1, cx0:cx1]
        if a.fundo_liso:
            fundo = np.median(c[anel], axis=0); bg = c.copy(); bg[mk > 0] = fundo
        else:
            bg = cv2.inpaint(c, mk, 5, cv2.INPAINT_TELEA)
        go = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY).astype(np.float32)[nk]
        gb = cv2.cvtColor(bg, cv2.COLOR_BGR2GRAY).astype(np.float32)[nk]
        ok = np.abs(cor_g - gb) > 25
        alfa = float(np.clip(np.median((go[ok] - gb[ok]) / (cor_g - gb[ok])), 0, 1)) if ok.sum() > 20 else 0.0
        if alfa > 0.05:
            c[:] = bg
            reg = f[oy:oy + nh, ox:ox + nw].astype(np.float32)
            kk = (novo * alfa)[..., None]
            f[oy:oy + nh, ox:ox + nw] = (reg * (1 - kk) + cor[None, None, :] * kk).astype(np.uint8)
            trocados.append(t)
    enc.stdin.write(f.tobytes())
enc.stdin.close(); enc.wait()
if trocados: print(f"quadros trocados: {len(trocados)} (de {trocados[0]:.2f}s a {trocados[-1]:.2f}s)")
else: print("nenhum quadro trocado")

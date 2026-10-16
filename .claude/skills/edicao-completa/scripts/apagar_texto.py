#!/usr/bin/env python3
"""
Apaga um texto queimado e parado (legenda do story, marca d'água) de um vídeo,
preenchendo só os traços das letras com o que está em volta (inpainting).

Como o texto não se mexe e o fundo se mexe, a máscara sai da MEDIANA do brilho ao
longo do tempo dentro da região: o que fica claro em todos os frames é letra.
O vídeo é processado frame a frame, em fluxo (um 720p de 1 min já são 5 GB brutos).

Uso: apagar_texto.py <entrada> <saida> --regiao x,y,w,h [--limiar 150] [--dilatar 2]
"""
import argparse, subprocess, sys
import numpy as np, cv2

ap = argparse.ArgumentParser()
ap.add_argument("entrada"); ap.add_argument("saida")
ap.add_argument("--regiao", required=True, help="x,y,w,h em pixels da fonte")
ap.add_argument("--limiar", type=int, default=150)
ap.add_argument("--dilatar", type=int, default=2)
a = ap.parse_args()
x, y, w, h = (int(v) for v in a.regiao.split(","))

info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                       "stream=width,height,r_frame_rate", "-of", "csv=p=0", a.entrada],
                      capture_output=True, text=True, check=True).stdout.strip().split(",")
W, H, fps = int(info[0]), int(info[1]), info[2]
TAM = W * H * 3

# 1) máscara: amostra 1 frame por segundo só da região
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.entrada, "-vf", f"fps=1,crop={w}:{h}:{x}:{y}",
                      "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True, check=True).stdout
amostra = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).min(axis=3)
mascara = (np.median(amostra, axis=0) > a.limiar).astype(np.uint8) * 255
mascara = cv2.dilate(mascara, np.ones((3, 3), np.uint8), iterations=a.dilatar)
print(f"máscara: {int((mascara > 0).sum())} px de letra em {len(amostra)} amostras", file=sys.stderr)
if (mascara > 0).sum() < 50:
    sys.exit("máscara vazia: confere a região ou baixa o --limiar")

# 2) fluxo: decodifica -> inpaint na região -> codifica
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.entrada, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                       stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                        "-r", fps, "-i", "-", "-i", a.entrada, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264",
                        "-preset", "fast", "-crf", "12", "-pix_fmt", "yuv420p", "-c:a", "copy", a.saida],
                       stdin=subprocess.PIPE)
n = 0
while True:
    buf = dec.stdout.read(TAM)
    if len(buf) < TAM:
        break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
    f[y:y + h, x:x + w] = cv2.inpaint(f[y:y + h, x:x + w], mascara, 4, cv2.INPAINT_TELEA)
    enc.stdin.write(f.tobytes())
    n += 1
    if n % 300 == 0:
        print(f"  {n} frames", file=sys.stderr)
enc.stdin.close(); dec.stdout.close()
dec.wait(); enc.wait()
if enc.returncode:
    sys.exit(f"ffmpeg saiu com {enc.returncode}")
print(f"{n} frames -> {a.saida}", file=sys.stderr)
print(a.saida)

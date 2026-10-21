"""Folha de conferência: recorte da área alterada, antes (em cima) e depois (embaixo), em vários instantes.
Uso: python conferencia.py ORIGINAL PRONTO SAIDA.jpg --caixa X0 Y0 X1 Y1 --tempos 5.5 6 8 9.8
"""
import argparse, subprocess, numpy as np, cv2
ap = argparse.ArgumentParser(); ap.add_argument("orig"); ap.add_argument("pronto"); ap.add_argument("saida")
ap.add_argument("--caixa", nargs=4, type=int, required=True); ap.add_argument("--tempos", nargs="+", type=float, required=True)
a = ap.parse_args(); x0, y0, x1, y1 = a.caixa
def quadro(p, t):
    out = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", p, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
    return cv2.imdecode(np.frombuffer(out, np.uint8), cv2.IMREAD_COLOR)[y0:y1, x0:x1]
cols = []
for t in a.tempos:
    o, p = quadro(a.orig, t), quadro(a.pronto, t)
    lab = np.zeros((40, o.shape[1], 3), np.uint8); cv2.putText(lab, f"{t:.2f}s", (8, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
    cols.append(np.vstack([lab, o, np.full((6, o.shape[1], 3), 255, np.uint8), p]))
folha = np.hstack([np.hstack([c, np.full((c.shape[0], 8, 3), 255, np.uint8)]) for c in cols])
esc = min(1.0, 2400 / folha.shape[1]); folha = cv2.resize(folha, None, fx=esc, fy=esc)
open(a.saida, "wb").write(cv2.imencode(".jpg", folha, [cv2.IMWRITE_JPEG_QUALITY, 90])[1].tobytes())
for p in (a.orig, a.pronto):
    print(p, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height,codec_type", "-of", "csv=p=0", p], capture_output=True, text=True).stdout.split())

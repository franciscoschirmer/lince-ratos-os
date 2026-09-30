#!/usr/bin/env python3
"""
Queima o texto do hook na abertura do corte.

Uso:
  queimar-hook.py <corte.mp4> -o <saida.mp4> --texto "ninguem te conta\\nisso sobre X"
                  [--ate 3] [--y 0.24] [--tamanho 60] [--contorno 4]
                  [--fonte /caminho/Font.ttf] [--cor white] [--so-png]

POR QUE PNG + overlay E NAO O drawtext DO FFMPEG:
  O filtro drawtext so existe se o ffmpeg foi compilado com libfreetype. Varios
  builds comuns NAO tem (o ffmpeg 8.1 do Homebrew testado aqui nao tinha freetype
  nem libass, entao nem drawtext nem subtitles funcionavam). Renderizar o texto com
  PIL e compor com `overlay` funciona em QUALQUER build, porque overlay e core.

  De brinde resolve o problema que editor de timeline costuma nao resolver:
  CONTORNO. Texto branco chapado some em cima de screenshot claro. Com contorno o
  mesmo hook fica legivel sobre fundo claro OU escuro, e tu para de ter que caçar
  uma janela de tela cheia pra encaixar o hook.

Precisa: Pillow (pip install Pillow) e ffmpeg com overlay (todo build tem).
"""
import argparse, os, shutil, subprocess, sys, tempfile
from pathlib import Path

FONTES_COMUNS = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def acha_fonte(pedida):
    if pedida:
        if not Path(pedida).exists():
            sys.exit(f"erro: fonte nao encontrada: {pedida}")
        return pedida
    for f in FONTES_COMUNS:
        if Path(f).exists():
            return f
    sys.exit("erro: nao achei nenhuma fonte no sistema. Passa --fonte /caminho/Font.ttf")


def dimensoes(video):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", video],
        capture_output=True, text=True)
    if r.returncode or not r.stdout.strip():
        sys.exit(f"erro: ffprobe falhou em {video}")
    w, h = r.stdout.strip().split(",")[:2]
    return int(w), int(h)


def render_png(texto, w, h, fonte_path, tamanho, contorno, cor, y_rel, dest):
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    try:
        fonte = ImageFont.truetype(fonte_path, tamanho)
    except OSError:
        fonte = ImageFont.truetype(fonte_path, tamanho, index=0)

    linhas = texto.split("\\n") if "\\n" in texto else texto.split("\n")
    linhas = [l.strip() for l in linhas if l.strip()]
    if not linhas:
        sys.exit("erro: texto vazio.")

    # altura de linha a partir da metrica real da fonte, com folga
    alturas = [d.textbbox((0, 0), l, font=fonte)[3] - d.textbbox((0, 0), l, font=fonte)[1] for l in linhas]
    lh = max(alturas) * 1.45
    total = lh * len(linhas)
    y0 = (h * y_rel) - (total / 2)

    for i, linha in enumerate(linhas):
        bbox = d.textbbox((0, 0), linha, font=fonte)
        lw = bbox[2] - bbox[0]
        x = (w - lw) / 2 - bbox[0]
        y = y0 + i * lh
        # contorno: legivel sobre fundo claro e escuro
        if contorno > 0:
            d.text((x, y), linha, font=fonte, fill=cor,
                   stroke_width=contorno, stroke_fill=(0, 0, 0, 235))
        else:
            d.text((x, y), linha, font=fonte, fill=cor)

    img.save(dest)
    return dest


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("-o", "--out")
    p.add_argument("--texto", required=True, help='usa \\n pra quebrar linha')
    p.add_argument("--ate", type=float, default=3.0, help="segundo em que o hook sai")
    p.add_argument("--y", type=float, default=0.24, help="0=topo, 1=base")
    p.add_argument("--tamanho", type=int, default=60, help="px pra altura 1920; escala junto")
    p.add_argument("--contorno", type=int, default=4, help="0 desliga")
    p.add_argument("--fonte")
    p.add_argument("--cor", default="white")
    p.add_argument("--so-png", action="store_true", help="so gera o PNG, nao compoe")
    args = p.parse_args()

    if not Path(args.video).exists():
        sys.exit(f"erro: nao achei {args.video}")
    if not args.so_png and not args.out:
        sys.exit("erro: precisa -o <saida.mp4> (ou --so-png)")

    w, h = dimensoes(args.video)
    fonte = acha_fonte(args.fonte)
    tam = max(12, round(args.tamanho * h / 1920))

    # PNG intermediario vai pro temp: a pasta de saida entrega .mp4, nao lixo de
    # processo. Com --so-png ele fica ao lado da saida, que ai e o que tu pediu.
    tmpdir = None
    if args.so_png:
        png = Path(args.out).with_suffix(".hook.png") if args.out else Path("hook.png")
    else:
        tmpdir = tempfile.mkdtemp()
        png = Path(tmpdir) / "hook.png"

    render_png(args.texto, w, h, fonte, tam, args.contorno, args.cor, args.y, png)
    print(f"png: {png} ({w}x{h}, fonte {tam}px, {Path(fonte).name})")

    if args.so_png:
        return

    # overlay e filtro CORE: funciona em qualquer build de ffmpeg
    r = subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", args.video, "-i", str(png),
         "-filter_complex", f"[0:v][1:v]overlay=0:0:enable='between(t,0,{args.ate})'",
         "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
         "-c:a", "copy", "-movflags", "+faststart", args.out])
    falhou = r.returncode or not Path(args.out).exists() or Path(args.out).stat().st_size == 0
    if tmpdir:
        shutil.rmtree(tmpdir, ignore_errors=True)
    if falhou:
        sys.exit(f"erro: ffmpeg falhou ao compor {args.out}")

    print(f"ok {Path(args.out).name} | hook ate {args.ate}s | y={args.y}")
    print(f"  CONFERE um frame antes de aceitar em lote:")
    print(f"  ffmpeg -y -i \"{args.out}\" -ss 1 -vframes 1 /tmp/hook-check.png && open /tmp/hook-check.png")


if __name__ == "__main__":
    main()

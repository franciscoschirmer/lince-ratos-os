#!/usr/bin/env python3
"""
Puxa a legenda de um vídeo do YouTube (sem baixar o vídeo) e devolve texto limpo.

Uso:
    python yt_transcript.py "<URL>" [--lang pt en] [--out arquivo.md]

- Tenta legenda manual e auto-legenda, nas línguas pedidas (default: pt, en).
- Limpa o VTT: remove timestamps, tags <c>, cabeçalho e linhas duplicadas
  (a auto-legenda do YouTube repete muito por causa do efeito rolagem).
- Sem --out, imprime no stdout. Código de saída !=0 se não achar legenda.

Requer apenas yt-dlp no PATH. Não é a única forma de capturar uma fonte —
pra vídeos sem legenda, ou de outras plataformas, use a skill `transcribe`.
"""
import argparse
import os
import re
import subprocess
import sys
import tempfile
import time


def fetch_vtt(url: str, langs: list[str], tmpdir: str, retries: int = 2) -> str | None:
    """Roda yt-dlp e devolve o caminho do .vtt baixado, ou None.

    Tenta algumas vezes com backoff: rodar muitos vídeos em paralelo costuma
    fazer o YouTube throttlar e devolver vazio numa parte deles. Um retry
    simples resolve a maioria desses casos transitórios.
    """
    out_tpl = os.path.join(tmpdir, "sub.%(ext)s")
    # sub-langs aceita regex; pt.* pega pt, pt-BR, pt-orig etc.
    sub_langs = ",".join(f"{l}.*" for l in langs)
    cmd = [
        "yt-dlp", "--skip-download",
        "--write-subs", "--write-auto-subs",
        "--sub-langs", sub_langs,
        "--sub-format", "vtt",
        "-o", out_tpl, url,
    ]
    vtts: list[str] = []
    for attempt in range(retries + 1):
        try:
            subprocess.run(cmd, check=False, capture_output=True, text=True, timeout=180)
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            print(f"erro ao rodar yt-dlp: {e}", file=sys.stderr)
            return None
        vtts = [f for f in os.listdir(tmpdir) if f.endswith(".vtt")]
        if vtts:
            break
        if attempt < retries:
            time.sleep(3 * (attempt + 1))  # backoff: 3s, 6s
    # acha o primeiro .vtt gerado, preferindo a ordem de línguas pedida
    if not vtts:
        return None
    for lang in langs:
        for f in vtts:
            if f".{lang}" in f or f"-{lang}" in f:
                return os.path.join(tmpdir, f)
    return os.path.join(tmpdir, vtts[0])


_TS = re.compile(r"^\d{2}:\d{2}:\d{2}\.\d{3} -->")
_TAG = re.compile(r"<[^>]+>")  # <c>, <00:00:00.000>, etc.


def clean_vtt(path: str) -> str:
    """Converte VTT em texto corrido, sem timestamps, tags nem repetição."""
    lines: list[str] = []
    with open(path, encoding="utf-8", errors="replace") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            if not line.strip():
                continue
            if line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")):
                continue
            if _TS.match(line):
                continue
            if line.strip().isdigit():  # número do cue
                continue
            text = _TAG.sub("", line).strip()
            if not text:
                continue
            # dedup: auto-legenda repete a linha anterior parcialmente
            if lines and (text == lines[-1] or text in lines[-1]):
                continue
            if lines and lines[-1] in text:
                lines[-1] = text
                continue
            lines.append(text)
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--lang", nargs="+", default=["pt", "en"])
    ap.add_argument("--out")
    args = ap.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        vtt = fetch_vtt(args.url, args.lang, tmp)
        if not vtt:
            print("sem legenda disponível pra esse vídeo. "
                  "Use a skill `transcribe` (Whisper) pra essa fonte.",
                  file=sys.stderr)
            return 2
        text = clean_vtt(vtt)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(text)
        print(f"salvo em {args.out} ({len(text)} chars)")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())

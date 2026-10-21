#!/usr/bin/env python3
"""
Converte a transcrição do transcrever.py (formato da casa) pro formato --words da ffmpeg-skill.

Formato da casa:  {"duracao", "palavras": [{"i","ini","fim","txt"}], "segmentos": [{"ini","fim","txt"}]}
Formato --words:  JSON de whisper com "start"/"end" por palavra, em "words" e dentro de cada "segments".

Uso: palavras_para_words.py transcricao.json -o words.json
Depois: python ~/.claude/skills/ffmpeg-skill/scripts/silence.py <video> --filler --filler-lang pt --words words.json --filler-list

Por que existe: o --transcribe embutido da ffmpeg-skill chama o faster-whisper de um jeito que quebra com o
huggingface_hub 1.33 (erro "metadata_errors", 2026-10-21). O transcrever.py da casa roda normal, então
a transcrição é dele e a ffmpeg-skill só recebe o JSON.
"""
import argparse, json, sys

p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
p.add_argument("entrada", help="JSON do transcrever.py")
p.add_argument("-o", "--saida", required=True, help="JSON no formato --words")
p.add_argument("--idioma", default="pt")
a = p.parse_args()

d = json.load(open(a.entrada, encoding="utf-8"))
palavras = d.get("palavras") or []
if not palavras:
    sys.exit("erro: o JSON não tem 'palavras' com tempo; rode o transcrever.py de novo")

words = [{"word": w["txt"], "start": w["ini"], "end": w["fim"]} for w in palavras]
segments = []
for s in d.get("segmentos") or []:
    segments.append({
        "start": s["ini"], "end": s["fim"], "text": s["txt"],
        "words": [w for w in words if s["ini"] <= w["start"] <= s["fim"]],
    })
if not segments:
    segments = [{"start": words[0]["start"], "end": words[-1]["end"],
                 "text": " ".join(w["word"] for w in words), "words": words}]

json.dump({"language": a.idioma, "segments": segments, "words": words},
          open(a.saida, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(words)} palavras, {len(segments)} segmentos -> {a.saida}", file=sys.stderr)

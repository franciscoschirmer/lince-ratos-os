#!/usr/bin/env python3
"""
Transcreve com tempo por palavra usando faster-whisper (local, sem chave).

Saída: JSON {"palavras": [{"i", "ini", "fim", "txt"}], "segmentos": [...]}
Tempos em segundos. Usa a GPU se tiver (cuda, float16), senão CPU int8.

Uso: transcrever.py <video> -o transcricao.json [--modelo medium] [--idioma pt]
"""
import argparse, json, sys

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("-o", "--saida", required=True)
ap.add_argument("--modelo", default="medium")
ap.add_argument("--idioma", default="pt")
a = ap.parse_args()

from faster_whisper import WhisperModel

# o áudio sai pelo ffmpeg direto pra memória: o decoder do faster-whisper (PyAV)
# quebra com algumas versões, e o ffmpeg lê qualquer coisa que o celular gravar
import subprocess, numpy as np
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-ac", "1", "-ar", "16000",
                      "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, dtype=np.float32)

# a GPU só serve se as DLLs do CUDA (cublas) estiverem instaladas; o modelo carrega
# sem elas e só quebra na hora de transcrever, então a troca pra CPU é aqui
segs = None
for device, ctype in (("cuda", "float16"), ("cpu", "int8")):
    try:
        modelo = WhisperModel(a.modelo, device=device, compute_type=ctype)
        gen, info = modelo.transcribe(audio, language=a.idioma, word_timestamps=True,
                                      vad_filter=False, condition_on_previous_text=False)
        segs = list(gen)
        print(f"motor: {a.modelo} em {device}/{ctype}", file=sys.stderr)
        break
    except Exception as e:
        print(f"sem {device}: {str(e)[:120]}", file=sys.stderr)
if segs is None:
    sys.exit("não consegui rodar o whisper")
palavras, segmentos = [], []
for s in segs:
    segmentos.append({"ini": round(s.start, 3), "fim": round(s.end, 3), "txt": s.text.strip()})
    for w in s.words or []:
        palavras.append({"i": len(palavras), "ini": round(w.start, 3), "fim": round(w.end, 3),
                         "txt": w.word.strip()})

with open(a.saida, "w", encoding="utf-8") as f:
    json.dump({"duracao": info.duration, "palavras": palavras, "segmentos": segmentos},
              f, ensure_ascii=False, indent=1)
print(f"{len(palavras)} palavras, {info.duration:.1f}s -> {a.saida}", file=sys.stderr)
